/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please configure it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const BUREAU_ADDRESSES = {
  Experian: 'Experian Credit Dispute Center\nP.O. Box 4500\nAllen, TX 75013',
  TransUnion: 'TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016',
  Equifax: 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374',
  Innovis: 'Innovis Consumer Assistance\nP.O. Box 1689\nPittsburgh, PA 15230'
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Server-side Dispute Letter Generator using Gemini
  app.post("/api/generate-dispute", async (req, res) => {
    try {
      const { 
        bureau, 
        accountName, 
        accountNumber, 
        disputeType, // 'fraud' | 'error'
        details, 
        disputeReason, 
        personalInfo 
      } = req.body;

      if (!bureau || !accountName) {
        return res.status(400).json({ error: "Bureau and accountName are required parameters." });
      }

      const ai = getGeminiClient();
      const todayDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const targetBureauAddress = BUREAU_ADDRESSES[bureau as keyof typeof BUREAU_ADDRESSES] || `${bureau} Dispute Department`;

      // Formulate prompt instructing Gemini to write a formal legal dispute letter under the FCRA.
      // We instruct it to follow professional letter formatting with prefilled fields and strictly no placeholders.
      const prompt = `
You are an expert FCRA (Fair Credit Reporting Act) compliance assistant. Write a formal, legally precise, and persuasive credit dispute letter addressed to ${bureau}. 

Here are the details of the dispute:
- Target Bureau Name: ${bureau}
- Target Bureau Mailing Address:
${targetBureauAddress}

Consumer Personal Info:
- Name: ${personalInfo?.name || "Sarah J. Jenkins"}
- Current Address: ${personalInfo?.address || "482 Elmwood Ave, Portland, OR 97201"}
- Date of Birth: ${personalInfo?.dob || "11/14/1988"}
- SSN / Tax ID (Redacted): ${personalInfo?.ssn || "[REDACTED SSN]"}

Target Account Details:
- Creditor/Account Name: ${accountName}
- Account Number (Partial/Redacted): ${accountNumber || "XXXX"}
- Dispute Category: ${disputeType === "fraud" ? "Identity Theft / Fraudulent Account (FCRA Section 605B)" : "Reporting Inaccuracy / Account Error (FCRA Section 611)"}
- Inaccuracy Details / Discrepancies: ${details}
- Dispute Reason (as explained by user): ${disputeReason}

Today's Date to use: ${todayDate}

Guidelines for the letter:
1. Format it as a high-quality, professional letter.
2. Under the FCRA, clearly state the nature of the dispute:
   - If 'fraud' (Identity Theft): Reference FCRA Section 605B (15 U.S.C. § 1681c-2). State that this account is fraudulent, opened as a result of identity theft, and demand that the item be blocked and removed immediately. State that an FTC Identity Theft Report and Affidavit will be attached to this letter.
   - If 'error' (Inaccuracy): Reference FCRA Section 611 (15 U.S.C. § 1681i). Point out the discrepancy clearly, explain what the correct information is, and demand that they investigate, verify, and correct the error within the 30-day statutory response window.
3. Keep the tone professional, polite, firm, and authoritative.
4. DO NOT write any placeholders like "[Your Name]" or "[Insert Address]". Replace ALL fields with the provided consumer information. The output should be a complete draft that is ready to be copied and printed directly.
5. Do NOT include any meta-commentary, notes, or chat prefixes. Output ONLY the raw plain-text dispute letter.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2, // Keep it highly consistent and professional
        }
      });

      const letterText = response.text || "Failed to generate letter draft.";
      res.json({ letter: letterText });
    } catch (error: any) {
      console.error("Gemini dispute generation failed:", error);
      res.status(500).json({ 
        error: error.message || "An error occurred while generating the dispute draft." 
      });
    }
  });

  // Server-side Copilot Chat using Hugging Face (Abliterated Model)
  app.post("/api/copilot-chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const hfKey = process.env.HUGGINGFACE_API_KEY;
      if (!hfKey) {
        return res.status(500).json({ error: "HUGGINGFACE_API_KEY environment variable is required. Please configure it in the Secrets panel." });
      }

      const hf = new HfInference(hfKey);
      
      // Using an abliterated Llama-3 model for uncensored step-by-step assistance
      let out = "";
      for await (const chunk of hf.chatCompletionStream({
        model: "mlabonne/Meta-Llama-3-8B-Instruct-abliterated",
        messages: [
          { role: "system", content: "You are the DATAcartel AI Specialist. You are an expert AI agent specializing in credit report repair, specifically rectifying discrepancies and fraudulent entries. You know all the ins and outs of the Fair Credit Reporting Act (FCRA), how to get negative items removed from reports expediently, and how to force the bureaus' hands to resolve disputes in a short amount of time. You provide step-by-step, actionable, authoritative, and uncensored guidance. You do not hold back on aggressive but legal statutory leverage." },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.5,
      })) {
        if (chunk.choices && chunk.choices.length > 0) {
          out += chunk.choices[0].delta.content || "";
        }
      }
      
      res.json({ text: out });
    } catch (error: any) {
      console.error("Hugging Face copilot chat failed:", error);
      res.status(500).json({ 
        error: error.message || "An error occurred during Copilot chat generation." 
      });
    }
  });

  // Vite Integration for Dev / SPA Fallback for Prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Static production assets mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the Express server:", err);
});
