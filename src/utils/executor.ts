// Ruta: src/utils/executor.ts
// Versión: 1.0 (Módulo para la ejecución de comandos de terminal)

import { exec } from 'node:child_process';
import util from 'node:util';

// Convertimos la función 'exec' basada en callbacks a una basada en promesas
// para poder usarla cómodamente con async/await.
const execPromise = util.promisify(exec);

/**
 * Define la estructura del objeto que devolverá la ejecución de un comando.
 */
export interface CommandResult {
  success: boolean; // true si el comando terminó con código 0, false si no.
  stdout: string;  // La salida estándar del comando.
  stderr: string;  // La salida de error del comando.
}

/**
 * Ejecuta un comando de terminal de forma asíncrona dentro del directorio del proyecto.
 * Captura y devuelve tanto la salida estándar como la de error.
 * @param command El comando completo a ejecutar (ej: "pnpm install", "ls -la").
 * @returns Una promesa que se resuelve con un objeto CommandResult.
 */
export async function executeCommand(command: string): Promise<CommandResult> {
  try {
    // Intentamos ejecutar el comando. Si tiene éxito (código de salida 0),
    // devolvemos un objeto indicando el éxito y la salida.
    const { stdout, stderr } = await execPromise(command);
    return {
      success: true,
      stdout,
      stderr,
    };
  } catch (error: any) {
    // Si execPromise lanza un error, significa que el comando falló (código de salida no-cero).
    // El objeto de error a menudo contiene stdout y stderr, que son muy útiles para depurar.
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || 'Ocurrió un error desconocido durante la ejecución del comando.',
    };
  }
}