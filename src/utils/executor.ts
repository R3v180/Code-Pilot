// Ruta: src/utils/executor.ts
// Versión: 2.0 (Refactorizado para usar 'spawn' y streaming en tiempo real)

import { spawn, SpawnOptions } from 'node:child_process';

/**
 * Define el resultado de la ejecución de un comando.
 */
export interface CommandResult {
  success: boolean;
  // stdout y stderr ya no se devuelven aquí, se emiten en tiempo real.
}

/**
 * Ejecuta un comando de terminal de forma asíncrona, emitiendo su salida en tiempo real.
 * @param command El comando completo a ejecutar (ej: "pnpm install express").
 * @param cwd El directorio de trabajo donde se ejecutará el comando.
 * @param onData Callback que se invoca con cada fragmento de datos (stdout o stderr).
 * @returns Una promesa que se resuelve con un objeto CommandResult cuando el comando termina.
 */
export function executeCommand(
  command: string,
  cwd: string,
  onData: (data: string) => void
): Promise<CommandResult> {
  
  // Usamos una Promesa para poder usar async/await en el AgentPanel
  return new Promise((resolve, reject) => {
    // 1. Parseamos el comando y sus argumentos
    const [cmd, ...args] = command.split(' ');
    
    // 2. Opciones para spawn
    const options: SpawnOptions = {
      cwd,
      shell: true, // Usamos un shell para que comandos como 'cd' o '&&' funcionen
      stdio: 'pipe', // Redirigimos la salida para poder capturarla
    };

    // 3. Creamos el proceso hijo
    const child = spawn(cmd, args, options);

    // 4. Escuchamos el stream de salida estándar (stdout)
    child.stdout?.on('data', (data: Buffer) => {
      onData(data.toString());
    });

    // 5. Escuchamos el stream de salida de errores (stderr)
    child.stderr?.on('data', (data: Buffer) => {
      onData(data.toString());
    });

    // 6. Escuchamos el evento 'close', que indica que el proceso ha terminado
    child.on('close', (code) => {
      // El código 0 significa éxito
      if (code === 0) {
        resolve({ success: true });
      } else {
        // Cualquier otro código significa error
        onData(`\nEl proceso terminó con el código de error: ${code}`);
        resolve({ success: false });
      }
    });

    // 7. Escuchamos el evento 'error' por si el comando no se puede iniciar
    child.on('error', (err) => {
      onData(`Error al iniciar el comando: ${err.message}`);
      reject(err); // Rechazamos la promesa principal
    });
  });
}