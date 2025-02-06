import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "You are a recipe generation bot, which generates recipes which step by step instructions based on some of the ingredients available in the pantry"

export async function POST(req) {
    const openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
    }) // Create a new instance of the OpenAI client
    const data = await req.json() // Parse the JSON body of the incoming request
    const { ingredients } = data;
    const prompt = `Here are the ingredients available: ${ingredients.join(", ")}. Generate a recipe based on some of these ingredients.`;
    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ], // Include the system prompt and user messages
      model: 'openai/gpt-4o-2024-08-06', // Specify the model to use
      stream: true, // Enable streaming responses
    })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}