import { NextRequest, NextResponse } from "next/server";
import { DataAPIClient } from "@datastax/astra-db-ts";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN } = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const formatDbId = (input: string): string => {
  let sanitized = input.replace(/[^a-zA-Z0-9 _]/g, "").replace(/\s+/g, "_");
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inputName = searchParams.get("name");

    if (!inputName) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    const formattedName = formatDbId(inputName);
    const collection = db.collection("prompts");

    // Query for both raw input and formatted version
    const uniqueCheck = await collection.find({
      $or: [
        { assistantName: inputName },
        { assistantName: formattedName }
      ]
    });

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
