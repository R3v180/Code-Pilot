// Ruta: /src/ui/FileExplorer.tsx
// Versión: 2.4

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { getProjectStructure } from '../utils/file-system.js';

interface FileExplorerProps {
  selectedFiles: Set<string>;
  onFileSelect: (filePath: string) => void;
  isActive: boolean; // Nueva prop
}

const getCleanPath = (line: string) => {
  return line.trim().replace(/^[└├─│ >]+/, '');
}

export function FileExplorer({ selectedFiles, onFileSelect, isActive }: FileExplorerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [structure, setStructure] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    getProjectStructure().then(treeString => {
      setStructure(treeString.split('\n').filter(line => line.trim() !== ''));
      setIsLoading(false);
    });
  }, []);

  // El hook useInput ahora tiene una opción 'isActive' para controlar cuándo escucha.
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(structure.length - 1, prev + 1));
    }
    if (input === ' ') {
      const line = structure[selectedIndex];
      if (line) {
        const filePath = getCleanPath(line);
        onFileSelect(filePath);
      }
    }
  }, { isActive: isActive }); // Solo escucha si este panel está activo.

  if (isLoading) {
    return <Text color="gray">Cargando estructura del proyecto...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold color={isActive ? "cyan" : "blue"} underline>Explorador de Archivos</Text>
      <Text color="gray"> (Usa ↑/↓ para navegar, Espacio para seleccionar)</Text>
      <Box height={1} />
      {structure.map((line, index) => {
        const isSelectedForNav = index === selectedIndex;
        const cleanPath = getCleanPath(line);
        const isSelectedForContext = selectedFiles.has(cleanPath);

        let prefix = isSelectedForNav ? '> ' : '  ';
        let content = line.substring(prefix.length);

        let textColor: "cyan" | "green" | "white" = "white";
        if (isSelectedForNav && isActive) textColor = "cyan"; // Resalta solo si el panel está activo
        if (isSelectedForContext) textColor = "green";

        return (
          <Text key={cleanPath + index} color={textColor}>
            {prefix}
            {isSelectedForContext ? '[x] ' : '[ ] '}
            {content}
          </Text>
        );
      })}
    </Box>
  );
}