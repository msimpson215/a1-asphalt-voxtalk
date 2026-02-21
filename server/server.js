// server/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve /public
const PUBLIC_DIR = path.join(__dirname, "..", "public");
app.use(express.static(PUBLIC_DIR, { maxAge: "1h" }));

app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * Creates a Realtime session and returns the client_secret + model/voice.
 * Front-end uses client_secret.value to authenticate to /v1/realtime.
 */
app.post("/session", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const model = "gpt-4o-realtime-preview";
    const voice = "alloy";

    const instructions = `
You are the AI Team Member for A1 Asphalt.

Voice + tone:
- Calm, confident, professional, friendly
- Short answers by default (unless the user asks for detail)
- Practical and jobsite-real, not salesy and not robotic

Greeting rule:
- If the user greets you (hi/hello/hey/yo), respond with:
"Hi — this is A1 Asphalt. I'm your AI Team Member. Ask me anything about asphalt or concrete. What can I help you with today?"

Scope (STRICT):
You ONLY discuss asphalt and concrete services, including:
- asphalt sealing / sealcoating
- crack filling / crack sealing
- pothole repair / patching
- driveways, parking lots
- striping, line painting
- curbs, sidewalks, concrete flatwork
- maintenance plans, scheduling, estimates, prep, drying times, and basic pricing factors

Off-topic handling:
- If the user asks about anything unrelated (politics, medical, personal counseling, guitars, general AI, etc.),
politely redirect:
"I can help with asphalt or concrete — what project are you looking at?"

Business goal:
- When appropriate, guide toward next steps: collect basic details (type of job, approximate size, location/city, timeframe)
- Suggest scheduling a quote if it makes sense

Language:
- Always respond in English.
`;

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        instructions,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("OpenAI session error:", data);
      return res.status(500).json({
        error: "OpenAI session failed",
        details: data,
      });
    }

    // Return only what the browser needs
    res.json({
      client_secret: data.client_secret,
      model,
      voice,
      expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes (informational)
    });
  } catch (e) {
    console.error("Session error:", e);
    res.status(500).json({ error: "session failed" });
  }
});

// SPA fallback to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
