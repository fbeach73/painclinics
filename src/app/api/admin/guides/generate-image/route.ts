import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { processImage, generateImageFilename } from "@/lib/blog/image-processing";
import { upload } from "@/lib/storage";

/**
 * POST /api/admin/guides/generate-image
 * Generate an image using Gemini and save to blob storage
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

    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      },
    });

    const generatedImage = response.generatedImages?.[0];
    if (!generatedImage?.image?.imageBytes) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    // Convert base64 to buffer
    const rawBuffer = Buffer.from(generatedImage.image.imageBytes, "base64");

    // Process (resize + webp)
    const processedBuffer = await processImage(rawBuffer);
    const filename = generateImageFilename("guide-ai-generated.png");

    // Upload to blob
    const result = await upload(processedBuffer, filename, "guides");

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
