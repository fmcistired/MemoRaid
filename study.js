// Confirmation message for console in Chrome
console.log("study.js loaded");

import {
    getDecks,
    getFlashcards,
    updateFlashcardLevel
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
  
      currentCardIndex = (currentCardIndex + 1) % flashcards.length;
      isFlipped = false;
      showFront();
    };
  });
  
  // Hint Modal
  hintBtn.onclick = () => {
    if (!flashcards.length) return;
    const current = flashcards[currentCardIndex];
    document.getElementById("hintContent").textContent = `Hint for: ${current.front} (placeholder)`;
    hintModal.classList.remove("hidden");
  };
  
  closeHintModal.onclick = () => {
    hintModal.classList.add("hidden");
  };
  
  populateDecks();
  