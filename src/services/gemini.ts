// Ruta: /src/services/gemini.ts
// Versión: 3.3.0 (Usa getActiveApiKey del nuevo sistema de config)

import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import type { Message } from '../ui/ChatPanel.js';
// 1. Cambiamos la importación para usar la nueva función
import { getActiveApiKey } from '../utils/config.js';

let genAI: GoogleGenerativeAI;
let model: any;

function initializeApi(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
}

function setupApi() {
  // 2. Usamos la nueva función
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    console.error(chalk.red.bold('Error Crítico: No se encontró la API Key.'));
    process.exit(1);
  }
  initializeApi(apiKey);
}

export async function validateApiKey(apiKey: string): Promise<{isValid: boolean; error?: string}> {
  try {
    const tempGenAI = new GoogleGenerativeAI(apiKey);
    const tempModel = tempGenAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    await tempModel.countTokens("validation_ping");
    return { isValid: true };
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido.';
    if (errorMessage.includes('API key not valid')) {
      return { isValid: false, error: 'La API Key introducida no es válida.' };
    }
    if (errorMessage.includes('fetch failed')) {
        return { isValid: false, error: 'No se pudo conectar con la API de Google. Revisa tu conexión a internet.' };
    }
    if (errorMessage.includes('is not found for API version')) {
        return { isValid: false, error: 'Tu clave de API es válida, pero no tienes acceso al modelo Gemini necesario.' };
    }
    return { isValid: false, error: `Ocurrió un error inesperado. Revisa tu clave y conexión.` };
  }
}

export async function explainCode(code: string): Promise<string> {
    return "Explicación no implementada en este flujo.";
}
export async function refactorCode(code: string, instruction: string): Promise<string> {
    return "Refactorización no implementada en este flujo.";
}
export async function generatePlan(taskDescription: string, projectStructure: string): Promise<string> {
    return "Plan no implementado en este flujo.";
}

export async function generateChatResponse(
  userMessage: string,
  contextFiles: { path: string; content: string }[],
  chatHistory: Message[]
): Promise<string> {
  if (!model) {
    setupApi();
  }
  
  let filesContext = 'No se ha proporcionado ningún archivo como contexto.';
  if (contextFiles.length > 0) {
    filesContext = contextFiles.map(file => 
      `--- Archivo: ${file.path} ---\n\`\`\`\n${file.content}\n\`\`\``
    ).join('\n\n');
  }

  const historyLimit = 6;
  const recentHistory = chatHistory.slice(-historyLimit);

  const historyContext = recentHistory.map(message => {
    if (message.sender === 'user') {
      return `--- Usuario:\n${message.text}`;
    } else {
      try {
        const aiResponse = JSON.parse(JSON.stringify(message.text)); // Usamos JSON.stringify para asegurar que es un string válido
        // Si el texto de la IA es a su vez un JSON stringified, lo parseamos
        const parsedText = JSON.parse(aiResponse);
        return `--- IA:\n${parsedText.explanation || message.text}`;
      } catch (e) {
        // Si no es un JSON, lo usamos tal cual
        return `--- IA:\n${message.text}`;
      }
    }
  }).join('\n');

  const structuredPrompt = `
Eres Code-Pilot, un asistente de programación experto. Tu tarea es responder a las solicitudes del usuario con un objeto JSON estructurado.

**Contexto de Archivos:**
${filesContext}

**Historial de la Conversación Reciente (el último mensaje es la solicitud actual del usuario):**
${historyContext}

**Tu Misión:**
Analiza la solicitud MÁS RECIENTE del usuario, usando el historial y el contexto de archivos para entender la conversación completa. Responde SIEMPRE con un objeto JSON válido. No incluyas texto ni markdown fuera del objeto JSON.
El objeto JSON debe tener la siguiente estructura:
{
  "explanation": "Una explicación en texto de tu razonamiento o la respuesta a la pregunta del usuario. Esto se mostrará en el chat.",
  "changes": [ 
    {
      "type": "thought" | "file_creation" | "file_modification",
      "filePath": "string" | null,
      "content": "string" | null
    }
  ]
}
`;

  try {
    const result = await model.generateContent(structuredPrompt);
    const response = result.response;
    const textResponse = response.text();
    
    const jsonRegex = /\{[\s\S]*\}/;
    const match = textResponse.match(jsonRegex);
    if (match) {
      return match[0];
    }
    return JSON.stringify({
      explanation: 'Lo siento, no pude procesar esa solicitud correctamente. Inténtalo de nuevo.',
      changes: [{ type: 'thought', filePath: null, content: null }]
    });
  } catch (error) {
    console.error(chalk.red.bold('Error al contactar con la API de Gemini:'), error);
    process.exit(1);
  }
}