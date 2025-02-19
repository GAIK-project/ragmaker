import { NextRequest, NextResponse } from "next/server";
import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";
import { formatDbId } from "@/app/lib/formatDbId";
import { scrapePage } from "@/app/lib/newScraping";
import { scrapePage as scrapePage2 } from "@/app/lib/autoScraper";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN } = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function GET(req: NextRequest) {
    try {
        // const colls = await db.listCollections();

        // const checkIfExists = (searchName: string): boolean => {
        //     return colls.some(collection => collection.name === searchName);
        // };

        // console.log("promptit: ", checkIfExists("prompts"));
        // console.log("promptit2: ", checkIfExists("prompts222"));

        let testLink : string = "https://yle.fi/t/18-173265/fi";

        let textContent = await scrapePage2(testLink);

        console.log(textContent);

        return NextResponse.json({
            message: "Task status retrieved"
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching task status:", error);
        return NextResponse.json({ message: "Failed to check task status", error: error.message }, { status: 500 });
    }
}