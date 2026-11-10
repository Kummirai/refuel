import { MongoClient } from "mongodb";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

async function fixCarwashCharges() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Get configured service charge from settings
    const settings = await db.collection("settings").findOne({ type: "app_settings" });
    const serviceCharge = settings?.services?.carWashServiceCharge ?? 0;
    console.log(`Configured car wash service charge: R${serviceCharge}`);

    if (serviceCharge <= 0) {
      console.log("No service charge configured. Skipping.");
      return;
    }

    // Find carwash records where 13% interest was incorrectly applied
    // (interestRate !== 0 or serviceCharge field missing)
    const affected = await db.collection("serviceRequests").find({
      type: "carwash",
      $or: [
        { interestRate: { $ne: 0 } },
        { serviceCharge: { $exists: false } },
      ],
    }).toArray();

    console.log(`Found ${affected.length} affected carwash records:`);

    for (const r of affected) {
      const correctTotal = (r.amount || 0) + serviceCharge;
      const oldTotal = r.totalRepayable || 0;
      const wasWrong = Math.abs(oldTotal - correctTotal) > 0.01;

      console.log(`\n  ${r.driverName || "Unknown"} (${r.carNumber || "N/A"})`);
      console.log(`    Amount: R${r.amount || 0}`);
      console.log(`    Old: totalRepayable=R${oldTotal}, interestRate=${r.interestRate ?? "missing"}%, interest=${r.interest ?? "missing"}, serviceCharge=${r.serviceCharge ?? "missing"}`);
      console.log(`    New: totalRepayable=R${correctTotal}, interestRate=0, interest=0, serviceCharge=${serviceCharge}, repaymentDays=0, dailyPayment=0`);

      if (wasWrong) {
        await db.collection("serviceRequests").updateOne(
          { _id: r._id },
          {
            $set: {
              interest: 0,
              interestRate: 0,
              repaymentDays: 0,
              dailyPayment: 0,
              serviceCharge: serviceCharge,
              totalRepayable: correctTotal,
              remainingBalance: r.isPaid ? (r.remainingBalance || 0) : correctTotal,
              updatedAt: new Date(),
            },
          },
        );
        console.log(`    ✓ FIXED`);
      } else {
        console.log(`    - Skipped (already correct)`);
      }
    }

    console.log(`\nDone. ${affected.length} record(s) processed.`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixCarwashCharges();
