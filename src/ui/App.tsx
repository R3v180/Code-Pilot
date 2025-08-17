// Ruta: /src/ui/App.tsx
// Versión: 4.5 (Añade observador de archivos en tiempo real con chokidar)

import React, { useState, useEffect } from 'react'; // 1. Importamos useEffect
import { Box } from 'ink';
import fsPromises from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import chokidar from 'chokidar'; // 2. Importamos chokidar
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
  const [fileSystemVersion, setFileSystemVersion] = useState(0);

  // 3. NUEVO useEffect para observar el sistema de archivos
  useEffect(() => {
    // Determinamos la ruta a observar
    const projectDir = path.resolve(process.cwd());
    const targetDir = fs.existsSync(path.join(projectDir, 'proyectos')) ? path.join(projectDir, 'proyectos') : projectDir;

    // Inicializamos chokidar
    const watcher = chokidar.watch(targetDir, {
      // Ignoramos archivos/carpetas comunes para mejorar el rendimiento
      ignored: /(^|[\/\\])\..|node_modules|dist|git/,
      persistent: true,
      ignoreInitial: true, // No disparamos eventos por los archivos que ya existen al inicio
      depth: 10, // Limitamos la profundidad de la recursividad
    });

    // La función que se ejecutará en cada cambio
    const triggerRefresh = () => {
      setFileSystemVersion(v => v + 1);
    };

    // Escuchamos los eventos de creación y borrado
    watcher
      .on('add', triggerRefresh)
      .on('unlink', triggerRefresh)
      .on('addDir', triggerRefresh)
      .on('unlinkDir', triggerRefresh);

    // Función de limpieza: se ejecuta cuando el componente se desmonta (al cerrar la app)
    return () => {
      watcher.close();
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez

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
    
    const contentToWrite = change.content || '';

    const projectDir = path.resolve(process.cwd());
    const targetDir = fs.existsSync(path.join(projectDir, 'proyectos')) ? path.join(projectDir, 'proyectos') : projectDir;
    const absolutePath = path.join(targetDir, change.filePath);
    
    await fsPromises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fsPromises.writeFile(absolutePath, contentToWrite); 
    
    setStagedChanges(prev => prev.filter((_, i) => i !== index));
    // Ya no es estrictamente necesario llamar a setFileSystemVersion aquí,
    // porque chokidar lo detectará, pero lo dejamos por inmediatez.
    setFileSystemVersion(v => v + 1);
    
    setActivePanel('chat');
  };

  const handleDiscardChange = (index: number) => {
    setStagedChanges(prev => prev.filter((_, i) => i !== index));
    setActivePanel('chat');
  };

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
            fileSystemVersion={fileSystemVersion}
          />
        </Box>
        <Box borderStyle="round" borderColor={activePanel === 'chat' ? 'cyan' : 'green'} width="50%" paddingX={1}>
          <ChatPanel
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