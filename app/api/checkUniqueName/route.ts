import { NextRequest, NextResponse } from "next/server";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { formatDbId } from "@/app/lib/formatDbId";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN } = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function GET(req: NextRequest) {
  try {
    
    const { searchParams } = new URL(req.url);
    const inputName = searchParams.get("assistantId");

    if (!inputName) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    const formattedName = formatDbId(inputName);
    const collection = db.collection(`${ASTRA_DB_PROMPT_COLLECTION}`);

    // Query for both raw input and formatted version
    // const uniqueCheck = await collection.find({
    //   $or: [
    //     { assistantName: inputName },
    //     { assistantName: formattedName }
    //   ]
    // });
    const uniqueCheck2 = await collection.findOne({ assistantName : inputName || formattedName });

    if (uniqueCheck2) {
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
