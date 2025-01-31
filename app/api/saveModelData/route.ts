import { NextRequest, NextResponse } from "next/server";
import { sendTestData } from "@/app/lib/testFunction";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { systemPrompt, links } = body;

        // Validate input
        if (typeof systemPrompt !== "string" || !Array.isArray(links)) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        // Simulating saving data (replace this with DB logic)
        console.log("Received data:", { systemPrompt, links });
        let testData : string = await sendTestData();
        console.log("testdata: ", testData);

        // Send a success response
        return NextResponse.json({ message: "Data saved successfully!" }, { status: 200 });
    } catch (error) {
        console.error("Error handling request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
