export default async function handler(req, res) {
  // CORS
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

  // ① チャンネルのアップロード動画リストの playlistId を取得
  async function getUploadsPlaylistId() {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("id", CHANNEL_ID);
    url.searchParams.set("part", "contentDetails");

    const res = await fetch(url);
    const data = await res.json();

    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  }

  // ② playlistItems を使って全動画を取得（ページネーション対応）
  async function getAllVideos(playlistId) {
    let videos = [];
    let nextPageToken = "";

    while (true) {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("key", API_KEY);
      url.searchParams.set("playlistId", playlistId);
      url.searchParams.set("part", "snippet");
      url.searchParams.set("maxResults", "50");
      if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

      const res = await fetch(url);
      const data = await res.json();

      if (!data.items) break;

      videos = videos.concat(data.items);

      if (!data.nextPageToken) break;
      nextPageToken = data.nextPageToken;
    }

    return videos;
  }

  // ③ キーワードでフィルタして最新の動画を返す
  function filterVideos(videos, keywords, mode) {
    const filtered = videos.filter(item => {
      const title = item.snippet.title || "";
      const desc = item.snippet.description || "";
      const text = title + " " + desc;

      if (mode === "AND") {
        return keywords.every(kw => text.includes(kw));
      } else {
        return keywords.some(kw => text.includes(kw));
      }
    });

    // 公開日の新しい順にソート
    filtered.sort((a, b) => {
      return new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt);
    });

    return filtered[0] || null;
  }

  // 実行
  const playlistId = await getUploadsPlaylistId();
  if (!playlistId) {
    return res.status(500).json({ error: "Failed to get playlistId" });
  }

  const allVideos = await getAllVideos(playlistId);
  const latest = filterVideos(allVideos, keywords, mode);

  if (!latest) {
    return res.status(404).json({ error: "No matching video found" });
  }

  const videoId = latest.snippet.resourceId.videoId;
  const url = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&loop=1&playlist=${videoId}`;

  res.status(200).json({ url });
}
