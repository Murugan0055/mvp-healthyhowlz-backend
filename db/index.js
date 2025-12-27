const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

let model = 'gemini-2.5-flash-lite';
const modelNames = [
  'gemini-2.5-flash',       // fast, good price-performance
  'gemini-2.5-flash-lite',  // even lighter, for high volume
  'gemini-2.5-pro'          // heavier, best reasoning
];
// Test database connection
pool.connect()
  .then(client => {
    console.log("✅ Connected to Supabase PostgreSQL DB successfully!");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
    console.error(err);
  });

// Test AI connection
const testAIConnection = async () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY not found in environment variables");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try the correct model names for v1beta API



    console.log("\n🤖 Testing Google Gemini AI connection...");

    for (const modelName of modelNames) {
      try {
        const modelObj = genAI.getGenerativeModel({ model: modelName });
        const result = await modelObj.generateContent("Hello");
        const response = await result.response;
        const text = response.text();

        if (text) {
          console.log(`✅ AI Model '${modelName}' is working!`);
          console.log(`   Response: ${text.substring(0, 50)}...`);
          model = modelName;
          break; // Found a working model
        }
      } catch (error) {
        console.log(`❌ Model '${modelName}' failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ AI connection error:", error.message);
  }
};

// Run AI test after a short delay to let the server start
setTimeout(testAIConnection, 1000);

module.exports = { pool, model };

