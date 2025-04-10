// Import Firestore functions & Gemini API key
import { getDecks, getFlashcards } from './app.js';
import { GEMINI_API_KEY } from './config.js';

// DOM element references for rendering stats and AI feedback
const mostStudiedEl = document.getElementById("mostStudied");
const avgDifficultyEl = document.getElementById("avgDifficulty");
const weakestDeckEl = document.getElementById("weakestDeck");
const aiFeedbackBox = document.getElementById("aiFeedbackBox");
const aiFeedback = document.getElementById("aiFeedback");

// Stores all collected study data and weak cards
let statsSummary = {
  totalCards: 0,
  totalDifficulty: 0,
  deckStats: {},
  weakCards: []
};

// Calculate stats from all decks and flashcards
async function calculateStats() {
  const decks = await getDecks();

  for (const deck of decks) {
    const cards = await getFlashcards(deck.id);

    // Initialize deck stats
    statsSummary.deckStats[deck.name] = {
      count: 0,
      lows: 0
    };

    // Evaluate each card in the deck
    for (const card of cards) {
      if (card.level) {
        statsSummary.totalCards++;
        statsSummary.totalDifficulty += card.level;
        statsSummary.deckStats[deck.name].count++;

        // Track weak cards (difficulty 1–2)
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

  // Render results on the page
  renderStats();
}

// Render calculated stats into the DOM
function renderStats() {
  const sortedDecks = Object.entries(statsSummary.deckStats)
    .sort((a, b) => b[1].count - a[1].count);

  const mostStudied = sortedDecks[0]?.[0] || "N/A";

  const weakestDeck = sortedDecks
    .sort((a, b) => b[1].lows - a[1].lows)[0]?.[0] || "N/A";

  mostStudiedEl.textContent = mostStudied;
  avgDifficultyEl.textContent = statsSummary.totalCards > 0
    ? (statsSummary.totalDifficulty / statsSummary.totalCards).toFixed(2)
    : "N/A";
  weakestDeckEl.textContent = weakestDeck;
}

// Event: Generate AI feedback on button click
document.getElementById("generateFeedbackBtn").onclick = async () => {
  aiFeedbackBox.style.display = "block";
  aiFeedback.textContent = "Generating feedback with AI...";

  // Build weak card list for AI prompt
  const weakFlashcardList = statsSummary.weakCards
    .slice(0, 5)
    .map(card => `- "${card.front}" (Deck: ${card.deck})`)
    .join("\n");

  // Prepare overall metrics for the prompt
  const totalCards = statsSummary.totalCards;
  const avgDifficulty = statsSummary.totalCards > 0
    ? (statsSummary.totalDifficulty / statsSummary.totalCards).toFixed(2)
    : "N/A";

  const studiedDecks = Object.keys(statsSummary.deckStats).join(", ");
  const weakestDeck = weakestDeckEl.textContent;

  // AI prompt passed to Gemini
  const prompt = `
You are a flashcard study coach.

The student has completed ${totalCards} cards across these decks: ${studiedDecks}.
Their average difficulty score is ${avgDifficulty}.
Their weakest deck is "${weakestDeck}".

These are the flashcards they struggled with:
${weakFlashcardList || "No weak flashcards were found."}

Write a short but smart feedback summary (2–4 sentences). Include:
- A sentence about their overall performance
- A specific observation about the weakest deck and flashcards
- One helpful study suggestion
- A short motivational ending
Avoid repeating the prompt structure and keep the tone supportive.
`;

  // Call Gemini API
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  // Extract and display feedback
  const data = await res.json();
  const feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't generate feedback.";
  aiFeedback.textContent = feedback;
};

// Start calculating stats on page load
calculateStats();
