# Code-Pilot piloting_airplane

**Code-Pilot es un entorno de desarrollo conversacional de nueva generación que opera dentro de tu terminal. Actúa como un arquitecto de software y un programador junior autónomo, permitiéndote crear, modificar y validar proyectos complejos usando solo lenguaje natural.**

![Demostración de Code-Pilot](https://github.com/R3v180/Code-Pilot/blob/main/assets/demo.gif?raw=true)
_(Nota: Crearemos y subiremos este GIF de demostración más adelante)_

---

## :rocket: Visión del Proyecto

La misión de Code-Pilot es fusionar el poder de los modelos de IA avanzados con el flujo de trabajo eficiente y centrado en el teclado de la terminal. En lugar de ser un simple autocompletado, Code-Pilot es un agente activo que puede:

- **Planificar** tareas de desarrollo complejas.
- **Ejecutar** modificaciones en múltiples archivos.
- **Verificar** su propio trabajo ejecutando compiladores y tests.
- **Autocorregirse** basándose en los errores encontrados.

## :sparkles: Características Clave

- **Interfaz de Terminal (TUI) Interactiva:** Todo sucede en una única interfaz fluida, sin necesidad de salir de la terminal.
- **Contexto Inteligente:** Selecciona archivos y directorios para dar a la IA el contexto exacto que necesita para cada tarea.
- **Agente Autónomo (En Desarrollo):** Capaz de abordar tareas de alto nivel, desde la creación de un proyecto desde cero hasta la implementación de nuevas funcionalidades.
- **Seguro por Defecto:** Ningún cambio se aplica a tu código sin tu revisión y aprobación explícita en el panel de "staging".
- **Potenciado por Gemini:** Utiliza los modelos de IA más avanzados de Google para un razonamiento y una generación de código de alta calidad.

## :gear: Instalación y Uso

**Prerrequisitos:**

- [Node.js](https://nodejs.org/) (v20.10.0 o superior recomendado)
- [pnpm](https://pnpm.io/installation)

**Instalación:**

```bash
# Clona el repositorio
git clone https://github.com/R3v180/Code-Pilot.git

# Entra en el directorio
cd Code-Pilot

# Instala las dependencias
pnpm install

# Compila el proyecto
pnpm build

# Enlaza el comando 'pilot' globalmente
pnpm link --global
```
