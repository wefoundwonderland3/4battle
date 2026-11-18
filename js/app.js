import { playSound } from './audio.js';
import { loadDictionary } from '../data/words.js';
import {
  createInitialState,
  getMaxTimeForRound,
  getChangedLetterIndex,
  hasValidMoves,
  validateMove
} from './engine.js';

/**
 * Controlador principal de la aplicacion.
 * Conecta el motor de reglas (engine.js) con la interfaz HTML/CSS,
 * gestiona la carga asincrona del diccionario y escucha los eventos del usuario.
 */

let state = {};
let timerInterval = null;
let isDictionaryLoaded = false;

// Genera el grafico vectorial SVG de un corazon pixelado segun su estado (lleno o vacio)
function getHeartSVG(filled, isDarkBg) {
  const border = isDarkBg ? '#ffffff' : '#0d0d0d';
  const fill = filled ? '#d92626' : (isDarkBg ? '#2a2a2a' : '#ebebeb');
  return `
    <svg class="heart-svg" viewBox="0 0 9 9" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1h2v1h1v1h1V2h1V1h2v1h1v3H8v1H7v1H6v1H5v1H4V8H3V7H2V6H1V5H0V2h1V1z" fill="${border}"/>
      <path d="M1 2h2v1h1v1h1V3h1V2h2v3H7v1H6v1H5v1H4V7H3V6H2V5H1V2z" fill="${fill}"/>
      ${filled ? '<rect x="2" y="2" width="1" height="1" fill="#ffffff"/>' : ''}
    </svg>
  `;
}

// Inicializa o reinicia la partida completa una vez que el diccionario esta disponible
function initGame() {
  if (!isDictionaryLoaded) return;

  clearInterval(timerInterval);
  state = createInitialState();

  document.getElementById('gameOverOverlay').classList.remove('visible');
  document.getElementById('feedbackMsg').textContent = "";
  renderAll();
  startTurnTimer();
}

// Inicia la cuenta regresiva del turno actual y actualiza la barra estilo XP cada 100ms
function startTurnTimer() {
  clearInterval(timerInterval);
  state.maxTime = getMaxTimeForRound(state.round);
  state.timeLeft = state.maxTime;
  updateTimerUI();

  const stepMs = 100;
  timerInterval = setInterval(() => {
    if (state.isGameOver) return;

    state.timeLeft = Math.max(0, +(state.timeLeft - stepMs / 1000).toFixed(1));
    updateTimerUI();

    if (state.timeLeft <= 0) {
      clearInterval(timerInterval);
      const winner = state.activePlayer === 1 ? 2 : 1;
      endGame(winner, `Player ${state.activePlayer} ran out of time!`);
    }
  }, stepMs);
}

// Actualiza el texto del reloj y el ancho porcentual de la barra de experiencia
function updateTimerUI() {
  const timerLabel = document.getElementById('timerLabel');
  const xpFill = document.getElementById('xpFill');
  timerLabel.textContent = `${Math.ceil(state.timeLeft)}s`;

  const pct = (state.timeLeft / state.maxTime) * 100;
  xpFill.style.width = `${pct}%`;

  const isUrgent = state.timeLeft <= 4;
  timerLabel.classList.toggle('urgent', isUrgent);
  xpFill.classList.toggle('urgent', isUrgent);
}

// Renderiza los paneles de jugadores, corazones de vida, numero de ronda y turno activo
function renderHUD() {
  const p1Box = document.getElementById('p1Box');
  const p2Box = document.getElementById('p2Box');
  p1Box.classList.toggle('active', state.activePlayer === 1);
  p2Box.classList.toggle('active', state.activePlayer === 2);

  let p1HeartsHTML = '';
  let p2HeartsHTML = '';
  for (let i = 0; i < 3; i++) {
    p1HeartsHTML += getHeartSVG(i < state.lives[1], state.activePlayer === 1);
    p2HeartsHTML += getHeartSVG(i < state.lives[2], state.activePlayer === 2);
  }

  document.getElementById('p1Hearts').innerHTML = p1HeartsHTML;
  document.getElementById('p2Hearts').innerHTML = p2HeartsHTML;
  document.getElementById('roundLabel').textContent = `ROUND ${state.round}`;
  document.getElementById('turnBanner').textContent = `PLAYER ${state.activePlayer}'S TURN`;
}

// Renderiza la lista cronologica de palabras jugadas resaltando la letra modificada
function renderHistory() {
  const list = document.getElementById('historyList');
  const countLabel = document.getElementById('wordCount');
  countLabel.textContent = `${state.history.length} WORD${state.history.length > 1 ? 'S' : ''}`;

  const header = list.querySelector('.history-header');
  list.innerHTML = '';
  list.appendChild(header);

  state.history.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.dataset.word = entry.word;

    let formattedWord = '';
    for (let i = 0; i < 4; i++) {
      if (i === entry.changedIdx) {
        formattedWord += `<span class="changed-char">${entry.word[i]}</span>`;
      } else {
        formattedWord += entry.word[i];
      }
    }

    const tag = entry.player === 0 ? 'START' : `P${entry.player}`;
    div.innerHTML = `
      <span>#${idx + 1} ${formattedWord}</span>
      <span class="history-meta">${tag}</span>
    `;
    list.appendChild(div);
  });

  // Desplaza automaticamente el historial hacia la palabra mas reciente
  list.scrollTop = list.scrollHeight;
}

// Actualiza las 4 casillas de escritura y verifica advertencias visuales en el historial
function renderSlots() {
  const typed = state.currentInput;
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`slot${i}`);
    slot.textContent = typed[i] || '';
    slot.classList.toggle('filled', Boolean(typed[i]));
    slot.classList.toggle('active-cursor', i === typed.length && typed.length < 4);
  }

  // Si la palabra escrita ya existe en el historial, la resalta en rojo antes de enviarla
  const items = document.querySelectorAll('.history-item');
  items.forEach(el => {
    if (typed.length === 4 && el.dataset.word === typed) {
      el.classList.add('duplicate-warning');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('duplicate-warning');
    }
  });
}

function renderAll() {
  renderHUD();
  renderHistory();
  renderSlots();
}

// Resta una vida al jugador activo y dispara la animacion de sacudida
function penalizePlayer(reason) {
  playSound('hurt');
  const p = state.activePlayer;
  state.lives[p]--;

  const box = document.getElementById(p === 1 ? 'p1Box' : 'p2Box');
  const frame = document.getElementById('gameFrame');
  box.classList.remove('shake');
  frame.classList.remove('shake');
  void box.offsetWidth; // Fuerza el reinicio de la animacion CSS
  box.classList.add('shake');
  frame.classList.add('shake');

  state.currentInput = "";
  renderHUD();
  renderSlots();

  if (state.lives[p] <= 0) {
    const winner = p === 1 ? 2 : 1;
    endGame(winner, `Player ${p} lost all 3 lives! (${reason})`);
  } else {
    document.getElementById('feedbackMsg').textContent = `${reason} (-1 LIFE)`;
  }
}

// Procesa el envio de una palabra completa
function submitWord() {
  if (!isDictionaryLoaded || state.isGameOver) return;
  const word = state.currentInput;

  if (word.length < 4) {
    document.getElementById('feedbackMsg').textContent = "NEED 4 LETTERS";
    return;
  }

  const lastWord = state.history[state.history.length - 1].word;
  const check = validateMove(word, lastWord, state.historySet);

  if (!check.valid) {
    penalizePlayer(check.reason);
    return;
  }

  // Movimiento valido: registra sonido, historial y avanza turno
  playSound('xp');
  document.getElementById('feedbackMsg').textContent = "";

  const changedIdx = getChangedLetterIndex(lastWord, word);
  state.history.push({ word, player: state.activePlayer, changedIdx });
  state.historySet.add(word);
  state.currentInput = "";
  state.turnsPlayed++;

  // Verifica si el oponente quedo sin movimientos posibles en el diccionario
  if (!hasValidMoves(word, state.historySet)) {
    renderHistory();
    renderSlots();
    const loser = state.activePlayer === 1 ? 2 : 1;
    endGame(state.activePlayer, `No valid words left! Player ${loser} is trapped!`);
    return;
  }

  // Alterna el jugador y sube la ronda cada 2 turnos completos
  state.activePlayer = state.activePlayer === 1 ? 2 : 1;
  if (state.turnsPlayed % 2 === 0) {
    state.round++;
  }

  renderAll();
  startTurnTimer();
}

// Maneja entradas tanto del teclado virtual en pantalla como del teclado fisico
function handleKey(key) {
  if (!isDictionaryLoaded || state.isGameOver) return;

  if (key === 'BACK') {
    if (state.currentInput.length > 0) {
      playSound('click');
      state.currentInput = state.currentInput.slice(0, -1);
      document.getElementById('feedbackMsg').textContent = "";
      renderSlots();
    }
  } else if (key === 'ENTER') {
    submitWord();
  } else if (/^[A-Z]$/.test(key) && state.currentInput.length < 4) {
    playSound('click');
    state.currentInput += key;
    document.getElementById('feedbackMsg').textContent = "";
    renderSlots();
  }
}

// Finaliza la partida y muestra el modal con las estadisticas
function endGame(winner, reason) {
  state.isGameOver = true;
  clearInterval(timerInterval);
  playSound('gameover');

  document.getElementById('winnerTitle').textContent = `PLAYER ${winner} WINS!`;
  document.getElementById('gameOverReason').textContent = reason;
  document.getElementById('gameStats').textContent =
    `Round reached: ${state.round} | Words chained: ${state.history.length}`;
  document.getElementById('gameOverOverlay').classList.add('visible');
}

// Construye dinamicamente los botones del teclado QWERTY en pantalla
function buildKeyboard() {
  const rows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["ENTER","Z","X","C","V","B","N","M","BACK"]
  ];
  const kb = document.getElementById('keyboard');

  rows.forEach(row => {
    const rDiv = document.createElement('div');
    rDiv.className = 'kb-row';
    row.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key-btn' + (k.length > 1 ? ' action-key' : '');
      btn.textContent = k === 'BACK' ? 'DEL' : k;
      btn.dataset.key = k;
      btn.addEventListener('click', () => handleKey(k));
      rDiv.appendChild(btn);
    });
    kb.appendChild(rDiv);
  });
}

// Escucha pulsaciones del teclado fisico y sincroniza la animacion con el teclado virtual
document.addEventListener('keydown', (e) => {
  if (!isDictionaryLoaded) return;

  if (state.isGameOver) {
    if (e.key === 'Enter') initGame();
    return;
  }

  const k = e.key.toUpperCase();
  if (k === 'BACKSPACE') {
    handleKey('BACK');
  } else if (k === 'ENTER') {
    handleKey('ENTER');
  } else if (/^[A-Z]$/.test(k)) {
    handleKey(k);
    const btn = document.querySelector(`.key-btn[data-key="${k}"]`);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 90);
    }
  }
});

document.getElementById('restartBtn').addEventListener('click', initGame);

// Secuencia de arranque asincrona: construye la UI, carga el JSON y comienza la partida
async function bootstrap() {
  buildKeyboard();
  document.getElementById('turnBanner').textContent = "LOADING DICTIONARY...";

  try {
    await loadDictionary();
    isDictionaryLoaded = true;
    initGame();
  } catch (error) {
    document.getElementById('turnBanner').textContent = "LOAD FAILED";
    document.getElementById('feedbackMsg').textContent = "CHECK DATA/WORDS4.JSON";
    console.error(error);
  }
}

bootstrap();