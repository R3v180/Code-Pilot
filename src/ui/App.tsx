// Ruta: /src/ui/App.tsx
// Versión: 2.3

import React, { useState } from 'react';
import { Box, useInput } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { FileExplorer } from './FileExplorer.js';
import { ChatPanel } from './ChatPanel.js';
import { StagingPanel } from './StagingPanel.js';

export interface StagedChange {
  filePath: string;
  content: string;
  type: 'creation' | 'modification';
}

type ActivePanel = 'explorer' | 'chat' | 'staging';

export function App() {
  const [selectedFiles, setSelectedFiles] = useState(new Set<string>());
  const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('explorer');

  useInput((input, key) => {
    if (key.tab) {
      setActivePanel(current => {
        if (current === 'explorer') return 'chat';
        if (current === 'chat') return 'staging';
        return 'explorer';
      });
    }
  });

  const handleFileSelect = (filePath: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(filePath)) {
      newSelectedFiles.delete(filePath);
    } else {
      newSelectedFiles.add(filePath);
    }
    setSelectedFiles(newSelectedFiles);
  };

  const handleStageChange = (change: StagedChange) => {
    setStagedChanges([change]);
  };

  // 1. Nueva función para aplicar un cambio.
  const handleApplyChange = async (index: number) => {
    const changeToApply = stagedChanges[index];
    if (!changeToApply) return;

    const absolutePath = path.resolve(process.cwd(), changeToApply.filePath);
    await fs.writeFile(absolutePath, changeToApply.content);
    
    // Eliminamos el cambio de la lista de staging
    setStagedChanges(prev => prev.filter((_, i) => i !== index));
  };

  // 2. Nueva función para descartar un cambio.
  const handleDiscardChange = (index: number) => {
    setStagedChanges(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <Box width="100%" height={process.stdout.rows - 1} flexDirection="row">
      <Box 
        borderStyle="round" 
        borderColor={activePanel === 'explorer' ? 'cyan' : 'blue'} 
        width="25%" 
        paddingX={1}
      >
        <FileExplorer 
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          isActive={activePanel === 'explorer'}
        />
      </Box>
      
      <Box 
        borderStyle="round" 
        borderColor={activePanel === 'chat' ? 'cyan' : 'green'} 
        width="50%" 
        paddingX={1}
      >
        <ChatPanel 
          selectedFiles={selectedFiles} 
          onStageChange={handleStageChange} 
          isActive={activePanel === 'chat'}
        />
      </Box>
      
      {/* 3. Pasamos las nuevas funciones de manejo al StagingPanel */}
      <Box 
        borderStyle="round" 
        borderColor={activePanel === 'staging' ? 'cyan' : 'yellow'} 
        flexGrow={1} 
        paddingX={1}
      >
        <StagingPanel 
          stagedChanges={stagedChanges}
          isActive={activePanel === 'staging'}
          onApplyChange={handleApplyChange}
          onDiscardChange={handleDiscardChange}
        />
      </Box>
    </Box>
  );
}