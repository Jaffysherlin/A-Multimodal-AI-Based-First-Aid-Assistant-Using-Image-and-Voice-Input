<<<<<<< HEAD
# AidVision - AI First Aid Assistant

AidVision is a research-first emergency assistant that uses a **Multi-Model Intelligence Pipeline** (BERT + MobileNet + Qwen2.5:0.5B) to provide immediate medical guidance through edge-based image and text analysis.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Firebase account](https://console.firebase.google.com/)
- [Ollama](https://ollama.com/) (For local LLM inference)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   # LLM Config (Qwen2.5:0.5B via Ollama - Localhost)
   VITE_LOCAL_AI_URL=http://localhost:11434
   ```

3. **Firebase Setup**
   - Enable **Authentication** (Email/Password).
   - Create a **Firestore Database**.
   - Setup **Firebase Storage** for image uploads.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open the App**
   Visit `http://localhost:5173` in your browser.

## Features

- **Emergency Assessment**: Upload photos of injuries for instant analysis using a Hybrid CNN-MLP-Llama pipeline.
- **AidBot**: Real-time conversational first aid advice powered by Qwen2.5:0.5B (via Ollama).
- **System Diagnostics**: Built-in suite to test local model availability, database permissions, and rPPG signal quality.
- **Health Profile**: Store medical conditions, allergies, and emergency contacts.
- **Incident History**: Keep track of all previous medical assessments and guidance steps.
- **Training Guides**: Interactive guides for CPR, bleeding, burns, and more.
=======
# A-Multimodal-AI-Based-First-Aid-Assistant-Using-Image-and-Voice-Input
>>>>>>> f5e9f4bc6a339055a7581c6b179fe8170d6688b6
