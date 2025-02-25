import { NextRequest, NextResponse } from "next/server";
import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";
import { formatDbId } from "@/app/lib/formatDbId";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN } = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function GET(req: NextRequest) {
    try {
        // const colls = await db.listCollections();

        // console.log(colls);

        const { searchParams } = new URL(req.url);
        const assistantId = searchParams.get("assistantId");

        let newName : string = formatDbId(assistantId).toString().trim();

        const promptCollection = db.collection(ASTRA_DB_PROMPT_COLLECTION);

        // let juu = await promptCollection.estimatedDocumentCount();
        // console.log(juu);

        const docs = await promptCollection.find({}).toArray();

        let latestPrompt = docs.find(entry => entry.assistantName === newName);

        // const latestPrompt = await promptCollection.findOne({ assistantName : newName }); //this did not work, probably if data is not uniform it cant fetch one

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
