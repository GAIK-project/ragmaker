import { openai as openai2 } from '@ai-sdk/openai';
import OpenAI from "openai";
import { streamText } from 'ai';
import { DataAPIClient } from '@datastax/astra-db-ts';

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_EMBEDDING_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, {
  namespace: ASTRA_DB_NAMESPACE,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = '';

    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: latestMessage,
        encoding_format: "float"
    })

    try {
      const collection = await db.collection(ASTRA_DB_EMBEDDING_COLLECTION);
      const cursor = collection.find(null, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
      });

      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
      
    } catch (error) {
      console.error('Error querying db in block 1:', error);
    }

    const template = {
      role: 'system',
      content: `You are an AI assistant who knows everything about Formula One. Use the below context to augment what you know about Formula One racing. If the context doesn't include the information you need to answer, rely on your existing knowledge. Do not mention the source of your information or what the context does or does not include. Format responses using markdown where applicable and do not return images.
      START CONTEXT ${docContext} END CONTEXT. QUESTION: ${latestMessage}`,
    };

    const result = await streamText({
      model: openai2('gpt-4o'),
      messages: [template, ...messages],
    });

    // const result = await streamText({
    //   model: openai2('gpt-4'),
    //   system: `You are an AI assistant who knows everything about Formula One. Use the below context to augment what you know about Formula One racing. If the context doesn't include the information you need to answer, rely on your existing knowledge. Do not mention the source of your information or what the context does or does not include. Format responses using markdown where applicable and do not return images.
    //   START CONTEXT ${docContext} END CONTEXT. QUESTION: ${latestMessage}`,
    //   messages: messages,
    // });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
