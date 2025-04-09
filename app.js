import {
    db, collection, getDocs, query, where
  } from './firebase.js';
  
  async function getDecks(userId = "testUser") {
    const q = query(collection(db, "decks"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    let decks = [];
    snapshot.forEach(doc => {
      decks.push({ id: doc.id, ...doc.data() });
    });
    console.log("User's Decks:", decks);
  }
  
  getDecks();
  