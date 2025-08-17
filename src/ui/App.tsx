// Ruta: /src/ui/App.tsx
// Versión: 5.1 (Acepta y propaga la ruta del proyecto)

import React, { useState, useEffect } from 'react';
import { Box, useInput } from 'ink';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import chokidar from 'chokidar';
import { FileExplorer } from './FileExplorer.js';
import { ChatPanel } from './ChatPanel.js';
import { StagingPanel } from './StagingPanel.js';
import { StatusBar, type ActivePanel, type AiStatus } from './StatusBar.js';
import { ConfigManager } from './ConfigManager.js';

export interface StagedChange {
  filePath: string;
  content: string;
  type: 'creation' | 'modification';
}

type AppMode = 'main' | 'config';

// 1. Definimos las props que recibirá App
interface AppProps {
  projectPath: string;
}

export function App({ projectPath }: AppProps) { // 2. Recibimos projectPath
  const [selectedFiles, setSelectedFiles] = useState(new Set<string>());
  const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('explorer');
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [fileSystemVersion, setFileSystemVersion] = useState(0);
  const [mode, setMode] = useState<AppMode>('main');

  useInput((input, key) => {
    if (key.ctrl && input === 'k') {
      setMode(current => current === 'main' ? 'config' : 'main');
    }
  });
  
  useEffect(() => {
    // 3. El observador ahora usa la ruta del proyecto
    const watcher = chokidar.watch(projectPath, {
      ignored: /(^|[\/\\])\..|node_modules|dist|git/,
      persistent: true,
      ignoreInitial: true,
      depth: 10,
    });
    const triggerRefresh = () => setFileSystemVersion(v => v + 1);
    watcher
      .on('add', triggerRefresh).on('unlink', triggerRefresh)
      .on('addDir', triggerRefresh).on('unlinkDir', triggerRefresh);
    return () => { watcher.close(); };
  }, [projectPath]); // Se reactiva si cambia la ruta del proyecto

  const handlePanelChange = () => {
    setActivePanel(current => (current === 'explorer' ? 'chat' : current === 'chat' ? 'staging' : 'explorer'));
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
    const contentToWrite = change.content || '';
    // 4. La escritura de archivos ahora usa la ruta del proyecto
    const absolutePath = path.join(projectPath, change.filePath);
    await fsPromises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fsPromises.writeFile(absolutePath, contentToWrite); 
    setStagedChanges(prev => prev.filter((_, i) => i !== index));
    setFileSystemVersion(v => v + 1);
    setActivePanel('chat');
  };
  
  const handleDiscardChange = (index: number) => {
    setStagedChanges(prev => prev.filter((_, i) => i !== index));
    setActivePanel('chat');
  };
  const handleEditChange = (index: number, newContent: string) => {
    setStagedChanges(prev =>
      prev.map((change, i) => i === index ? { ...change, content: newContent } : change)
    );
  };

  if (mode === 'config') {
    return <ConfigManager onClose={() => setMode('main')} />;
  }

  return (
    <Box width="100%" height={process.stdout.rows - 1} flexDirection="column">
      <Box flexGrow={1} flexDirection="row">
        <Box borderStyle="round" borderColor={activePanel === 'explorer' ? 'cyan' : 'blue'} width="25%" paddingX={1}>
          {/* 5. Pasamos la ruta del proyecto a los componentes hijos */}
          <FileExplorer
            projectPath={projectPath}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onBulkFileSelect={handleBulkFileSelect}
            isActive={activePanel === 'explorer'}
            onPanelChange={handlePanelChange}
            fileSystemVersion={fileSystemVersion}
          />
        </Box>
        <Box borderStyle="round" borderColor={activePanel === 'chat' ? 'cyan' : 'green'} width="50%" paddingX={1}>
          <ChatPanel
            projectPath={projectPath}
            selectedFiles={selectedFiles}
            onStageChanges={handleStageChanges}
            isActive={activePanel === 'chat'}
            setAiStatus={setAiStatus}
            onPanelChange={handlePanelChange}
            setActivePanel={setActivePanel}
          />
        </Box>
        <Box borderStyle="round" borderColor={activePanel === 'staging' ? 'cyan' : 'yellow'} flexGrow={1} paddingX={1}>
          <StagingPanel
            projectPath={projectPath}
            stagedChanges={stagedChanges}
            isActive={activePanel === 'staging'}
            onApplyChange={handleApplyChange}
            onDiscardChange={handleDiscardChange}
            onEditChange={handleEditChange}
            onPanelChange={handlePanelChange}
            setActivePanel={setActivePanel}
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