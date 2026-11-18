/**
 * Modulo encargado de cargar y almacenar el diccionario completo de 4 letras.
 * Combina el archivo JSON lexico con una lista manual de respaldo.
 */
export const DICTIONARY = new Set();

export const STARTER_WORDS = [
  "COLD", "GAME", "HAND", "LINE", "MAKE", "TIME", "WORD", "BOOK", "DARK",
  "FIRE", "WIND", "MIND", "LAND", "FAST", "GOLD", "SHIP", "TREE", "BLUE"
];

// Palabras adicionales garantizadas manualmente
const EXTRA_WORDS = [
  "BANE", "FEST", "STAN", "SANE", "SANK", "TORE", "DIME", 
  "TAME", "BAKE", "BANE", "SWAN", "TINT", "TINE", "CANE", "DINE"
];

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

  for (const extra of EXTRA_WORDS) {
    DICTIONARY.add(extra);
  }
}