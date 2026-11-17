/**
 * Modulo de audio procedural usando Web Audio API.
 * Genera efectos retro de 8 bits mediante osciladores matematicos,
 * evitando la descarga de archivos externos y manteniendo peso cero.
 */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSound(type) {
  // Los navegadores bloquean el audio hasta que el usuario interactua por primera vez
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'click') {
    // Pulso cuadrado corto para simular el clic mecanico de teclas
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.start(now);
    osc.stop(now + 0.04);

  } else if (type === 'xp') {
    // Dos notas ascendentes estilo orbe de experiencia al validar palabra
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.07);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.22);

  } else if (type === 'hurt') {
    // Onda diente de sierra descendente para impacto de dano
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.18);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.18);

  } else if (type === 'gameover') {
    // Secuencia descendente de tres tonos para fin de partida
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(240, now + 0.12);
    osc.frequency.setValueAtTime(180, now + 0.24);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}   