import { DICTIONARY, STARTER_WORDS } from '../data/words.js';

/**
 * Motor puro de reglas del juego.
 * No manipula el DOM directamente; calcula estados, validaciones y condiciones de derrota.
 * Esto permitira reutilizar exactamente este archivo cuando conectemos el Bot y Firebase.
 */

// Calcula el limite de tiempo segun la ronda: 15s en ronda 1, bajando 1s por ronda hasta minimo 5s
export function getMaxTimeForRound(round) {
  return Math.max(5, 16 - round);
}

// Cuenta cuantas letras difieren en la misma posicion entre dos palabras de 4 letras
export function countDiffLetters(wordA, wordB) {
  let diff = 0;
  for (let i = 0; i < 4; i++) {
    if (wordA[i] !== wordB[i]) {
      diff++;
    }
  }
  return diff;
}

// Devuelve el indice (0 a 3) de la unica letra que cambio entre la palabra anterior y la nueva
export function getChangedLetterIndex(prevWord, newWord) {
  for (let i = 0; i < 4; i++) {
    if (prevWord[i] !== newWord[i]) {
      return i;
    }
  }
  return -1;
}

// Verifica si existe al menos una palabra valida disponible para continuar la cadena
export function hasValidMoves(currentWord, historySet) {
  for (const candidate of DICTIONARY) {
    if (!historySet.has(candidate) && countDiffLetters(currentWord, candidate) === 1) {
      return true;
    }
  }
  return false;
}

// Crea y devuelve el objeto de estado inicial de una partida nueva
export function createInitialState() {
  const startWord = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
  return {
    activePlayer: 1,
    lives: { 1: 3, 2: 3 },
    turnsPlayed: 0,
    round: 1,
    maxTime: getMaxTimeForRound(1),
    timeLeft: getMaxTimeForRound(1),
    currentInput: "",
    history: [{ word: startWord, player: 0, changedIdx: -1 }],
    historySet: new Set([startWord]),
    isGameOver: false
  };
}

// Evalua una palabra enviada por el jugador activo y devuelve un objeto con el resultado
export function validateMove(word, currentWord, historySet) {
  if (historySet.has(word)) {
    return { valid: false, reason: "ALREADY USED" };
  }
  if (countDiffLetters(currentWord, word) !== 1) {
    return { valid: false, reason: "CHANGE ONLY 1 LETTER" };
  }
  if (!DICTIONARY.has(word)) {
    return { valid: false, reason: "NOT IN DICTIONARY" };
  }
  return { valid: true, reason: "" };
}