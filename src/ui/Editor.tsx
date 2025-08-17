// Ruta: src/ui/Editor.tsx
// Versión: 1.1 (Ignora la tecla Tab para permitir el cambio de panel)

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface Cursor {
  row: number;
  col: number;
}

interface EditorProps {
  initialContent: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}

export function Editor({ initialContent, onSave, onCancel }: EditorProps) {
  const [lines, setLines] = useState(initialContent.split('\n'));
  const [cursor, setCursor] = useState<Cursor>({ row: 0, col: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  const visibleHeight = process.stdout.rows > 10 ? process.stdout.rows - 12 : 8;

  useEffect(() => {
    if (cursor.row < scrollTop) {
      setScrollTop(cursor.row);
    } else if (cursor.row >= scrollTop + visibleHeight) {
      setScrollTop(cursor.row - visibleHeight + 1);
    }
  }, [cursor.row, scrollTop, visibleHeight]);


  useInput((input, key) => {
    // --- Guardar y Cancelar ---
    if (key.ctrl && input === 's') {
      onSave(lines.join('\n'));
      return;
    }
    if (key.escape) {
      onCancel();
      return;
    }
    
    // --- INICIO DE LA CORRECCIÓN ---
    // Si se presiona Tab, no hacemos nada y dejamos que el evento se propague.
    // Ink procesará el siguiente hook 'useInput' que encuentre (el de App.tsx).
    if (key.tab) {
        return;
    }
    // --- FIN DE LA CORRECCIÓN ---

    const newLines = [...lines];

    // --- Movimiento del Cursor ---
    if (key.upArrow) {
      setCursor(c => ({ ...c, row: Math.max(0, c.row - 1) }));
      return;
    }
    if (key.downArrow) {
      setCursor(c => ({ ...c, row: Math.min(newLines.length - 1, c.row + 1) }));
      return;
    }
    if (key.leftArrow) {
      setCursor(c => ({ ...c, col: Math.max(0, c.col - 1) }));
      return;
    }
    if (key.rightArrow) {
      const currentLine = newLines[cursor.row] || '';
      setCursor(c => ({ ...c, col: Math.min(currentLine.length, c.col + 1) }));
      return;
    }

    const currentLine = newLines[cursor.row] || '';
    const clampedCol = Math.min(cursor.col, currentLine.length);

    // --- Lógica de Edición ---
    if (key.return) { // Enter
      const lineStart = currentLine.substring(0, clampedCol);
      const lineEnd = currentLine.substring(clampedCol);
      newLines[cursor.row] = lineStart;
      newLines.splice(cursor.row + 1, 0, lineEnd);
      setLines(newLines);
      setCursor({ row: cursor.row + 1, col: 0 });
    } else if (key.backspace || key.delete) { // Backspace
      if (clampedCol > 0) {
        const newLine = currentLine.slice(0, clampedCol - 1) + currentLine.slice(clampedCol);
        newLines[cursor.row] = newLine;
        setLines(newLines);
        setCursor(c => ({ ...c, col: c.col - 1 }));
      } else if (cursor.row > 0) {
        const prevLine = newLines[cursor.row - 1];
        const newCol = prevLine.length;
        newLines[cursor.row - 1] = prevLine + currentLine;
        newLines.splice(cursor.row, 1);
        setLines(newLines);
        setCursor({ row: cursor.row - 1, col: newCol });
      }
    } else if (input && !key.ctrl) { // Evitamos caracteres de control
      const newLine = currentLine.slice(0, clampedCol) + input + currentLine.slice(clampedCol);
      newLines[cursor.row] = newLine;
      setLines(newLines);
      setCursor(c => ({ ...c, col: clampedCol + input.length }));
    }
  });

  const visibleLines = lines.slice(scrollTop, scrollTop + visibleHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box paddingX={1} borderStyle="round" borderColor="cyan" flexDirection="column">
        <Text bold>Modo Edición</Text>
        {visibleLines.map((line, index) => {
          const absoluteIndex = scrollTop + index;
          const isCursorLine = absoluteIndex === cursor.row;
          const clampedCol = Math.min(cursor.col, line.length);

          if (!isCursorLine) {
            return <Text key={absoluteIndex}>{line || ' '}</Text>;
          }

          const lineStart = line.substring(0, clampedCol);
          const cursorChar = line.substring(clampedCol, clampedCol + 1) || ' ';
          const lineEnd = line.substring(clampedCol + 1);

          return (
            <Text key={absoluteIndex}>
              {lineStart}
              <Text backgroundColor="white" color="black">{cursorChar}</Text>
              {lineEnd}
            </Text>
          );
        })}
      </Box>
      <Box justifyContent="space-around" marginTop={1}>
        <Text bold color="green">[Ctrl+S] Guardar</Text>
        <Text bold color="red">[Esc] Cancelar</Text>
      </Box>
    </Box>
  );
}