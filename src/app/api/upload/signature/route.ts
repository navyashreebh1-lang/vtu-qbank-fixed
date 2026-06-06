import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/upload/signature - Generate a signature for client-side upload
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(ip, { maxRequests: 20, windowMs: 60000 });
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json(
        { success: false, error: "Missing public_id" },
        { status: 400 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!apiSecret) {
      throw new Error("Missing Cloudinary configuration");
    }

    const paramsToSign = {
      timestamp,
      folder: "vtu-question-bank",
      public_id,
      tags: "vtu,question-paper",
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error: any) {
    console.error("POST /api/upload/signature error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate signature" },
      { status: 500 }
    );
  }
}
