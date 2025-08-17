// Ruta: src/ui/ConfigManager.tsx
// Versión: 2.3.1 (Corrige error de sintaxis de Ink en el mensaje de error)

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import {
  getAllApiKeys,
  addApiKey,
  removeApiKey,
  setActiveApiKeyIndex,
  ApiKeyProfile,
  getActiveApiKey,
} from '../utils/config.js';
import { validateApiKey } from '../services/gemini.js';
import TextInput from 'ink-text-input';

type Mode = 'list' | 'add' | 'confirm_delete';
type FormFocus = 'alias' | 'key';

interface ConfigManagerProps {
  onClose: () => void;
}

export const ConfigManager = ({ onClose }: ConfigManagerProps) => {
  const [profiles, setProfiles] = useState<ApiKeyProfile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('list');
  
  const [formState, setFormState] = useState({ alias: '', key: '' });
  const [formFocus, setFormFocus] = useState<FormFocus>('alias');
  const [formError, setFormError] = useState('');

  const refreshProfiles = () => {
    setProfiles(getAllApiKeys());
    setActiveKey(getActiveApiKey());
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const handleAddProfile = async () => {
    if (!formState.alias.trim() || !formState.key.trim()) {
      setFormError('Ambos campos son obligatorios.');
      return;
    }
    setFormError('Validando clave...');
    const { isValid, error } = await validateApiKey(formState.key.trim());
    if (isValid) {
      addApiKey({ alias: formState.alias.trim(), key: formState.key.trim() });
      refreshProfiles();
      setMode('list');
      setFormState({ alias: '', key: '' });
      setFormError('');
    } else {
      setFormError(error || 'Clave inválida.');
    }
  };

  const handleFormInputChange = (value: string) => {
    setFormState(prev => ({ ...prev, [formFocus]: value }));
  };

  useInput(
    (input, key) => {
      if (mode === 'list') {
        if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
        if (key.downArrow) setSelectedIndex(i => Math.min(profiles.length - 1, i + 1));
        if (input === 'a') {
            setFormFocus('alias');
            setMode('add');
        }
        if (input === 'd' && profiles.length > 0) setMode('confirm_delete');
        if (key.return && profiles.length > 0) {
          setActiveApiKeyIndex(selectedIndex);
          onClose();
        }
        if (input === 'q' || key.escape) onClose();
      } else if (mode === 'add') {
        if (key.escape) {
          setMode('list');
          setFormError('');
          setFormState({ alias: '', key: '' });
        }
        if (key.upArrow) setFormFocus('alias');
        if (key.downArrow) setFormFocus('key');
        if (key.tab) setFormFocus(current => current === 'alias' ? 'key' : 'alias');
      } else if (mode === 'confirm_delete') {
        if (input === 'y') {
          removeApiKey(selectedIndex);
          refreshProfiles();
          setSelectedIndex(0);
          setMode('list');
        }
        if (input === 'n' || key.escape) setMode('list');
      }
    }
  );
  
  if (mode === 'add') {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round">
        <Text bold>Añadir Nueva API Key</Text>
        
        <Box marginTop={1} borderStyle="round" paddingX={1} borderColor={formFocus === 'alias' ? 'cyan' : 'gray'}>
          <Text>Alias: </Text>
          {formFocus === 'alias' ? (
            <TextInput value={formState.alias} onChange={handleFormInputChange} onSubmit={() => setFormFocus('key')} />
          ) : (
            <Text>{formState.alias}</Text>
          )}
        </Box>
        
        <Box borderStyle="round" paddingX={1} borderColor={formFocus === 'key' ? 'cyan' : 'gray'} marginTop={1}>
          <Text>Key:   </Text>
          {formFocus === 'key' ? (
            <TextInput value={formState.key} onChange={handleFormInputChange} mask="*" onSubmit={handleAddProfile} />
          ) : (
            <Text>{'*'.repeat(formState.key.length)}</Text>
          )}
        </Box>

        {/* --- INICIO DE LA CORRECCIÓN --- */}
        {formError && (
          <Box marginTop={1}>
            <Text color="yellow">{formError}</Text>
          </Box>
        )}
        {/* --- FIN DE LA CORRECCIÓN --- */}
        
        <Box marginTop={1}>
            <Text color="gray">[↑/↓] Cambiar Campo | [Enter] para Siguiente/Guardar | [Esc] para Cancelar</Text>
        </Box>
      </Box>
    );
  }
  
  if (mode === 'confirm_delete') {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round" borderColor="red">
        <Text bold color="red">¿Estás seguro de que quieres eliminar "{profiles[selectedIndex]?.alias}"?</Text>
        <Text>[Y] Sí / [N] No</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round">
      <Text bold underline>Gestor de API Keys</Text>
      <Box flexDirection="column" marginTop={1}>
        {profiles.map((profile, index) => {
          const isActive = profile.key === activeKey;
          const isSelected = selectedIndex === index;
          let textColor: "cyan" | "white" | "green" = "white";
          if (isActive) textColor = "green";
          if (isSelected) textColor = "cyan";

          return (
            <Text key={index} color={textColor} bold={isActive}>
              {isSelected ? '> ' : '  '}
              {profile.alias}
              {isActive ? ' (Activa)' : ''}
            </Text>
          );
        })}
        {profiles.length === 0 && <Text color="gray">No hay ninguna API Key guardada.</Text>}
      </Box>
      <Box marginTop={1} borderStyle="single" paddingX={1}>
        <Text color="gray">[↑/↓] Navegar | [Enter] Seleccionar | [A]ñadir | [D] borrar | [Q] Salir/Cancelar</Text>
      </Box>
    </Box>
  );
};