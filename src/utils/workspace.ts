// Ruta: src/utils/workspace.ts
// Versión: 1.1 (Las funciones ahora operan sobre un projectPath explícito)

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Convierte una ruta relativa a una ruta absoluta segura dentro de un proyecto.
 * @param projectPath La ruta absoluta al proyecto.
 * @param relativePath La ruta relativa dentro del proyecto.
 * @returns La ruta absoluta y segura.
 * @throws {Error} si la ruta intenta escapar del directorio del proyecto.
 */
function getSafePath(projectPath: string, relativePath: string): string {
  const absolutePath = path.resolve(projectPath, relativePath);
  if (!absolutePath.startsWith(projectPath)) {
    throw new Error(`Acceso no permitido fuera del espacio de trabajo: ${relativePath}`);
  }
  return absolutePath;
}

/**
 * Lee el contenido de un archivo dentro de un proyecto específico.
 * @param projectPath La ruta al proyecto.
 * @param filePath La ruta relativa al archivo a leer.
 */
export async function readFile(projectPath: string, filePath: string): Promise<string> {
  const safePath = getSafePath(projectPath, filePath);
  return fs.readFile(safePath, 'utf-8');
}

/**
 * Escribe contenido en un archivo dentro de un proyecto específico.
 * @param projectPath La ruta al proyecto.
 * @param filePath La ruta relativa al archivo a escribir.
 * @param content El contenido a escribir.
 */
export async function writeFile(projectPath: string, filePath: string, content: string): Promise<void> {
  const safePath = getSafePath(projectPath, filePath);
  await fs.mkdir(path.dirname(safePath), { recursive: true });
  await fs.writeFile(safePath, content);
}

/**
 * Elimina un archivo dentro de un proyecto específico.
 * @param projectPath La ruta al proyecto.
 * @param filePath La ruta relativa al archivo a eliminar.
 */
export async function deleteFile(projectPath: string, filePath: string): Promise<void> {
    const safePath = getSafePath(projectPath, filePath);
    await fs.unlink(safePath);
}

/**
 * Lista archivos y directorios en una ruta específica dentro de un proyecto.
 * @param projectPath La ruta al proyecto.
 * @param dirPath La ruta relativa al directorio a listar.
 */
export async function listFiles(projectPath: string, dirPath: string = '.'): Promise<string[]> {
    const safePath = getSafePath(projectPath, dirPath);
    return fs.readdir(safePath);
}