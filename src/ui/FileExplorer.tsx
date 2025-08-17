// Ruta: /src/ui/FileExplorer.tsx
// Versión: 3.3 (Se recarga cuando el sistema de archivos cambia)

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { getProjectStructureObject, flattenTree } from '../utils/file-system.js'; 
import path from 'node:path';

interface FileExplorerProps {
  selectedFiles: Set<string>;
  onFileSelect: (filePath: string) => void;
  onBulkFileSelect: (filePaths: string[], action: 'select' | 'deselect') => void;
  isActive: boolean;
  onPanelChange: () => void;
  fileSystemVersion: number; // 1. Recibimos la nueva prop
}

interface FlatNode {
    line: string;
    path: string;
    type: 'file' | 'directory';
    name: string;
}

const FOLDER_ICON = '📁';
const FILE_ICON = '📄';

export function FileExplorer({ selectedFiles, onFileSelect, onBulkFileSelect, isActive, onPanelChange, fileSystemVersion }: FileExplorerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [flatStructure, setFlatStructure] = useState<FlatNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleHeight = process.stdout.rows > 10 ? process.stdout.rows - 10 : 10;

  // 2. MODIFICACIÓN CLAVE: Este useEffect ahora se ejecutará al inicio Y cada vez que fileSystemVersion cambie.
  useEffect(() => {
    setIsLoading(true); // Mostramos el mensaje de carga mientras se actualiza
    getProjectStructureObject()
      .then(treeObject => {
        const flattenedNodes = flattenTree(treeObject);
        setFlatStructure(flattenedNodes);
        setIsLoading(false);
      })
      .catch(() => {
        setFlatStructure([{ line: 'Error al cargar la estructura.', path: '', type: 'directory', name: 'Error' }]);
        setIsLoading(false);
      });
  }, [fileSystemVersion]); // El array de dependencias ahora escucha los cambios

  // ... el resto del componente no necesita cambios ...

  useInput((input, key) => {
    if (key.tab) {
        onPanelChange();
        return;
    }

    if (flatStructure.length === 0) return;

    if (key.ctrl && input === 'a') {
      const allFiles = flatStructure
        .filter(node => node.type === 'file')
        .map(node => node.path);
      
      const action = selectedFiles.size >= allFiles.length ? 'deselect' : 'select';
      onBulkFileSelect(allFiles, action);
      return;
    }

    let newIndex = selectedIndex;
    if (key.upArrow) newIndex = Math.max(0, selectedIndex - 1);
    if (key.downArrow) newIndex = Math.min(flatStructure.length - 1, selectedIndex + 1);
    if (key.pageDown) newIndex = Math.min(flatStructure.length - 1, selectedIndex + visibleHeight);
    if (key.pageUp) newIndex = Math.max(0, selectedIndex - visibleHeight);
    
    setSelectedIndex(newIndex);
    
    if (newIndex < scrollTop) {
      setScrollTop(newIndex);
    } else if (newIndex >= scrollTop + visibleHeight) {
      setScrollTop(newIndex - visibleHeight + 1);
    }

    if (input === ' ') {
      const selectedNode = flatStructure[selectedIndex];
      if (!selectedNode) return;

      if (selectedNode.type === 'directory') {
        const dirPath = selectedNode.path;
        const childFiles = flatStructure
            .filter(node => node.type === 'file' && node.path.startsWith(dirPath + path.sep))
            .map(node => node.path);

        if (childFiles.length > 0) {
          const areAllSelected = childFiles.every(file => selectedFiles.has(file));
          onBulkFileSelect(childFiles, areAllSelected ? 'deselect' : 'select');
        }
      } else {
        onFileSelect(selectedNode.path);
      }
    }
  }, { isActive });

  if (isLoading) {
    return <Text color="gray">Cargando estructura del proyecto...</Text>;
  }

  const visibleItems = flatStructure.slice(scrollTop, scrollTop + visibleHeight);

  return (
    <Box flexDirection="column">
      <Text bold color={isActive ? "cyan" : "blue"} underline>Explorador de Archivos</Text>
      <Text color="gray">(↑↓, Espacio, Ctrl+A, Tab)</Text>
      <Box height={1} />
      {visibleItems.map((node, index) => {
        const absoluteIndex = scrollTop + index;
        const isSelectedForNav = absoluteIndex === selectedIndex;
        const isSelectedForContext = selectedFiles.has(node.path);

        let textColor: "cyan" | "green" | "white" = "white";
        if (isSelectedForContext) textColor = "green";
        if (isSelectedForNav && isActive) textColor = "cyan";

        const icon = node.type === 'directory' ? FOLDER_ICON : FILE_ICON;
        const checkbox = node.type === 'directory' ? '  ' : isSelectedForContext ? '[x]' : '[ ]';
        
        const indentedName = node.line.substring(node.line.search(/\S/));
        const indent = node.line.substring(0, node.line.search(/\S/));

        return (
          <Text key={node.path} color={textColor}>
            {`${isSelectedForNav ? '> ' : '  '}${checkbox} ${indent}${icon} ${indentedName}`}
          </Text>
        );
      })}
    </Box>
  );
}