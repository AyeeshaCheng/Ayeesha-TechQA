import { generateText } from "ai";
import { getVisionModel } from "@/lib/model";
import { getDataDir } from "@/lib/db";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

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

  // Save the image to disk so we can show it later in history
  let savedImagePath: string | null = null;
  try {
    const dataDir = getDataDir(); // always absolute
    const imagesDir = path.join(dataDir, "jd-images");
    fs.mkdirSync(imagesDir, { recursive: true });

    // Extract MIME type and base64 data
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const ext = mimeMatch ? mimeMatch[1].split("/")[1] : "png";
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const filename = `jd-${randomUUID().slice(0, 8)}.${ext}`;
    const filePath = path.join(imagesDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
    savedImagePath = filePath;
  } catch (err) {
    console.error("Failed to save JD image:", err);
    // Don't fail the whole request — OCR can still proceed
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

    return Response.json({ jdText: result.text, imagePath: savedImagePath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("OCR error:", msg);
    return Response.json({
      error: `OCR 识别失败: ${msg.slice(0, 300)}。请确认已配置 VISION_OPENAI_API_KEY（支持 GPT-4o 或 Claude Vision 的 API Key）。`,
    }, { status: 500 });
  }
}
