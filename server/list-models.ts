import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listModels() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

  console.log('--- Checking available models for your key ---');
  try {
    const response = await axios.get(url);
    console.log('✅ Models found:');
    (response.data as any).models.forEach((m: any) => console.log(`- ${m.name}`));
  } catch (e: any) {
    console.log('❌ Failed to list models.');
    console.log('Status:', e.response?.status);
    console.log('Error:', e.response?.data?.error?.message);
  }
}

listModels();
