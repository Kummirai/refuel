import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");
    const limit = limitParam ? parseInt(limitParam) : null;
    const skip = skipParam ? parseInt(skipParam) : 0;

    const statusFilter: any =
      status && status !== "all"
        ? { status }
        : { status: { $in: ["approved", "sent", "completed"] } };

    const pipeline: any[] = [
      { $match: statusFilter },

      {
        $addFields: {
          _amount: { $ifNull: ["$actualAmount", "$amount", 0] },
          _totalRepayable: { $ifNull: ["$totalRepayable", "$amount", 0] },
          _repaid: {
            $min: [
              { $max: [{ $ifNull: ["$repaidAmount", 0] }, 0] },
              { $ifNull: ["$totalRepayable", "$amount", 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          _remaining: { $max: [0, { $subtract: ["$_totalRepayable", "$_repaid"] }] },
        },
      },

      {
        $addFields: {
          _userIdObj: {
            $convert: { input: "$userId", to: "objectId", onError: null, onNull: null },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "_userIdObj",
          foreignField: "_id",
          as: "_userDoc",
        },
      },
      {
        $addFields: {
          _userDoc: { $arrayElemAt: ["$_userDoc", 0] },
          _resolvedEmail: {
            $cond: [
              { $and: [{ $ne: ["$driverEmail", null] }, { $ne: ["$driverEmail", ""] }] },
              "$driverEmail",
              { $ifNull: ["$_userDoc.email", ""] },
            ],
          },
          _resolvedPhone: {
            $cond: [
              { $and: [{ $ne: ["$driverPhone", null] }, { $ne: ["$driverPhone", ""] }] },
              "$driverPhone",
              { $ifNull: ["$_userDoc.phone", ""] },
            ],
          },
        },
      },

      {
        $group: {
          _id: "$userId",
          driverName: {
            $first: {
              $trim: {
                input: { $ifNull: ["$driverName", "Unknown"] },
              },
            },
          },
          driverEmail: { $first: "$_resolvedEmail" },
          driverPhone: { $first: "$_resolvedPhone" },
          paid: { $sum: "$_repaid" },
          outstanding: { $sum: "$_remaining" },
          loans: {
            $push: {
              id: { $toString: "$_id" },
              type: "$type",
              amount: "$_amount",
              totalRepayable: "$_totalRepayable",
              repaid: "$_repaid",
              remaining: "$_remaining",
              status: "$status",
              hasReceipt: { $ifNull: ["$hasReceipt", false] },
              completedDate: "$completedDate",
              carNumber: "$carNumber",
            },
          },
        },
      },
    ];

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      pipeline.push({
        $match: {
          $or: [
            { driverName: { $regex: escaped, $options: "i" } },
            { driverEmail: { $regex: escaped, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { driverName: 1 } });

    if (limit !== null) {
      pipeline.push({
        $facet: {
          total: [{ $count: "count" }],
          drivers: [
            { $skip: skip },
            { $limit: limit },
            {
              $addFields: {
                paid: { $round: ["$paid", 2] },
                outstanding: { $round: ["$outstanding", 2] },
                loans: {
                  $map: {
                    input: "$loans",
                    as: "loan",
                    in: {
                      $mergeObjects: [
                        "$$loan",
                        {
                          repaid: { $round: ["$$loan.repaid", 2] },
                          remaining: { $round: ["$$loan.remaining", 2] },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      });
    } else {
      pipeline.push({
        $addFields: {
          paid: { $round: ["$paid", 2] },
          outstanding: { $round: ["$outstanding", 2] },
          loans: {
            $map: {
              input: "$loans",
              as: "loan",
              in: {
                $mergeObjects: [
                  "$$loan",
                  {
                    repaid: { $round: ["$$loan.repaid", 2] },
                    remaining: { $round: ["$$loan.remaining", 2] },
                  },
                ],
              },
            },
          },
        },
      });
    }

    const [result] = await db.collection("serviceRequests").aggregate(pipeline).toArray();

    const drivers = limit !== null ? (result?.drivers || []) : (result || []);
    const totalCount = limit !== null ? (result?.total?.[0]?.count || 0) : drivers.length;

    return NextResponse.json({
      drivers,
      total: totalCount,
      hasMore: limit !== null ? skip + limit < totalCount : false,
    });
  } catch (error) {
    console.error("Error fetching driver view data:", error);
    return NextResponse.json({ error: "Failed to fetch driver view data" }, { status: 500 });
  }
}
