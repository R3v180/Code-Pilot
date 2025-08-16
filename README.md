<div align="center">
  <h1>✈️ Code-Pilot</h1>
  <p><strong>Un entorno de desarrollo conversacional de nueva generación, dentro de tu terminal.</strong></p>
  <p>Code-Pilot actúa como un arquitecto de software y un programador junior autónomo, permitiéndote crear, modificar y validar proyectos complejos usando solo lenguaje natural.</p>
</div>

<p align="center">
  <img src="https://github.com/R3v180/Code-Pilot/blob/main/assets/demo.gif?raw=true" alt="Demostración de Code-Pilot en acción" />
  <em>(Nota: Crearemos y subiremos este GIF de demostración más adelante)</em>
</p>

---

## ✨ Características Clave

| Característica                             | Descripción                                                                                                                           |
| :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Interfaz de Terminal (TUI) Interactiva** | Todo sucede en una única interfaz fluida, sin necesidad de salir de la terminal.                                                      |
| **Contexto Inteligente**                   | Selecciona archivos y directorios para dar a la IA el contexto exacto que necesita.                                                   |
| **Agente Autónomo (En Desarrollo)**        | Capaz de abordar tareas de alto nivel, desde la creación de un proyecto desde cero hasta la implementación de nuevas funcionalidades. |
| **Seguro por Defecto**                     | Ningún cambio se aplica a tu código sin tu revisión y aprobación explícita en el panel de "staging".                                  |
| **Potenciado por Gemini**                  | Utiliza los modelos de IA más avanzados de Google para un razonamiento y una generación de código de alta calidad.                    |

---

## ⚙️ Instalación y Uso

**Prerrequisitos:**

- [Node.js](https://nodejs.org/) (v20.10.0 o superior recomendado)
- [pnpm](https://pnpm.io/installation)

### **Pasos de Instalación**

Primero, clona el repositorio en tu máquina y navega dentro del nuevo directorio:
`git clone https://github.com/R3v180/Code-Pilot.git`
`cd Code-Pilot`

Luego, instala todas las dependencias, compila el proyecto y enlaza el comando global `pilot`:
`pnpm install`
`pnpm build`
`pnpm link --global`

### **Configuración de la API**

Code-Pilot necesita una clave de la API de Google AI para funcionar.

Para empezar, crea tu archivo `.env` personal a partir de la plantilla.

- **En Linux o macOS:**
  `cp .env.example .env`

- **En Windows (Command Prompt o PowerShell):**
  `copy .env.example .env`

A continuación, abre el archivo `.env` que acabas de crear con tu editor de texto favorito y añade tu clave de API. El contenido debe ser:
`GEMINI_API_KEY="AIzaSy...TU_API_KEY_REAL_AQUI"`

> **Nota:** Esta funcionalidad se moverá a una pantalla de configuración dentro de la aplicación en el futuro.

### **¡A Volar!**

Una vez instalado y configurado, simplemente ejecuta el siguiente comando en tu terminal para iniciar la sesión interactiva:
`pilot`

---

## 🧭 Hoja de Ruta del Proyecto

¡El futuro es emocionante! Aquí puedes ver en qué estamos trabajando.

| Fase  | Hito                                                                               |     Estado      |
| :---- | :--------------------------------------------------------------------------------- | :-------------: |
| **0** | **MVP Inicial** (CLI no interactiva, comandos `explain` y `refactor`)              |  ✅ Completado  |
| **1** | **TUI Interactiva** (Paneles de Explorador, Chat y Staging funcionales)            |  ✅ Completado  |
| **2** | **UI Intuitiva y Memoria** (StatusBar, selección mejorada, memoria conversacional) | ⏳ En Progreso  |
| **3** | **Agente Autónomo** (Creación de proyectos, ejecución de tests, autocorrección)    | ▶️ Próximamente |

¡Toda contribución y sugerencia es bienvenida! Si tienes una idea, abre un "Issue" en el repositorio.
