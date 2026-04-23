const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Recipe generation endpoint
app.post('/api/generate-recipe', async (req, res) => {
  try {
    const { ingredients, cuisine, dietaryPreferences, mealType, servings } = req.body;

    if (!ingredients || ingredients.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide at least one ingredient.' });
    }

    const prompt = `You are a world-class chef and recipe creator. Generate a detailed, delicious recipe based on the following:

**Available Ingredients:** ${ingredients}
${cuisine ? `**Cuisine Style:** ${cuisine}` : ''}
${dietaryPreferences ? `**Dietary Preferences:** ${dietaryPreferences}` : ''}
${mealType ? `**Meal Type:** ${mealType}` : ''}
${servings ? `**Servings:** ${servings}` : '**Servings:** 4'}

Please provide the recipe in the following JSON format:
{
  "name": "Recipe Name",
  "description": "A brief, appetizing description of the dish (2-3 sentences)",
  "prepTime": "preparation time",
  "cookTime": "cooking time",
  "totalTime": "total time",
  "servings": "number of servings",
  "difficulty": "Easy/Medium/Hard",
  "calories": "estimated calories per serving",
  "ingredients": [
    "ingredient 1 with quantity",
    "ingredient 2 with quantity"
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "tips": [
    "Helpful tip 1",
    "Helpful tip 2"
  ],
  "nutritionFacts": {
    "protein": "amount",
    "carbs": "amount",
    "fat": "amount",
    "fiber": "amount"
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no code blocks, just pure JSON.`;

    const response = await axios.post(GEMINI_URL, {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const content = response.data.candidates[0].content.parts[0].text.trim();

    // Parse JSON — handle possible markdown code blocks
    let recipe;
    try {
      let jsonStr = content;
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      recipe = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw content:', content);
      return res.status(500).json({ error: 'Failed to parse recipe. Please try again.' });
    }

    res.json({ success: true, recipe });

  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 429) {
      return res.status(429).json({ error: 'API rate limit reached. Please wait a moment and try again.' });
    }
    res.status(500).json({ error: 'Failed to generate recipe. Please try again.' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  AI Recipe Generator running at http://localhost:${PORT}\n`);
});
