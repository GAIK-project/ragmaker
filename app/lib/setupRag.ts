import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_PROMPT_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY } = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    try {
        await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 1536,
                metric: similarityMetric
            }
        });
        await db.createCollection(ASTRA_DB_PROMPT_COLLECTION);
        return true;
    } catch (error) {
        console.error("Error creating collection:", error);
        return false;
    }
};

const scrapePage = async (url: string) => {
    try {
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: { headless: true },
            gotoOptions: { waitUntil: "domcontentloaded" },
            evaluate: async (page, browser) => {
                const result = await page.evaluate(() => document.body.innerHTML);
                await browser.close();
                return result;
            }
        });
        return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
    } catch (error) {
        console.error(`Error scraping page ${url}:`, error);
        return null;
    }
};

const loadData = async (links: string[]) => {
    try {
        const collection = await db.collection(ASTRA_DB_COLLECTION);
        for await (const url of links) {
            const content = await scrapePage(url);
            if (!content) continue;
            const chunks = await splitter.splitText(content);
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
            }
        }
        return { message: "Data loaded successfully", success: true };
    } catch (error) {
        console.error("Error loading data:", error);
        return { message: "Failed to load data", success: false };
    }
};

const saveSystemPrompt = async (systemPrompt: string) => {
    try {
        const promptCollection = await db.collection(ASTRA_DB_PROMPT_COLLECTION);
        await promptCollection.insertOne({
            prompt: systemPrompt,
            timestamp: new Date()
        });
        return { message: "System prompt saved successfully", success: true };
    } catch (error) {
        console.error("Error saving system prompt:", error);
        return { message: "Failed to save system prompt", success: false };
    }
};

export const processLinks = async (links: string[], systemPrompt: string) => {
    const collectionCreated = await createCollection();
    if (!collectionCreated) {
        return { message: "Failed to create collection", success: false };
    }
    const promptSaved = await saveSystemPrompt(systemPrompt);
    if (!promptSaved.success) {
        return promptSaved;
    }
    return await loadData(links);
};
