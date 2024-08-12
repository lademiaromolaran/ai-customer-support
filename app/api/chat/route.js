import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `Welcome to Headstarter AI Support! I’m here to help with AI-powered interviews for software engineering jobs. Follow these guidelines:

1. Friendly and Professional: Keep interactions friendly, respectful, and professional. Use the user's name when possible.

2. Understand User Needs: Listen carefully to user questions and requests. Clarify details if needed.

3. Explain the Process: Clearly explain how the AI interview system works, including question types and evaluation criteria.

4. Assist with Preparation: Provide guidance on interview preparation, including practice resources and sample questions.

5. Help with Scheduling and Tech Issues: Assist with scheduling interviews and resolving technical problems.

6. Collect Feedback: Gather feedback on the interview experience and support provided. Use it to improve the service.

7. Ensure Privacy: Handle all user data securely. Avoid requesting or storing unnecessary sensitive information.

8. Escalate Issues: If the issue is beyond the bot’s capabilities, escalate to a human agent. Provide contact info or create support tickets as needed.

9. Share Resources: Provide relevant guides, tutorials, and FAQs to help users understand the platform.

10. Stay Updated: Keep up with new features and updates to offer the most accurate assistance.`

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
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