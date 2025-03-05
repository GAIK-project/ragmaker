import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "./../../lib/db";
import PromptModel from "./../../models/Prompt";
import { formatDbId } from "@/app/lib/formatDbId";

export async function GET(req: NextRequest) {
  try {

    await connectToDatabase();  // Ensure database is connected
    
    const { searchParams } = new URL(req.url);
    const inputName = searchParams.get("assistantId");

    if (!inputName) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    const formattedName = formatDbId(inputName);

    const uniqueCheck = await PromptModel.findOne({
      assistantName: { $in: [inputName, formattedName] },
    });

    if (uniqueCheck) {
      return NextResponse.json({ message: "Name already exists", unique: true }, { status: 404 });
    }

    return NextResponse.json({
      message: "Name is free to take",
      unique: false,
    }, { status: 200 });
  } catch (error) {
    console.error("Error checking uniqueness:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
