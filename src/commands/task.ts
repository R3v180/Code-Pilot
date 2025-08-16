// Ruta: /code-pilot/src/commands/task.ts
// Versión: 2.0

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs/promises';
import path from 'node:path';
import inquirer from 'inquirer';
import { diffLines } from 'diff';
import { getProjectStructure } from '../utils/file-system.js';
import { generatePlan, refactorCode } from '../services/gemini.js';

interface PlanStep {
  file: string;
  instruction: string;
}

export const taskCommand = new Command('task')
  .description('Ejecuta una tarea de desarrollo compleja basada en una descripción en lenguaje natural.')
  .argument('<task_description>', 'La descripción de la tarea a realizar.')
  .option('--execute', 'Ejecuta el plan propuesto de forma interactiva.')
  .action(async (taskDescription: string, options: { execute?: boolean }) => {
    console.log(chalk.blue.bold('Code-Pilot: Analizando tu solicitud de tarea...'));

    try {
      const projectStructure = await getProjectStructure();
      console.log(chalk.green('✓ Estructura del proyecto analizada.'));
      console.log(chalk.blue('✓ Creando un plan de ejecución con Gemini...'));
      
      const planJson = await generatePlan(taskDescription, projectStructure);
      const planSteps: PlanStep[] = JSON.parse(planJson);

      if (!planSteps || planSteps.length === 0) {
        console.log(chalk.yellow('La IA no ha propuesto ningún plan de acción. Inténtalo de nuevo con una descripción más detallada.'));
        return;
      }
      
      // MODO EJECUCIÓN
      if (options.execute) {
        console.log(chalk.cyan.bold('\n--- Plan de Ejecución a Realizar ---'));
        planSteps.forEach((step, index) => {
          console.log(`${chalk.yellow(`Paso ${index + 1}:`)} Modificar ${chalk.bold(step.file)}`);
          console.log(`   └─ ${chalk.gray(step.instruction)}`);
        });

        const { confirmExecution } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirmExecution',
            message: `El plan modificará ${planSteps.length} archivo(s). ¿Deseas continuar?`,
            default: true,
        }]);

        if (!confirmExecution) {
            console.log(chalk.yellow('Ejecución cancelada por el usuario.'));
            return;
        }

        for (const [index, step] of planSteps.entries()) {
            console.log(chalk.blue.bold(`\n--- Ejecutando Paso ${index + 1}/${planSteps.length}: Modificando ${step.file} ---`));
            
            const absolutePath = path.resolve(process.cwd(), step.file);
            const originalContent = await fs.readFile(absolutePath, 'utf-8');
            
            const refactoredContent = await refactorCode(originalContent, step.instruction);
            
            console.log(chalk.yellow.bold('\n--- Cambios Propuestos ---'));
            diffLines(originalContent, refactoredContent).forEach(part => {
                if (part.added) process.stdout.write(chalk.green('+ ' + part.value));
                else if (part.removed) process.stdout.write(chalk.red('- ' + part.value));
            });
            console.log(chalk.yellow.bold('\n--- Fin de los Cambios ---\n'));

            const { confirmStep } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirmStep',
                message: `¿Aplicar estos cambios a ${chalk.bold(step.file)}?`,
                default: true,
            }]);

            if (confirmStep) {
                await fs.writeFile(absolutePath, refactoredContent);
                console.log(chalk.green.bold('✓ ¡Cambios aplicados con éxito!'));
            } else {
                console.log(chalk.yellow(`Paso cancelado. El archivo ${step.file} no ha sido modificado.`));
            }
        }
        console.log(chalk.green.bold('\n¡Tarea completada!'));
      
      // MODO VISTA PREVIA (por defecto)
      } else {
        console.log(chalk.cyan.bold('\n--- Plan de Ejecución Propuesto ---'));
        planSteps.forEach((step, index) => {
          console.log(`${chalk.yellow(`Paso ${index + 1}:`)} Modificar ${chalk.bold(step.file)}`);
          console.log(`   └─ Instrucción: ${chalk.gray(step.instruction)}`);
        });
        console.log(chalk.cyan.bold('--- Fin del Plan ---\n'));
        console.log(chalk.yellow.bold('NOTA: Esta es una vista previa. Para ejecutar el plan, vuelve a lanzar el comando con el flag --execute'));
      }

    } catch (error) {
      console.error(chalk.red.bold('Ha ocurrido un error inesperado durante la ejecución de la tarea:'), error);
      process.exit(1);
    }
  });