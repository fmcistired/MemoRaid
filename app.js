import {
    db,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    updateDoc,
    query,
    where
  } from "./firebase.js";
  
  // Config 
  const USER_ID = "testUser";
  
  // --------- DECK FUNCTIONS -----------
  
  export async function getDecks() {
    const q = query(collection(db, "decks"), where("userId", "==", USER_ID));
    const snapshot = await getDocs(q);
    let decks = [];
    snapshot.forEach(doc => {
      decks.push({ id: doc.id, ...doc.data() });
    });
    return decks;
  }
  
  export async function createDeck(name, description = "") {
    const deckData = {
      name,
      description,
      userId: USER_ID,
      createdAt: Date.now()
    };
    const newDeck = await addDoc(collection(db, "decks"), deckData);
    return newDeck.id;
  }
  
  export async function deleteDeck(deckId) {
    await deleteDoc(doc(db, "decks", deckId));
  }

  export async function updateDeck(deckId, newName, newDesc) {
    const ref = doc(db, "decks", deckId);
    await updateDoc(ref, {
      name: newName,
      description: newDesc
    });
  }
  
  
  // --------- FLASHCARD FUNCTIONS -----------
  
  export async function getFlashcards(deckId) {
    const cardsCol = collection(db, "decks", deckId, "cards");
    const snapshot = await getDocs(cardsCol);
    let cards = [];
    snapshot.forEach(doc => {
      cards.push({ id: doc.id, ...doc.data() });
    });
    return cards;
  }
  
  export async function createFlashcard(deckId, front, back) {
    const cardData = {
      front,
      back,
      deckId,
      createdAt: Date.now(),
      level: 1 // For spaced repetition logic later
    };
    await addDoc(collection(db, "decks", deckId, "cards"), cardData);
  }
  
  export async function deleteFlashcard(deckId, cardId) {
    const cardRef = doc(db, "decks", deckId, "cards", cardId);
    await deleteDoc(cardRef);
  }

  export async function updateFlashcard(deckId, cardId, front, back) {
    const cardRef = doc(db, "decks", deckId, "cards", cardId);
    await updateDoc(cardRef, { front, back });
  }
  
  
  // --------- USER STATS (XP, Level, Streak) -----------
  
  export async function getUserStats() {
    const userRef = doc(db, "users", USER_ID);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? snapshot.data() : null;
  }
  
  export async function updateUserStats({ xp = 0, level = 1, streak = 0 }) {
    const userRef = doc(db, "users", USER_ID);
    await setDoc(userRef, { xp, level, streak }, { merge: true });
  }