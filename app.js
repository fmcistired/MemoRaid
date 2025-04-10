// Firebase Firestore Imports
import {
    db,
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    deleteDoc,
    updateDoc,
    query,
    where
  } from "./firebase.js";
  
  // Config 
  const USER_ID = "testUser";
  
  // --------- DECK FUNCTIONS -----------
  
  // Fetch all decks belonging to current user
  export async function getDecks() {
    const q = query(collection(db, "decks"), where("userId", "==", USER_ID));
    const snapshot = await getDocs(q);
    let decks = [];
    snapshot.forEach(doc => {
      decks.push({ id: doc.id, ...doc.data() });
    });
    return decks;
  }
  
  // Create a new deck with name + optional description
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
  
  // Delete a deck by its Firestore ID
  export async function deleteDeck(deckId) {
    await deleteDoc(doc(db, "decks", deckId));
  }

  // Update deck name and/or description
  export async function updateDeck(deckId, newName, newDesc) {
    const ref = doc(db, "decks", deckId);
    await updateDoc(ref, {
      name: newName,
      description: newDesc
    });
  }
  
  
  // --------- FLASHCARD FUNCTIONS -----------
  
  // Fetch all flashcards from a specific deck
  export async function getFlashcards(deckId) {
    const cardsCol = collection(db, "decks", deckId, "cards");
    const snapshot = await getDocs(cardsCol);
    let cards = [];
    snapshot.forEach(doc => {
      cards.push({ id: doc.id, ...doc.data() });
    });
    return cards;
  }
  
  // Create a new flashcard in a given deck
  export async function createFlashcard(deckId, front, back) {
    const cardData = {
      front,
      back,
      deckId,
      createdAt: Date.now(),
      level: 1
    };
    await addDoc(collection(db, "decks", deckId, "cards"), cardData);
  }
  
  // Delete a flashcard by ID from a specific deck
  export async function deleteFlashcard(deckId, cardId) {
    const cardRef = doc(db, "decks", deckId, "cards", cardId);
    await deleteDoc(cardRef);
  }

  // Update a flashcard's front/back text
  export async function updateFlashcard(deckId, cardId, front, back) {
    const cardRef = doc(db, "decks", deckId, "cards", cardId);
    await updateDoc(cardRef, { front, back });
  }

  // Update the difficulty level of a flashcard
  export async function updateFlashcardLevel(deckId, cardId, level) {
    const ref = doc(db, "decks", deckId, "cards", cardId);
    await updateDoc(ref, { level });
  }  

  
  
  // --------- USER STATS (XP, Level, Streak) -----------
  
  // Get current user stats (XP, level, streak)
  export async function getUserStats() {
    const userRef = doc(db, "users", USER_ID);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? snapshot.data() : null;
  }

  // Manually update XP, level, or streak  
  export async function updateUserStats({ xp = 0, level = 1, streak = 0 }) {
    const userRef = doc(db, "users", USER_ID);
    await setDoc(userRef, { xp, level, streak }, { merge: true });
  }

  // Add XP and auto-calculate level ups
  export async function addXP(amount = 10) {
    const userRef = doc(db, "users", USER_ID);
    const snapshot = await getDoc(userRef);
  
    let xp = 0;
    let level = 1;
    let streak = 0;
  
    if (snapshot.exists()) {
      const data = snapshot.data();
      xp = data.xp || 0;
      level = data.level || 1;
      streak = data.streak || 0;
    }
  
    xp += amount;

    // Level up logic: every 100 XP = new level
    if (xp >= 100) {
      level += Math.floor(xp / 100);
      xp = xp % 100;
    }
  
    await setDoc(userRef, { xp, level, streak }, { merge: true });
    return { xp, level, streak };
  }

  
  
