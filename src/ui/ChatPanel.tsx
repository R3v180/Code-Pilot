// Ruta: /src/ui/ChatPanel.tsx
// Versión: 3.3 (Cambia automáticamente a Staging al recibir cambios)

import React, { useState, Dispatch, SetStateAction } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { generateChatResponse } from '../services/gemini.js';
import fsPromises from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { StagedChange } from './App.js';
import { AiStatus, ActivePanel } from './StatusBar.js'; // 1. Importamos ActivePanel

const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  // ... (componente sin cambios)
  const parts = content.split(/(\`\`\`[\s\S]*?\`\`\`)/g);
  return (
    <Box flexDirection="column">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```/g, '').trim();
          return (
            <Box key={index} paddingX={1} borderStyle="round" borderColor="gray">
              <Text color="yellow">{code}</Text>
            </Box>
          );
        }
        return part.split('\n').map((line, lineIndex) => {
          if (line.startsWith('# ')) return <Text key={`${index}-${lineIndex}`} bold underline>{line.substring(2)}</Text>;
          if (line.startsWith('* ') || line.startsWith('- ')) return <Text key={`${index}-${lineIndex}`}>• {line.substring(2)}</Text>;
          return <Text key={`${index}-${lineIndex}`}>{line}</Text>;
        });
      })}
    </Box>
  );
};

interface ChatPanelProps {
  selectedFiles: Set<string>;
  onStageChanges: (changes: StagedChange[]) => void;
  isActive: boolean;
  setAiStatus: Dispatch<SetStateAction<AiStatus>>;
  onPanelChange: () => void;
  setActivePanel: Dispatch<SetStateAction<ActivePanel>>; // 2. Añadimos la nueva prop
}

export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// 3. Añadimos setActivePanel a los argumentos
export function ChatPanel({ selectedFiles, onStageChanges, isActive, setAiStatus, onPanelChange, setActivePanel }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/(\r\n|\n|\r)/gm, " ");
    setInputValue(sanitizedValue);
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: value };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setAiStatus('thinking');

    const projectDir = path.resolve(process.cwd(), fs.existsSync(path.join(process.cwd(), 'proyectos')) ? 'proyectos' : '');
    const contextFiles = await Promise.all(
      Array.from(selectedFiles).map(async (filePath) => {
        const absolutePath = path.join(projectDir, filePath);
        const content = await fsPromises.readFile(absolutePath, 'utf-8');
        return { path: filePath, content };
      })
    );
    
    const aiResponseJson = await generateChatResponse(value, contextFiles, newMessages);
    const aiResponse = JSON.parse(aiResponseJson);
    
    setMessages(prev => [...prev, { sender: 'ai', text: aiResponse.explanation }]);
    
    const newChanges = aiResponse.changes
      .filter((change: any) => change.type === 'file_creation' || change.type === 'file_modification')
      .map((change: any) => ({
        filePath: change.filePath,
        content: change.content,
        type: change.type === 'file_creation' ? 'creation' : 'modification'
      }));

    if (newChanges.length > 0) {
      onStageChanges(newChanges);
      // 4. MEJORA DE UX: Si hay cambios, cambiamos el foco a Staging.
      setActivePanel('staging');
    }

    setIsLoading(false);
    setAiStatus('idle');
  };

  useInput((input, key) => {
      if (key.tab) {
          onPanelChange();
          return;
      }
  }, { isActive });

  // ... (resto del JSX sin cambios)
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text bold color={isActive ? "cyan" : "green"}>Panel de Chat</Text>
      
      <Box 
        borderStyle="round" 
        flexGrow={1} 
        paddingX={1} 
        marginTop={1}
        flexDirection="column"
      >
        {messages.length === 0 && (
          <Text color="gray">Selecciona archivos y escribe una instrucción...</Text>
        )}
        {messages.map((msg, index) => (
          <Box key={index} flexDirection="column" marginBottom={1}>
            <Text bold color={msg.sender === 'user' ? 'cyan' : 'magenta'}>
              {msg.sender === 'user' ? 'Tú:' : 'IA:'}
            </Text>
            {msg.sender === 'ai' ? <SimpleMarkdown content={msg.text} /> : <Text>{msg.text}</Text>}
          </Box>
        ))}
        {isLoading && <Text color="gray">IA está escribiendo...</Text>}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="green">Archivos en contexto: {selectedFiles.size}</Text>
        <Box>
          <Text bold color="cyan">{'> '}</Text>
          {!isLoading && (
            <TextInput 
              value={inputValue}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              focus={isActive} 
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}