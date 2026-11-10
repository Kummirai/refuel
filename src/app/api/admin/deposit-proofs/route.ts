// src/app/api/admin/deposit-proofs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Db, Filter, ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  getDepositTierConfig,
  type DepositProofDoc,
  type DepositProofStatus,
  type DepositTier,
} from "@/lib/deposit";
import {
  approveDepositProof,
  DepositApprovalError,
  findDepositUser,
  notifyDriver,
} from "@/lib/deposit-approval";
import { sendDriverDepositRejectionEmail } from "@/lib/email";
import { formatMoney, toMoney } from "@/lib/money";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if ((session.user as { role?: string }).role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

interface AdminUser {
  _id?: ObjectId | string;
  name?: string;
  email?: string;
  phone?: string;
  pushTokens?: string[];
  expoPushToken?: string | null;
}

interface AdminDriverProfile {
  userId?: string;
  fullName?: string;
  driverEmail?: string;
  driverPhone?: string;
  carRegistrationNumber?: string;
  targetDepositAmount?: number;
  securityDepositBalance?: number;
  depositAcceptedAt?: Date | string;
  depositTier?: DepositTier;
  consecutiveOnTimeMonths?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { db: database } = await connectToDatabase();
    const db = database as Db;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: Filter<DepositProofDoc> = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status as DepositProofStatus;
    }

    const proofs = await db
      .collection<DepositProofDoc>("depositProofs")
      .find(query)
      .sort({ submittedAt: -1 })
      .limit(200)
      .toArray();

    const userIds = [...new Set(proofs.map((p) => p.userId))];
    const [users, profiles] = await Promise.all([
      findUsers(db, userIds),
      db
        .collection<AdminDriverProfile>("driverProfiles")
        .find({ userId: { $in: userIds } })
        .toArray(),
    ]);

    const userById = new Map(
      users.map((u) => [String(u._id), u] as const),
    );
    const profileByUser = new Map(
      profiles.map((p) => [String(p.userId), p] as const),
    );

    const enriched = proofs.map((proof) => {
      const user = userById.get(proof.userId);
      const profile = profileByUser.get(proof.userId);
      const tierConfig = getDepositTierConfig(proof.tier);
      return {
        id: proof._id?.toString() ?? "",
        userId: proof.userId,
        driverName: profile?.fullName || user?.name || "Unknown",
        driverEmail: user?.email || profile?.driverEmail || "Unknown",
        driverPhone: user?.phone || profile?.driverPhone || "Unknown",
        carRegistration: profile?.carRegistrationNumber || "Not provided",
        tier: proof.tier,
        tierName: tierConfig?.name || proof.tier,
        targetDepositAmount:
          tierConfig?.targetAmount ??
          toMoney(Number(profile?.targetDepositAmount) || 0),
        securityDepositBalance: toMoney(
          Number(profile?.securityDepositBalance) || 0,
        ),
        amount: toMoney(Number(proof.amount) || 0),
        weekStart: proof.weekStart,
        weekEnd: proof.weekEnd,
        proofUrl: proof.proofUrl,
        proofPublicId: proof.proofPublicId,
        status: proof.status,
        submittedAt: proof.submittedAt,
        reviewedAt: proof.reviewedAt,
        approvedAt: proof.approvedAt,
        rejectionReason: proof.rejectionReason,
        creditedAmount: proof.creditedAmount,
        balanceAfter: proof.balanceAfter,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching deposit proofs:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit proofs" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { proofId, status, reason } = body as {
      proofId?: string;
      status?: "approved" | "rejected";
      reason?: string;
    };

    if (!proofId || !status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "proofId and status (approved or rejected) are required" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(proofId)) {
      return NextResponse.json({ error: "Invalid proof id" }, { status: 400 });
    }

    const { db: database } = await connectToDatabase();
    const db = database as Db;
    const proofs = db.collection<DepositProofDoc>("depositProofs");
    const profiles = db.collection<AdminDriverProfile>("driverProfiles");

    const proof = await proofs.findOne({ _id: new ObjectId(proofId) });
    if (!proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }
    if (proof.status !== "pending") {
      return NextResponse.json(
        { error: `This proof is already ${proof.status}` },
        { status: 409 },
      );
    }

    const profile = await profiles.findOne({ userId: proof.userId });
    const tierConfig = getDepositTierConfig(proof.tier);

    const now = new Date();
    const user = await findDepositUser(db, proof.userId);
    const driverName = profile?.fullName || user?.name || "Driver";
    const driverEmail = user?.email || profile?.driverEmail || "";
    const carRegistration = profile?.carRegistrationNumber || "Unknown";
    const tierName = tierConfig?.name || proof.tier;

    if (status === "rejected") {
      await proofs.updateOne(
        { _id: proof._id },
        {
          $set: {
            status: "rejected" as DepositProofStatus,
            rejectionReason:
              reason ||
              "No specific reason provided. Please contact support for more information.",
            reviewedAt: now,
            updatedAt: now,
          },
        },
      );

      await notifyDriver(user, {
        title: "Deposit Payment Rejected",
        body: `Your deposit proof of ${formatMoney(
          Number(proof.amount) || 0,
        )} was rejected. Reason: ${
          reason || "No specific reason provided."
        }`,
      });

      if (driverEmail) {
        await sendDriverDepositRejectionEmail({
          driverEmail,
          driverName,
          carRegistration,
          tierName,
          amount: toMoney(Number(proof.amount) || 0),
          reason:
            reason ||
            "No specific reason provided. Please contact support for more information.",
          weekStart: proof.weekStart.toISOString(),
        }).catch((err) =>
          console.error("Failed to send deposit rejection email:", err),
        );
      }

      return NextResponse.json({
        success: true,
        message: "Deposit proof rejected",
      });
    }

    try {
      const result = await approveDepositProof(db, proof, now);
      return NextResponse.json({
        success: true,
        message: "Deposit proof approved",
        creditedAmount: result.creditedAmount,
        balanceAfter: result.balanceAfter,
        depositComplete: result.depositComplete,
        deposit: result.summary,
      });
    } catch (error) {
      if (error instanceof DepositApprovalError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error processing deposit proof:", error);
    return NextResponse.json(
      { error: "Failed to process deposit proof" },
      { status: 500 },
    );
  }
}

async function findUsers(db: Db, userIds: string[]) {
  if (userIds.length === 0) return [];
  const users = db.collection<AdminUser>("user");
  const ids = userIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));
  const found = await users.find({ _id: { $in: ids } }).toArray();
  // Ensure every requested id resolves, including legacy string ids.
  const resolved = new Set(found.map((u) => String(u._id)));
  const missing = userIds.filter((id) => !resolved.has(id));
  if (missing.length > 0) {
    const extra = await users.find({ _id: { $in: missing } }).toArray();
    found.push(...extra);
  }
  return found;
}
