import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

const REPAYMENT_PROOF_ID = "6a32dff5d8d06e47d33f9b30";
const STUCK_REQUEST_IDS = [
  "6a2d67885324b963edbbfd79",
  "6a2f13b23c0d7398cc9feead",
  "6a32d783ae5ca3b13ed84d11",
];

async function fix() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    // 1. Remove the 3 request IDs from the repayment proof's requestIds array
    const proofResult = await repaymentProofsCollection.updateOne(
      { _id: new ObjectId(REPAYMENT_PROOF_ID) },
      {
        $pullAll: { requestIds: STUCK_REQUEST_IDS },
      },
    );
    console.log(`Repayment proof updated: ${JSON.stringify(proofResult)}`);

    // 2. Remove pending repayment flags from the 3 service requests
    for (const reqId of STUCK_REQUEST_IDS) {
      const result = await serviceRequestsCollection.updateOne(
        { _id: new ObjectId(reqId) },
        {
          $unset: {
            hasPendingRepayment: "",
            pendingRepaymentAmount: "",
            pendingRepaymentId: "",
          },
        },
      );
      console.log(`Service request ${reqId} updated: ${JSON.stringify(result)}`);
    }

    // 3. Verify
    const proof = await repaymentProofsCollection.findOne({ _id: new ObjectId(REPAYMENT_PROOF_ID) });
    console.log(`\nRepayment proof requestIds now:`, proof?.requestIds);

    for (const reqId of STUCK_REQUEST_IDS) {
      const req = await serviceRequestsCollection.findOne({ _id: new ObjectId(reqId) });
      console.log(`Request ${reqId}: hasPendingRepayment=${req?.hasPendingRepayment}, pendingRepaymentId=${req?.pendingRepaymentId}`);
    }

    console.log("\nDone. The 3 requests are moved back to pending.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fix();
