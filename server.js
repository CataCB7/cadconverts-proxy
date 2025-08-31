import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// CORS permis pentru site-ul tău:
app.use(cors({
  origin: ["https://www.cadconverts.com", "https://cadconverts.com"],
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// acceptă body binar (fișier)
app.use(express.raw({ type: "*/*", limit: "200mb" }));

app.get("/", (req, res) => res.send("CADConverts Proxy OK"));

/**
 * POST /upload?bucket=<bucket>&objectKey=<key>&token=<access_token>
 * Body: fișierul (binar)
 */
app.post("/upload", async (req, res) => {
  try {
    const bucket = (req.query.bucket || "").toString();
    const objectKey = (req.query.objectKey || "").toString();
    const token = (req.query.token || "").toString();

    if (!bucket || !objectKey || !token) {
      return res.status(400).json({ error: "Missing bucket, objectKey or token" });
    }
    if (!req.body?.length) {
      return res.status(400).json({ error: "Empty body" });
    }

    const url = `https://oss.api.autodesk.com/oss/v2/buckets/${bucket}/objects/${encodeURIComponent(objectKey)}`;

    const up = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-ads-region": "US",
        "Content-Type": "application/octet-stream",
        "Content-Length": String(req.body.length),
        "Connection": "keep-alive"
      },
      body: req.body
    });

    const txt = await up.text().catch(()=>"(no body)");
    if (!up.ok) return res.status(up.status).json({ ok:false, status: up.status, error: txt });

    return res.json({ ok: true, bucket, objectKey });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy running on", port));
