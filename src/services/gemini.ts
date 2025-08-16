// Ruta: /src/services/gemini.ts
// Versión: 1.9

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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


// --- Funciones de Comandos Anteriores (sin cambios) ---
export async function explainCode(code: string): Promise<string> {
    const structuredPrompt = `Eres un programador experto...`; // Omitido por brevedad
    try { const result = await model.generateContent(structuredPrompt); return result.response.text(); } catch (error) { console.error(chalk.red.bold('Error al contactar con la API de Gemini:'), error); process.exit(1); }
}
export async function refactorCode(code: string, instruction: string): Promise<string> {
    const structuredPrompt = `Eres un programador senior experto...`; // Omitido por brevedad
    try { const result = await model.generateContent(structuredPrompt); const refactoredCode = result.response.text(); return refactoredCode.replace(/```(?:typescript|javascript|ts|js)?\n/g, '').replace(/```\n?$/g, '').trim(); } catch (error) { console.error(chalk.red.bold('Error al contactar con la API de Gemini:'), error); process.exit(1); }
}
export async function generatePlan(taskDescription: string, projectStructure: string): Promise<string> {
    const structuredPrompt = `Eres un arquitecto de software...`; // Omitido por brevedad
    try { const result = await model.generateContent(structuredPrompt); const textResponse = result.response.text(); const jsonRegex = /\[[\s\S]*\]/; const match = textResponse.match(jsonRegex); return match ? match[0] : '[]'; } catch (error) { console.error(chalk.red.bold('Error al contactar con la API de Gemini:'), error); process.exit(1); }
}

// --- Función de Chat Interactivo (PROMPT CORREGIDO) ---
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
  "responseType": "thought" | "file_creation" | "file_modification",
  "explanation": "Una explicación en texto de tu razonamiento o la respuesta a la pregunta del usuario. Esto se mostrará en el chat.",
  "filePath": "string" | null, // <-- CAMBIO CLAVE: Especificación más estricta
  "content": "string" | null
}

**Reglas de Decisión:**
- Usa "thought" si el usuario hace una pregunta. 'filePath' y 'content' deben ser null.
- Usa "file_creation" si la intención es crear un nuevo archivo. 'filePath' debe ser la ruta **relativa desde la raíz del proyecto** (ej: "src/nuevoComponente.ts") y 'content' su contenido.
- Usa "file_modification" si la intención es modificar un archivo existente del contexto. 'filePath' debe ser la ruta **relativa y exacta** del archivo a modificar (ej: "example.ts") y 'content' el nuevo contenido completo.

**Ejemplo para modificar un archivo:**
{
  "responseType": "file_modification",
  "explanation": "De acuerdo, he modificado 'example.ts' para añadir el chiste.",
  "filePath": "example.ts", // <-- CAMBIO CLAVE: Ruta relativa, sin barras iniciales
  "content": "function fibonacci(n) { ... \\n // Chiste añadido }"
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
      responseType: 'thought',
      explanation: 'Lo siento, no pude procesar esa solicitud correctamente.',
      filePath: null,
      content: null
    });
  } catch (error) {
    console.error(chalk.red.bold('Error al contactar con la API de Gemini:'), error);
    process.exit(1);
  }
}