/* ══════════════════════════════════════════════════════════════════════
   RADIO TRIGAL FM — MOTOR DE AUDIO (audio.js)
   ══════════════════════════════════════════════════════════════════════
   Todo lo relacionado con sonido vive aquí: el catálogo de efectos (SFX)
   y sonidos ambiente, la música del menú/título, el audio principal de
   las rondas del quiz (incluido el temporizador del Modo Difícil, que
   depende del audio de la ronda), los sonidos de ambiente en bucle de
   los Eventos Pokémon (lluvia de Blastoise, ronquido de Snorlax) y la
   reproducción de fichas desde la pantalla Sonidex.

   Debe cargarse ANTES que pokemon.js y que game.js: pokemon.js registra
   su catálogo de Eventos Pokémon nada más cargarse, y uno de ellos usa
   directamente `SFX.shiny`, así que `SFX` ya tiene que existir en ese
   momento. El resto de identificadores que este fichero usa pero no
   define (settings, screens, shuffle, state, session, GameMode,
   loseLife, renderLives, showResult, updateStatsUI, stopJigglypuffSinging...)
   solo se referencian dentro de funciones que se invocan más tarde
   (clics, timers...), nunca al cargarse el script, así que no importa
   que game.js los defina después.
   ══════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
//  🔊 CATÁLOGO DE SONIDOS
// ═══════════════════════════════════════════════

// Sonidos del juego (coloca tus archivos en sounds/)
const SFX = {
  correct: "sounds/correct.mp3",
  wrong:   "sounds/wrong.mp3",
  go:       "sounds/go.mp3",
  newmode:  "sounds/newmode.mp3",
  victory:  "sounds/victory.mp3",
  back:     "sounds/back.mp3",
  event:    "sounds/poke-event.mp3", // sonido corto genérico al aparecer un Evento Pokémon
  explosion: "sounds/explosion.mp3", // Evento Electrode: al explotar por agotarse el tiempo
  shiny:     "sounds/shiny.mp3",     // Evento Caterpie Shiny: sonido propio de aparición
  jigglypuff: "sounds/jigglypuff.mp3", // Evento Jigglypuff: su canción, suena una vez al empezar la ronda
};

// Sonidos ambiente en bucle (efectos que duran mientras dura el overlay
// visual, a diferencia de los SFX de un solo disparo de arriba).
const AMBIENT_SFX = {
  rain: "sounds/rain-ambient.mp3", // lluvia de fondo del evento Blastoise
  snore: "sounds/snore.mp3",       // ronquido en bucle del evento Snorlax
};

// ═══════════════════════════════════════════════
//  🎵 MOTOR DE REPRODUCCIÓN (música, SFX, Sonidex)
// ═══════════════════════════════════════════════

// Música del menú
const menuAudio=document.getElementById('menu-audio');
const MENU_SONGS=[
 "songs/general/pokemusic1.mp3",
 "songs/general/pokemusic2.mp3",
 "songs/general/pokemusic3.mp3",
 "songs/general/pokemusic4.mp3",
 "songs/general/pokemusic5.mp3",
 "songs/general/pokemusic6.mp3",
 "songs/general/pokemusic7.mp3",
 "songs/general/pokemusic8.mp3",
 "songs/general/pokemusic9.mp3",
 "songs/general/pokemusic10.mp3"
];
// Los navegadores bloquean el autoplay de audio CON sonido, pero permiten
// autoplay si empieza silenciado. Arrancamos así y desactivamos el silencio
// en cuanto el usuario interactúa por primera vez, para que la canción ya
// esté sonando (desde el segundo 0) apenas se detecte esa interacción.
let menuMusicUnlocked = false;

// Cola aleatoria de canciones de menú: se baraja el listado completo y se
// reproduce en ese orden sin repetir ninguna hasta haber sonado todas.
// Cuando se agota, se vuelve a barajar para el siguiente ciclo (evitando que
// la última canción de un ciclo coincida con la primera del siguiente, para
// que tampoco pueda repetirse justo al enlazar dos ciclos). Esto evita
// repeticiones tanto si la canción termina sola como si se interrumpe (p.ej.
// al entrar y salir del quiz) y se retoma la música del menú desde cero.
let menuSongQueue = [];
let lastMenuSong = null;

/** Rellena la cola de canciones de menú con un nuevo orden aleatorio,
 * evitando que la primera repita la última canción que sonó. */
function refillMenuSongQueue() {
  menuSongQueue = shuffle(MENU_SONGS);
  if (menuSongQueue.length > 1 && menuSongQueue[0] === lastMenuSong) {
    menuSongQueue.push(menuSongQueue.shift());
  }
}

/** Devuelve la siguiente canción de menú a reproducir, rellenando la
 * cola primero si se ha vaciado. */
function getNextMenuSong() {
  if (menuSongQueue.length === 0) refillMenuSongQueue();
  return menuSongQueue.shift();
}

/** Reproduce la siguiente canción de la cola de música de menú (no sube
 * mientras se está jugando una partida) y se reprograma a sí misma al
 * terminar, para que la música de menú siga sonando en bucle. */
function playRandomMenuSong(){
 if(screens.quiz.classList.contains('show')) return;
 if(!MENU_SONGS.length) return;
 const s=getNextMenuSong();
 lastMenuSong=s;
 menuAudio.src=s; menuAudio.volume=settings.musicVol;
 menuAudio.muted=!menuMusicUnlocked;
 menuAudio.onended=playRandomMenuSong;
 menuAudio.play().catch(()=>{});
}
/** Detiene y rebobina la música de menú. */
function stopMenuMusic(){menuAudio.pause();menuAudio.currentTime=0;}

// ── Helper genérico de sonido ambiente en bucle ──
// Usado por los eventos Pokémon que necesitan un sonido de fondo continuo
// (lluvia de Blastoise, ronquido de Snorlax...). Centraliza el arranque/
// parada de un elemento <audio> en bucle: si en el futuro se añade un
// evento nuevo con sonido ambiente, no hace falta duplicar el par de
// funciones otra vez, basta con llamar a estas dos con el elemento y la
// clave de AMBIENT_SFX que correspondan.
/** Arranca en bucle el sonido ambiente `src` sobre el elemento `el`
 * (fija la fuente la primera vez, aplica el volumen de SFX actual —
 * multiplicado por `volumeMultiplier` si se indica, para sonidos
 * ambiente que deben oírse más fuerte que el resto de SFX, con el
 * resultado siempre acotado a 1 (el máximo que admite <audio>) — y
 * reproduce desde el principio). */
function startAmbientLoop(el, src, volumeMultiplier) {
  try {
    if (!el.src) el.src = src;
    el.volume = Math.min(1, settings.sfxVol * (volumeMultiplier || 1));
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch (e) {}
}
/** Detiene y rebobina un sonido ambiente en bucle. */
function stopAmbientLoop(el) {
  try {
    el.pause();
    el.currentTime = 0;
  } catch (e) {}
}

// ── Sonido ambiente de lluvia (evento Blastoise) ──
// Suena en bucle mientras el overlay visual de lluvia está activo, y se
// detiene desde stopAudioHard() (ver más abajo) para cubrir todos los
// puntos donde la ronda/partida termina o cambia (siguiente ronda, salir
// del quiz, reiniciar partida, fin del Modo Historia, etc.).
const blastoiseRainAudio = document.getElementById('blastoise-rain-audio');
/** Arranca en bucle el sonido ambiente de lluvia asociado al evento
 * Pokémon de Blastoise. */
function startBlastoiseRainSound() { startAmbientLoop(blastoiseRainAudio, AMBIENT_SFX.rain); }
/** Detiene y rebobina el sonido ambiente de lluvia. */
function stopBlastoiseRainSound() { stopAmbientLoop(blastoiseRainAudio); }

// ── Sonido en bucle de ronquido (evento Snorlax) ──
// Suena en bucle, junto a la canción de la ronda, mientras Snorlax sigue
// dormido sobre las respuestas, y se detiene en cuanto el jugador lo
// despierta a base de toques (ver el evento "snorlax" en el catálogo de
// PokeEvents). También se detiene desde stopAudioHard() como red de
// seguridad, igual que el sonido de lluvia de Blastoise, para cubrir todos
// los puntos donde la ronda/partida termina o cambia antes de que el
// jugador llegue a despertarlo (siguiente ronda, salir del quiz, reiniciar
// partida, fin del Modo Historia, etc.).
const snorlaxSnoreAudio = document.getElementById('snorlax-snore-audio');
/** Arranca en bucle el sonido de ronquido asociado al evento Pokémon de
 * Snorlax (suena junto a la canción de la ronda), al doble de volumen
 * que el resto de SFX para que se note bien por encima de la canción. */
function startSnorlaxSnoreSound() { startAmbientLoop(snorlaxSnoreAudio, AMBIENT_SFX.snore, 2); }
/** Detiene y rebobina el sonido de ronquido de Snorlax. */
function stopSnorlaxSnoreSound() { stopAmbientLoop(snorlaxSnoreAudio); }

// ── Glitch de audio (evento Porygon) ──
// A diferencia de la lluvia de Blastoise o el ronquido de Snorlax (sonidos
// ambiente aparte, en bucle), este efecto no añade ningún audio nuevo: cada
// pocos segundos retrocede unas décimas de segundo la propia canción de la
// ronda, para que suene como un "salto"/tartamudeo digital, a juego con el
// resto del efecto visual de Porygon (letras corruptas, píxeles). Se
// detiene desde stopAudioHard() como red de seguridad, igual que el resto
// de sonidos de Eventos Pokémon, para cubrir todos los puntos donde la
// ronda/partida termina o cambia (siguiente ronda, salir del quiz, etc.).
let porygonAudioGlitchInterval = null;
/** Arranca el glitch de audio del evento Porygon sobre el `<audio>`
 * indicado (el de la ronda en curso): cada intervalo, si sigue
 * reproduciéndose, retrocede una fracción de segundo al azar. */
function startPorygonAudioGlitch(audioEl) {
  stopPorygonAudioGlitch(); // por seguridad, nunca debería haber uno colgado ya
  porygonAudioGlitchInterval = setInterval(() => {
    try {
      if (!audioEl || audioEl.paused || audioEl.ended) return;
      const jumpBack = 0.05 + Math.random() * 0.15; // retrocede entre 50 y 200ms
      audioEl.currentTime = Math.max(0, audioEl.currentTime - jumpBack);
    } catch (e) {}
  }, 2600); // antes 650ms; se espacian a una cuarta parte de frecuencia (intervalo x4)
}
/** Detiene el glitch de audio del evento Porygon. */
function stopPorygonAudioGlitch() {
  if (porygonAudioGlitchInterval) { clearInterval(porygonAudioGlitchInterval); porygonAudioGlitchInterval = null; }
}

// Arranca música de menú SOLO si no hay ya una sonando (evita reinicios al navegar por los menús)
function ensureMenuMusicPlaying(){
  if (screens.quiz.classList.contains('show')) return;
  if (!menuAudio.paused) return; // ya está sonando una canción de menú, la dejamos seguir
  playRandomMenuSong();
}
// Se llama en la primera interacción del usuario (click/tap/tecla) para
// quitar el silencio inicial, sin reiniciar ni cambiar la canción.
function unlockMenuMusic(){
  if (menuMusicUnlocked) return;
  menuMusicUnlocked = true;
  menuAudio.muted = false;
  // por si el autoplay (incluso silenciado) fue bloqueado del todo, la arrancamos ahora
  ensureMenuMusicPlaying();
}


// Elemento <audio> principal: reproduce tanto la canción de cada ronda del
// quiz como, reutilizándolo, las fichas de la Sonidex (nunca suenan a la vez).
const audio = document.getElementById('main-audio');
// "Contexto de audio" y "analizador" decorativos para el visualizador de
// ondas (ver WAVEFORM en game.js): no se conecta al audio real, solo se usa
// como bandera de que el visualizador puede dibujar (ver initAudioContext).
let audioCtx = null;
let analyser = null;
// Id del requestAnimationFrame del visualizador de ondas (drawWave, en
// game.js), guardado aquí porque el resto del motor de audio ya vive en
// este fichero; se declara aunque no se lea nunca desde aquí mismo.
let animFrame = null;

// Modo Difícil: temporizador de 10s por ronda. Antes la canción se pausaba
// a los 3s del preview; ahora el jugador dispone de 10s reales para
// responder y, si se agotan sin haber respondido, la ronda se da por
// fallada (igual que un fallo normal).
const HARD_ROUND_SECONDS = 10;
let hardRoundInterval = null;
let hardRoundTimeout = null;

/** Arranca la cuenta atrás visual del Modo Difícil (HARD_ROUND_SECONDS
 * segundos): actualiza el número en pantalla cada segundo y, si llega a
 * cero sin respuesta, fuerza una respuesta incorrecta automática. */
function startHardRoundTimer() {
  stopHardRoundTimer();
  const wrap = document.getElementById('hard-timer-wrap');
  const badge = document.getElementById('hard-timer-badge');
  const val = document.getElementById('hard-timer-val');
  if (!wrap || !badge || !val) return;

  let remaining = HARD_ROUND_SECONDS;
  val.textContent = remaining;
  badge.classList.remove('low');
  wrap.style.display = 'block';

  hardRoundInterval = setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    val.textContent = remaining;
    if (remaining <= 3) badge.classList.add('low');
  }, 1000);

  hardRoundTimeout = setTimeout(hardRoundTimeUp, HARD_ROUND_SECONDS * 1000);
}

/** Detiene la cuenta atrás del Modo Difícil y oculta su indicador. */
function stopHardRoundTimer() {
  clearInterval(hardRoundInterval);
  clearTimeout(hardRoundTimeout);
  hardRoundInterval = null;
  hardRoundTimeout = null;
  const wrap = document.getElementById('hard-timer-wrap');
  if (wrap) wrap.style.display = 'none';
}

// Se agotan los 10s de la ronda sin que el jugador haya respondido: cuenta
// como fallo (rompe la racha y revela la respuesta correcta), igual que
// tocar una opción incorrecta.
function hardRoundTimeUp() {
  stopHardRoundTimer();
  if (state.answered) return; // ya respondió justo antes de que se agotara el tiempo
  state.answered = true;

  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
  state.streak = 0;
  playSFX(SFX.wrong);
  const status = document.getElementById('audio-status');
  if (status) status.textContent = '⏱️ ¡Tiempo agotado!';
  updateStatsUI();

  setTimeout(() => {
    document.querySelectorAll('.answer-btn').forEach(b => {
      if (b.textContent === (session.questionType === "region" ? state.currentSong.region : state.currentSong.title)) {
        b.classList.add('reveal');
      }
    });
  }, 300);

  if (session.mode === GameMode.STORY) {
    loseLife();
    if (session.storyLives <= 0) return; // storyGameOver() ya se encarga de cortar la partida
    setTimeout(() => document.getElementById('next-btn').classList.add('visible'), 750);
    return;
  }

  if (session.mode === GameMode.INFINITE) {
    if (session.infiniteLives > 0) {
      session.infiniteLives--;
      renderLives();
      setTimeout(() => document.getElementById('next-btn').classList.add('visible'), 750);
    } else {
      setTimeout(() => showResult(), 900);
    }
    return;
  }

  setTimeout(() => document.getElementById('next-btn').classList.add('visible'), 750);
}

/** Inicializa el "contexto de audio" decorativo usado por el
 * visualizador de ondas (no intercepta el audio real, solo dibuja una
 * animación). */
function initAudioContext() {
  // Visualizador decorativo (no secuestramos el audio nativo).
  audioCtx = { state: 'running', resume: () => {} };
  analyser = null;
}

/** Reproduce un efecto de sonido puntual (aciertos, fallos, navegación...),
 * bajando brevemente el volumen de la música de fondo mientras suena
 * para que se oiga con claridad. */
function playSFX(src) {
  try {
    // bajar volumen canción mientras suena el efecto
    fadeVolume(audio, Math.max(0, settings.musicVol * 0.07), 150);

    const sfx = new Audio(src);
    sfx.volume = settings.sfxVol;
    sfx.play().catch(() => {});

    sfx.onended = () => fadeVolume(audio, settings.musicVol, 260);
    setTimeout(() => fadeVolume(audio, settings.musicVol, 260), 2500);
  } catch(e) {}
}

/** Transición suave del volumen de un elemento <audio> hasta `targetVol`
 * en `durationMs` milisegundos, en pequeños pasos (usado por playSFX). */
function fadeVolume(el, targetVol, durationMs) {
  const steps = 20;
  const interval = durationMs / steps;
  const startVol = el.volume;
  const delta = (targetVol - startVol) / steps;
  let step = 0;
  clearInterval(el._fadeTimer);
  el._fadeTimer = setInterval(() => {
    step++;
    el.volume = Math.min(1, Math.max(0, startVol + delta * step));
    if (step >= steps) {
      el.volume = targetVol;
      clearInterval(el._fadeTimer);
    }
  }, interval);
}

/** Corta por completo el audio de la ronda actual: cancela callbacks
 * pendientes (para que no arranque una canción "fantasma" tras salir
 * del quiz), para la música y los sonidos ambiente de eventos Pokémon. */
function stopAudioHard(){
  stopHardRoundTimer();
  // cancelamos los callbacks pendientes para que la canción de la ronda no
  // pueda arrancar más tarde (p. ej. si "canplaythrough" llega después de salir del quiz)
  audio.oncanplaythrough = null;
  audio.onerror = null;
  audio.pause();
  audio.currentTime = 0;
  stopBlastoiseRainSound();
  stopSnorlaxSnoreSound();
  stopJigglypuffSinging();
  stopPorygonAudioGlitch();
}

// ── Reproducción de fichas desde la Sonidex ──
// Reutiliza el elemento <audio> principal (libre mientras no hay una ronda en curso).
let sonidexCurrentFile = null;
let sonidexCurrentButtons = null; // { card, playBtn, stopBtn } de la ficha que suena ahora

/** Reproduce la ficha de una canción desde la pantalla Sonidex,
 * deteniendo primero cualquier otra ficha o la música de menú que
 * estuviera sonando. */
function playSonidexSong(song, card, playBtn, stopBtn) {
  // Si ya sonaba otra ficha, la paramos primero (sin reanudar aún la música de menú)
  if (sonidexCurrentFile && sonidexCurrentFile !== song.file) {
    stopSonidexPlayback(false);
  }

  // La música de menú se pausa antes de reproducir la canción de la ficha
  stopMenuMusic();

  audio.oncanplaythrough = null;
  audio.onerror = null;
  audio.pause();
  audio.currentTime = 0;
  audio.src = song.file;
  audio.volume = settings.musicVol;
  audio.onended = () => stopSonidexPlayback(true);
  audio.play().catch(() => {});

  sonidexCurrentFile = song.file;
  sonidexCurrentButtons = { card, playBtn, stopBtn };
  card.classList.add("playing");
  playBtn.style.display = "none";
  stopBtn.style.display = "";
}

/** Detiene la reproducción de una ficha de la Sonidex y restaura el
 * botón de "reproducir"; opcionalmente reanuda la música de menú. */
function stopSonidexPlayback(resumeMenuMusic) {
  audio.onended = null;
  audio.pause();
  audio.currentTime = 0;

  if (sonidexCurrentButtons) {
    sonidexCurrentButtons.card.classList.remove("playing");
    sonidexCurrentButtons.playBtn.style.display = "";
    sonidexCurrentButtons.stopBtn.style.display = "none";
    sonidexCurrentButtons = null;
  }
  sonidexCurrentFile = null;

  // Al parar la ficha, la música del menú se reanuda
  if (resumeMenuMusic) ensureMenuMusicPlaying();
}

