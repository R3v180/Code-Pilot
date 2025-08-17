// Ruta: src/ui/AgentPanel.tsx
// Versión: 2.4 (Ejecuta comandos en el directorio correcto y corrige renderizado)

import React, { useState, Dispatch, SetStateAction } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { generateExecutionPlan, generateCorrectionPlan, ExecutionPlan, DebugContext } from '../services/gemini.js';
import { AiStatus } from './StatusBar.js';
import { executeCommand } from '../utils/executor.js';
import * as workspace from '../utils/workspace.js';

interface AgentPanelProps {
  projectPath: string;
  isActive: boolean;
  onPanelChange: () => void;
  setAiStatus: Dispatch<SetStateAction<AiStatus>>;
  refreshFileSystem: () => void;
}

type StepStatus = 'pending' | 'running' | 'success' | 'failure';

export const AgentPanel = ({ projectPath, isActive, onPanelChange, setAiStatus, refreshFileSystem }: AgentPanelProps) => {
  const [task, setTask] = useState('');
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const [stepOutputs, setStepOutputs] = useState<(string | null)[]>([]);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  useInput((input, key) => {
    if (isActive && !isExecuting && plan && plan.plan.length > 0 && key.ctrl && input === 'e') {
      executePlan();
    }
  });

  const handleSubmit = async () => {
    if (!task.trim() || isLoading) return;
    setIsLoading(true);
    setAiStatus('thinking');
    setPlan(null);
    setDebugMessage(null);
    const generatedPlan = await generateExecutionPlan(task, []);
    setPlan(generatedPlan);
    setStepStatuses(Array(generatedPlan.plan.length).fill('pending'));
    setStepOutputs(Array(generatedPlan.plan.length).fill(null));
    setIsLoading(false);
    setAiStatus('idle');
  };

  const executePlan = async () => {
    if (!plan) return;
    setIsExecuting(true);
    setAiStatus('thinking');
    setDebugMessage(null);

    for (let i = 0; i < plan.plan.length; i++) {
      const step = plan.plan[i];
      setStepStatuses(prev => prev.map((s, idx) => idx === i ? 'running' : s));
      let success = false;
      let output = '';

      try {
        switch (step.type) {
          case 'command':
            if (step.command) {
              // 2. Pasamos el projectPath al executor
              const result = await executeCommand(step.command, projectPath);
              success = result.success;
              output = result.stdout || result.stderr;
            }
            break;
          case 'file_creation':
          case 'file_modification':
            if (step.filePath && typeof step.content === 'string') {
              await workspace.writeFile(step.filePath, step.content);
              success = true; output = `Archivo ${step.filePath} guardado.`;
            }
            break;
          case 'file_deletion':
             if (step.filePath) {
              await workspace.deleteFile(step.filePath);
              success = true; output = `Archivo ${step.filePath} eliminado.`;
            }
            break;
          case 'thought':
            success = true; output = 'Paso de reflexión, sin acción.';
            break;
        }
      } catch (error: any) {
        success = false;
        output = error.message;
      }
      
      setStepStatuses(prev => prev.map((s, idx) => idx === i ? (success ? 'success' : 'failure') : s));
      setStepOutputs(prev => prev.map((o, idx) => idx === i ? output : o));

      if (!success) {
        setDebugMessage('🔴 Fallo detectado. Pidiendo a la IA un plan de corrección...');
        const debugContext: DebugContext = {
          originalTask: task,
          failedPlan: plan,
          failedStepIndex: i,
          errorOutput: output,
        };
        const correctedPlan = await generateCorrectionPlan(debugContext, []);
        setPlan(correctedPlan);
        setStepStatuses(Array(correctedPlan.plan.length).fill('pending'));
        setStepOutputs(Array(correctedPlan.plan.length).fill(null));
        setDebugMessage('🟢 Nuevo plan generado. Revísalo y ejecuta de nuevo.');
        setIsExecuting(false);
        setAiStatus('idle');
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
                      <Text>[{step.type.toUpperCase()}] </Text>
                      <Text>{step.description}</Text>
                    </Box>
                    {stepOutputs[index] && (
                        // 3. Envolvemos la salida en un Box para un mejor control del renderizado
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