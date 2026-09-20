# AIR — Asistente Inteligente de Reuniones 🦉

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue.svg)](https://luis28lh.github.io/asistente-reuniones/)
[![Status](https://img.shields.io/badge/Status-Producci%C3%B3n%20Listo-success.svg)]()
[![Responsive](https://img.shields.io/badge/Mobile-100%25%20Responsive-orange.svg)]()

> **Sistema inteligente de transcripción, síntesis ejecutiva, extracción de compromisos y generación de minutas formales de reuniones de trabajo.**

Acceso web en vivo directo (sin instalar nada, accesible desde teléfono o PC):  
👉 **[https://luis28lh.github.io/asistente-reuniones/](https://luis28lh.github.io/asistente-reuniones/)**

---

## 📱 ¿Qué es AIR?

AIR es una solución web integral diseñada para equipos directivos, gerentes de proyectos y líderes de comités que necesitan transformar el audio de sus reuniones en acuerdos claros y accionables en cuestión de segundos.

### 🌟 Características Principales

1. **Captura y Carga de Audio Dual**:
   - Grabación en vivo mediante el micrófono del dispositivo con visualización de onda sonora en tiempo real.
   - Carga de archivos de audio pregrabados (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`, `.aac`).
   - Botón de demostración rápida para pruebas inmediatas con el caso benchmark oficial (Nova Caribe).

2. **Síntesis Ejecutiva Estructurada**:
   - **Metadatos completos**: Fecha, hora, participantes, facilitador y objetivo.
   - **Resumen ejecutivo**: Conclusiones clave y decisiones estratégicas.
   - **Estructura metodológica**: Riesgos identificados, Acuerdos vinculantes y Puntos pendientes.

3. **Matriz de Compromisos & Responsables**:
   - Lista interactiva de tareas con casillas de verificación (checkboxes).
   - Asignación explícita de responsable (`@nombre`) y fecha límite.
   - Contador dinámico de progreso en tiempo real.

4. **Copiloto / Chat de Sesión**:
   - Asistente conversacional contextual que responde preguntas específicas sobre lo conversado en la reunión.

5. **Centro de Ayuda y Tutorial Integrado**:
   - Botón `[? Ayuda y Tutorial]` en la barra superior.
   - Guía paso a paso que explica para qué sirve cada campo y botón, y cómo llenarlo.
   - Chat interactivo de soporte para resolver dudas de navegación.

6. **Exportación Formal a PDF**:
   - Genera una minuta ejecutiva formal con membrete, tabla de compromisos formateada y estructura corporativa mediante `jsPDF` y `AutoTable`.

7. **100% Responsive & Móvil**:
   - Optimizado para pantallas pequeñas (smartphones), tablets y monitores de escritorio.
   - Botones táctiles amplios (≥44px), tipografía legible y controles ergonómicos.
   - Paleta de diseño ejecutiva en tonos grises neutros y sobrios.

---

## 🚀 Despliegue y Acceso

### Opción 1: En la Web (Recomendada para teléfonos)
Simplemente abre en el navegador de tu celular o computadora:  
**https://luis28lh.github.io/asistente-reuniones/**

### Opción 2: Ejecución Local en PC
Para ejecutar en tu computadora en caso de querer desarrollo local:
```bash
# Iniciar el servidor local (usa el puerto 3005 para no colisionar con otros proyectos)
node server.js
```
Luego abre en tu navegador: `http://localhost:3005`

---

## 📁 Estructura del Proyecto

```text
asistente-reuniones/
├── index.html                   # Interfaz de usuario principal responsive
├── css/
│   └── styles.css               # Estilos personalizados y utilidades de scroll/onda
├── js/
│   └── app.js                   # Lógica de audio, síntesis, chat, ayuda y exportación PDF
├── assets/
│   └── icons/
│       └── logo-buho.jpg        # Ícono distintivo del software (búho centinela)
├── GUIA_PASO_A_PASO_USUARIO.md  # Manual completo de uso del sistema
├── server.js                    # Servidor estático Node.js (puerto 3005)
└── README.md                    # Documentación del repositorio
```

---

## 📄 Licencia y Créditos
Desarrollado para optimizar la productividad y seguimiento ejecutivo de reuniones de trabajo.
