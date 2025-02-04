import { NextRequest, NextResponse } from "next/server";
import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN } = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function GET(req: NextRequest) {
    try {
        // const colls = await db.listCollections();
        // console.log(colls);

        const promptCollection = await db.collection(ASTRA_DB_PROMPT_COLLECTION);

        // Fetch the latest system prompt entry
        // const latestPrompt = await promptCollection.findOne({}, { sort: { timestamp: -1 } });
        const latestPrompt = await promptCollection.findOne({ taskCompleted : true });

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
