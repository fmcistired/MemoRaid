// Confirmation message for console in Chrome
console.log("study.js loaded");
import { GEMINI_API_KEY } from "./config.js";

import {
    getDecks,
    getFlashcards,
    updateFlashcardLevel,
    addXP
  } from "./app.js";

  
  const deckSelect = document.getElementById("deckSelect");
  const flashcardEl = document.getElementById("flashcard");
  const hintBtn = document.getElementById("hintBtn");
  const hintModal = document.getElementById("hintModal");
  const closeHintModal = document.getElementById("closeHintModal");
  const titleEl = document.getElementById("deckTitle");
  
  let flashcards = [];
  let currentCardIndex = 0;
  let isFlipped = false;
  
  async function populateDecks() {
    const decks = await getDecks();
    decks.forEach(deck => {
      const option = document.createElement("option");
      option.value = deck.id;
      option.textContent = deck.name;
      deckSelect.appendChild(option);
    });
  }

// AI Hint Function
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
      return `⚠️ Error: ${data.error.message}`;
    } else {
      return "❌ Could not generate a hint.";
    }
  }
  
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
  
    titleEl.textContent = deckSelect.options[deckSelect.selectedIndex].textContent;
  
    if (flashcards.length === 0) {
      flashcardEl.textContent = "No flashcards yet.";
    } else {
      showFront();
    }
  };
  
  function showFront() {
    if (!flashcards.length) return;
    flashcardEl.textContent = flashcards[currentCardIndex].front;
    isFlipped = false;
  }
  
  function showBack() {
    if (!flashcards.length) return;
    flashcardEl.textContent = flashcards[currentCardIndex].back;
    isFlipped = true;
  }
  
  // Flip button
  document.getElementById("flipCard").onclick = () => {
    if (!flashcards.length) return;
    isFlipped ? showFront() : showBack();
  };
  
  // Next & Previous
  document.getElementById("prevCard").onclick = () => {
    if (!flashcards.length) return;
    currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
    showFront();
  };
  
  document.getElementById("nextCard").onclick = () => {
    if (!flashcards.length) return;
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    showFront();
  };
  
  // Difficulty buttons
  document.querySelectorAll(".diff").forEach(btn => {
    btn.onclick = async () => {
      if (!flashcards.length) return;
  
      const level = parseInt(btn.dataset.level);
      const currentCard = flashcards[currentCardIndex];
      const deckId = deckSelect.value;
  
      await updateFlashcardLevel(deckId, currentCard.id, level);
  
      const result = await addXP(10); // update 


      currentCardIndex = (currentCardIndex + 1) % flashcards.length;
      isFlipped = false;
      showFront();
    };
  });
  
  // Hint Modal
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
  
  closeHintModal.onclick = () => {
    hintModal.classList.add("hidden");
  };
  


  populateDecks();
  