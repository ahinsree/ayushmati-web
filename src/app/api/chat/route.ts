import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools, type AssistantMessage } from "@/lib/ai/tools";

export const maxDuration = 60;

const MAX_MESSAGES = 40;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "The assistant is not configured yet." }, { status: 503 });
  }

  let messages: AssistantMessage[];
  try {
    ({ messages } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return Response.json({ error: "Please start a new conversation." }, { status: 400 });
  }

  const result = streamText({
    model: anthropic(process.env.AI_MODEL ?? "claude-opus-5-5"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: stepCountIs(5),
    maxOutputTokens: 4000,
    providerOptions: { anthropic: { effort: "low" } },
  });

  return result.toUIMessageStreamResponse({
    onError: () => "Sorry, something went wrong. Please try again in a moment.",
  });
}
