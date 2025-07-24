# 🏃‍♂️ Dia Game

## 📋 Table of Contents
- [📖 About](#-about)
- [🚀 Getting Started](#-getting-started)
- [🔨 How to Build / How to Run](#-how-to-build--how-to-run)
- [🏗️ Project Structure](#️-project-structure)
- [🎯 Features](#-features)
- [🐳 Docker Deployment](#-docker-deployment)
- [🤖 CI/CD](#-cicd)
- [📄 License](#-license)

## 📖 About
Dia is an interactive mobile-friendly game featuring character movement and collectible items. It's a Progressive Web App (PWA) built with vanilla JavaScript, featuring an Express.js server for deployment. Players control a character that can move around the game area and collect items while managing their score.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm package manager
- Modern web browser

### 📦 Installation
```bash
git clone <repository-url>
cd dia
npm install
🔨 How to Build / How to Run
Development Mode
bash# Start the development server
node server.js
The game will be available at http://localhost:3000
Production Mode
bash# Install dependencies
npm install

# Start the server
node server.js
🏗️ Project Structure
dia/
├── index.html          # Main game HTML with header and game container
├── main.js             # Game logic, character movement, and scoring
├── styles.js           # Dynamic styling and responsive design
├── server.js           # Express server configuration
├── manifest.json       # PWA manifest for installability
├── service-worker.js   # Service worker for offline functionality
├── dockerfile          # Docker configuration
├── package.json        # Dependencies and project metadata
├── .gitignore          # Git ignore patterns
└── .github/workflows/  # CI/CD workflows
    └── main.yml        # Docker build and push workflow
🎯 Features

Interactive Gameplay: Character movement with emoji-based graphics
Score System: Real-time score tracking
Mobile-Friendly: Touch controls and responsive design
Progressive Web App: Installable on mobile devices
Offline Support: Works without internet connection
Virtual Controller: On-screen joystick for mobile devices

🐳 Docker Deployment
Build Docker Image
bashdocker build -t dia:latest .
Run Container
bashdocker run -p 3000:3000 dia:latest
Docker Hub Deployment
The project includes automated Docker Hub deployment via GitHub Actions.
🤖 CI/CD

GitHub Actions: Automated Docker image builds
Manual Triggers: Workflow dispatch for controlled deployments
Docker Hub Integration: Automatic image pushing

📄 License
MIT License - see LICENSE file for details.
