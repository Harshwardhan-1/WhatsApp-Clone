import { GROQ_API_KEY } from "../configs/env.config";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: GROQ_API_KEY,
});

const titleSystemPrompt = `
You are a chat title generator, similar to WhatsApp/ChatGPT auto-naming.

TASK:
Given the user's first message in a new chat, generate a short title for that chat.

RULES:
- Output ONLY the title text. No quotes, no punctuation at the end, no explanation.
- Max 4-5 words.
- Capture the core topic/intent of the message.
- If the message is a greeting or too vague to summarize (e.g. "hi", "hello"), output: "New Chat".
- Never invent details not present in the message.
`;

const fallbackTitle = (msg: string): string => {
    const words = msg.trim().split(/\s+/).slice(0, 5).join(" ");
    if (!words) return "New Chat";
    return words.length > 40 ? words.slice(0, 40) + "…" : words;
};

const cleanTitle = (t: string): string =>
    t.replace(/^["'`]+|["'`]+$/g, "").replace(/[.!?]+$/, "").trim();

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    const trimmed = firstMessage.trim();
    if (!trimmed) return "New Chat";

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: titleSystemPrompt },
                { role: "user", content: trimmed },
            ],
            model: "openai/gpt-oss-120b",
            temperature: 0.3,
            reasoning_effort: "low",
            max_completion_tokens: 512,
        });

        console.log("title raw:", JSON.stringify(completion.choices[0]?.message));

        const title = cleanTitle(completion.choices[0]?.message?.content ?? "");
        return title || fallbackTitle(trimmed);
    } catch (error) {
        console.error("Groq title generation error:", error);
        return fallbackTitle(trimmed);
    }
};