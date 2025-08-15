import { groq } from "@ai-sdk/groq";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { model, messages }: { messages: UIMessage[]; model: string } =
    await req.json();

  const result = streamText({
    model: groq(model),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
