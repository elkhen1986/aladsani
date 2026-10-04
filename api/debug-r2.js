// api/debug-r2.js - ملف تشخيص R2 - يحطه في مجلد api
// افتح https://موقعك.vercel.app/api/debug-r2 بعد الرفع

import { S3Client, ListObjectsV2Command, HeadBucketCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  const env = {
    bucket: process.env.R2_BUCKET_NAME,
    account: process.env.R2_ACCOUNT_ID,
    publicUrl: process.env.R2_PUBLIC_URL,
    hasAccess: !!process.env.R2_ACCESS_KEY_ID,
    hasSecret: !!process.env.R2_SECRET_ACCESS_KEY,
    accessPrefix: process.env.R2_ACCESS_KEY_ID?.substring(0, 8) || "MISSING",
  };

  if (!process.env.R2_BUCKET_NAME || !process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return res.status(500).json({
      success: false,
      step: "ENV_CHECK",
      error: "ناقص متغيرات بيئة",
      env
    });
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    // 1- هل الباكت موجود؟
    await client.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME }));
  } catch (e) {
    return res.status(500).json({
      success: false,
      step: "HEAD_BUCKET",
      error: e.message,
      code: e.Code || e.name,
      env
    });
  }

  try {
    // 2- هل يقدر يعمل List؟
    const list = await client.send(new ListObjectsV2Command({ 
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 5
    }));
    return res.status(200).json({
      success: true,
      step: "OK",
      message: "R2 شغال تمام! ✅",
      env,
      filesFound: list.KeyCount,
      sampleKeys: (list.Contents || []).map(c => c.Key).slice(0, 3)
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      step: "LIST",
      error: e.message,
      code: e.Code || e.name,
      stack: e.stack?.substring(0, 500),
      env
    });
  }
}