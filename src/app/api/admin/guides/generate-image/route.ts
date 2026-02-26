import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { processImage, generateImageFilename } from "@/lib/blog/image-processing";
import { upload } from "@/lib/storage";

/**
 * POST /api/admin/guides/generate-image
 * Generate an image using Gemini 3 Pro Image (same model as nano-banana-pro)
 *
 * Body: { prompt: string }
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Use generateContent with image modality (same approach as nano-banana-pro)
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract image from response parts
    let imageBytes: string | null = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageBytes = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageBytes) {
      return NextResponse.json(
        { error: "No image generated — try rephrasing the prompt" },
        { status: 500 }
      );
    }

    // Convert base64 to buffer
    const rawBuffer = Buffer.from(imageBytes, "base64");

    // Process (resize + webp)
    const processedBuffer = await processImage(rawBuffer);
    const filename = generateImageFilename("guide-ai-generated.png");

    // Upload to blob
    const result = await upload(processedBuffer, filename, "guides");

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Error generating image:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
