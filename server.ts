import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch"; // polyfill if needed

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analytics storage (In-memory for prototype)
const analyticsStore = {
  wpm: [] as { userId: string, age: number, wpm: number, timestamp: Date }[],
  struggledWords: [] as { userId: string, word: string, count: number }[]
};

// Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Analytics: Save Reading Session
  app.post("/api/analytics/session", (req, res) => {
    const { userId = 'anonymous', age, wpm, struggledWords } = req.body;
    
    if (wpm) {
      analyticsStore.wpm.push({ userId, age, wpm, timestamp: new Date() });
    }

    if (struggledWords && Array.isArray(struggledWords)) {
      struggledWords.forEach(word => {
        const existing = analyticsStore.struggledWords.find(sw => sw.userId === userId && sw.word === word);
        if (existing) {
          existing.count += 1;
        } else {
          analyticsStore.struggledWords.push({ userId, word, count: 1 });
        }
      });
    }

    res.json({ success: true, message: "Analytics saved" });
  });

  // Analytics: Get Stats
  app.get("/api/analytics/stats", (req, res) => {
    res.json(analyticsStore);
  });

  // Gemini: Generate Next Story Node
  app.post("/api/story/generate", async (req, res) => {
    const { currentStoryPath, readingLevel, recentStruggledWords } = req.body;
    
    // We want the AI to output a JSON object representing the next node.
    const prompt = `
      You are an interactive storyteller for a ${readingLevel || 'beginner'} reading level child.
      The story so far: ${currentStoryPath || "The hero begins their journey."}
      
      Generate the next node in the story.
      Keep the text short, engaging, and appropriate for the reading level.
      If the child struggled with these words recently: ${recentStruggledWords ? recentStruggledWords.join(", ") : "none"}, try to gently include one or two of them to help them practice, but don't force it.
      
      Respond STRICTLY in this JSON format, with no markdown formatting around it (just the JSON object):
      {
        "text": "The short paragraph of the story scene.",
        "imagePrompt": "A highly detailed, beautiful storybook illustration for children, depicting: [describe the scene visually]",
        "mood": "happy", // MUST be one of: "calm", "happy", "tense", "mysterious"
        "choices": [
          { "text": "Choice 1 text", "intent": "branch_1" },
          { "text": "Choice 2 text", "intent": "branch_2" }
        ],
        "moral": "An optional moral if this happens to be a good ending (leave null if continuing)"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-pro',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      const responseText = response.text();
      let nodeData;
      try {
        nodeData = JSON.parse(responseText || "{}");
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", responseText);
        return res.status(500).json({ error: "Invalid JSON from AI" });
      }

      res.json(nodeData);
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the dist folder
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));
    // For Express v4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
