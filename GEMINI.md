# Gemini Project Context: WHOOP Intelligence Dashboard

## 🚀 Project Overview
A high-performance health intelligence application that visualizes **WHOOP API v2** data and provides an **AI Performance Coach** powered by **Google Gemini 2.0 Flash**.

### Core Features
- **Elite Dashboard:** Interactive cards for Recovery, Strain, and Sleep with 14-day trend visualizations.
- **AI Performance Coach:** A persistent right-side chat panel that analyzes your physiological data to provide sports-science recommendations.
- **Stable UX:** A "Detailed Insights Panel" that opens below the main grid, keeping the primary UI fixed and grounded.
- **Full API Integration:** Uses `read:profile`, `read:recovery`, `read:cycles`, `read:workout`, `read:sleep`, and `read:body_measurement`.

## 🛠️ Tech Stack & Architecture
- **Frontend:** React 18, Vite, TypeScript, Recharts (Area, Bar, and Pie charts).
- **Backend:** Node.js, Express, Google Generative AI SDK (@google/generative-ai).
- **Auth:** OAuth 2.0 Authorization Code Flow with `localStorage` token persistence.
- **AI Model:** `gemini-2.0-flash` (Active and verified for this API key).

## 🏃 Building and Running

### Environment Setup
Ensure your `.env` file contains:
- `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET`
- `GOOGLE_GEMINI_API_KEY`
- `REDIRECT_URI=http://localhost:3002/callback`
- `PORT=3002`

### Commands
- **Backend (Port 3002):** `cd server; npm run dev`
- **Frontend (Port 5173):** `cd client; npm run dev`
- **AI Diagnostics:** `cd server; npm run test:ai` (Checks Gemini connectivity and available models).

## 📐 Development Conventions

### AI Integration
- **Model:** Always use `gemini-2.0-flash`.
- **Context:** Every chat message is pre-pended with a `systemPrompt` containing the user's latest WHOOP metrics (HRV, Strain, Sleep %).
- **History:** Chat history must always start with a `user` role to satisfy the Gemini API contract.

### API Proxying
- Local endpoints at `http://localhost:3002/api/:endpoint` map to WHOOP v2:
  - `profile` -> `/user/profile/basic`
  - `body` -> `/user/measurement/body`
  - `recovery` -> `/recovery`
  - `sleep` -> `/activity/sleep`
  - `cycles` -> `/cycle`
  - `workout` -> `/activity/workout`

### UI/UX Standards
- **Theme:** Dark mode (#080808 background), WHOOP Red highlights (#FF0000).
- **Interactivity:** Clicking Overview cards (Recovery, Strain, Sleep) toggles the `detailed-insights-panel` below the grid.
- **Stability:** The dashboard uses a split-pane flex layout: `main-content` (left) and `chat-sidebar` (right).
