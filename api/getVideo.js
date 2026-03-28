import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const url = await kv.get("latestVideoUrl");

  if (!url) {
    return res.status(404).json({ error: "No saved video" });
  }

  res.status(200).json({ url });
}
