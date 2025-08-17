// Ruta: src/utils/workspace.ts
// Versión: 1.0 (Módulo para la interacción con el sistema de archivos del proyecto)

import fs from 'node:fs/promises';
import path from 'node:path';
import fsSync from 'node:fs';

/**
 * Obtiene la ruta raíz segura del espacio de trabajo del proyecto.
 * Si existe una carpeta 'proyectos' en el directorio actual, la usa como raíz.
 * De lo contrario, usa el directorio actual.
 * @returns {string} La ruta absoluta al espacio de trabajo.
 */
function getWorkspaceRoot(): string {
  const projectDir = process.cwd();
  const targetDir = fsSync.existsSync(path.join(projectDir, 'proyectos'))
    ? path.join(projectDir, 'proyectos')
    : projectDir;
  return targetDir;
}

/**
 * Convierte una ruta relativa dentro del proyecto a una ruta absoluta segura.
 * Previene que se acceda a archivos fuera del directorio del proyecto (Path Traversal).
 * @param relativePath La ruta relativa desde la raíz del proyecto (ej: 'src/index.ts').
 * @returns {string} La ruta absoluta completa y segura.
 * @throws {Error} Si la ruta intenta escapar del directorio de trabajo.
 */
function getSafePath(relativePath: string): string {
  const root = getWorkspaceRoot();
  const absolutePath = path.resolve(root, relativePath);

  // Medida de seguridad: nos aseguramos de que la ruta final sigue estando dentro de la raíz.
  if (!absolutePath.startsWith(root)) {
    throw new Error(`Acceso no permitido fuera del espacio de trabajo: ${relativePath}`);
  }

  return absolutePath;
}

/**
 * Lee el contenido de un archivo dentro del espacio de trabajo.
 * @param filePath La ruta relativa al archivo a leer.
 * @returns Una promesa que se resuelve con el contenido del archivo como string.
 * @throws {Error} Si el archivo no existe o no se puede leer.
 */
export async function readFile(filePath: string): Promise<string> {
  const safePath = getSafePath(filePath);
  return fs.readFile(safePath, 'utf-8');
}

/**
 * Escribe (o sobrescribe) contenido en un archivo dentro del espacio de trabajo.
 * Crea los directorios necesarios si no existen.
 * @param filePath La ruta relativa al archivo a escribir.
 * @param content El contenido a escribir en el archivo.
 * @returns Una promesa que se resuelve cuando la escritura se completa.
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  const safePath = getSafePath(filePath);
  // Aseguramos que el directorio donde se va a escribir el archivo exista.
  await fs.mkdir(path.dirname(safePath), { recursive: true });
  await fs.writeFile(safePath, content);
}

/**
 * Elimina un archivo dentro del espacio de trabajo.
 * @param filePath La ruta relativa al archivo a eliminar.
 * @returns Una promesa que se resuelve cuando la eliminación se completa.
 */
export async function deleteFile(filePath: string): Promise<void> {
    const safePath = getSafePath(filePath);
    await fs.unlink(safePath);
}

/**
 * Lista los archivos y directorios en una ruta específica dentro del espacio de trabajo.
 * @param dirPath La ruta relativa al directorio a listar. Si se omite, lista la raíz.
 * @returns Una promesa que se resuelve con un array de nombres de archivos/directorios.
 */
export async function listFiles(dirPath: string = '.'): Promise<string[]> {
    const safePath = getSafePath(dirPath);
    return fs.readdir(safePath);
}