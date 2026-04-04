export const config = {
  runtime: "edge"
};

import { kv } from "@vercel/kv";

export default async function handler() {
  const url = await kv.get("latestVideoUrl");

  if (!url) {
  return res.status(404).json({ error: "No saved video" });
  }

  return new Response(JSON.stringify({ url }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",        // ← これが重要
      "Access-Control-Allow-Methods": "GET"
    }
  });
}