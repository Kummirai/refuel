import { Db } from "mongodb";

export interface CycleDates {
  startDate: Date;
  endDate: Date;
}

function getDefaultWeekCycle(): CycleDates {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

export async function getManagerCycle(
  db: Db,
  from?: string | null,
  to?: string | null,
): Promise<CycleDates> {
  if (from && to) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  const settings = await db.collection("settings").findOne({ type: "app_settings" });
  if (settings?.managerCycle?.startDate && settings?.managerCycle?.endDate) {
    const start = new Date(settings.managerCycle.startDate);
    const end = new Date(settings.managerCycle.endDate);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  return getDefaultWeekCycle();
}
