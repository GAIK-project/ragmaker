import { NextRequest, NextResponse } from "next/server";
import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";
import { formatDbId } from "@/app/lib/formatDbId";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN } = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const assistantId = searchParams.get("assistantId");

        if (!assistantId) {
            return NextResponse.json({ message: "Missing assistantId parameter" }, { status: 400 });
        }

        let newName : string = formatDbId(assistantId);

        const promptCollection = await db.collection(`${ASTRA_DB_PROMPT_COLLECTION}`);

        // // Find the assistant by ID
        // const assistantData = await promptCollection.findOne({ assistantName: newName });
        const docs = await promptCollection.find({}).toArray();

        let assistantData = docs.find(entry => entry.assistantName === newName);
        console.log(assistantData);

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
