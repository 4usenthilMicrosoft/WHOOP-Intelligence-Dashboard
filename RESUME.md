# WHOOP Data Review App - Session Resume

This document contains everything you need to resume development or run the application.

## 🚀 Quick Start

1.  **Backend (Port 3002):**
    ```bash
    cd server
    npm run dev
    ```
2.  **Frontend (Port 5173):**
    ```bash
    cd client
    npm run dev
    ```
3.  **Access:** Open [http://localhost:5173](http://localhost:5173)

## ⚙️ Configuration (WHOOP Developer Dashboard)

- **Redirect URI:** `http://localhost:3002/callback`
- **Scopes Required:** `read:profile`, `read:recovery`, `read:cycles`, `read:workout`, `read:sleep`, `offline`

## 📂 Project Structure

- `server/`: Express backend handling OAuth 2.0 and Proxying WHOOP API v2.
- `client/`: React/Vite frontend with high-performance dashboard.
- `.env`: Contains your Client ID, Client Secret, and port settings.

## 🛠️ Implementation Details

- **Auth Flow:** Authorization Code Flow. The backend redirects to the frontend with the `access_token` in the URL, which the frontend then stores in `localStorage`.
- **API Proxy:** All requests are proxied through the local server to avoid CORS issues and protect your `Client Secret`.
- **Dashboard:** Features `CircularProgress` components and interactive "click-to-expand" cards for:
    - **Recovery:** HRV, RHR, Skin Temp, SpO2.
    - **Strain:** Avg/Max HR, Calories, Active Duration.
    - **Sleep:** Performance %, Efficiency, Respiratory Rate.

## ✅ Current Status
- [x] OAuth 2.0 Integration (v2 API)
- [x] LocalStorage Token Handling
- [x] Premium Dashboard UI
- [x] Interactive Metric Cards
- [x] v2 Endpoint Mapping (Profile, Recovery, Sleep, Cycles)

## 📝 Notes
- If you see "Unauthorized", simply click "Logout" at the bottom of the dashboard and log in again.
- The `COOKIE_SECRET` in `.env` is used for signing cookies, though the app currently prioritizes `localStorage` for better reliability on `localhost`.
