// Ruta: /code-pilot/src/commands/refactor.ts
// Versión: 1.0

import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { diffLines } from 'diff';
import { refactorCode } from '../services/gemini.js'; // <- Crearemos esta función a continuación

export const refactorCommand = new Command('refactor')
  .description('Refactoriza un archivo de código basándose en una instrucción.')
  .argument('<filepath>', 'Ruta al archivo a refactorizar.')
  .requiredOption('-i, --instruction <instruction>', 'Instrucción detallada para la refactorización.')
  .action(async (filepath: string, options: { instruction: string }) => {
    console.log(chalk.blue.bold('Code-Pilot: Iniciando refactorización...'));

    try {
      // 1. Leer el archivo original
      const absolutePath = path.resolve(process.cwd(), filepath);
      await fs.access(absolutePath);
      const originalContent = await fs.readFile(absolutePath, 'utf-8');

      console.log(chalk.green('✓ Archivo original leído correctamente.'));
      console.log(chalk.blue('✓ Enviando instrucción y código a Gemini...'));

      // 2. Obtener el código refactorizado de la IA
      const refactoredContent = await refactorCode(originalContent, options.instruction);

      console.log(chalk.green('✓ Gemini ha propuesto una refactorización.'));

      // 3. Generar y mostrar el diff
      console.log(chalk.yellow.bold('\n--- Cambios Propuestos ---'));
      const differences = diffLines(originalContent, refactoredContent);
      
      differences.forEach(part => {
        if (part.added) {
          process.stdout.write(chalk.green('+ ' + part.value));
        } else if (part.removed) {
          process.stdout.write(chalk.red('- ' + part.value));
        } else {
          process.stdout.write(chalk.gray('  ' + part.value.split('\n').slice(0, 2).join('\n') + '\n  ...'));
        }
      });
      console.log(chalk.yellow.bold('\n--- Fin de los Cambios ---\n'));

      // 4. Pedir confirmación al usuario
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '¿Deseas aplicar estos cambios?',
        default: true,
      }]);

      // 5. Aplicar o descartar los cambios
      if (confirm) {
        await fs.writeFile(absolutePath, refactoredContent);
        console.log(chalk.green.bold('✓ ¡Cambios aplicados con éxito!'));
      } else {
        console.log(chalk.yellow('Operación cancelada. No se ha modificado ningún archivo.'));
      }

    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.error(chalk.red.bold(`Error: El archivo no se encontró en la ruta: ${filepath}`));
      } else {
        console.error(chalk.red.bold('Ha ocurrido un error inesperado:'), error);
      }
      process.exit(1);
    }
  });