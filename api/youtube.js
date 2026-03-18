export default async function handler(req, res) {
  // CORS 対応
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  const API_KEY = process.env.API_KEY;
  const CHANNEL_ID = "UCGc93NguHRwzv1Rw9MyIcxQ";

  const keywords = req.query.keywords ? req.query.keywords.split(",") : [];
  const mode = req.query.mode || "OR";

  async function getLatestVideoUrl(keywords = [], mode = "OR") {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("channelId", CHANNEL_ID);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("order", "date");
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("type", "video");

    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) return null;

    const filtered = data.items.filter(item => {
      const title = item.snippet.title || "";
      const desc = item.snippet.description || "";
      const text = title + " " + desc;

      if (mode === "AND") {
        return keywords.every(kw => text.includes(kw));
      } else {
        return keywords.some(kw => text.includes(kw));
      }
    });

    if (filtered.length === 0) return null;

    const latest = filtered[0];
    return `https://www.youtube.com/embed/${latest.id.videoId}?enablejsapi=1&loop=1&playlist=${latest.id.videoId}`;
  }

  const url = await getLatestVideoUrl(keywords, mode);
  res.status(200).json({ url });
}
