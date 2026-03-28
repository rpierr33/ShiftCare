import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { nanoid } from "nanoid";

// To enable real S3 uploads, install:
//   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
// Then set env vars: S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

/**
 * POST /api/credentials/upload-url
 * Generates a presigned S3 upload URL for credential file uploads.
 * Falls back to a mock response when S3 is not configured.
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate required fields
    const { fileName, contentType } = await req.json();
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    // Generate a unique file key scoped to the user
    const fileKey = `credentials/${session.user.id}/${nanoid()}-${fileName}`;

    // If S3 is configured and AWS SDK is installed, generate a real presigned URL
    if (process.env.S3_BUCKET && process.env.AWS_REGION) {
      try {
        // Dynamic import — SDK may not be installed
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

        // Initialize S3 client with credentials from env
        const s3 = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        // Create a PUT command for the specific bucket/key/content-type
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: fileKey,
          ContentType: contentType,
        });

        // Generate presigned URL valid for 1 hour
        const uploadUrl = await getSignedUrl(s3, command, {
          expiresIn: 3600,
        });

        return NextResponse.json({ uploadUrl, fileKey });
      } catch (err) {
        // Log the failure and fall through to mock response
        console.error("S3 presigned URL generation failed (is @aws-sdk installed?):", err);
      }
    }

    // Mock response when S3 is not configured — allows UI flow to work in dev
    // The file key is saved to DB but no actual upload happens
    return NextResponse.json({
      uploadUrl: null,
      fileKey,
      mock: true,
      message:
        "S3 not configured. File key saved for reference. Install @aws-sdk/client-s3 and set S3_BUCKET + AWS credentials to enable uploads.",
    });
  } catch (error) {
    console.error("Upload URL route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
