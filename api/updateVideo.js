import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const API_KEY = process.env.API_KEY;
  const CHANNEL_ID = "UCGc93NguHRwzv1Rw9MyIcxQ";

  // ① アップロード動画リストを取得
  async function getUploadsPlaylistId() {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("id", CHANNEL_ID);
    url.searchParams.set("part", "contentDetails");

    const r = await fetch(url);
    const d = await r.json();
    return d.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  }

  // ② 全動画を取得
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

      const r = await fetch(url);
      const d = await r.json();

      videos = videos.concat(d.items || []);
      if (!d.nextPageToken) break;
      nextPageToken = d.nextPageToken;
    }

    return videos;
  }

  // ③ 最新動画を判定
  function getLatest(videos) {
    videos.sort((a, b) =>
      new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
    );
    return videos[0];
  }

  // 実行
  const playlistId = await getUploadsPlaylistId();
  const videos = await getAllVideos(playlistId);
  const latest = getLatest(videos);

  const videoId = latest.snippet.resourceId.videoId;
  const url = `https://www.youtube.com/embed/${videoId}?loop=1&playlist=${videoId}`;

  // ④ KV に保存
  await kv.set("latestVideoUrl", url);

  res.status(200).json({ saved: url });
}
