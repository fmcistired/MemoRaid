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
  .map(card => `- "${card.front}" (Deck: ${card.deck})`)
  .join("\n");
  
  const totalCards = statsSummary.totalCards;
  const avgDifficulty = statsSummary.totalCards > 0
  ? (statsSummary.totalDifficulty / statsSummary.totalCards).toFixed(2)
  : "N/A";
  
  const studiedDecks = Object.keys(statsSummary.deckStats).join(", ");
  const weakestDeck = weakestDeckEl.textContent;

  const prompt = `
  You are an educational assistant. A student used a flashcard study app.

  - Total cards studied: ${totalCards}
  - Decks studied: ${studiedDecks}
  - Average difficulty score: ${avgDifficulty}
  - Weakest deck: "${weakestDeck}"

  These are some of the specific flashcards the student struggled with:
  ${weakFlashcardList}

  Give a motivational, constructive 2–3 sentence feedback:
  - Highlight what topics the user struggled
  - Suggest how to improve those areas
  - Use plain, friendly tone
  `;


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
