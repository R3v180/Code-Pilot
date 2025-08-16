// Ruta: /code-pilot/src/commands/explain.ts
// Versión: 1.1

import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { explainCode } from '../services/gemini.js';

// Creamos un comando específico para 'explain'
export const explainCommand = new Command('explain')
  .description('Explica un fragmento de código de un archivo específico.')
  .argument('<filepath>', 'Ruta al archivo que se desea explicar.')
  .action(async (filepath: string) => {
    console.log(chalk.blue.bold('Code-Pilot: Analizando tu código...'));

    try {
      const absolutePath = path.resolve(process.cwd(), filepath);
      await fs.access(absolutePath);

      const fileContent = await fs.readFile(absolutePath, 'utf-8');

      if (!fileContent.trim()) {
        console.error(chalk.yellow('El archivo está vacío. No hay nada que explicar.'));
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Archivo leído correctamente.'));
      console.log(chalk.blue('✓ Contactando a la IA de Gemini para obtener una explicación...'));

      const explanation = await explainCode(fileContent);

      console.log(chalk.cyan.bold('\n--- Explicación de Gemini ---'));
      // Imprimimos la respuesta directamente, ya que viene formateada en Markdown.
      console.log(explanation);
      console.log(chalk.cyan.bold('--- Fin de la Explicación ---\n'));

    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          console.error(chalk.red.bold(`Error: El archivo no se encontró en la ruta: ${filepath}`));
      } else {
          console.error(chalk.red.bold('Ha ocurrido un error inesperado:'), error);
      }
      process.exit(1);
    }
  });