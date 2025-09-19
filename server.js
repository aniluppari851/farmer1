import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // serve index.html

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Hardcoded market prices (you can update daily)
const MARKET_PRICES = {
  tomato: "₹35 per kg",
  onion: "₹25 per kg",
  potato: "₹20 per kg"
};

// --- API Route ---
app.post('/chat', async (req, res) => {
  try {
    const { message, lang, topic } = req.body;
    if (!message) return res.json({ reply: 'No question received' });

    // Check if it's a market price question
    if (topic === 'market') {
      const lower = message.toLowerCase();
      for (let item in MARKET_PRICES) {
        if (lower.includes(item)) {
          return res.json({ reply: `📊 Current market price of ${item} is ${MARKET_PRICES[item]}.` });
        }
      }
      return res.json({ reply: `⚠️ Sorry, price info not available for that item.` });
    }

    // Otherwise, let AI handle crop, soil, pest, irrigation, weather
    const systemPrompt = `You are a farming advisory assistant. 
Answer in clear, step-by-step format. 
Make sure the response is in the requested language: ${lang}. 
The topic is ${topic}. Keep answers practical for farmers.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: 'Server error' });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is busy. Trying next port...`);
    const newPort = PORT + 1;
    app.listen(newPort, () => {
      console.log(`✅ Server running on http://localhost:${newPort}`);
    });
  } else {
    console.error(err);
  }
});
