// Ruta: /code-pilot/src/utils/file-system.ts
// Versión: 2.3 (Usa la carpeta 'proyectos' y corrige la detección de tipo)

import { glob } from 'glob';
import path from 'node:path';
import fs from 'node:fs'; // <-- Importar 'fs' para comprobar si la carpeta existe

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.git/**',
  '**/*.log',
  '**/.env',
];

export interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
  type: 'file' | 'directory';
}

export async function getProjectStructureObject(): Promise<FileTreeNode> {
  // --- CORRECCIÓN 1: Usar la carpeta 'proyectos' si existe ---
  const projectRoot = process.cwd();
  const devProjectsPath = path.join(projectRoot, 'proyectos');
  const targetCwd = fs.existsSync(devProjectsPath) ? devProjectsPath : projectRoot;
  // --- FIN CORRECCIÓN 1 ---

  const files = await glob('**/*', {
    cwd: targetCwd, // <-- Usamos el directorio de trabajo objetivo
    ignore: IGNORE_PATTERNS,
    nodir: false,
    dot: true,
    // stat: true, // Usar stat es más lento pero más fiable
  });

  const root: FileTreeNode = { name: path.basename(targetCwd), path: '.', type: 'directory', children: [] };

  for (const file of files) {
    const parts = file.split(path.sep);
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let childNode = currentNode.children?.find(child => child.name === part);

      if (!childNode) {
        const currentPath = parts.slice(0, i + 1).join(path.sep);
        
        // --- CORRECCIÓN 2: Detección de tipo más fiable ---
        // Un path es un directorio si otro path en la lista es un hijo suyo.
        // O si `fs.statSync` nos lo dice. Para evitar lentitud, usamos la primera heurística.
        const isDirectory = files.some(f => f.startsWith(currentPath + path.sep));
        const type = isDirectory ? 'directory' : 'file';
        // --- FIN CORRECCIÓN 2 ---

        childNode = {
          name: part,
          path: currentPath,
          type: type,
          children: type === 'directory' ? [] : undefined,
        };
        
        if (!currentNode.children?.some(c => c.path === childNode!.path)) {
            currentNode.children?.push(childNode);
        }
      }
      
      if (childNode.type === 'directory' && !childNode.children) {
        childNode.children = [];
      }

      currentNode = childNode;
    }
  }

  const sortChildren = (node: FileTreeNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  };

  sortChildren(root);
  return root;
}

export const flattenTree = (node: FileTreeNode, prefix = '', allNodes: { line: string, path: string, type: 'file' | 'directory', name: string }[] = []) => {
  const line = `${prefix}${node.name}`;
  // No mostramos la raíz en la lista, empezamos desde sus hijos
  if (node.path !== '.') {
     allNodes.push({ line, path: node.path, type: node.type, name: node.name });
  }

  if (node.children) {
    for (const child of node.children) {
      flattenTree(child, prefix + '  ', allNodes);
    }
  }
  return allNodes;
};

// Esta función no necesita cambios, depende de las de arriba.
export async function getProjectStructure(): Promise<string> {
    const obj = await getProjectStructureObject();
    const flattened = flattenTree(obj);
    return flattened.map(f => f.line).join('\n');
}