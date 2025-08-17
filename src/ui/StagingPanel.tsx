// Ruta: /src/ui/StagingPanel.tsx
// Versión: 4.2 (Añade manejo de cambio de panel y reseteo de foco)

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { StagedChange } from './App.js';
import { diffLines, type Change } from 'diff';
import fs from 'node:fs/promises';
import path from 'node:path';
import fsSync from 'node:fs';
import { Editor } from './Editor.js';

interface StagingPanelProps {
  stagedChanges: StagedChange[];
  isActive: boolean;
  onApplyChange: (index: number) => void;
  onDiscardChange: (index: number) => void;
  onEditChange: (index: number, newContent: string) => void;
  onPanelChange: () => void; // <-- 1. Añadimos la nueva prop
}

type StagingMode = 'navigate' | 'action' | 'edit';
type Action = 'apply' | 'discard' | 'edit';

// 2. Añadimos `onPanelChange` a los argumentos
export function StagingPanel({ stagedChanges, isActive, onApplyChange, onDiscardChange, onEditChange, onPanelChange }: StagingPanelProps) {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [diff, setDiff] = React.useState<Change[] | null>(null);
    const [isLoadingDiff, setIsLoadingDiff] = React.useState(false);
    const [mode, setMode] = React.useState<StagingMode>('navigate');
    const [selectedAction, setSelectedAction] = React.useState<Action>('apply');
    const [diffScrollTop, setDiffScrollTop] = React.useState(0);

    const visibleDiffHeight = process.stdout.rows > 10 ? process.stdout.rows - 12 : 8;

    React.useEffect(() => {
        if (!isActive) {
            setMode('navigate');
        }
    }, [isActive]);
    
    React.useEffect(() => {
        if (stagedChanges.length === 0) {
            setSelectedIndex(0);
            setMode('navigate');
            setDiffScrollTop(0);
        } else if (selectedIndex >= stagedChanges.length) {
            setSelectedIndex(stagedChanges.length - 1);
        }
    }, [stagedChanges, selectedIndex]);

    React.useEffect(() => {
        if (mode !== 'edit' && stagedChanges.length > 0 && selectedIndex < stagedChanges.length) {
            setIsLoadingDiff(true);
            const change = stagedChanges[selectedIndex];
            const projectDir = path.resolve(process.cwd(), fsSync.existsSync(path.join(process.cwd(), 'proyectos')) ? 'proyectos' : '');
            const absolutePath = path.join(projectDir, change.filePath);

            fs.readFile(absolutePath, 'utf-8')
                .then(originalContent => setDiff(diffLines(originalContent, change.content)))
                .catch(() => setDiff(diffLines('', change.content)))
                .finally(() => setIsLoadingDiff(false));
        } else {
            setDiff(null);
        }
    }, [selectedIndex, stagedChanges, mode]);

    useInput((input, key) => {
        // 3. Añadimos la lógica para manejar Tab
        if (key.tab) {
            onPanelChange();
            return;
        }

        if (mode === 'navigate') {
            if (key.upArrow) setSelectedIndex(prev => Math.max(0, prev - 1));
            if (key.downArrow) setSelectedIndex(prev => Math.min(stagedChanges.length - 1, prev + 1));
            if (key.return && stagedChanges.length > 0) {
                setSelectedAction('apply');
                setMode('action');
            }
            if (key.shift && key.downArrow && diff) setDiffScrollTop(prev => Math.min(diff.length - 1, prev + 1));
            if (key.shift && key.upArrow) setDiffScrollTop(prev => Math.max(0, prev - 1));
        } else if (mode === 'action') {
            if (key.leftArrow) setSelectedAction(current => (current === 'discard' ? 'edit' : current === 'edit' ? 'apply' : 'apply'));
            if (key.rightArrow) setSelectedAction(current => (current === 'apply' ? 'edit' : current === 'edit' ? 'discard' : 'discard'));
            if (key.escape) setMode('navigate');
            if (key.return) {
                if (selectedAction === 'apply') onApplyChange(selectedIndex);
                else if (selectedAction === 'edit') setMode('edit');
                else onDiscardChange(selectedIndex);
                
                if(selectedAction !== 'edit') setMode('navigate');
            }
        }
    }, { isActive: isActive && mode !== 'edit' });

    const selectedChange = stagedChanges[selectedIndex];

    const handleSave = (newContent: string) => {
        onEditChange(selectedIndex, newContent);
        setMode('navigate');
    };

    const handleCancel = () => {
        setMode('navigate');
    };

    const ActionMenu = () => (
        <Box marginTop={1}>
            <Text color={selectedAction === 'apply' ? 'black' : 'green'} backgroundColor={selectedAction === 'apply' ? 'green' : undefined}>[ Aplicar ]</Text>
            <Text>  </Text>
            <Text color={selectedAction === 'edit' ? 'black' : 'cyan'} backgroundColor={selectedAction === 'edit' ? 'cyan' : undefined}>[ Editar ]</Text>
            <Text>  </Text>
            <Text color={selectedAction === 'discard' ? 'black' : 'red'} backgroundColor={selectedAction === 'discard' ? 'red' : undefined}>[ Descartar ]</Text>
        </Box>
    );

    const renderDiff = () => {
        if (isLoadingDiff) return <Text>Cargando diff...</Text>;
        if (!diff) return null;
        const visibleLines = diff.slice(diffScrollTop, diffScrollTop + visibleDiffHeight);
        return visibleLines.map((part: Change, i: number) => (
            <Text key={i} color={part.added ? 'green' : part.removed ? 'red' : 'gray'}>{(part.added ? '+ ' : part.removed ? '- ' : '  ') + part.value.replace(/\n$/, '')}</Text>
        ));
    };

    if (isActive && mode === 'edit' && selectedChange) {
        return (
            <Editor
                initialContent={selectedChange.content}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        );
    }
    
    return (
        <Box flexDirection="column" flexGrow={1}>
            <Text bold color={isActive ? "cyan" : "yellow"} underline>Panel de Cambios (Staging)</Text>
            {stagedChanges.length === 0 ? (
                <Box marginTop={1}><Text color="gray">Propuestas de cambio aparecerán aquí.</Text></Box>
            ) : (
                <>
                <Text color="gray">(↑↓, Enter. Shift+↑↓ para scroll)</Text>
                <Box flexDirection="row" flexGrow={1} marginTop={1}>
                    <Box flexDirection="column" width="50%" marginRight={2}>
                        <Text>Cambios propuestos:</Text>
                        {stagedChanges.map((change, index) => (
                            <Text key={index} color={index === selectedIndex && isActive && mode !== 'edit' ? "cyan" : "white"}>
                            {index === selectedIndex && mode !== 'edit' ? '> ' : '  '}
                            {change.type === 'creation' ? '[NUEVO] ' : '[MODIF] '}
                            {change.filePath}
                            </Text>
                        ))}
                        {isActive && mode === 'action' && <ActionMenu />}
                    </Box>
                    <Box flexDirection="column" flexGrow={1} borderStyle="round" paddingX={1}>
                        <Text bold>Diferencias para: {selectedChange?.filePath}</Text>
                        {renderDiff()}
                    </Box>
                </Box>
                </>
            )}
        </Box>
    );
}