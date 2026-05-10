import { NextResponse } from "next/server";
import {connectToDatabase} from "@/lib/db"

export async function GET(){

console.log(`You request reached this point`);


    try {
        const {db} = await connectToDatabase();
        const pending = await db.collection("serviceRequests").countDocuments({completedDate: {$ne: null}, hasReceipt: {$eq: false}}, );
        console.log(`Pending receipts ${pending}`);
        return NextResponse.json({ pending });
    } catch (error) {
    console.error("Error fetching verification count:", error);
    return NextResponse.json({ pending: 0 });    
    }
}