const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config();


const app = express();
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, 'public')));
const port = 3000;

const gemini_api_key = process.env.API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
  maxOutputTokens: 4096,
};

const geminiModel = googleAI.getGenerativeModel({
  model: 'gemini-pro',
  geminiConfig,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/fetch', async (req, res) => {
  const url = req.body.url;

  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Remove internal and external CSS and JS
    $('style').remove();
    $('link[rel="stylesheet"]').remove();
    $('script').remove();

    // Fetch the cleaned HTML
    const cleanedHtml = $.html();

    // Analyze the cleaned HTML content
    const prompt = `Please analyze the following web page content: ${cleanedHtml}. Provide overall SEO optimization suggestions, how can I improve it, and what mistakes you find.`;

    const result = await geminiModel.generateContent(prompt);
    const response2 = result.response;
    const insights = response2.text();

    res.json({ insights });
  } catch (error) {
    console.error(`Error processing the URL: ${error.message}`);
    res.status(500).json({ error: 'An error occurred while processing the URL.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
