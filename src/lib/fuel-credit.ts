// src/lib/fuel-credit.ts
import { Db } from "mongodb";
import { toMoney } from "./money";

export const DEFAULT_WEEKLY_FUEL_CREDIT = 2500;

export interface FuelCreditWeek {
  startDate: Date;
  endDate: Date;
}

export interface DriverFuelCredit {
  limit: number;
  used: number;
  remaining: number;
  weekStart: Date;
  weekEnd: Date;
  isDefaultLimit: boolean;
  enabled: boolean;
}

// Monday 00:00 → next Monday 00:00 (local time)
export function getFuelCreditWeek(now: Date = new Date()): FuelCreditWeek {
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setHours(0, 0, 0, 0);
  return { startDate: start, endDate: end };
}

export interface FuelCreditConfig {
  defaultLimit: number;
  enabled: boolean;
}

export async function getFuelCreditConfig(db: Db): Promise<FuelCreditConfig> {
  const settings = await db.collection("settings").findOne({ type: "app_settings" });
  const value = Number(settings?.fuelCredit?.defaultLimit);
  return {
    defaultLimit:
      Number.isFinite(value) && value >= 0
        ? toMoney(value)
        : DEFAULT_WEEKLY_FUEL_CREDIT,
    // Admin toggle — credit limits enforced only when enabled (default: on)
    enabled: settings?.fuelCredit?.enabled !== false,
  };
}

export async function isFuelCreditEnabled(db: Db): Promise<boolean> {
  const settings = await db.collection("settings").findOne({ type: "app_settings" });
  return settings?.fuelCredit?.enabled !== false;
}

export async function getDefaultWeeklyFuelCredit(db: Db): Promise<number> {
  return (await getFuelCreditConfig(db)).defaultLimit;
}

// Counts pending + approved + sent + completed fuel requests in the current week
export async function getDriverFuelCredit(
  db: Db,
  userId: string,
  week: FuelCreditWeek = getFuelCreditWeek(),
): Promise<DriverFuelCredit> {
  const [profile, config] = await Promise.all([
    db.collection("driverProfiles").findOne({ userId }),
    getFuelCreditConfig(db),
  ]);
  const defaultLimit = config.defaultLimit;

  const override = Number(profile?.fuelCreditLimit);
  const hasOverride = Number.isFinite(override) && override >= 0;
  const limit = hasOverride ? toMoney(override) : defaultLimit;

  const rows = await db
    .collection("serviceRequests")
    .find({
      userId,
      type: "fuel",
      status: { $in: ["pending", "approved", "sent", "completed"] },
      requestDate: { $gte: week.startDate, $lt: week.endDate },
    })
    .project({ amount: 1, actualAmount: 1 })
    .toArray();

  const used = toMoney(
    rows.reduce(
      (sum: number, r: { amount?: number; actualAmount?: number }) =>
        sum + (r.actualAmount || r.amount || 0),
      0,
    ),
  );

  return {
    limit,
    used,
    remaining: toMoney(Math.max(0, limit - used)),
    weekStart: week.startDate,
    weekEnd: week.endDate,
    isDefaultLimit: !hasOverride,
    enabled: config.enabled,
  };
}

// Per-driver credits for all drivers, in a single week-window query each
export async function getAllDriverFuelCredits(db: Db) {
  const week = getFuelCreditWeek();
  const config = await getFuelCreditConfig(db);
  const defaultLimit = config.defaultLimit;

  const [profiles, usageRows] = await Promise.all([
    db.collection("driverProfiles").find({}).project({
      userId: 1,
      name: 1,
      fullName: 1,
      email: 1,
      driverEmail: 1,
      carRegistrationNumber: 1,
      fuelCreditLimit: 1,
    }).toArray(),
    db.collection("serviceRequests").find({
      type: "fuel",
      status: { $in: ["pending", "approved", "sent", "completed"] },
      requestDate: { $gte: week.startDate, $lt: week.endDate },
    }).project({ userId: 1, amount: 1, actualAmount: 1 }).toArray(),
  ]);

  const usageByUser = new Map<string, number>();
  for (const row of usageRows) {
    if (!row.userId) continue;
    usageByUser.set(
      row.userId,
      (usageByUser.get(row.userId) || 0) + (row.actualAmount || row.amount || 0),
    );
  }

  const drivers = profiles
    .filter((p) => p.userId)
    .map((p) => {
      const override = Number(p.fuelCreditLimit);
      const hasOverride = Number.isFinite(override) && override >= 0;
      const limit = hasOverride ? toMoney(override) : defaultLimit;
      const used = toMoney(usageByUser.get(p.userId) || 0);
      return {
        userId: p.userId,
        name: p.fullName || p.name || "",
        email: p.email || p.driverEmail || "",
        carRegistration: p.carRegistrationNumber || "",
        limit,
        used,
        remaining: toMoney(Math.max(0, limit - used)),
        isDefault: !hasOverride,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    defaultLimit,
    enabled: config.enabled,
    weekStart: week.startDate,
    weekEnd: week.endDate,
    drivers,
  };
}
