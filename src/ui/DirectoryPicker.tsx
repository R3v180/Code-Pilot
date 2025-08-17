// Ruta: src/ui/DirectoryPicker.tsx
// Versión: 1.0 (Componente para seleccionar un directorio de una lista)

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { getProjectDirectories } from '../utils/file-system.js';

interface DirectoryPickerProps {
  basePath: string; // La ruta donde buscar los directorios (ej: 'proyectos/')
  title: string;    // Un título para mostrar en la pantalla (ej: "Abrir Proyecto")
  onSelect: (directoryPath: string) => void; // Función a llamar con la ruta completa seleccionada
  onCancel: () => void; // Función a llamar si el usuario cancela
}

export const DirectoryPicker = ({ basePath, title, onSelect, onCancel }: DirectoryPickerProps) => {
  const [directories, setDirectories] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProjectDirectories(basePath).then(dirs => {
      setDirectories(dirs);
      setIsLoading(false);
    });
  }, [basePath]);

  useInput((input, key) => {
    if (isLoading || directories.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(directories.length - 1, i + 1));
    }
    if (key.return) {
      const selectedDir = directories[selectedIndex];
      if (selectedDir) {
        onSelect(`${basePath}/${selectedDir}`); // Devolvemos la ruta completa
      }
    }
    if (key.escape) {
      onCancel();
    }
  });

  if (isLoading) {
    return (
      <Box padding={1}><Text color="gray">Buscando proyectos...</Text></Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round">
      <Text bold underline>{title}</Text>
      <Box flexDirection="column" marginTop={1}>
        {directories.length > 0 ? (
          directories.map((dir, index) => (
            <Text key={dir} color={selectedIndex === index ? 'cyan' : 'white'}>
              {selectedIndex === index ? '> ' : '  '}
              📁 {dir}
            </Text>
          ))
        ) : (
          <Text color="yellow">No se encontraron proyectos. ¡Crea uno nuevo!</Text>
        )}
      </Box>
      <Box marginTop={1} borderStyle="single" paddingX={1}>
        <Text color="gray">[↑/↓] Navegar | [Enter] Seleccionar | [Esc] Cancelar</Text>
      </Box>
    </Box>
  );
};