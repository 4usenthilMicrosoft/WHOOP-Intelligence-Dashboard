import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function rawTest() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  console.log('--- Raw API v1 Test ---');
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: 'hi' }] }]
    });
    console.log('✅ Success! The v1 endpoint works.');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (e: any) {
    console.log('❌ Raw Test Failed.');
    console.log('Status:', e.response?.status);
    console.log('Error Data:', JSON.stringify(e.response?.data, null, 2));
  }
}

rawTest();
