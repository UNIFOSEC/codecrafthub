import type Anthropic from "@anthropic-ai/sdk";
import { TOOL_NAMES } from "./prompt";

type MessageParam = Anthropic.Beta.BetaMessageParam;

/**
 * The endpoint is public, so every request is checked before it reaches Claude:
 * - bounded size, so it can't be used for long or expensive prompts
 * - only text and Coach's own tool blocks; no images, documents or other tools
 * - user blocks are rebuilt field by field. Assistant blocks are passed back
 *   unchanged, because the API requires thinking blocks to be returned exactly.
 */
export const LIMITS = {
  messages: 60, // user + assistant + tool-result turns
  userText: 4_000, // a single typed message
  courseData: 40_000, // the <course_data> snapshot block
  toolResult: 4_000,
  totalChars: 200_000,
} as const;

export class RequestError extends Error {}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateMessages(body: unknown): MessageParam[] {
  if (!isObject(body) || !Array.isArray(body.messages)) {
    throw new RequestError('Expected a JSON body like { "messages": [...] }.');
  }
  const raw = body.messages;
  if (raw.length === 0) throw new RequestError("No messages to send.");
  if (raw.length > LIMITS.messages) {
    throw new RequestError("This conversation is too long. Start a new chat to keep going.");
  }
  if (JSON.stringify(raw).length > LIMITS.totalChars) {
    throw new RequestError("This conversation is too long. Start a new chat to keep going.");
  }

  const messages = raw.map((message, index): MessageParam => {
    if (!isObject(message)) throw new RequestError(`Message ${index} is not an object.`);
    if (message.role === "user") return { role: "user", content: userContent(message.content, index) };
    if (message.role === "assistant") return { role: "assistant", content: assistantContent(message.content, index) };
    throw new RequestError(`Message ${index} has an unsupported role.`);
  });

  if (messages[0].role !== "user" || messages[messages.length - 1].role !== "user") {
    throw new RequestError("A conversation must start and end with a user message.");
  }
  return messages;
}

function userContent(content: unknown, index: number): Anthropic.Beta.BetaContentBlockParam[] {
  if (typeof content === "string") content = [{ type: "text", text: content }];
  if (!Array.isArray(content) || content.length === 0) throw new RequestError(`Message ${index} is empty.`);

  return content.map((block): Anthropic.Beta.BetaContentBlockParam => {
    if (!isObject(block)) throw new RequestError(`Message ${index} has an invalid block.`);

    if (block.type === "text" && typeof block.text === "string") {
      const limit = block.text.startsWith("<course_data") ? LIMITS.courseData : LIMITS.userText;
      if (block.text.length === 0) throw new RequestError(`Message ${index} has an empty text block.`);
      if (block.text.length > limit) throw new RequestError("That message is too long. Please shorten it.");
      return { type: "text", text: block.text };
    }

    if (block.type === "tool_result" && typeof block.tool_use_id === "string" && typeof block.content === "string") {
      if (block.content.length > LIMITS.toolResult) throw new RequestError("A tool result is too long.");
      return {
        type: "tool_result",
        tool_use_id: block.tool_use_id,
        content: block.content,
        ...(block.is_error === true ? { is_error: true } : {}),
      };
    }

    throw new RequestError(`Message ${index} contains an unsupported block.`);
  });
}

const ASSISTANT_BLOCKS = new Set(["text", "thinking", "redacted_thinking", "tool_use", "fallback"]);

function assistantContent(content: unknown, index: number): Anthropic.Beta.BetaContentBlockParam[] {
  if (typeof content === "string") return [{ type: "text", text: content }];
  if (!Array.isArray(content)) throw new RequestError(`Message ${index} has invalid content.`);

  for (const block of content) {
    if (!isObject(block) || typeof block.type !== "string" || !ASSISTANT_BLOCKS.has(block.type)) {
      throw new RequestError(`Message ${index} contains an unsupported block.`);
    }
    if (block.type === "tool_use" && (typeof block.name !== "string" || !TOOL_NAMES.has(block.name))) {
      throw new RequestError(`Message ${index} uses an unknown tool.`);
    }
  }
  // Returned unchanged: thinking blocks are verified by the API and must not be edited
  return content as Anthropic.Beta.BetaContentBlockParam[];
}
