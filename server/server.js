import express from "express";

const app = express();
app.use(express.static("public"));

app.post("/session", async (req, res) => {
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: "alloy",
        instructions:
          "You are an AI voice assistant. When the user starts a session, greet them by saying: 'Hi, this is VoxTalk. How can I help you today, Mia?' ALWAYS respond in English. Never default to Spanish. If the user speaks another language, translate it and reply only in English."
      })
    });

    const data = await r.json();

    // Add a 10-minute timeout
    const session = {
      client_secret: data.client_secret,
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      deepgramKey: process.env.DEEPGRAM_API_KEY, // keep this for now
      expires_at: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    res.json(session);

  } catch (e) {
    console.error("Session error:", e);
    res.status(500).json({ error: "session failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
