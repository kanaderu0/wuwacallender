export const config = {
  runtime: "edge"
};

import { kv } from "@vercel/kv";

export default async function handler(req) {
  const API_KEY = process.env.API_KEY;
  const CHANNEL_ID = "UCGc93NguHRwzv1Rw9MyIcxQ";

  async function getUploadsPlaylistId() {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("id", CHANNEL_ID);
    url.searchParams.set("part", "contentDetails");

    const r = await fetch(url);
    const d = await r.json();
    return d.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  }

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

  function getLatest(videos) {
    videos.sort((a, b) =>
      new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
    );
    return videos[0];
  }

  const playlistId = await getUploadsPlaylistId();
  const videos = await getAllVideos(playlistId);
  const latest = getLatest(videos);

  const videoId = latest.snippet.resourceId.videoId;
  const url = `https://www.youtube.com/embed/${videoId}?loop=1&playlist=${videoId}`;

  await kv.set("latestVideoUrl", url);

  return new Response(JSON.stringify({ saved: url }), {
    headers: { "Content-Type": "application/json" }
  });
}