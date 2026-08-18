# ⚡ IFFIKIRA_SYS — Next-Gen AI Assistant & Windows System Controller

<div align="center">

![IFFIKIRA Banner](https://img.shields.io/badge/IFFIKIRA--SYS-v2.0-blueviolet?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Gemini 3.0](https://img.shields.io/badge/Google_Gemini-3.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

</div>

---

## 📌 Overview

**IFFIKIRA_SYS** is an advanced, multimodal AI assistant designed for Windows OS automation, real-time voice interaction, visual understanding, and interactive personality modes. 

Powered by **Google Gemini 3 Flash** and a custom **Python Local Bridge**, IFFIKIRA can execute native Windows system commands, control media and volume, send WhatsApp messages, inspect uploaded images/camera feeds, speak using AI voice synthesis, and maintain persistent conversation memory across restarts.

---

## ✨ Features

### 🧠 Multimodal AI Core & Personalities
- **3 Dynamic Personality Modes**:
  - 🤖 **Normal Mode**: Polite, intelligent, helpful personal assistant & partner.
  - 🔥 **Roast Mode**: Savage, witty, Indian female persona using Hinglish slang.
  - ❤️ **Lovely Mode**: Romantic, caring, girlfriend persona.
- 👁️ **Vision & Image Understanding**: Analyzes screenshots, images, and live camera frames in real time.
- 🎙️ **Voice & Speech Synthesis (TTS)**: Built-in Text-to-Speech output powered by Gemini voice model (`Kore`).
- 💾 **Persistent Memory Storage**: Full conversation history saved to disk (`memory.json`) and restored automatically across system reboots.

### 💻 Windows OS System Automation (Python Bridge)
- 🔊 **Volume Control**: Increase, decrease, set specific level, or mute system audio.
- ☀️ **Brightness Control**: Adjust screen brightness dynamically.
- 🚀 **App Launcher & Smart Website Opener**: Launch apps (VS Code, Chrome, Spotify, Notepad, Calculator, Discord, Telegram, etc.) or open web services.
- 💬 **WhatsApp Automation**: Send pre-filled WhatsApp messages to contacts automatically.
- 📺 **YouTube Search & Playback**: Instantly search videos and play media on YouTube.
- 📸 **Screen Capture**: Take automated screenshots and view output instantly.
- ⌨️ **Keystroke Simulation**: Automated typing and shortcut execution via PyAutoGUI.

### 🖥️ Hacker-Aesthetic Cyberpunk UI
- Interactive Matrix digital rain canvas visualizer.
- System metrics overlay displaying IP address, platform, uptime, and Python bridge connection status.
- Live audio visualizer and responsive glassmorphism UI built with **React 19**, **Vite**, and **TailwindCSS**.

---

## 🏗️ System Architecture

```
                       +-------------------------------+
                       |    React 19 Frontend (Vite)   |
                       |    (Cyberpunk Matrix UI)      |
                       +---------------+---------------+
                                       |
                                       v
                       +---------------+---------------+
                       | Express.js Server (Port 3000) |
                       +-------+---------------+-------+
                               |               |
             +-----------------+               +-----------------+
             |                                                   |
             v                                                   v
+------------+------------------+             +------------------+------------+
|  Google Gemini 3.0 API        |             | Python Local Bridge (Port 5000) |
|  - Text / Chat Generation     |             |  - Flask / PyAutoGUI / SBC      |
|  - Multimodal Vision          |             |  - Native Windows Automation    |
|  - Voice Synthesis (TTS)      |             |  - Apps, Volume, Brightness     |
+-------------------------------+             +---------------------------------+
```

---

## 📁 Project Structure

```
iffikira_sys/
├── .env.example            # Template for environment configuration
├── .gitignore              # Files to exclude from Git tracking
├── IFFIKIRA_SETUP.bat     # 1-Click setup script for dependencies
├── RUN_IFFIKIRA.bat       # 1-Click launcher script for Node + Python
├── index.html              # Main HTML entry point
├── local_bridge.py         # Python Flask server for Windows automation
├── package.json            # Node.js dependencies and scripts
├── server.ts               # Express server with Vite middleware & Gemini API logic
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── src/                    # React frontend application
    ├── App.tsx             # Main React UI layout
    ├── index.css           # Global styles and tailwind directives
    ├── components/         # MatrixBackground, SystemOverlay, Visualizer, etc.
    └── services/           # Gemini API, Live Service, Command Handlers
```

---

## 🚫 Files NOT to Upload to GitHub (`.gitignore`)

When publishing this repository to GitHub, **never upload sensitive or auto-generated files**. 

The following items are configured in `.gitignore` and **MUST NOT** be committed to GitHub:

| File / Folder | Why It Must NOT Be Uploaded |
| :--- | :--- |
| **`.env`** | ❌ **CRITICAL SECURITY RISK**: Contains your private `GEMINI_API_KEY`. Uploading this leaks your secret key. |
| **`node_modules/`** | ❌ Large folder containing thousands of installed packages (installed via `npm install`). |
| **`screenshots/`** | ❌ Temporary folder containing screen captures created during runtime. |
| **`memory.json`** | ❌ Contains personal chat history and local runtime logs. |
| **`dist/` / `build/`** | ❌ Compiled build artifacts generated at publish time. |
| **`__pycache__/` / `*.pyc`** | ❌ Python bytecode cache files. |

> [!IMPORTANT]
> Always keep `.env.example` committed to GitHub as a template so users know what environment variables to set up!

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+)
- **Python 3.x** (with "Add Python to PATH" checked during installation)
- **Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/app/apikey))

---

### ⚡ Method 1: Automatic 1-Click Setup (Windows)

1. **Run Setup**: Double-click **`IFFIKIRA_SETUP.bat`**. This installs all Node.js and Python dependencies and generates your `.env` file.
2. **Add API Key**: Open `.env` in Notepad and paste your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
   NODE_ENV=development
   ```
3. **Launch**: Double-click **`RUN_IFFIKIRA.bat`**.
4. **Open App**: Visit `http://localhost:3000` in your browser.

---

### 🛠️ Method 2: Manual Terminal Setup

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

2. **Install Python dependencies**:
   ```bash
   python -m pip install flask flask-cors pyautogui screen-brightness-control
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=development
   ```

4. **Start Node Server**:
   ```bash
   npm run dev
   ```

5. **Start Python Local Bridge (in a new terminal)**:
   ```bash
   python local_bridge.py
   ```

6. **Access App**: Navigate to `http://localhost:3000`.

---

## 🎮 Windows Automation Commands

Through natural voice or chat commands, IFFIKIRA can execute the following system actions:

| Action | Example Command / Prompt |
| :--- | :--- |
| **Volume Control** | *"Increase volume by 20"*, *"Set volume to 50"*, *"Mute audio"* |
| **Brightness** | *"Set brightness to 80"* |
| **Launch Apps** | *"Open VS Code"*, *"Open Chrome"*, *"Launch Spotify"*, *"Open Notepad"* |
| **Close Apps** | *"Close chrome"*, *"Exit notepad"* |
| **YouTube Search** | *"Search YouTube for Alan Walker Faded"* |
| **WhatsApp Message** | *"Send WhatsApp message to John | Hey, let's meet tomorrow"* |
| **Screenshot** | *"Take a screenshot"* |
| **Typing** | *"Type Hello World into the active window"* |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
