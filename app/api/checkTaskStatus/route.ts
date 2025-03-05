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
        let newName: string = formatDbId(assistantId).toString().trim();

        const latestPrompt = await PromptModel.findOne({ assistantName: newName });

        if (!latestPrompt) {
            return NextResponse.json({ message: "No prompt found", taskCompleted: false }, { status: 404 });
        }

        return NextResponse.json({
            message: "Task status retrieved",
            taskCompleted: latestPrompt.taskCompleted ?? false
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching task status:", error);
        return NextResponse.json({ message: "Failed to check task status", error: error.message }, { status: 500 });
    }
}
