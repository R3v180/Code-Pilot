// Ruta: /src/ui/App.tsx
// Versión: 4.2.1 (Sintaxis de import corregida)

import React, { useState } from 'react'; // CORRECCIÓN: Estaba `import React, { useState }`
import { Box } from 'ink';
import fsPromises from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { FileExplorer } from './FileExplorer.js';
import { ChatPanel } from './ChatPanel.js';
import { StagingPanel } from './StagingPanel.js';
import { StatusBar, type ActivePanel, type AiStatus } from './StatusBar.js';

export interface StagedChange {
  filePath: string;
  content: string;
  type: 'creation' | 'modification';
}

export function App() {
  const [selectedFiles, setSelectedFiles] = useState(new Set<string>());
  const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('explorer');
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');

  const handlePanelChange = () => {
    setActivePanel(current => {
      if (current === 'explorer') return 'chat';
      if (current === 'chat') return 'staging';
      return 'explorer';
    });
  };

  const handleFileSelect = (filePath: string) => {
    const newFiles = new Set(selectedFiles);
    newFiles.has(filePath) ? newFiles.delete(filePath) : newFiles.add(filePath);
    setSelectedFiles(newFiles);
  };

  const handleBulkFileSelect = (files: string[], action: 'select' | 'deselect') => {
    const newFiles = new Set(selectedFiles);
    files.forEach(file => (action === 'select' ? newFiles.add(file) : newFiles.delete(file)));
    setSelectedFiles(newFiles);
  };

  const handleStageChanges = (changes: StagedChange[]) => setStagedChanges(prev => [...prev, ...changes]);

  const handleApplyChange = async (index: number) => {
    const change = stagedChanges[index];
    if (!change) return;
    const projectDir = path.resolve(process.cwd());
    const targetDir = fs.existsSync(path.join(projectDir, 'proyectos')) ? path.join(projectDir, 'proyectos') : projectDir;
    const absolutePath = path.join(targetDir, change.filePath);
    
    await fsPromises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fsPromises.writeFile(absolutePath, change.content);
    setStagedChanges(prev => prev.filter((_, i) => i !== index));
  };

  const handleDiscardChange = (index: number) => setStagedChanges(prev => prev.filter((_, i) => i !== index));

  const handleEditChange = (index: number, newContent: string) => {
    setStagedChanges(prev =>
      prev.map((change, i) =>
        i === index ? { ...change, content: newContent } : change
      )
    );
  };

  return (
    <Box width="100%" height={process.stdout.rows - 1} flexDirection="column">
      <Box flexGrow={1} flexDirection="row">
        <Box borderStyle="round" borderColor={activePanel === 'explorer' ? 'cyan' : 'blue'} width="25%" paddingX={1}>
          <FileExplorer
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onBulkFileSelect={handleBulkFileSelect}
            isActive={activePanel === 'explorer'}
            onPanelChange={handlePanelChange}
          />
        </Box>
        <Box borderStyle="round" borderColor={activePanel === 'chat' ? 'cyan' : 'green'} width="50%" paddingX={1}>
          <ChatPanel
            selectedFiles={selectedFiles}
            onStageChanges={handleStageChanges}
            isActive={activePanel === 'chat'}
            setAiStatus={setAiStatus}
            onPanelChange={handlePanelChange}
          />
        </Box>
        <Box borderStyle="round" borderColor={activePanel === 'staging' ? 'cyan' : 'yellow'} flexGrow={1} paddingX={1}>
          <StagingPanel
            stagedChanges={stagedChanges}
            isActive={activePanel === 'staging'}
            onApplyChange={handleApplyChange}
            onDiscardChange={handleDiscardChange}
            onEditChange={handleEditChange}
            onPanelChange={handlePanelChange}
          />
        </Box>
      </Box>
      <StatusBar
        activePanel={activePanel}
        aiStatus={aiStatus}
        selectedFileCount={selectedFiles.size}
        stagedChangeCount={stagedChanges.length}
      />
    </Box>
  );
}