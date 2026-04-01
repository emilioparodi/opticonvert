# OptiConvert

**OptiConvert** is a high-performance desktop utility designed to batch convert and optimize images to modern formats like **WebP** and **AVIF**. Built for speed and simplicity, it brings professional-grade image processing to your desktop.

---

## Technologies

This project leverages a modern tech stack to ensure performance, security, and a native desktop experience:

* **[Angular](https://angular.io/)**: The core framework used for building the reactive and modern user interface.
* **[Electron](https://www.electronjs.org/)**: The bridge that allows the application to run as a native desktop executable on macOS, Windows, and Linux.
* **[Sharp](https://sharp.pixelplumbing.com/)**: A high-speed Node.js module used for the heavy lifting of image conversion and compression.
* **[Tailwind CSS](https://tailwindcss.com/)**: Used for the sleek, glassmorphism-inspired UI design.

---

## Features

* **Batch Processing**: Select multiple images at once and convert them in a single click.
* **Smart Saving**: Choose a destination folder once for multiple files, or a specific location for single conversions.
* **Format Control**: Support for WebP and AVIF with granular quality adjustment.
* **Modern UI**: Native window effects (Vibrancy on macOS), Dark/Light mode support, and drag-and-drop functionality.

---

## Development & AI Optimization

This application was developed and optimized using **Google AI Studio** powered by **Gemini 3 Flash**. 

The collaboration with Gemini allowed for:
* **Code Optimization**: Fine-tuning the IPC (Inter-Process Communication) between Angular and Electron.
* **Architecture Design**: Implementing a zero-footprint personalization and efficient batch logic.
* **UI/UX Refinement**: Crafting a responsive and accessible interface.

---

## Installation & Build

### Prerequisites
* Node.js (LTS recommended)
* npm

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install