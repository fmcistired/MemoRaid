// Confirmation message for console in Chrome
console.log("deck.js loaded");


// Import all deck & flashcard functions from backend logic
import { getDecks, createDeck, deleteDeck, createFlashcard, getFlashcards, updateDeck, updateFlashcard, deleteFlashcard} from './app.js';


// DOM element references
const deckListEl = document.getElementById("deckList");
const deckDetailsEl = document.getElementById("deckDetails");
const addDeckBtn = document.getElementById("addDeckBtn");
const deckModal = document.getElementById("deckModal");
const closeModal = document.getElementById("closeModal");
const createDeckBtn = document.getElementById("createDeckBtn");
const flashcardModal = document.getElementById("flashcardModal");
const closeFlashcardModal = document.getElementById("closeFlashcardModal");
const createCardBtn = document.getElementById("createCardBtn");
const editFlashcardModal = document.getElementById("editFlashcardModal");
const closeEditFlashcardModal = document.getElementById("closeEditFlashcardModal");
const saveFlashcardChanges = document.getElementById("saveFlashcardChanges");

let editCardId = null;
let currentDeckId = null;


// Close buttons
closeFlashcardModal.onclick = () => flashcardModal.classList.add("hidden");
closeEditFlashcardModal.onclick = () => editFlashcardModal.classList.add("hidden");
closeModal.onclick = () => {
  deckModal.classList.add("hidden");
};


// Open deck creation
addDeckBtn.onclick = () => {
  deckModal.classList.remove("hidden");
};

// Create new deck
createCardBtn.onclick = async () => {
  const front = document.getElementById("cardFrontInput").value;
  const back = document.getElementById("cardBackInput").value;
  if (!front || !back || !currentDeckId) return;
    await createFlashcard(currentDeckId, front, back);
    flashcardModal.classList.add("hidden");
    loadFlashcards(currentDeckId);
  };

// Create new deck
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


// Save flashcard edits
saveFlashcardChanges.onclick = async () => {
  const front = document.getElementById("editCardFront").value;
  const back = document.getElementById("editCardBack").value;
  if (!editCardId || !front || !back) return;
  
  await updateFlashcard(currentDeckId, editCardId, front, back);
  editFlashcardModal.classList.add("hidden");
  loadFlashcards(currentDeckId);
};

// Render all flashcardsin a list
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

// Show flashcards and deck details when a deck is selected
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

// Load flashcards for the selected deck
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
      <small>${card.back}</small><br>
      <button class="edit-btn" data-id="${card.id}" data-front="${card.front}" data-back="${card.back}">✏️ Edit</button>
      <button class="delete-btn" data-id="${card.id}">❌ Delete</button>
    </div>`
  ).join("");
  
  // Edit flashcard
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = () => {
      editCardId = btn.dataset.id;
      document.getElementById("editCardFront").value = btn.dataset.front;
      document.getElementById("editCardBack").value = btn.dataset.back;
      editFlashcardModal.classList.remove("hidden");
    };
  });
  
  // Delete flashcard
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = async () => {
      const cardId = btn.dataset.id;
      await deleteFlashcard(currentDeckId, cardId);
      loadFlashcards(currentDeckId);
    };
  });    
}

renderDecks();
