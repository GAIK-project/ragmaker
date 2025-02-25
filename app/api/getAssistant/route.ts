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
