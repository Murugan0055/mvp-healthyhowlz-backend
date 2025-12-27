const { model } = require('../db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.extractPlanFromImage = async (req, res) => {
  try {
    const { image, type } = req.body; // type: 'diet' or 'workout'
    if (!image) return res.status(400).json({ error: 'Image required' });
    if (!type) return res.status(400).json({ error: 'Type required (diet/workout)' });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const generativeModel = genAI.getGenerativeModel({ model: model });

    let prompt = '';

    if (type === 'diet') {
      prompt = `Analyze this image of a diet plan / nutrition chart.
      Extract all meals into a structured JSON list.
      For each meal, identify:
      1. meal_type (Breakfast, Lunch, Dinner, Snack, Pre Workout, Post Workout)
      2. name (The name of the food/dish)
      3. description (Preparation notes or quantity)
      4. calories_kcal (estimated)
      5. protein_g (estimated)
      6. carbs_g (estimated)
      7. fat_g (estimated)

      Return ONLY a JSON object:
      {
        "title": "Extracted Diet Plan",
        "description": "Auto-extracted from image",
        "meals": [
          { "meal_type": "string", "name": "string", "description": "string", "calories_kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number }
        ]
      }`;
    } else {
      prompt = `Analyze this image of a workout plan / exercise routine.
      Extract all exercises into a structured JSON list.
      For each exercise, identify:
      1. day_name (Monday, Tuesday, etc.)
      2. name (The name of the exercise)
      3. category (STRENGTH, CARDIO, STRETCHING, OTHER)
      4. sets (number)
      5. reps (string, e.g., '10-12' or 'to failure')
      6. duration (string, e.g., '30 mins' - mainly for cardio)
      7. notes (Form cues or equipment info)

      Return ONLY a JSON object:
      {
        "title": "Extracted Workout Plan",
        "description": "Auto-extracted from image",
        "exercises": [
          { "day_name": "string", "name": "string", "category": "string", "sets": number, "reps": "string", "duration": "string", "notes": "string" }
        ]
      }`;
    }

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    const result = await generativeModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    res.json(data);
  } catch (err) {
    console.error('AI Extraction Error:', err);
    res.status(500).json({ error: 'Failed to extract data from image' });
  }
};
