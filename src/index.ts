#!/usr/bin/env node

// Ruta: /src/index.ts
// Versión: 2.0

import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';

// Ya no usamos Commander aquí. La lógica se moverá dentro de la UI.

// La función render de Ink toma un componente de React y lo renderiza en la terminal.
// Esto inicia nuestra aplicación interactiva a pantalla completa.
render(React.createElement(App));