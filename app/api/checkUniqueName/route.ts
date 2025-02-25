import { NextRequest, NextResponse } from "next/server";
import mongoose, { ConnectOptions } from "mongoose";
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
    const inputName = searchParams.get("assistantId");

    if (!inputName) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    const formattedName = formatDbId(inputName);
    
    // Query for both raw input and formatted version
    const uniqueCheck = await PromptModel.findOne({ assistantName: { $in: [inputName, formattedName] } });

    if (uniqueCheck) {
        return NextResponse.json({ message: "Name already exists", unique: true }, { status: 404 });
    }

    return NextResponse.json({
        message: "Name is free to take",
        unique: false
    }, { status: 200 });
  } catch (error) {
    console.error("Error checking uniqueness:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
