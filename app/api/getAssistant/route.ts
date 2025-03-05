import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "./../../lib/db";
import PromptModel from "./../../models/Prompt";
import "dotenv/config";
import { formatDbId } from "@/app/lib/formatDbId";

export async function GET(req: NextRequest) {
    try {

        await connectToDatabase();  // Ensure database is connected
        
        const { searchParams } = new URL(req.url);
        const assistantId = searchParams.get("assistantId");

        if (!assistantId) {
            return NextResponse.json({ message: "Missing assistantId parameter" }, { status: 400 });
        }

        let newName: string = formatDbId(assistantId);

        // Find the assistant by ID
        const assistantData = await PromptModel.findOne({ assistantName: newName });

        if (!assistantData) {
            return NextResponse.json({ message: "No assistant found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Assistant retrieved",
            data: assistantData
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching assistant data:", error);
        return NextResponse.json({ message: "Failed to retrieve assistant data", error: error.message }, { status: 500 });
    }
}
