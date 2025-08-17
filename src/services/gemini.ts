// Ruta: /src/services/gemini.ts
// Versión: 3.0 (Añade memoria conversacional)

import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import type { Message } from '../ui/ChatPanel.js'; // <-- 1. Importamos el tipo Message

// --- Funciones de Utilidad y Configuración (sin cambios) ---
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(chalk.red.bold('Error: La variable de entorno GEMINI_API_KEY no está configurada.'));
    console.log(chalk.yellow('Asegúrate de tener un archivo .env en la raíz del proyecto con tu clave de API.'));
    process.exit(1);
  }
  return apiKey;
}

const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Funciones antiguas (sin cambios) ---
export async function explainCode(code: string): Promise<string> {
    return "Explicación no implementada en este flujo.";
}
export async function refactorCode(code: string, instruction: string): Promise<string> {
    return "Refactorización no implementada en este flujo.";
}
export async function generatePlan(taskDescription: string, projectStructure: string): Promise<string> {
    return "Plan no implementado en este flujo.";
}


// --- Función de Chat Interactivo (Modificada) ---
// 2. Actualizamos la firma de la función para aceptar `chatHistory`
export async function generateChatResponse(
  userMessage: string,
  contextFiles: { path: string; content: string }[],
  chatHistory: Message[]
): Promise<string> {
  
  // --- Construcción del contexto de archivos (sin cambios) ---
  let filesContext = 'No se ha proporcionado ningún archivo como contexto.';
  if (contextFiles.length > 0) {
    filesContext = contextFiles.map(file => 
      `--- Archivo: ${file.path} ---\n\`\`\`\n${file.content}\n\`\`\``
    ).join('\n\n');
  }

  // --- 3. Construcción del historial de la conversación ---
  // Limitamos el historial a los últimos 6 mensajes para no exceder los límites de tokens
  const historyLimit = 6;
  const recentHistory = chatHistory.slice(-historyLimit);

  const historyContext = recentHistory.map(message => {
    if (message.sender === 'user') {
      return `--- Usuario:\n${message.text}`;
    } else {
      // Para la IA, solo incluimos la explicación, no el JSON completo para ser concisos
      try {
        const aiResponse = JSON.parse(message.text);
        return `--- IA:\n${aiResponse.explanation || message.text}`;
      } catch (e) {
        // Si el texto de la IA no es un JSON, lo usamos tal cual
        return `--- IA:\n${message.text}`;
      }
    }
  }).join('\n');

  // 4. Integramos el historial en el prompt final
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

**Reglas de Decisión para los cambios:**
- Si el usuario solo hace una pregunta o saludas, el array 'changes' debe contener un único objeto con "type": "thought". 'filePath' y 'content' deben ser null.
- Si la intención es crear UNO O MÁS archivos, añade un objeto por cada archivo a crear en el array 'changes' con "type": "file_creation".
- Si la intención es modificar UNO O MÁS archivos, añade un objeto por cada archivo a modificar en el array 'changes' con "type": "file_modification".
- 'filePath' debe ser la ruta **relativa y exacta** desde la raíz del proyecto (ej: "src/componente.ts" o "miweb/index.html").

**Ejemplo para modificar DOS archivos:**
{
  "explanation": "Claro, he modificado 'index.html' para enlazar el CSS y he añadido los estilos básicos a 'styles.css'.",
  "changes": [
    {
      "type": "file_modification",
      "filePath": "miweb/index.html",
      "content": "<!DOCTYPE html>..."
    },
    {
      "type": "file_creation",
      "filePath": "miweb/styles.css",
      "content": "body { font-family: sans-serif; }"
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