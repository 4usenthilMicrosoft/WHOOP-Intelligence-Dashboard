import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3002;
const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'whoop-secret'));
app.use(express.json());

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v2';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Step 1: Redirect to WHOOP Authorization
app.get('/auth', (req: Request, res: Response) => {
  const scope = 'read:profile read:recovery read:cycles read:workout read:sleep read:body_measurement offline';
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const authUrl = `${WHOOP_AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&state=${state}`;
  res.redirect(authUrl);
});

// Step 2: Handle Callback and Exchange Code for Token
app.get('/callback', async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;
  if (error) return res.status(400).send(`WHOOP OAuth Error: ${error_description || error}`);
  if (!code) return res.status(400).send('Authorization code missing');

  try {
    const response = await axios.post(
      WHOOP_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI!,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token } = response.data;
    res.redirect(`http://localhost:5173/dashboard?token=${access_token}`);
  } catch (error: any) {
    res.status(500).send('Authentication failed');
  }
});

// API Proxy Routes
app.get('/api/:endpoint', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  const endpoint = req.params.endpoint;
  const query = req.query;
  let url = '';

  switch (endpoint) {
    case 'profile': url = `${WHOOP_API_BASE}/user/profile/basic`; break;
    case 'body': url = `${WHOOP_API_BASE}/user/measurement/body`; break;
    case 'recovery': url = `${WHOOP_API_BASE}/recovery`; break;
    case 'sleep': url = `${WHOOP_API_BASE}/activity/sleep`; break;
    case 'cycles': url = `${WHOOP_API_BASE}/cycle`; break;
    case 'workout': url = `${WHOOP_API_BASE}/activity/workout`; break;
    default: return res.status(404).send('Endpoint not found');
  }

  const queryString = new URLSearchParams(query as any).toString();
  if (queryString) url += `?${queryString}`;

  try {
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
  }
});

// Chat AI Route
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history, userData } = req.body;

  if (!GEMINI_API_KEY) {
    return res.status(400).json({ error: 'Gemini API Key missing in server configuration.' });
  }

  const systemPrompt = `You are an expert WHOOP Performance Coach. Analyze the user's physiological data and provide elite-level, sports-science recommendations.
  
  USER CONTEXT:
  - Name: ${userData.profile?.first_name}
  - Latest Recovery: ${userData.latest.recovery?.score?.recovery_score}%
  - Latest Strain: ${userData.latest.cycle?.score?.strain}
  - Latest Sleep: ${userData.latest.sleep?.score?.sleep_performance_percentage}%
  
  Be direct, professional, and keep responses under 150 words. Always mention their specific scores in your advice.`;

  try {
    // Filter and map history correctly for the Google AI SDK
    const chatHistory = history
      .filter((h: any) => h.role === 'user' || h.role === 'ai')
      .map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

    // Ensure history starts with a 'user' message
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: { maxOutputTokens: 500 },
    });

    const result = await chat.sendMessage([{ text: `${systemPrompt}\n\nUser Question: ${message}` }]);
    const responseText = result.response.text();
    res.json({ reply: responseText });
  } catch (error: any) {
    console.error('CRITICAL Gemini Error:', error.message || error);
    res.status(500).json({ 
      error: 'AI failed to respond.', 
      details: error.message,
      code: error.status || 'unknown' 
    });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
