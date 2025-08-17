// Ruta: src/utils/executor.ts
// Versión: 1.3 (Asegura que la salida SIEMPRE sea un string)

import { exec, ExecOptions } from 'node:child_process';
import util from 'node:util';

const execPromise = util.promisify(exec);

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Ejecuta un comando de terminal de forma asíncrona.
 * @param command El comando completo a ejecutar.
 * @param cwd El directorio de trabajo actual (Current Working Directory) donde se ejecutará el comando.
 * @returns Una promesa que se resuelve con un objeto CommandResult.
 */
export async function executeCommand(command: string, cwd: string): Promise<CommandResult> {
  const options: ExecOptions = {
    cwd,
  };

  try {
    const { stdout, stderr } = await execPromise(command, options);
    // --- INICIO DE LA CORRECCIÓN ---
    // Aseguramos la conversión también en el caso de éxito.
    return {
      success: true,
      stdout: stdout.toString(),
      stderr: stderr.toString(),
    };
    // --- FIN DE LA CORRECCIÓN ---
  } catch (error: any) {
    const stdout = error.stdout ? error.stdout.toString() : '';
    const stderr = error.stderr ? error.stderr.toString() : (error.message || 'Ocurrió un error desconocido.');
    
    return {
      success: false,
      stdout: stdout,
      stderr: stderr,
    };
  }
}