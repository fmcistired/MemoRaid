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
      level: 1
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

  export async function updateFlashcardLevel(deckId, cardId, level) {
    const ref = doc(db, "decks", deckId, "cards", cardId);
    await updateDoc(ref, { level });
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
    if (xp >= 100) {
      level += Math.floor(xp / 100);
      xp = xp % 100;
    }
  
    await setDoc(userRef, { xp, level, streak }, { merge: true });
    return { xp, level, streak };
  }
