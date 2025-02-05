import { NextRequest, NextResponse } from "next/server";
import { processLinks } from "@/app/lib/setupRag";

const formatDbId = (input: string): string => {
    // Remove all characters except letters, numbers, spaces, and underscores
    let sanitized = input.replace(/[^a-zA-Z0-9 _]/g, "");
  
    // Replace spaces with underscores
    sanitized = sanitized.replace(/\s+/g, "_");
  
    // Capitalize the first letter
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { assistantName, systemPrompt, links } = body;

        // Validate input
        if (typeof systemPrompt !== "string" || !Array.isArray(links) || typeof assistantName !== "string") {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        let newName : string = formatDbId(assistantName);

        //start processing data
        processLinks(newName, links, systemPrompt).then(() => {
            console.log("Data processing finished");
        }).catch((error) => {
            console.error("Error in background process:", error);
        });

        // Send a success response
        return NextResponse.json({ message: "Data saved successfully!" }, { status: 202 });
    } catch (error) {
        console.error("Error handling request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
