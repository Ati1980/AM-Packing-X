import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // API route for AI maintenance prediction
  app.post("/api/predict-maintenance", async (req, res) => {
    try {
      const { machineName, records } = req.body;
      const prompt = `You are an expert industrial maintenance AI engineer for 1Kg packaging machines.
Analyze the following inspection history records for machine "${machineName}":
${JSON.stringify(records, null, 2)}

Provide a concise, professional engineering diagnosis in Thai language with:
1. Overall Machine Health Assessment (สถานะเครื่องจักรโดยรวม)
2. Temperature & Speed Trend Analysis (วิเคราะห์แนวโน้มอุณหภูมิและความเร็ว)
3. Predictive Maintenance Recommendations (คำแนะนำการบำรุงรักษาเชิงพยากรณ์ว่าควรตรวจสอบชิ้นส่วนใดและเมื่อใด)

Keep the response structured, clear, and actionable.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      res.json({ success: true, analysis: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate AI prediction" });
    }
  });

  // Vite middleware for frontend development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
