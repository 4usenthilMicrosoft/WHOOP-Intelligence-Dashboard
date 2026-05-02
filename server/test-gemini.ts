import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function autoTest() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey || '');
  // Try the most compatible alias
  const modelName = 'gemini-pro';
  
  console.log(`--- Testing with ${modelName} ---`);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('hi');
    const response = await result.response;
    console.log('✅ PASS: Alias working!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ FAIL:', error.message);
    process.exit(1);
  }
}

autoTest();
