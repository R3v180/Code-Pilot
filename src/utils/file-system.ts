// Ruta: /code-pilot/src/utils/file-system.ts
// Versión: 2.6 (getProjectStructure ahora acepta un basePath)

import { glob } from 'glob';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';

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

export async function getProjectDirectories(basePath: string): Promise<string[]> {
  try {
    if (!fsSync.existsSync(basePath)) {
      fsSync.mkdirSync(basePath, { recursive: true });
      return [];
    }
    const dirents = await fs.readdir(basePath, { withFileTypes: true });
    return dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    return [];
  }
}

export async function getProjectStructureObject(basePath: string): Promise<FileTreeNode> {
  const files = await glob('**/*', {
    cwd: basePath,
    ignore: IGNORE_PATTERNS,
    nodir: false,
    dot: true,
  });

  const root: FileTreeNode = { name: path.basename(basePath), path: '.', type: 'directory', children: [] };

  for (const file of files) {
    const parts = file.split(path.sep);
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let childNode = currentNode.children?.find(child => child.name === part);

      if (!childNode) {
        const currentPath = parts.slice(0, i + 1).join(path.sep);
        const isDirectory = files.some(f => f.startsWith(currentPath + path.sep));
        const type = isDirectory ? 'directory' : 'file';

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


// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Genera una representación en string de la estructura de archivos de un directorio.
 * @param basePath La ruta al directorio a escanear.
 * @returns Una promesa que se resuelve con el 'árbol' de archivos como un string.
 */
export async function getProjectStructure(basePath: string): Promise<string> {
    const obj = await getProjectStructureObject(basePath);
    const flattened = flattenTree(obj);
    return flattened.map(f => f.line).join('\n');
}
// --- FIN DE LA MODIFICACIÓN ---