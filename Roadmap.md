# **Hoja de Ruta Maestra: Super Code-Pilot**

## **Visión del Producto**

Crear un entorno de desarrollo conversacional de nueva generación, que opera dentro de la terminal (TUI). Code-Pilot actuará como un arquitecto de software y un programador junior autónomo, capaz de entender, crear, modificar y validar proyectos de software complejos basándose en instrucciones en lenguaje natural.

## **Principios Fundamentales**

1.  **Local-First:** El código del usuario nunca abandona su máquina. La herramienta opera directamente sobre el sistema de archivos local.
2.  **Interfaz Intuitiva:** El usuario siempre debe saber dónde está, qué puede hacer y cuál es el estado del sistema. El control por teclado es prioritario.
3.  **Seguro por Defecto:** Ninguna acción destructiva (escritura de archivos) se realiza sin la confirmación explícita del usuario (excepto en "Modo Auto" previamente aprobado).
4.  **Agente Autónomo:** El objetivo final es un agente que pueda operar de forma independiente en un ciclo de "Planificar -> Ejecutar -> Verificar -> Corregir".

---

## **Fase 1: La Interfaz de Usuario Intuitiva (UX/UI Core)**

**Objetivo:** Construir una TUI robusta, escalable y fácil de usar que sirva como base para todas las funcionalidades futuras.

- **Hito 1.1: La Barra de Estado Dinámica (`StatusBar`)**

  - **Función:** Añadir una barra inferior persistente que muestre dinámicamente:
    - **Estado de la IA:** `Listo`, `Pensando...`, `Ejecutando Test...`
    - **Contexto Actual:** Nº de archivos seleccionados y cambios propuestos.
    - **Ayuda Contextual:** Comandos de teclado relevantes para el panel activo.

- **Hito 1.2: El Explorador de Archivos Mejorado (`FileExplorer`)**

  - **Función:**
    - **Selección Masiva:** `Espacio` en directorios para seleccionar/deseleccionar todos sus hijos. `Ctrl+A` para seleccionar/deseleccionar todos los archivos.
    - **Iconografía:** Usar iconos Unicode (`📁`, `📄`, `✅`, `⬜`) para mejorar la legibilidad.
  - **Usabilidad:** Debe soportar **scroll** (`↑/↓`, `PageUp/Down`, `Home/End`) para proyectos con muchos archivos.

- **Hito 1.3: El Chat Elocuente (`ChatPanel`)**

  - **Función:**
    - **Renderizado de Markdown:** Formatear las respuestas de la IA para una legibilidad superior (títulos, listas, bloques de código con fondo).
  - **Usabilidad:** Debe soportar **scroll** para conversaciones largas.

- **Hito 1.4: El Panel de Staging Interactivo (`StagingPanel`)**
  - **Función:**
    - **Inspección de Diff:** Mostrar un `diff` detallado del cambio seleccionado.
    - **Menú de Acciones:** Permitir `Aplicar` o `Descartar` cambios a través de un menú interactivo (`Enter` -> `←/→` -> `Enter`).
  - **Usabilidad:** La vista de `diff` debe soportar **scroll**.

---

## **Fase 2: El Cerebro Persistente (Memoria y Configuración)**

**Objetivo:** Dotar a la IA de memoria y permitir al usuario configurar la herramienta.

- **Hito 2.1: Memoria Conversacional**

  - **Función:** El agente recordará los últimos N mensajes de la conversación actual, enviándolos como contexto en las nuevas peticiones para mantener la coherencia.

- **Hito 2.2: Pantalla de Configuración**
  - **Función:** Una nueva vista en la TUI donde el usuario puede:
    1.  **Gestionar Clave API:** Introducir y guardar su clave de la API de Google AI en un archivo de configuración local (`~/.config/codepilot/config.json`).
    2.  **Selección de Modelo:** Obtener una lista de los modelos de Gemini disponibles para su clave y permitirle seleccionar cuál usar para las tareas.

---

## **Fase 3: El Agente Autónomo (El Ciclo "Crear, Probar, Corregir")**

**Objetivo:** Implementar el "Modo Auto" para la creación y modificación de proyectos de forma autónoma.

- **Hito 3.1: Herramientas del Agente (`executor` y `workspace`)**

  - **Función:** Crear los módulos base para la autonomía:
    1.  `executor.ts`: Para ejecutar comandos de terminal (`pnpm install`, `git`, etc.) y capturar su salida.
    2.  `workspace.ts`: Para que la IA pueda leer y escribir archivos de forma segura en el proyecto.

- **Hito 3.2: El Lanzador de Proyectos (`WelcomeScreen`)**

  - **Función:** Una pantalla de bienvenida al iniciar `pilot` que permita:
    1.  `Crear un nuevo proyecto`: Pide un nombre, una ubicación (con un navegador de directorios TUI) y una descripción.
    2.  `Abrir un proyecto existente`: Abre el explorador de archivos en un directorio seleccionado.

- **Hito 3.3: El Bucle de Autocorrección (El "Modo Auto")**

  - **Función:** Implementar el ciclo completo:
    1.  La IA recibe una tarea de alto nivel y genera un plan JSON.
    2.  El agente ejecuta cada paso del plan.
    3.  Tras cada paso relevante (ej. escritura de código), ejecuta un comando de verificación (ej. `pnpm build` o `pnpm test`).
    4.  Si la verificación falla, captura el error y se lo reenvía a la IA con un prompt de "debugging", pidiéndole que genere una corrección.
    5.  El bucle se repite hasta que todas las verificaciones pasen o se alcance un límite de intentos.

- **Hito 3.4: Edición Manual de Cambios (Post-MVP)**
  - **Función:** Permitir al usuario editar manualmente el código propuesto por la IA en el `StagingPanel` antes de aplicarlo.
