/**
 * Modulo encargado de cargar y almacenar el diccionario completo de 4 letras.
 * Convierte el arreglo JSON en un Set para mantener validaciones instantaneas O(1).
 */
export const DICTIONARY = new Set();

export const STARTER_WORDS = [
  "COLD", "GAME", "HAND", "LINE", "MAKE", "PLAY", "TIME", "WORD", "BOOK", "DARK",
  "FIRE", "WIND", "STAR", "MIND", "LAND", "FAST", "GOLD", "SHIP", "TREE", "BLUE"
];

/**
 * Descarga el archivo JSON local una sola vez al abrir la pagina
 * y puebla el Set en memoria.
 */
export async function loadDictionary() {
  if (DICTIONARY.size > 0) return;

  const response = await fetch('./data/words4.json');
  if (!response.ok) {
    throw new Error('No se pudo cargar el diccionario words4.json');
  }

  const wordsArray = await response.json();
  for (const word of wordsArray) {
    DICTIONARY.add(word);
  }
}