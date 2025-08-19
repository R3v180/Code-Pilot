// Ruta: /src/services/gemini.ts
// Versión: 4.4.1 (Código 100% completo y verificado)

import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import os from 'node:os';
import { getActiveApiKey } from '../utils/config.js';

export interface Message {
  sender: 'user' | 'ai';
  text: string;
}
export interface PlanStep {
  type: 'command' | 'file_creation' | 'file_modification' | 'file_deletion' | 'thought';
  command?: string;
  filePath?: string;
  content?: string;
  description: string;
}
export interface ExecutionPlan {
  thought: string;
  plan: PlanStep[];
}
export interface DebugContext {
  originalTask: string;
  failedPlan: ExecutionPlan;
  failedStepIndex: number;
  errorOutput: string;
  fileSystemState: string; 
}

let genAI: GoogleGenerativeAI;
let model: any;

function initializeApi(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
}
function setupApi() {
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
    if (errorMessage.includes('API key not valid')) return { isValid: false, error: 'La API Key introducida no es válida.' };
    if (errorMessage.includes('fetch failed')) return { isValid: false, error: 'No se pudo conectar. Revisa tu conexión.' };
    if (errorMessage.includes('is not found for API version')) return { isValid: false, error: 'Tu clave no tiene acceso al modelo Gemini necesario.' };
    return { isValid: false, error: `Ocurrió un error inesperado.` };
  }
}
export async function generateExecutionPlan(
  userTask: string,
  contextFiles: { path: string; content: string }[]
): Promise<ExecutionPlan> {
  if (!model) setupApi();
  let filesContext = 'No se ha proporcionado ningún archivo como contexto.';
  if (contextFiles.length > 0) {
    filesContext = contextFiles.map(file => `--- Archivo: ${file.path} ---\n\`\`\`\n${file.content}\n\`\`\``).join('\n\n');
  }
  
  const platform = os.platform();

  const structuredPrompt = `
Eres un Arquitecto de Software experto que crea planes de ejecución detallados para un agente autónomo.

**Contexto del Entorno de Ejecución:**
- Sistema Operativo: ${platform}

**Contexto de Archivos:**
${filesContext}

**Petición del Usuario:**
---
${userTask}
---

**Tu Misión:**
Devuelve SIEMPRE un único objeto JSON válido. El objeto debe tener la estructura { "thought": "...", "plan": [...] }.

**Reglas para crear el plan:**
- **Compatibilidad del SO:** **CRÍTICO:** Ten en cuenta el Sistema Operativo (${platform}). Usa comandos que funcionen en ese entorno. Para crear directorios anidados, 'mkdir -p' es para UNIX y 'mkdir' (usado secuencialmente) es para Windows.
- **Evita la Interacción:** Usa siempre flags que eviten prompts interactivos (ej: 'npm init -y'). El agente no puede responder preguntas.
- **Divide la tarea:** Descompón la petición en los pasos más pequeños y lógicos posibles.
- **Usa las herramientas correctas:** 'command', 'file_creation', 'file_modification', 'file_deletion', 'thought'.
- **Contenido Completo:** Para 'file_modification', proporciona siempre el contenido total del archivo.
`;
  try {
    const result = await model.generateContent(structuredPrompt);
    const response = result.response;
    const textResponse = response.text();
    const jsonRegex = /\{[\s\S]*\}/;
    const match = textResponse.match(jsonRegex);
    if (match) {
      return JSON.parse(match[0]) as ExecutionPlan;
    }
    return {
      thought: "La IA no pudo generar un plan válido. La respuesta no fue un JSON.",
      plan: [],
    };
  } catch (error) {
    console.error(chalk.red.bold('Error al generar el plan de ejecución:'), error);
    return {
      thought: `Ocurrió un error al contactar con la API de Gemini: ${error}`,
      plan: [],
    };
  }
}
export async function generateCorrectionPlan(
  debugContext: DebugContext,
  contextFiles: { path: string; content: string }[]
): Promise<ExecutionPlan> {
  if (!model) setupApi();
  const filesContext = contextFiles.map(file => `--- Archivo: ${file.path} ---\n\`\`\`\n${file.content}\n\`\`\``).join('\n\n');
  const failedPlanString = JSON.stringify(debugContext.failedPlan.plan, null, 2);
  
  const platform = os.platform();

  const structuredPrompt = `
Eres un Programador Senior experto en depuración. El agente junior falló. Analiza el error y crea un NUEVO plan completo para solucionar el problema.

**Contexto del Entorno de Ejecución:**
- Sistema Operativo: ${platform}

**Tarea Original del Usuario:**
---
${debugContext.originalTask}
---

**Estado Actual del Sistema de Archivos (resultado de 'tree'):**
---
${debugContext.fileSystemState}
---

**Plan Original que Falló:**
---
${failedPlanString}
---

**Paso Específico que Falló (índice ${debugContext.failedStepIndex}):**
---
${JSON.stringify(debugContext.failedPlan.plan[debugContext.failedStepIndex])}
---

**Salida del Error del Paso Fallido:**
---
${debugContext.errorOutput}
---

**Tu Misión:**
1.  **Analiza la Causa Raíz:** En "thought", explica por qué falló el plan, considerando el SO (${platform}) y el estado actual de los archivos.
2.  **Crea un Plan de Corrección Idempotente y Compatible:** En "plan", crea un plan **NUEVO Y COMPLETO** que sea compatible con el SO del usuario y que no repita pasos ya completados.
3.  **Evita la Interacción:** Usa flags no interactivos (ej: '-y').
4.  **Responde en JSON:** Devuelve SIEMPRE un único objeto JSON válido.
`;
  try {
    const result = await model.generateContent(structuredPrompt);
    const response = result.response;
    const textResponse = response.text();
    const jsonRegex = /\{[\s\S]*\}/;
    const match = textResponse.match(jsonRegex);
    if (match) {
      return JSON.parse(match[0]) as ExecutionPlan;
    }
    return {
      thought: "La IA no pudo generar un plan de corrección válido.",
      plan: [],
    };
  } catch (error) {
    console.error(chalk.red.bold('Error al generar el plan de corrección:'), error);
    return {
      thought: `Ocurrió un error al contactar con la API de Gemini: ${error}`,
      plan: [],
    };
  }
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
        const aiResponse = JSON.parse(message.text);
        return `--- IA:\n${aiResponse.explanation || message.text}`;
      } catch (e) {
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