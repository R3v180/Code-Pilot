// Ruta: /src/services/gemini.ts
// Versión: 2.1 (Funciones antiguas corregidas)

import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';

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


// --- INICIO DE CORRECCIÓN ---
// Añadimos retornos simples a estas funciones para que el compilador no se queje.
// No se usan en la UI interactiva, pero deben cumplir con su contrato de tipo.
export async function explainCode(code: string): Promise<string> {
    // Esta función ya no es central, pero mantenemos la firma.
    return "Explicación no implementada en este flujo.";
}
export async function refactorCode(code: string, instruction: string): Promise<string> {
    return "Refactorización no implementada en este flujo.";
}
export async function generatePlan(taskDescription: string, projectStructure: string): Promise<string> {
    return "Plan no implementado en este flujo.";
}
// --- FIN DE CORRECCIÓN ---


// --- Función de Chat Interactivo (sin cambios respecto a la versión anterior) ---
export async function generateChatResponse(
  userMessage: string,
  contextFiles: { path: string; content: string }[]
): Promise<string> {
  
  let filesContext = 'No se ha proporcionado ningún archivo como contexto.';
  if (contextFiles.length > 0) {
    filesContext = contextFiles.map(file => 
      `--- Archivo: ${file.path} ---\n\`\`\`\n${file.content}\n\`\`\``
    ).join('\n\n');
  }

  const structuredPrompt = `
Eres Code-Pilot, un asistente de programación experto. Tu tarea es responder a las solicitudes del usuario con un objeto JSON estructurado.

**Contexto de Archivos:**
${filesContext}

**Solicitud del Usuario:**
---
${userMessage}
---

**Tu Misión:**
Analiza la solicitud y el contexto. Responde SIEMPRE con un objeto JSON válido. No incluyas texto ni markdown fuera del objeto JSON.
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