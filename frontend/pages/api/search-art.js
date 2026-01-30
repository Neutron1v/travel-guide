// Proxy to Art Institute of Chicago API so users can search for places (artworks)
const ART_API = "https://api.artic.edu/api/v1";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ detail: "Method not allowed" });
    return;
  }
  const q = req.query.q || req.query.query || "";
  if (!q.trim()) {
    res.status(400).json({ detail: "Missing search query (q)" });
    return;
  }
  try {
    const url = `${ART_API}/artworks/search?q=${encodeURIComponent(q.trim())}&limit=12&fields=id,title,thumbnail`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(502).json({ detail: "Search failed" });
  }
}
