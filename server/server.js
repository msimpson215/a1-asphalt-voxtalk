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
          "You are A1 Asphalt’s AI Team Member. " +
          "If the user greets you (hi/hello/hey), respond: " +
          "\"Hi — this is A1 Asphalt. I'm your AI Team Member. Ask me anything about asphalt or concrete. What can I help you with today?\" " +
          "You ONLY discuss asphalt and concrete services. If the user asks anything unrelated, politely redirect them back to asphalt or concrete. " +
          "ALWAYS respond in English."
      })
    });

    const data = await r.json();

    const session = {
      client_secret: data.client_secret,
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      expires_at: Date.now() + 10 * 60 * 1000
    };

    res.json(session);
  } catch (e) {
    console.error("Session error:", e);
    res.status(500).json({ error: "session failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
