// src/app/api/admin/deposit-contracts/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Db, ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getDepositTierConfig, type DepositTier } from "@/lib/deposit";
import { toMoney } from "@/lib/money";

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

interface ContractProfile {
  userId: string;
  fullName?: string;
  driverEmail?: string;
  driverPhone?: string;
  carRegistrationNumber?: string;
  targetDepositAmount?: number;
  weeklyDepositInstallment?: number;
  securityDepositBalance?: number;
  depositAcceptedAt?: Date | string;
  depositTier?: DepositTier;
}

interface ContractUser {
  _id?: ObjectId | string;
  name?: string;
  email?: string;
  phone?: string;
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { db } = await connectToDatabase();
    const database = db as Db;

    // Drivers who accepted a contract but have not uploaded a single proof yet.
    const proofUserIds = await database
      .collection("depositProofs")
      .distinct("userId", {});

    const contracts = await database
      .collection<ContractProfile>("driverProfiles")
      .find({
        depositTier: { $in: ["TIER_1", "TIER_2"] },
        userId: { $nin: proofUserIds },
        $expr: { $eq: [{ $ifNull: ["$securityDepositBalance", 0] }, 0] },
      })
      .sort({ depositAcceptedAt: -1 })
      .limit(200)
      .toArray();

    const users = await findUsers(
      database,
      contracts.map((c) => c.userId),
    );
    const userById = new Map(users.map((u) => [String(u._id), u] as const));

    const enriched = contracts.map((contract) => {
      const user = userById.get(contract.userId);
      const tier = contract.depositTier as DepositTier;
      const config = getDepositTierConfig(tier);
      return {
        userId: contract.userId,
        driverName: contract.fullName || user?.name || "Unknown",
        driverEmail: user?.email || contract.driverEmail || "Unknown",
        driverPhone: user?.phone || contract.driverPhone || "Unknown",
        carRegistration: contract.carRegistrationNumber || "Not provided",
        tier,
        tierName: config?.name || tier,
        targetDepositAmount:
          config?.targetAmount ??
          toMoney(Number(contract.targetDepositAmount) || 0),
        weeklyInstallment:
          config?.weeklyInstallment ??
          toMoney(Number(contract.weeklyDepositInstallment) || 0),
        securityDepositBalance: toMoney(
          Number(contract.securityDepositBalance) || 0,
        ),
        acceptedAt: contract.depositAcceptedAt ?? null,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching deposit contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit contracts" },
      { status: 500 },
    );
  }
}

async function findUsers(db: Db, userIds: string[]) {
  if (userIds.length === 0) return [] as ContractUser[];
  const users = db.collection<ContractUser>("user");
  const ids = userIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));
  const found = await users.find({ _id: { $in: ids } }).toArray();
  const resolved = new Set(found.map((u) => String(u._id)));
  const missing = userIds.filter((id) => !resolved.has(id));
  if (missing.length > 0) {
    const extra = await users.find({ _id: { $in: missing } }).toArray();
    found.push(...extra);
  }
  return found;
}
