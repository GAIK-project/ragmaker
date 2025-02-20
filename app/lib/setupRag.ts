import { DataAPIClient } from "@datastax/astra-db-ts";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";
import { scrapePage } from "./autoScraper";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_EMBEDDING_COLLECTION, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY } = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

const createCollections = async (similarityMetric: SimilarityMetric, assistantName: string) => {
    try {

        const colls = await db.listCollections();

        const checkIfExists = (searchName: string): boolean => {
            return colls.some(collection => collection.name === searchName);
        };

        await db.createCollection(`${assistantName}_${ASTRA_DB_EMBEDDING_COLLECTION}`, {
            vector: {
                dimension: 1536,
                metric: similarityMetric
            }
        });

        if(!checkIfExists(ASTRA_DB_PROMPT_COLLECTION)){
            await db.createCollection(`${ASTRA_DB_PROMPT_COLLECTION}`);
        }
        
        console.log("Collections created");
        return true;
    } catch (error) {
        console.error("Error creating collection:", error);
        return false;
    }
};

const loadData = async (links: string[], assistantName: string) => {
    try {
        const collection = await db.collection(`${assistantName}_${ASTRA_DB_EMBEDDING_COLLECTION}`);
        for await (const url of links) {
            const content = await scrapePage(url);
            if (!content) continue;
            const chunks = await splitter.splitText(content);
            const totalChunks = chunks.length;
            let processedChunks = 0;

            // Save total chunks to DB
            await saveTotalChunks(assistantName, totalChunks); //////

            //go thru chunks and make embeddings
            for await (const chunk of chunks) {
                const embedding = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: chunk,
                    encoding_format: "float"
                });
                const vector = embedding.data[0].embedding;
                await collection.insertOne({
                    $vector: vector,
                    text: chunk
                });
                processedChunks++;
                let currentChunk : string = chunk.slice(0, 20);

                // Update DB with current chunk progress
                await updateCurrentChunk(assistantName, processedChunks); //////

                console.log("Datachunk processed: ", `${processedChunks}/${totalChunks}`, currentChunk);
            }
            console.log("Link processed");
        }
        await markTaskCompleted(assistantName); // Mark the process as completed
        return { message: "Data loaded successfully", success: true };
    } catch (error) {
        console.error("Error loading data:", error);
        return { message: "Failed to load data", success: false };
    }
};

const saveSystemPrompt = async (assistantName : string, systemPrompt: string) => {
    try {
        const promptCollection = await db.collection(`${ASTRA_DB_PROMPT_COLLECTION}`);
        await promptCollection.insertOne({
            prompt: systemPrompt,
            timestamp: new Date(),
            taskCompleted: false, // Initially false
            assistantName: assistantName
        });
        return { message: "System prompt saved successfully", success: true };
    } catch (error) {
        console.error("Error saving system prompt:", error);
        return { message: "Failed to save system prompt", success: false };
    }
};

const markTaskCompleted = async (assistantName: string) => {
    try {
        const promptCollection = await db.collection(`${ASTRA_DB_PROMPT_COLLECTION}`);
        await promptCollection.updateOne(
            { assistantName : assistantName },
            { $set: { taskCompleted: true } }
        );
        console.log("Task marked as completed.");
    } catch (error) {
        console.error("Error updating task status:", error);
    }
};

const saveTotalChunks = async (assistantName: string, totalChunks: number) => {
    try {
        const promptCollection = await db.collection(`${ASTRA_DB_PROMPT_COLLECTION}`);
        await promptCollection.updateOne(
            { assistantName: assistantName },
            { $set: { totalChunks: totalChunks } }
        );
        console.log(`Total chunks (${totalChunks}) saved for ${assistantName}.`);
    } catch (error) {
        console.error("Error saving total chunk count:", error);
    }
};

const updateCurrentChunk = async (assistantName: string, processedChunks: number) => {
    try {
        const promptCollection = await db.collection(`${ASTRA_DB_PROMPT_COLLECTION}`);
        await promptCollection.updateOne(
            { assistantName: assistantName },
            { $set: { processedChunks: processedChunks } }
        );
        console.log(`Updated current chunk for ${assistantName}: ${processedChunks} processed.`);
    } catch (error) {
        console.error("Error updating current chunk:", error);
    }
};

export const processLinks = async (assistantName : string, links: string[], systemPrompt: string) => {
    const collectionsCreated = await createCollections("dot_product", assistantName);
    if (!collectionsCreated) {
        return { message: "Failed to create collections", success: false };
    }
    const promptSaved = await saveSystemPrompt(assistantName, systemPrompt);
    if (!promptSaved.success) {
        console.error("Error saving prompt..retrying")
        return promptSaved;
    }
    return await loadData(links, assistantName);
};
