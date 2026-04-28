const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/GEMINI_API_KEY=(.*)/)?.[1]?.trim();

async function listModels() {
  const genAI = new GoogleGenAI({ apiKey: key });
  try {
    const list = await genAI.models.list();
    for (const m of list.pageInternal) {
      console.log(m.name);
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

listModels();
