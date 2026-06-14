import { generateText } from "ai";
import { getVisionModel } from "@/lib/model";

export async function POST(req: Request) {
  let imageBase64: string;
  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
  } catch {
    return Response.json({ error: "请求格式错误，请确认上传了有效的图片。" }, { status: 400 });
  }

  if (!imageBase64 || !imageBase64.startsWith("data:")) {
    return Response.json({ error: "图片格式无效，需要 base64 data URI。" }, { status: 400 });
  }

  try {
    const result = await generateText({
      model: getVisionModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请精确提取这张图片中的所有招聘JD文字内容，保持原有的格式和层级结构。只输出JD原文，不要添加任何解释或额外内容。",
            },
            { type: "image", image: imageBase64 },
          ],
        } as any,
      ],
    });

    return Response.json({ jdText: result.text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("OCR error:", msg);
    return Response.json({
      error: `OCR 识别失败: ${msg.slice(0, 300)}。请确认已配置 VISION_OPENAI_API_KEY（支持 GPT-4o 或 Claude Vision 的 API Key）。`,
    }, { status: 500 });
  }
}
