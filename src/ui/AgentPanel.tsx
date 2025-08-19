// Ruta: src/ui/AgentPanel.tsx
// Versión: 2.7.2 (Añade renderizado defensivo para planes de la IA)

import React, { useState, Dispatch, SetStateAction, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { generateExecutionPlan, generateCorrectionPlan, ExecutionPlan, DebugContext } from '../services/gemini.js';
import { AiStatus } from './StatusBar.js';
import { executeCommand } from '../utils/executor.js';
import * as workspace from '../utils/workspace.js';
import { getProjectStructure } from '../utils/file-system.js';

interface AgentPanelProps {
  projectPath: string;
  isActive: boolean;
  onPanelChange: () => void;
  setAiStatus: Dispatch<SetStateAction<AiStatus>>;
  refreshFileSystem: () => void;
  isAutoMode: boolean;
}

type StepStatus = 'pending' | 'running' | 'success' | 'failure';

const MAX_RETRIES = 5;

export const AgentPanel = ({ projectPath, isActive, onPanelChange, setAiStatus, refreshFileSystem, isAutoMode }: AgentPanelProps) => {
  const [task, setTask] = useState('');
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const [stepOutputs, setStepOutputs] = useState<string[]>([]);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  const retries = useRef(0);

  useInput((input, key) => {
    if (isActive && !isExecuting && plan && plan.plan.length > 0 && key.ctrl && input === 'e') {
      retries.current = 0;
      executePlan(plan);
    }
  });

  const handleSubmit = async () => {
    if (!task.trim() || isLoading) return;
    setIsLoading(true);
    setAiStatus('thinking');
    setPlan(null);
    setDebugMessage(null);
    retries.current = 0;
    const generatedPlan = await generateExecutionPlan(task, []);
    setPlan(generatedPlan);
    setStepStatuses(Array(generatedPlan.plan.length).fill('pending'));
    setStepOutputs(Array(generatedPlan.plan.length).fill(''));
    setIsLoading(false);
    setAiStatus('idle');
  };

  const executePlan = async (currentPlan: ExecutionPlan) => {
    if (!currentPlan) return;
    setIsExecuting(true);
    setAiStatus('thinking');
    setDebugMessage(isAutoMode ? `🤖 Iniciando ejecución en Modo Auto...` : '▶️ Iniciando ejecución...');
    let finalOutput = '';

    for (let i = 0; i < currentPlan.plan.length; i++) {
      const step = currentPlan.plan[i];
      setStepStatuses(prev => prev.map((s, idx) => idx === i ? 'running' : s));
      let success = false;
      
      try {
        switch (step.type) {
          case 'command':
            if (step.command) {
              const result = await executeCommand(step.command, projectPath, (data) => {
                  setStepOutputs(prev => prev.map((o, idx) => idx === i ? o + data : o));
              });
              success = result.success;
              finalOutput = stepOutputs[i] || '';
            }
            break;
          case 'file_creation':
          case 'file_modification':
            if (step.filePath && typeof step.content === 'string') {
              await workspace.writeFile(projectPath, step.filePath, step.content);
              success = true;
              setStepOutputs(prev => prev.map((o, idx) => idx === i ? `Archivo ${step.filePath} guardado.` : o));
            }
            break;
          case 'file_deletion':
             if (step.filePath) {
              await workspace.deleteFile(projectPath, step.filePath);
              success = true;
              setStepOutputs(prev => prev.map((o, idx) => idx === i ? `Archivo ${step.filePath} eliminado.` : o));
            }
            break;
          case 'thought':
            success = true;
            break;
        }
      } catch (error: any) {
        success = false;
        finalOutput = error.message;
      }
      
      setStepStatuses(prev => prev.map((s, idx) => idx === i ? (success ? 'success' : 'failure') : s));

      if (!success) {
        setDebugMessage(`🔴 Fallo detectado (Intento ${retries.current + 1}).`);
        if (isAutoMode && retries.current < MAX_RETRIES) {
          retries.current++;
          setDebugMessage(`🤖 Modo Auto: Pidiendo corrección...`);
          const fileSystemState = await getProjectStructure(projectPath);
          const debugContext: DebugContext = {
            originalTask: task, failedPlan: currentPlan,
            failedStepIndex: i, errorOutput: finalOutput,
            fileSystemState,
          };
          const correctedPlan = await generateCorrectionPlan(debugContext, []);
          setPlan(correctedPlan);
          setStepStatuses(Array(correctedPlan.plan.length).fill('pending'));
          setStepOutputs(Array(correctedPlan.plan.length).fill(''));
          executePlan(correctedPlan);
        } else {
          setDebugMessage(isAutoMode ? `🔴 Límite de reintentos alcanzado.` : `🔴 Fallo detectado. Revísalo y ejecuta de nuevo.`);
          setIsExecuting(false);
          setAiStatus('idle');
        }
        return;
      }
    }

    setDebugMessage('✅ ¡Plan completado con éxito!');
    setIsExecuting(false);
    setAiStatus('idle');
    refreshFileSystem();
  };
  
  const getStatusIndicator = (status: StepStatus) => {
    switch(status) {
      case 'pending': return '⚪️';
      case 'running': return '🟡';
      case 'success': return '✅';
      case 'failure': return '❌';
    }
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Text bold color={isActive ? "cyan" : "magenta"} underline>✈️ Panel del Agente Autónomo</Text>
      
      <Box 
        borderStyle="round" 
        flexGrow={1} 
        padding={1} 
        marginTop={1}
        flexDirection="column"
      >
        {!plan && !isLoading && <Text color="gray">Introduce una tarea de alto nivel...</Text>}
        {isLoading && <Box><Spinner type="dots" /><Text> La IA está planificando...</Text></Box>}
        
        {plan && (
          <Box flexDirection="column">
            <Text bold>🤔 Pensamiento:</Text>
            <Text color="gray">{plan.thought}</Text>
            <Box marginTop={1} flexDirection="column">
              <Text bold>📋 Plan de Ejecución:</Text>
              {plan.plan.length > 0 ? (
                plan.plan.map((step, index) => (
                  <Box key={index} flexDirection="column" marginBottom={1}>
                    <Box>
                      <Text>{getStatusIndicator(stepStatuses[index])} {index + 1}. </Text>
                      {/* --- INICIO DE LA CORRECCIÓN --- */}
                      <Text>[{(step.type || 'unknown').toUpperCase()}] </Text>
                      <Text>{step.description || 'Paso sin descripción.'}</Text>
                      {/* --- FIN DE LA CORRECCIÓN --- */}
                    </Box>
                    {stepOutputs[index] && (
                        <Box borderStyle="round" borderColor="gray" paddingX={1} marginLeft={4}>
                            <Text color="gray">{stepOutputs[index]}</Text>
                        </Box>
                    )}
                  </Box>
                ))
              ) : (
                <Text color="yellow">No se han generado pasos para este plan.</Text>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {debugMessage && <Text color={debugMessage.startsWith('🔴') ? 'red' : 'green'}>{debugMessage}</Text>}

      <Box marginTop={1} flexDirection="column">
        {plan && !isExecuting && <Text color="cyan" bold>[Ctrl+E] para Ejecutar Plan</Text>}
        <Box>
          <Text bold color="cyan">{'> '}</Text>
          <Box flexGrow={1}>
            <TextInput 
              value={task}
              onChange={setTask}
              onSubmit={handleSubmit}
              focus={isActive} 
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};