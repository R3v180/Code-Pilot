// Ruta: /src/ui/ChatPanel.tsx
// Versión: 2.4

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { generateChatResponse } from '../services/gemini.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { StagedChange } from './App.js';

interface ChatPanelProps {
  selectedFiles: Set<string>;
  onStageChange: (change: StagedChange) => void;
  isActive: boolean; // Nueva prop
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export function ChatPanel({ selectedFiles, onStageChange, isActive }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return;

    setMessages(prev => [...prev, { sender: 'user', text: value }]);
    setInputValue('');
    setIsLoading(true);

    const contextFiles = await Promise.all(
      Array.from(selectedFiles).map(async filePath => {
        const absolutePath = path.resolve(process.cwd(), filePath);
        const content = await fs.readFile(absolutePath, 'utf-8');
        return { path: filePath, content };
      })
    );
    
    const aiResponseJson = await generateChatResponse(value, contextFiles);
    const aiResponse = JSON.parse(aiResponseJson);
    
    setMessages(prev => [...prev, { sender: 'ai', text: aiResponse.explanation }]);
    
    if (aiResponse.responseType === 'file_creation' || aiResponse.responseType === 'file_modification') {
      onStageChange({
        filePath: aiResponse.filePath,
        content: aiResponse.content,
        type: aiResponse.responseType === 'file_creation' ? 'creation' : 'modification'
      });
    }

    setIsLoading(false);
  };

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
            <Text>{msg.text}</Text>
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
              onChange={setInputValue}
              onSubmit={handleSubmit}
              // El componente TextInput se enfocará automáticamente si el panel está activo.
              focus={isActive} 
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}