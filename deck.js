// Confirmation message for console in Chrome
console.log("deck.js loaded");

import { getDecks, createDeck, deleteDeck, createFlashcard, getFlashcards, updateDeck } from './app.js';

const deckListEl = document.getElementById("deckList");
const deckDetailsEl = document.getElementById("deckDetails");
const addDeckBtn = document.getElementById("addDeckBtn");
const deckModal = document.getElementById("deckModal");
const closeModal = document.getElementById("closeModal");
const createDeckBtn = document.getElementById("createDeckBtn");
const flashcardModal = document.getElementById("flashcardModal");
const closeFlashcardModal = document.getElementById("closeFlashcardModal");
const createCardBtn = document.getElementById("createCardBtn");

let currentDeckId = null;


closeFlashcardModal.onclick = () => flashcardModal.classList.add("hidden");


addDeckBtn.onclick = () => {
  deckModal.classList.remove("hidden");
};

closeModal.onclick = () => {
  deckModal.classList.add("hidden");
};

createCardBtn.onclick = async () => {
    const front = document.getElementById("cardFrontInput").value;
    const back = document.getElementById("cardBackInput").value;
    if (!front || !back || !currentDeckId) return;
  
    await createFlashcard(currentDeckId, front, back);
    flashcardModal.classList.add("hidden");
    loadFlashcards(currentDeckId);
  };

createDeckBtn.onclick = async () => {
  const name = document.getElementById("deckNameInput").value;
  const desc = document.getElementById("deckDescInput").value;
  if (name.trim() === "") return alert("Name required");

  await createDeck(name, desc);
  deckModal.classList.add("hidden");
  document.getElementById("deckNameInput").value = "";
  document.getElementById("deckDescInput").value = "";
  renderDecks();
};

async function renderDecks() {
  const decks = await getDecks();
  deckListEl.innerHTML = "";

  decks.forEach((deck, index) => {
    const card = document.createElement("div");
    card.classList.add("deck-card", index % 2 === 0 ? "green-card" : "blue-card");

    const name = document.createElement("span");
    name.textContent = deck.name;

    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.onclick = async () => {
      await deleteDeck(deck.id);
      const currentDetail = document.getElementById("deckDetails");
      currentDetail.innerHTML = `<p>Select a deck to view flashcards</p>`;
      renderDecks();
    };

    card.onclick = () => showDeckDetails(deck);
    card.appendChild(name);
    card.appendChild(delBtn);

    deckListEl.appendChild(card);
  });
}

function showDeckDetails(deck) {
    currentDeckId = deck.id;
  
    deckDetailsEl.innerHTML = `
    <div class="blue-card" style="padding:10px; margin-bottom:10px;">
        <input type="text" id="editDeckName" value="${deck.name}" placeholder="Deck name" />
        <textarea id="editDeckDesc" placeholder="Deck description">${deck.description || ""}</textarea>
        <button id="saveDeckChanges">💾 Save</button>
    </div>
    <div id="flashcardList">(Loading flashcards...)</div>
    <button id="openFlashcardModal">+ Add new flashcard</button>
    `;

    document.getElementById("saveDeckChanges").onclick = async () => {
        const newName = document.getElementById("editDeckName").value;
        const newDesc = document.getElementById("editDeckDesc").value;
        await updateDeck(deck.id, newName, newDesc);
        renderDecks();
        showDeckDetails({ id: deck.id, name: newName, description: newDesc });
      };
      

    loadFlashcards(deck.id);
  
    document.getElementById("openFlashcardModal").onclick = () => {
      flashcardModal.classList.remove("hidden");
    };
  }

async function loadFlashcards(deckId) {
    const flashcards = await getFlashcards(deckId);
    const list = document.getElementById("flashcardList");
  
    if (flashcards.length === 0) {
      list.innerHTML = `<p>No flashcards yet.</p>`;
      return;
    }
  
    list.innerHTML = flashcards.map(card =>
      `<div class="card">
        <strong>${card.front}</strong><br>
        <small>${card.back}</small>
      </div>`
    ).join("");
  }
  
  

renderDecks();
