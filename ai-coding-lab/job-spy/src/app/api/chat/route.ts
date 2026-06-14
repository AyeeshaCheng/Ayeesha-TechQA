import { streamText } from "ai";
import { getChatModel } from "@/lib/model";
import { CHAT_SYSTEM } from "@/lib/prompts";
import { randomUUID } from "crypto";
import { initDb, saveChatSession } from "@/lib/db";

export const maxDuration = 120;

export async function POST(req: Request) {
  initDb();

  const body = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    matchResultId?: string;
    context?: { jdSummary?: string; resumeGaps?: string };
  };

  // If this is the first message, build initial context
  let systemPrompt = CHAT_SYSTEM;
  if (body.context?.jdSummary) {
    systemPrompt += `\n\n当前目标岗位关键要求:\n${body.context.jdSummary}`;
  }
  if (body.context?.resumeGaps) {
    systemPrompt += `\n\n候选人简历可丰富部分:\n${body.context.resumeGaps}`;
  }

  const result = streamText({
    model: getChatModel(),
    system: systemPrompt,
    messages: body.messages as any,
    onFinish: async ({ text }) => {
      // Save completed conversation to DB
      const sessionId = randomUUID();
      const allMessages = [
        ...body.messages,
        { role: "assistant" as const, content: text },
      ];

      // Try to extract highlights if user said "完成"
      let highlightsJson: string | null = null;
      const lastUserMsg = body.messages
        .filter((m) => m.role === "user")
        .at(-1)?.content || "";
      if (lastUserMsg.includes("完成") || lastUserMsg.includes("结束")) {
        try {
          // Ask model to summarize
          const { generateText } = await import("ai");
          const summary = await generateText({
            model: getChatModel(),
            prompt: `请从以下对话中提取用户的工作亮点，输出JSON格式：
{"highlights": ["带量化数据的成就"], "quantifiedResults": ["量化指标"], "newSkills": ["未体现在简历中的技能"]}

对话内容：
${JSON.stringify(allMessages)}`,
          });
          highlightsJson = summary.text;
        } catch {
          // ignore summary failure
        }
      }

      try {
        saveChatSession({
          id: sessionId,
          match_result_id: body.matchResultId || null,
          messages_json: JSON.stringify(allMessages),
          highlights_json: highlightsJson,
        });
      } catch { /* ignore db errors */ }
    },
  });

  return result.toTextStreamResponse();
}
