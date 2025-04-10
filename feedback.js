import { getDecks, getFlashcards } from './app.js';
import { GEMINI_API_KEY } from './config.js';

const mostStudiedEl = document.getElementById("mostStudied");
const avgDifficultyEl = document.getElementById("avgDifficulty");
const weakestDeckEl = document.getElementById("weakestDeck");
const aiFeedbackBox = document.getElementById("aiFeedbackBox");
const aiFeedback = document.getElementById("aiFeedback");

let statsSummary = {
    totalCards: 0,
    totalDifficulty: 0,
    deckStats: {},
    weakCards: []
  };
  
  async function calculateStats() {
    const decks = await getDecks();
  
    for (const deck of decks) {
      const cards = await getFlashcards(deck.id);
  
      statsSummary.deckStats[deck.name] = {
        count: 0,
        lows: 0
      };
  
      for (const card of cards) {
        if (card.level) {
          statsSummary.totalCards++;
          statsSummary.totalDifficulty += card.level;
          statsSummary.deckStats[deck.name].count++;
  
          if (card.level <= 2) {
            statsSummary.deckStats[deck.name].lows++;
            statsSummary.weakCards.push({
              front: card.front,
              deck: deck.name
            });
          }
        }
      }
    }
  
    renderStats();
  }
  

function renderStats() {
  const sortedDecks = Object.entries(statsSummary.deckStats).sort((a, b) => b[1].count - a[1].count);
  const mostStudied = sortedDecks[0]?.[0] || "N/A";
  const weakestDeck = sortedDecks.sort((a, b) => b[1].lows - a[1].lows)[0]?.[0] || "N/A";

  mostStudiedEl.textContent = mostStudied;
  avgDifficultyEl.textContent = statsSummary.totalCards > 0
    ? (statsSummary.totalDifficulty / statsSummary.totalCards).toFixed(2)
    : "N/A";
  weakestDeckEl.textContent = weakestDeck;
}

document.getElementById("generateFeedbackBtn").onclick = async () => {
  aiFeedbackBox.style.display = "block";
  aiFeedback.textContent = "Generating feedback with AI...";

  const weakFlashcardList = statsSummary.weakCards
  .slice(0, 5)  
  .map(card => `• "${card.front}" (Deck: ${card.deck})`)
  .join("\n");
  
  const prompt = `
  I’m a student using a flashcard study app. 
  I studied ${statsSummary.totalCards} cards across the following decks: 
  ${Object.keys(statsSummary.deckStats).join(", ")}.
  
  My average difficulty rating was ${(statsSummary.totalDifficulty / statsSummary.totalCards).toFixed(2)}.
  I struggled most with "${weakestDeckEl.textContent}".
  
  Here are some specific flashcards I struggled with:
  ${weakFlashcardList}
  Based on this, give me personalized, constructive study feedback in 2–3 sentences.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await res.json();
  const feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't generate feedback.";
  aiFeedback.textContent = feedback;
};

calculateStats();
