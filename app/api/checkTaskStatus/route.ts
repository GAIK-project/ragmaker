import { NextRequest, NextResponse } from "next/server";
import mongoose, { ConnectOptions } from "mongoose";
import "dotenv/config";
import { formatDbId } from "@/app/lib/formatDbId";

const { MONGO_URI, MONGO_PROMPT_COLLECTION } = process.env;

// Ensure a single MongoDB connection instance
if (!mongoose.connection.readyState) {
    mongoose.connect(MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true } as ConnectOptions)
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.error("MongoDB connection error:", err));
}

// Define MongoDB Schema for Prompts
const promptSchema = new mongoose.Schema({
    assistantName: String,
    prompt: String,
    timestamp: { type: Date, default: Date.now },
    taskCompleted: { type: Boolean, default: false }
});
// const PromptModel = mongoose.models[MONGO_PROMPT_COLLECTION!] || mongoose.model(MONGO_PROMPT_COLLECTION!, promptSchema);
const PromptModel = mongoose.model(MONGO_PROMPT_COLLECTION!, promptSchema);

export async function GET(req: NextRequest) {
    try {
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
