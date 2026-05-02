import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkUsage() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  // Note: There isn't a direct "usage" endpoint, but we can infer from model details
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

  console.log('--- API Key Status Check ---');
  try {
    const response = await axios.get(url);
    console.log('✅ Connection active.');
    console.log('Available Models for your key:');
    response.data.models.forEach((m: any) => {
        console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(', ')})`);
    });
    
    console.log('\n💡 Note: Google AI Studio usually requires going to the dashboard to see "Hits Used".');
    console.log('Check here: https://aistudio.google.com/app/plan_and_billing');
  } catch (e: any) {
    console.log('❌ Failed to connect.');
    console.log('Error:', e.response?.data?.error?.message);
  }
}

checkUsage();
