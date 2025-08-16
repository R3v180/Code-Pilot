// Ruta: /code-pilot/src/utils/file-system.ts
// Versión: 1.0

import { glob } from 'glob';
import path from 'node:path';

// Patrones a ignorar durante el escaneo del proyecto.
// Es crucial para mantener el contexto limpio y relevante para la IA.
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.git/**',
  '**/*.log',
  '**/.env',
];

/**
 * Escanea el directorio de trabajo actual y genera una representación
 * en formato de árbol de texto de la estructura de archivos.
 * @returns Una cadena de texto que representa el árbol de archivos del proyecto.
 */
export async function getProjectStructure(): Promise<string> {
  const files = await glob('**/*', { 
    cwd: process.cwd(), 
    ignore: IGNORE_PATTERNS,
    nodir: true, // No incluir directorios en la lista, solo archivos.
    dot: true,   // Incluir archivos que empiezan con punto (ej: .eslintrc)
  });

  // Usamos un Set para obtener una lista única de directorios y luego la ordenamos.
  const dirs = [...new Set(files.map(file => path.dirname(file)))];
  const allPaths = [...dirs, ...files].sort();

  const tree: { [key: string]: any } = {};
  for (const p of allPaths) {
    let currentLevel = tree;
    const parts = p.split(path.sep);
    for (const part of parts) {
      if (part === '.') continue;
      if (!currentLevel[part]) {
        currentLevel[part] = {};
      }
      currentLevel = currentLevel[part];
    }
  }

  return formatTree(tree);
}

/**
 * Función auxiliar recursiva para formatear el objeto de árbol en una cadena de texto.
 * @param node El nodo actual del árbol a formatear.
 * @param prefix El prefijo de indentación para la línea actual.
 * @returns Una cadena de texto con el árbol formateado.
 */
function formatTree(node: { [key: string]: any }, prefix = ''): string {
  let result = '';
  const entries = Object.keys(node);
  for (let i = 0; i < entries.length; i++) {
    const key = entries[i];
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    result += `${prefix}${connector}${key}\n`;

    if (Object.keys(node[key]).length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      result += formatTree(node[key], newPrefix);
    }
  }
  return result;
}