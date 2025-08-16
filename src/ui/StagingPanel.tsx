// Ruta: /src/ui/StagingPanel.tsx
// Versión: 2.6

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { StagedChange } from './App.js';
import { diffLines, type Change } from 'diff';
import fs from 'node:fs/promises';
import path from 'node:path';

interface StagingPanelProps {
  stagedChanges: StagedChange[];
  isActive: boolean;
  onApplyChange: (index: number) => void;
  onDiscardChange: (index: number) => void;
}

type StagingMode = 'navigate' | 'action';
type Action = 'apply' | 'discard';

export function StagingPanel({ stagedChanges, isActive, onApplyChange, onDiscardChange }: StagingPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [diff, setDiff] = useState<Change[] | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [mode, setMode] = useState<StagingMode>('navigate');
  const [selectedAction, setSelectedAction] = useState<Action>('apply');

  useEffect(() => {
    if (stagedChanges.length === 0) {
      setSelectedIndex(0);
      setMode('navigate'); // Volver al modo navegación si no hay cambios
    }
  }, [stagedChanges]);

  useEffect(() => {
    if (stagedChanges.length > 0 && selectedIndex < stagedChanges.length) {
      setIsLoadingDiff(true);
      const change = stagedChanges[selectedIndex];
      
      fs.readFile(path.resolve(process.cwd(), change.filePath), 'utf-8')
        .then(originalContent => setDiff(diffLines(originalContent, change.content)))
        .catch(() => setDiff(diffLines('', change.content)))
        .finally(() => setIsLoadingDiff(false));
    } else {
      setDiff(null);
    }
  }, [selectedIndex, stagedChanges]);

  useInput((input, key) => {
    if (mode === 'navigate') {
      if (key.upArrow) setSelectedIndex(prev => Math.max(0, prev - 1));
      if (key.downArrow) setSelectedIndex(prev => Math.min(stagedChanges.length - 1, prev + 1));
      if (key.return) setMode('action'); // Enter
    } else if (mode === 'action') {
      if (key.leftArrow) setSelectedAction('apply');
      if (key.rightArrow) setSelectedAction('discard');
      if (key.escape) setMode('navigate'); // Escape
      if (key.return) { // Enter
        if (selectedAction === 'apply') onApplyChange(selectedIndex);
        else onDiscardChange(selectedIndex);
        setMode('navigate');
      }
    }
  }, { isActive });

  const selectedChange = stagedChanges[selectedIndex];

  const ActionMenu = () => (
    <Box marginTop={1}>
      <Text color={selectedAction === 'apply' ? 'black' : 'green'} 
            backgroundColor={selectedAction === 'apply' ? 'green' : undefined}>
        [ Aplicar ]
      </Text>
      <Text>  </Text>
      <Text color={selectedAction === 'discard' ? 'black' : 'red'}
            backgroundColor={selectedAction === 'discard' ? 'red' : undefined}>
        [ Descartar ]
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text bold color={isActive ? "cyan" : "yellow"} underline>Panel de Cambios (Staging)</Text>
      
      {stagedChanges.length === 0 ? (
        <Box marginTop={1}><Text color="gray">Propuestas de cambio aparecerán aquí.</Text></Box>
      ) : (
        <>
          <Text color="gray">(Usa ↑/↓ y Enter para actuar sobre un cambio)</Text>
          <Box flexDirection="row" flexGrow={1} marginTop={1}>
            <Box flexDirection="column" width="50%" marginRight={2}>
              <Text>Cambios propuestos:</Text>
              {stagedChanges.map((change, index) => (
                <Text key={index} color={index === selectedIndex && isActive ? "cyan" : "white"}>
                  {index === selectedIndex ? '> ' : '  '}
                  {change.type === 'creation' ? '[NUEVO] ' : '[MODIF] '}
                  {change.filePath}
                </Text>
              ))}
              {isActive && mode === 'action' && <ActionMenu />}
            </Box>
            
            <Box flexDirection="column" flexGrow={1} borderStyle="round" paddingX={1}>
              <Text bold>Diferencias para: {selectedChange?.filePath}</Text>
              {isLoadingDiff && <Text>Cargando diff...</Text>}
              {diff && diff.map((part: Change, i: number) => (
                <Text key={i} color={part.added ? 'green' : part.removed ? 'red' : 'gray'}>
                  {(part.added ? '+ ' : part.removed ? '- ' : '  ') + part.value.replace(/\n$/, '')}
                </Text>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}