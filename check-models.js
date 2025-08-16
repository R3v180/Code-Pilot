// Ruta: /code-pilot/check-models.js
// Versión: 1.0 (Script de diagnóstico)

import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listMyModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("ERROR CRÍTICO: No se encontró la variable GEMINI_API_KEY en tu archivo .env");
      return;
    }

    console.log("Contactando a la API de Google para listar los modelos disponibles...");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = await genAI.listModels();

    console.log("\n--- LISTA DE MODELOS DISPONIBLES QUE SOPORTAN 'generateContent' ---");
    for await (const m of models) {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(` -> ${m.name}`);
      }
    }
    console.log("------------------------------------------------------------------\n");
    console.log("Por favor, copia esta lista y pégala en nuestra conversación.");

  } catch (err) {
    console.error("Ha ocurrido un error al intentar listar los modelos:", err);
  }
}

listMyModels();