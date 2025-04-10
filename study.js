// Confirmation message for Chrome DevTools
console.log("study.js loaded");

// Import Gemini API key and Firebase functions
import { GEMINI_API_KEY } from "./config.js";
import {
  getDecks,
  getFlashcards,
  updateFlashcardLevel,
  addXP
} from "./app.js";

// DOM element references
const deckSelect = document.getElementById("deckSelect");
const flashcardEl = document.getElementById("flashcard");
const hintBtn = document.getElementById("hintBtn");
const hintModal = document.getElementById("hintModal");
const closeHintModal = document.getElementById("closeHintModal");
const titleEl = document.getElementById("deckTitle");

// Flashcard state tracking
let flashcards = [];
let currentCardIndex = 0;
let isFlipped = false;
let deckCompleted = false;
let timesRepeated = 0;

// Fetch all decks from Firestore and populate the dropdown
async function populateDecks() {
  const decks = await getDecks();
  decks.forEach(deck => {
    const option = document.createElement("option");
    option.value = deck.id;
    option.textContent = deck.name;
    deckSelect.appendChild(option);
  });
}

// Generate a Gemini hint based on current card
async function fetchAIHint(prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Give a hint to answer the question, WITHOUT TELLING THE ANSWER: "${prompt}"`
        }]
      }]
    })
  });

  const data = await response.json();

  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else if (data?.error?.message) {
    return `Error: ${data.error.message}`;
  } else {
    return "Could not generate a hint.";
  }
}

// Event handler: when a new deck is selected
deckSelect.onchange = async () => {
  const deckId = deckSelect.value;

  if (!deckId) {
    flashcards = [];
    currentCardIndex = 0;
    isFlipped = false;
    flashcardEl.textContent = "Click to flip";
    titleEl.textContent = "Select a deck";
    return;
  }

  flashcards = await getFlashcards(deckId);
  currentCardIndex = 0;
  isFlipped = false;
  deckCompleted = false;
  timesRepeated = 0;

  titleEl.textContent = deckSelect.options[deckSelect.selectedIndex].textContent;

  if (flashcards.length === 0) {
    flashcardEl.textContent = "No flashcards yet.";
  } else {
    showFront();
  }
};

// Show front side of current flashcard
function showFront() {
  if (!flashcards.length) return;
  flashcardEl.textContent = flashcards[currentCardIndex].front;
  isFlipped = false;
}

// Show back side of current flashcard
function showBack() {
  if (!flashcards.length) return;
  flashcardEl.textContent = flashcards[currentCardIndex].back;
  isFlipped = true;
}

// Flip the flashcard
document.getElementById("flipCard").onclick = () => {
  if (!flashcards.length) return;
  isFlipped ? showFront() : showBack();
};

// Go to previous flashcard
document.getElementById("prevCard").onclick = () => {
  if (!flashcards.length) return;
  currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
  showFront();
};

// Go to next flashcard
document.getElementById("nextCard").onclick = () => {
  if (!flashcards.length) return;
  currentCardIndex = (currentCardIndex + 1) % flashcards.length;
  showFront();
};

// Handle difficulty rating and XP logic
document.querySelectorAll(".diff").forEach(btn => {
  btn.onclick = async () => {
    if (!flashcards.length) return;

    const level = parseInt(btn.dataset.level);
    const currentCard = flashcards[currentCardIndex];
    const deckId = deckSelect.value;

    // Save card difficulty to Firestore
    await updateFlashcardLevel(deckId, currentCard.id, level);

    // XP reward logic
    let xpAmount = 10;
    if (deckCompleted) xpAmount = 5;

    await addXP(xpAmount);

    // Move to next card
    currentCardIndex++;

    // If all cards completed, mark as repeat
    if (currentCardIndex >= flashcards.length) {
      deckCompleted = true;
      timesRepeated++;
      currentCardIndex = 0;

      alert(`You completed this deck!\nRepeats will now earn half XP.`);
    }

    isFlipped = false;
    showFront();
  };
});

// Show Gemini-generated hint in a modal
hintBtn.onclick = async () => {
  if (!flashcards.length) return;
  const current = flashcards[currentCardIndex];

  hintModal.classList.remove("hidden");
  const hintTextEl = document.getElementById("hintContent");
  hintTextEl.textContent = "Generating hint...";

  try {
    const hint = await fetchAIHint(`Give a helpful study hint for: "${current.front}"`);
    hintTextEl.textContent = hint;
  } catch (error) {
    hintTextEl.textContent = "Failed to fetch hint. Try again later.";
    console.error("Hint error:", error);
  }
};

// Close the hint modal
closeHintModal.onclick = () => {
  hintModal.classList.add("hidden");
};

// Populate decks dropdown on page load
populateDecks();