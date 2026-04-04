export const config = {
  runtime: "edge"
};

import { kv } from "@vercel/kv";

export default async function handler() {
  const videoId = await kv.get("latestVideoId");

  if (!videoId) {
  return res.status(404).json({ error: "No saved video" });
  }

  return new Response(JSON.stringify({ videoId }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",        // ← これが重要
      "Access-Control-Allow-Methods": "GET"
    }
  });
}