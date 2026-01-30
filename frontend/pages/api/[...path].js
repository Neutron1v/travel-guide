// Sends requests from /api/* to the backend

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export default async function handler(req, res) {
  const path = req.query.path ? (Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path) : "";
  const url = BACKEND + "/" + path;

  try {
    let options = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };
    if (req.method !== "GET" && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const text = await response.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch (_) {}

    if (response.status === 204) {
      res.status(204).end();
      return;
    }

    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(502).json({ detail: "Backend error" });
  }
}
