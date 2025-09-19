import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get("/health/live", (_req, res) => res.status(200).send("OK"));
app.get("/", (_req, res) => res.status(200).send("KindCompanion API is live ✅"));
app.post("/echo", (req, res) => res.json({ youSent: req.body || null }));

app.listen(PORT, () => console.log(`KindCompanion API listening on ${PORT}`));
