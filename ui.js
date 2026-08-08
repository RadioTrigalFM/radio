/* ══════════════════════════════════════════════════════════════════════
   RADIO TRIGAL FM — CAPA DE INTERFAZ (ui.js)
   ══════════════════════════════════════════════════════════════════════
   Este fichero agrupa TODO lo que "pinta cosas en pantalla": navegación
   entre pantallas, renderizado de tarjetas/listas (perfil, logros,
   Sonidex, vidas, botones de respuesta...), overlays/modales (perfil,
   Modo Historia, splash inicial, info de Eventos Pokémon...), el fondo
   animado (cielo/colinas) y el visualizador de ondas, los popups y
   partículas decorativas, y los efectos visuales concretos de los
   Eventos Pokémon Jigglypuff, Electrode y Porygon.

   La idea que separa "qué va aquí" de "qué se queda en game.js" es:
   si la función decide algo sobre las reglas del juego (puntuación,
   vidas, si se ha ganado, qué evento toca...) vive en game.js; si la
   función solo refleja en el DOM un estado que YA se decidió en otro
   sitio (pintar corazones, mostrar un overlay, animar partículas...)
   vive aquí. Por eso funciones como healLife()/loseLife() (deciden y
   mutan session.storyLives) se han quedado en game.js, mientras que
   renderLives()/updateNervousState() (solo pintan ese estado en los
   corazones) están aquí.

   Al ser un script clásico (sin módulos), todo lo que se declara aquí
   con `const`/`let`/`function` queda en el ámbito global de la página,
   exactamente igual que si siguiera estando dentro de game.js: game.js
   llama con total normalidad a showScreen(), renderProfileBar(),
   renderLives(), etc., como si las hubiera declarado él mismo.

   Este fichero, a su vez, usa funciones/datos de los que se cargan
   antes que él: `settings`/`profile`/`AVATAR_CATALOG`/`achievementsData`
   (storage.js), `playSFX`/`SFX`/`menuAudio`/`unlockMenuMusic`/`audio`
   (audio.js) y `PokeEvents`/`bgPokeLayer`/`clearPokeEventVisuals`
   (pokemon.js). También llama a funciones que se definen MÁS ADELANTE,
   en game.js (p. ej. `startGame`, `session`, `state`, `stopAudioHard`,
   `stopElectrodeTimer`) — esto es seguro porque esas llamadas ocurren
   siempre dentro de manejadores de eventos o de otras funciones, que
   solo se ejecutan cuando el jugador interactúa con la app, momento en
   el que game.js ya se ha cargado por completo.

   Por eso el orden de carga en index.html, al final de <body>, es
   importante y debe respetarse exactamente así:
     <script src="storage.js"></script>
     <script src="audio.js"></script>
     <script src="pokemon.js"></script>
     <script src="ui.js"></script>
     <script src="game.js"></script>

   No contiene marcado HTML ni reglas de estilo: la estructura vive en
   index.html y la presentación en styles.css; este fichero solo lee y
   modifica esos elementos ya existentes en el DOM (por eso puede hacer
   document.getElementById(...) directamente al ejecutarse, sin esperar
   a ningún evento de carga). Cada sección importante va precedida de
   una cabecera "═══" y cada función relevante lleva su propio
   comentario explicativo justo encima.
   ══════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
//  ⏱️ POPUP DE PUNTOS
// ═══════════════════════════════════════════════
// Popup flotante "+XX pts" junto al botón pulsado
function showPointsPopup(btn, points, multiplier) {
  const rect = btn.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'points-popup';
  el.style.left = (rect.left + rect.width / 2) + 'px';
  el.style.top = rect.top + 'px';
  el.innerHTML = `+${points}` + (multiplier > 1 ? `<span class="mult-tag">x${multiplier.toFixed(1)}</span>` : '');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ═══════════════════════════════════════════════
//  👤 PERFIL: BARRA SUPERIOR Y REJILLA DE AVATARES
// ═══════════════════════════════════════════════
// Rellena una rejilla de avatares (reutilizada en la pantalla inicial y en el
// modal de perfil) y devuelve un getter/setter para el avatar seleccionado.
// Los avatares todavía no desbloqueados (isAvatarUnlocked(), AVATAR_UNLOCKS
// — ambos en game.js, por nivel de perfil o por logro según el avatar) se
// pintan en gris con un candado y no son seleccionables: al tocarlos se
// muestra un aviso con el requisito que hace falta (avatarLockRequirementText()
// en game.js), igual que al pulsar un modo/minijuego bloqueado.
// Orden de pintado: de menor a mayor nivel requerido para los avatares
// desbloqueables por nivel; los desbloqueables por logro van después de
// esos (en el mismo orden en que aparecen en AVATAR_CATALOG); los avatares
// sin entrada en AVATAR_UNLOCKS están desbloqueados desde el nivel 1, así
// que van primero de todos (sort estable → no se reordenan entre sí).
const AVATAR_ACHIEVEMENT_SORT_WEIGHT = 1000;
function avatarSortWeight(avatarId) {
  const cfg = AVATAR_UNLOCKS[avatarId];
  if (!cfg) return 1;
  return typeof cfg.level === "number" ? cfg.level : AVATAR_ACHIEVEMENT_SORT_WEIGHT;
}
function renderAvatarGrid(gridEl, selectedId, onSelect) {
  gridEl.innerHTML = "";
  const sortedCatalog = [...AVATAR_CATALOG].sort((a, b) => avatarSortWeight(a.id) - avatarSortWeight(b.id));
  sortedCatalog.forEach(av => {
    const unlocked = isAvatarUnlocked(av.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "profile-avatar-option"
      + (av.id === selectedId ? " selected" : "")
      + (unlocked ? "" : " locked");
    btn.title = unlocked ? av.name : t("avatar.lockedTitle", { name: av.name, req: avatarLockRequirementText(av.id) });
    btn.innerHTML = `<img src="${av.url}" alt="${av.name}" loading="lazy" onerror="this.closest('.profile-avatar-option').style.display='none'">`
      + (unlocked ? "" : `<span class="avatar-lock-badge">🔒</span>`);
    btn.addEventListener("click", () => {
      if (!unlocked) {
        queueAchievementToasts([{ icon: "🔒", label: t("lock.badge"), title: t("avatar.lockedToast", { req: avatarLockRequirementText(av.id) }) }]);
        return;
      }
      gridEl.querySelectorAll(".profile-avatar-option.selected").forEach(el => el.classList.remove("selected"));
      btn.classList.add("selected");
      onSelect(av.id);
    });
    gridEl.appendChild(btn);
  });
}

/** Refresca la barra de perfil del menú principal: avatar, nombre y
 * la insignia con el nivel actual. Se llama tras cargar el perfil y
 * cada vez que cambia el nombre, el avatar o el nivel. */
function renderProfileBar() {
  const img = document.getElementById("profile-bar-avatar-img");
  const name = document.getElementById("profile-bar-name");
  const levelBadge = document.getElementById("profile-bar-level-badge");
  if (img) img.src = getAvatarUrl(profile.avatarId);
  if (name) name.textContent = profile.username || t("common.trainerDefault");
  if (levelBadge) levelBadge.textContent = computeLevelInfo(profile.xp).level;
}

// ═══════════════════════════════════════════════
//  🧭 ROUTER DE PANTALLAS
// ═══════════════════════════════════════════════
const screens = {
  home: document.getElementById("screen-home"),
  mainModes: document.getElementById("screen-main-modes"),
  regionSelect: document.getElementById("screen-region-select"),
  otherGames: document.getElementById("screen-other-games"),
  openingsLangSelect: document.getElementById("screen-openings-lang-select"),
  options: document.getElementById("screen-options"),
  achievements: document.getElementById("screen-achievements"),
  sonidex: document.getElementById("screen-sonidex"),
  leaderboard: document.getElementById("screen-leaderboard"),
  guide: document.getElementById("screen-guide"),
  quiz: document.getElementById("screen-quiz"),
};
const backBtn = document.getElementById("back-btn");
const statsWrap = document.getElementById("stats-wrap");
const appHeader = document.getElementById("app-header");

let navStack = ["home"];
/**
 * Cambia la pantalla visible de la app (navegación principal).
 * @param {string} name  clave de `screens` (home, mainModes, quiz, ...)
 * @param {boolean} push  si true, añade la pantalla actual a la pila de
 *                        navegación para poder volver atrás con el botón
 *                        "Atrás" (false se usa al navegar sin apilar,
 *                        p. ej. al salir de una partida).
 * Además de mostrar/ocultar el `<section class="screen">` correspondiente,
 * se encarga de la limpieza de estado necesaria al cambiar de pantalla:
 * detener la ficha de la Sonidex si sonaba, apagar el evento Pokémon
 * visual activo si veníamos del quiz, etc.
 */
function showScreen(name, push=true) {
  // si salimos de la Sonidex con una ficha sonando, la paramos y reanudamos la música de menú
  if (screens.sonidex.classList.contains("show") && name !== "sonidex" && sonidexCurrentFile) {
    stopSonidexPlayback(true);
  }

  // Si salimos del quiz hacia cualquier otra pantalla (botón Atrás, "Salir",
  // Game Over, cambio de fase/región del Modo Historia...) mientras había un
  // Evento Pokémon activo (Hypno, Gengar...), su efecto visual no debe
  // seguir viéndose fuera de la ronda. Se limpia aquí, de forma centralizada,
  // para cubrir TODOS los caminos de salida y no solo los que ya se tenían
  // en cuenta uno a uno.
  if (screens.quiz.classList.contains("show") && name !== "quiz" && typeof clearPokeEventVisuals === "function") {
    clearPokeEventVisuals();
  }

  Object.values(screens).forEach(s => s.classList.remove("show"));
  screens[name].classList.add("show");

  // stats solo durante quiz
  const inQuiz = (name === "quiz");
  statsWrap.style.display = inQuiz ? "flex" : "none";
  if (!inQuiz) { stopElectrodeTimer(); stopHardRoundTimer(); stopPorygonTextGlitch(); }

  // back button
  if (name === "home") {
    backBtn.style.display = "none";
    navStack = ["home"];
  } else {
    backBtn.style.display = "inline-flex";
    if (push) navStack.push(name);
  }

  // Sin el logo, la tarjeta del header queda vacía en la pantalla de inicio: se oculta
  appHeader.style.display = (name === "home") ? "none" : "flex";
}

// Aplica la navegación real de "Atrás": parar el audio de la ronda si
// salimos del quiz y mostrar la pantalla anterior de la pila. Separada del
// listener del botón para poder posponerla hasta que el jugador confirme,
// en el caso del aviso de salida del Modo Historia (ver más abajo).
function goBackFromCurrentScreen() {
  const leavingQuiz = navStack[navStack.length - 1] === "quiz";
  if (leavingQuiz) stopAudioHard();

  if (navStack.length <= 1) {
    showScreen("home", false);
  } else {
    navStack.pop();
    const prev = navStack[navStack.length - 1] || "home";
    showScreen(prev, false);
  }

  // la música del menú debe seguir sonando sin reiniciarse; solo arranca si no estaba sonando
  ensureMenuMusicPlaying();
}

const leaveStoryConfirmOverlay = document.getElementById('leave-story-confirm-overlay');
const leaveStoryKeepBtn = document.getElementById('leave-story-keep-btn');
const leaveStoryExitBtn = document.getElementById('leave-story-exit-btn');

// Muestra el aviso de "¿Salir del Modo Historia?" y solo llama a
// onConfirmExit() si el jugador confirma que quiere salir igualmente.
// Si pulsa "Seguir jugando", simplemente se cierra el aviso y la ronda
// continúa exactamente como estaba.
function showLeaveStoryConfirm(onConfirmExit) {
  leaveStoryConfirmOverlay.classList.add('show');

  function onKeep() {
    playSFX(SFX.go);
    cleanup();
  }
  function onExit() {
    cleanup();
    onConfirmExit();
  }
  function cleanup() {
    leaveStoryConfirmOverlay.classList.remove('show');
    leaveStoryKeepBtn.removeEventListener('click', onKeep);
    leaveStoryExitBtn.removeEventListener('click', onExit);
  }

  leaveStoryKeepBtn.addEventListener('click', onKeep);
  leaveStoryExitBtn.addEventListener('click', onExit);
}

backBtn.addEventListener("click", () => {
  playSFX(SFX.back);

  const leavingQuiz = navStack[navStack.length - 1] === "quiz";

  // Modo Historia no guarda progreso a mitad de región/combate: si el
  // jugador pulsa "Atrás" mientras está jugando una ronda, pedimos
  // confirmación antes de abandonar, avisando de que la próxima partida
  // tendrá que empezar desde Kanto.
  if (leavingQuiz && session.mode === GameMode.STORY) {
    showLeaveStoryConfirm(goBackFromCurrentScreen);
    return;
  }

  goBackFromCurrentScreen();
});

// ═══════════════════════════════════════════════
//  🔒 BLOQUEOS DE MODOS Y CATEGORÍAS (candados en los botones)
// ═══════════════════════════════════════════════
/** Texto del requisito de desbloqueo para un botón bloqueado, a partir de
 * su config en MODE_UNLOCKS/OTHER_UNLOCKS: por nivel de perfil (solo
 * aplica a Modos, que son los únicos que usan `cfg.level`) o por logro.
 * `levelFmt`/`achievementFmt` dan la redacción exacta que quiere cada
 * sitio que lo usa (el candado del botón y el aviso emergente usan
 * frases distintas para el mismo dato). `translatedReqTitle` es el
 * nombre del logro ya traducido (ver `${i18nPrefix}.${key}.reqTitle` en
 * i18n.js), para no colar el texto en español de `cfg.reqTitle`
 * directamente en el aviso. */
function lockReqText(cfg, translatedReqTitle, levelFmt, achievementFmt) {
  return typeof cfg.level === "number" ? levelFmt(cfg.level) : achievementFmt(translatedReqTitle);
}

/** Sincroniza el aspecto de un conjunto de botones bloqueables (Modos o
 * categorías de Minijuegos) con su estado de desbloqueo actual: añade/
 * quita la clase "locked" y el texto de requisito ("🔒 ..."). `getBtn`
 * decide cómo localizar el botón de cada clave de `unlocksMap` (por id
 * fijo en Modos, por atributo `data-other` en Minijuegos). `i18nPrefix`
 * ("modeUnlock"/"otherUnlock") es el prefijo usado en i18n.js para
 * traducir `cfg.reqTitle` cuando el requisito es un logro. */
function updateLocksUI(unlocksMap, isUnlockedFn, getBtn, i18nPrefix) {
  Object.keys(unlocksMap).forEach(key => {
    const cfg = unlocksMap[key];
    const btn = getBtn(key, cfg);
    if (!btn) return;
    const unlocked = isUnlockedFn(key);
    btn.classList.toggle("locked", !unlocked);
    let reqEl = btn.querySelector(".lock-req");
    if (!unlocked) {
      if (!reqEl) {
        reqEl = document.createElement("small");
        reqEl.className = "lock-req";
        btn.appendChild(reqEl);
      }
      reqEl.textContent = "🔒 " + lockReqText(cfg, tData(`${i18nPrefix}.${key}.reqTitle`, cfg.reqTitle),
        level => t("lock.levelReqBadge", { level }),
        title => t("lock.achievementReqBadge", { title }));
    } else if (reqEl) {
      reqEl.remove();
    }
  });
}
/** Sincroniza el aspecto de los botones de modo con su estado de
 * desbloqueo (candado + texto de requisito). */
function updateModeLocksUI() {
  updateLocksUI(MODE_UNLOCKS, isModeUnlocked, (key, cfg) => document.getElementById(cfg.btnId), "modeUnlock");
}
/** Igual que updateModeLocksUI pero para los botones de categorías de
 * Minijuegos (atributo data-other). */
function updateOtherLocksUI() {
  updateLocksUI(OTHER_UNLOCKS, isOtherUnlocked, key => document.querySelector(`[data-other="${key}"]`), "otherUnlock");
}

/** Muestra un aviso emergente ("toast" de candado) explicando qué falta
 * para desbloquear un botón bloqueado de `unlocksMap` (Modos o
 * Minijuegos), al pulsarlo. `i18nPrefix` — ver `updateLocksUI`. */
function showLockedMessage(unlocksMap, key, i18nPrefix) {
  const cfg = unlocksMap[key];
  if (!cfg) return;
  const title = lockReqText(cfg, tData(`${i18nPrefix}.${key}.reqTitle`, cfg.reqTitle),
    level => t("lock.levelReqToast", { level }),
    reqTitle => t("lock.achievementReqToast", { title: reqTitle }));
  queueAchievementToasts([{ icon: "🔒", label: t("lock.badge"), title }]);
}
/** Aviso emergente al intentar entrar en un modo de juego todavía
 * bloqueado. */
function showLockedModeMessage(key) { showLockedMessage(MODE_UNLOCKS, key, "modeUnlock"); }
// ═══════════════════════════════════════════════
//  ♾️ INTERRUPTORES DE MODO INFINITO POR BOTÓN DE MODO
// ═══════════════════════════════════════════════
/** Sincroniza el aspecto visual (activo/inactivo) de los pequeños
 * interruptores ♾️ de los botones Fácil/Normal/Difícil/Combate con el
 * estado ya decidido en `endlessToggle` (game.js): no decide nada, solo
 * refleja ese estado en el DOM (clase "active" + `aria-pressed`). Se
 * llama tras cada click del interruptor y una vez en el INIT de
 * game.js. */
/** Sincroniza el aspecto visual (activo/inactivo) de los pequeños
 * interruptores ♾️ de los botones Fácil/Normal/Difícil/Combate y de las
 * categorías de Minijuegos con el estado ya decidido en
 * `endlessToggle`/`otherEndlessToggle` (game.js): no decide nada, solo
 * refleja ese estado en el DOM (clase "active" + `aria-pressed`). Se
 * llama tras cada click de cualquiera de esos interruptores y una vez
 * en el INIT de game.js. */
function renderEndlessTogglesUI() {
  const syncToggles = (toggleState, idPrefix) => {
    Object.keys(toggleState).forEach(key => {
      const el = document.getElementById(`${idPrefix}-${key}-endless`);
      if (!el) return;
      const active = !!toggleState[key];
      el.classList.toggle("active", active);
      el.setAttribute("aria-pressed", String(active));
    });
  };
  syncToggles(endlessToggle, "mode");
  syncToggles(otherEndlessToggle, "other");
}

const endlessInfoOverlay = document.getElementById('endless-info-overlay');
const endlessInfoOkBtn = document.getElementById('endless-info-ok-btn');
const endlessInfoDontShowCheckbox = document.getElementById('endless-info-dont-show');

/** Muestra el aviso de "modo infinito activado" (rondas sin límite, un
 * fallo termina la partida) al pulsar el interruptor ♾️ de un botón de
 * modo. No hace nada si el jugador ya marcó antes "No volver a mostrar"
 * (`settings.hideEndlessInfo`, ver storage.js). Solo pinta el aviso: la
 * decisión de CUÁNDO llamarla (al activar el interruptor, no al
 * desactivarlo) vive en `setupEndlessToggle()` (game.js). */
function showEndlessInfoModal() {
  if (settings.hideEndlessInfo) return;
  endlessInfoDontShowCheckbox.checked = false;
  endlessInfoOverlay.classList.add('show');
}
/** Cierra el aviso de "modo infinito activado" y, si el jugador marcó la
 * casilla "No volver a mostrar", persiste esa preferencia para que el
 * aviso deje de aparecer en cualquier modo de juego. */
function closeEndlessInfoModal() {
  if (endlessInfoDontShowCheckbox.checked) {
    settings.hideEndlessInfo = true;
    saveSettings();
  }
  endlessInfoOverlay.classList.remove('show');
}
endlessInfoOkBtn.addEventListener('click', () => { playSFX(SFX.back); closeEndlessInfoModal(); });
endlessInfoOverlay.addEventListener('click', (e) => { if (e.target === endlessInfoOverlay) closeEndlessInfoModal(); });

/** Aviso emergente al intentar entrar en una categoría de Minijuegos
 * todavía bloqueada. */
function showLockedOtherMessage(key) { showLockedMessage(OTHER_UNLOCKS, key, "otherUnlock"); }

// ═══════════════════════════════════════════════
//  🏅 LOGROS: AVISOS (TOASTS) Y PARTÍCULAS
// ═══════════════════════════════════════════════
// ── Animación de logro desbloqueado ──
let achToastQueue = [];
let achToastShowing = false;
/** Añade uno o varios avisos (logro, subida de nivel, modo desbloqueado...)
 * a la cola de notificaciones y arranca su procesado si no había ya uno
 * en pantalla. Cada aviso puede traer su propia `label` (el texto
 * pequeño de arriba, p. ej. "Logro desbloqueado" o "Subida de nivel");
 * si no la trae, se usa "Aviso" para no dar a entender que todo es un
 * logro conseguido. También puede traer una `image` (URL) en vez de
 * `icon` (emoji) — usado por el desbloqueo de avatar, para mostrar la
 * imagen real del avatar en vez de un emoticono genérico. */
function queueAchievementToasts(list) {
  achToastQueue.push(...list);
  processAchToastQueue();
}
/** Muestra el siguiente aviso de la cola (si hay alguno y no hay ya uno
 * visible) y se reprograma a sí mismo para el siguiente en cuanto el
 * actual termina su animación. */
function processAchToastQueue() {
  if (achToastShowing || achToastQueue.length === 0) return;
  achToastShowing = true;
  const a = achToastQueue.shift();
  const toast = document.getElementById("achievement-toast");
  document.getElementById("ach-toast-icon").innerHTML = a.image
    ? `<img src="${a.image}" alt="">`
    : "";
  if (!a.image) document.getElementById("ach-toast-icon").textContent = a.icon;
  document.getElementById("ach-toast-label").textContent = a.label || "Aviso";
  document.getElementById("ach-toast-title").textContent = a.title;
  toast.classList.add("show");
  spawnAchievementParticles();
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { achToastShowing = false; processAchToastQueue(); }, 500);
  }, 2600);
}
/** Helper genérico de partículas decorativas: comprueba el ajuste
 * `settings.particles`, y lanza `count` divs `.particle` con un emoji al
 * azar de `emojis`, dispersos alrededor de (cx, cy) según `spread`
 * (horizontal) y `spreadY` (vertical, opcional), con tamaño en el rango
 * `sizeRange` y un pequeño retardo escalonado (`delayStep`) entre cada
 * una. Cada partícula se autoelimina a los 4s. Usado por
 * spawnAchievementParticles, spawnLogoParticles y spawnParticles, que
 * son wrappers finos de este helper con sus propios parámetros. */
function spawnParticleBurst({ cx, cy, emojis, count, spread, sizeRange, delayStep, spreadY = 0 }) {
  if (!settings.particles) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left = (cx + (Math.random() - 0.5) * spread) + "px";
    p.style.top = (cy + (spreadY ? (Math.random() - 0.5) * spreadY : 0)) + "px";
    p.style.animationDelay = (i * delayStep) + "s";
    p.style.fontSize = (sizeRange[0] + Math.random() * sizeRange[1]) + "rem";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

/** Lanza una pequeña explosión de partículas decorativas (emoji) al
 * mostrar un aviso de logro/nivel, si el ajuste de partículas está
 * activado. */
function spawnAchievementParticles() {
  spawnParticleBurst({
    cx: window.innerWidth / 2, cy: 60,
    emojis: ["🏅", "⭐", "✨", "🎉"],
    count: 10, spread: 180, sizeRange: [0.9, 0.9], delayStep: 0.05,
  });
}

// ── Reacción visual al tocar el logo del menú principal ──
function spawnLogoParticles(el) {
  const rect = el.getBoundingClientRect();
  spawnParticleBurst({
    cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2,
    emojis: ["🎵", "✨", "🎶", "⭐"],
    count: 8, spread: 90, spreadY: 40, sizeRange: [0.9, 0.7], delayStep: 0.04,
  });
}
const homeHeroLogo = document.getElementById("home-hero-logo");
if (homeHeroLogo) {
  homeHeroLogo.addEventListener("click", () => {
    homeHeroLogo.classList.remove("logo-clicked");
    void homeHeroLogo.offsetWidth; // fuerza reflow para poder reiniciar la animación
    homeHeroLogo.classList.add("logo-clicked");
    spawnLogoParticles(homeHeroLogo);
    playSFX(SFX.go);
  });
  homeHeroLogo.addEventListener("animationend", () => homeHeroLogo.classList.remove("logo-clicked"));
}

// ── Contenedor explicativo de la función que desbloquea un logro ──
const achFeatureOverlay = document.getElementById("ach-feature-overlay");
const achFeatureBox = document.getElementById("ach-feature-box");
/** Muestra el overlay que explica qué funciones (modos, categorías...)
 * desbloquea un logro concreto, al pulsar sobre él en la pantalla de
 * Logros. */
function showAchFeatureInfo(achievement, feats) {
  const achTitle = tData(`achv.${achievement.id}.title`, achievement.title);
  document.getElementById("ach-feature-title").textContent = `«${achTitle}» ${t("feature.unlocksLabel")}`;
  document.getElementById("ach-feature-list").innerHTML = feats.map(f => `
    <div class="ach-feature-item">
      <span>${f.icon}</span>
      <span>${f.name}</span>
      <span class="ach-feature-type">(${f.type})</span>
    </div>
  `).join("");
  achFeatureOverlay.classList.add("show");
}
/** Cierra el overlay de información de un logro. */
function hideAchFeatureInfo() {
  achFeatureOverlay.classList.remove("show");
}
achFeatureOverlay.addEventListener("click", hideAchFeatureInfo);
achFeatureBox.addEventListener("click", (e) => e.stopPropagation());

// ═══════════════════════════════════════════════
//  🏅 PANTALLA DE LOGROS, 🎧 SONIDEX, 🖼 FONDO ANIMADO Y 🌊 WAVEFORM
// ═══════════════════════════════════════════════
// ── Pantalla de logros ──
function renderStreaksCard() {
  const s = achievementsData.stats;
  const wrap = document.getElementById("streaks-list");
  let html = "";

  html += `<div class="streak-group-title">${t("streaks.easyMode")}</div>`;
  html += `<div class="streak-row"><div class="streak-name">${t("streaks.easyLabel")}</div><div class="streak-value">🔥 ${s.bestStreakEasy || 0}</div></div>`;

  html += `<div class="streak-group-title">${t("streaks.hardMode")}</div>`;
  html += `<div class="streak-row"><div class="streak-name">${t("streaks.hardLabel")}</div><div class="streak-value">🔥 ${s.bestStreakHard || 0}</div></div>`;

  html += `<div class="streak-group-title">${t("streaks.combatMode")}</div>`;
  html += `<div class="streak-row"><div class="streak-name">${t("streaks.combatLabel")}</div><div class="streak-value">🔥 ${(s.bestStreakByRegion && s.bestStreakByRegion["Combate"]) || 0}</div></div>`;

  html += `<div class="streak-group-title">${t("streaks.infiniteMode")}</div>`;
  html += `<div class="streak-row"><div class="streak-name">${t("streaks.infiniteLabel")}</div><div class="streak-value">🔥 ${s.bestStreakInfinite || 0}</div></div>`;

  html += `<div class="streak-group-title">${t("streaks.normalByRegion")}</div>`;
  REGIONS.forEach(r => {
    const best = (s.bestStreakByRegion && s.bestStreakByRegion[r]) || 0;
    html += `<div class="streak-row"><div class="streak-name">🗺️ ${regionDisplayName(r)}</div><div class="streak-value">🔥 ${best}</div></div>`;
  });

  wrap.innerHTML = html;
}

/** Construye el HTML de una tarjeta de logro individual (icono, título,
 * descripción y fecha de desbloqueo si procede), usado dentro de cada
 * sección de renderAchievementsScreen(). No añade listeners: quien llama
 * decide si hace falta engancharlos (p. ej. el aviso de función especial). */
function achievementItemHTML(a, unlockedAt, feats) {
  const title = tData(`achv.${a.id}.title`, a.title);
  const desc = tData(`achv.${a.id}.desc`, a.desc);
  return `
    <div class="ach-icon">${unlockedAt ? a.icon : "🔒"}${feats.length ? `<span class="ach-star-badge" title="${t("ach.starBadgeTooltip")}">⭐</span>` : ""}</div>
    <div class="ach-info">
      <div class="ach-title">${title}</div>
      <div class="ach-desc">${desc}</div>
      ${unlockedAt ? `<div class="ach-date">${t("ach.unlockedOn", { date: new Date(unlockedAt).toLocaleDateString(settings.language === "en" ? "en-US" : "es-ES") })}</div>` : ""}
    </div>
  `;
}

/** Reconstruye por completo la pantalla de Logros: tarjeta de rachas,
 * barra de progreso general y la lista de logros agrupada por secciones
 * plegables (ACHIEVEMENT_SECTIONS, en game.js) en vez de una única rejilla
 * plana, para que no se vean los ~60 logros todos amontonados a la vez. */
function renderAchievementsScreen() {
  renderStreaksCard();
  const list = document.getElementById("achievements-list");
  list.innerHTML = "";
  let unlockedCount = 0;

  ACHIEVEMENT_SECTIONS.forEach(sec => {
    const items = ACHIEVEMENTS.filter(a => a.section === sec.id);
    if (!items.length) return;
    let sectionUnlocked = 0;

    const itemsHTML = items.map(a => {
      const unlockedAt = achievementsData.unlocked[a.id];
      if (unlockedAt) { unlockedCount++; sectionUnlocked++; }
      const feats = getFeatureUnlocksForAchievement(a.id);
      const clickable = feats.length ? ` data-ach-id="${a.id}"` : "";
      return `<div class="ach-item ${unlockedAt ? "unlocked" : "locked"}${feats.length ? " has-feature" : ""}"${clickable}>${achievementItemHTML(a, unlockedAt, feats)}</div>`;
    }).join("");

    const details = document.createElement("details");
    details.className = "ach-section";
    details.open = false; // todas las secciones empiezan plegadas, mostrando solo el título
    details.innerHTML = `
      <summary class="ach-section-summary">
        <span class="ach-section-icon">${sec.icon}</span>
        <span class="ach-section-title">${tData(`achSection.${sec.id}.title`, sec.title)}</span>
        <span class="ach-section-count">${sectionUnlocked} / ${items.length}</span>
        <span class="ach-section-chevron">▾</span>
      </summary>
      <div class="ach-list">${itemsHTML}</div>
    `;
    // Los logros con función especial (marca ⭐) abren el modal informativo
    // al tocarlos; se engancha aquí para no meter onclick="" en el HTML.
    details.querySelectorAll(".ach-item[data-ach-id]").forEach(el => {
      const a = ACHIEVEMENTS.find(x => x.id === el.dataset.achId);
      const feats = getFeatureUnlocksForAchievement(a.id);
      el.addEventListener("click", () => showAchFeatureInfo(a, feats));
    });
    list.appendChild(details);
  });

  document.getElementById("ach-progress-subtitle").textContent = t("achievements.progress", { n: unlockedCount, total: ACHIEVEMENTS.length });
  document.getElementById("ach-progress-bar-fill").style.width = (unlockedCount / ACHIEVEMENTS.length * 100) + "%";
}
/** Actualiza el resumen "X / Y desbloqueados" que se muestra en la
 * pantalla de Inicio. */
function updateHomeAchievementSummary() {
  const unlockedCount = Object.keys(achievementsData.unlocked).length;
  const el = document.getElementById("home-ach-summary");
  if (el) el.textContent = t("achievements.progress", { n: unlockedCount, total: ACHIEVEMENTS.length });
}

// ═══════════════════════════════════════════════
//  🏆 PANTALLA DE CLASIFICACIONES
// ═══════════════════════════════════════════════
// Las categorías de clasificación disponibles (deben coincidir con las
// claves de LEADERBOARD_CATEGORIES en leaderboard.js): id → cómo
// formatear el valor (nivel o puntuación) en cada fila de la tabla.
const LEADERBOARD_TABS = {
  level:    { formatValue: v => `Nv. ${v || 1}` },
  infinite: { formatValue: v => `💰 ${v || 0}` },
  story:    { formatValue: v => `💰 ${v || 0}` },
  hard:     { formatValue: v => `💰 ${v || 0}` },
  combat:   { formatValue: v => `💰 ${v || 0}` },
};
// Formato por defecto para categorías que no están explícitas en
// LEADERBOARD_TABS: las 7 subcategorías "region_<Región>" de la pestaña
// "Regiones" (una por región de REGIONS, ver renderLeaderboardRegionTabs()
// más abajo). No tiene sentido listarlas aquí una a una: comparten el
// mismo formato de puntuación que infinite/story/hard/combat.
const LEADERBOARD_DEFAULT_TAB = { formatValue: v => `💰 ${v || 0}` };
// Categoría actualmente seleccionada en la pantalla de Clasificaciones.
// Para las regiones vale "region_<Región>" (p. ej. "region_Kanto"), igual
// que las claves de LEADERBOARD_CATEGORIES en leaderboard.js — nunca el
// id "regions" del botón de pestaña, que es solo un agrupador visual.
let leaderboardActiveCategory = "level";
// Región seleccionada la última vez que se abrió la pestaña "Regiones"
// (una de REGIONS, definida en game.js), para reabrir esa misma región
// si el jugador vuelve a pulsar "Regiones" tras mirar otra categoría, en
// vez de resetear siempre a la primera. null hasta la primera vez que se
// entra en "Regiones".
let leaderboardActiveRegion = null;

// Se incrementa en cada llamada a renderLeaderboardScreen() para poder
// descartar una respuesta de Leaderboard.fetchTop() que llega tarde (p.
// ej. si el jugador cambia de pestaña o entra y sale varias veces
// seguidas de la pantalla antes de que responda la primera petición):
// solo se pinta la respuesta cuya "ficha" siga siendo la más reciente
// pedida.
let leaderboardRenderToken = 0;

/** Devuelve el icono de medalla para los tres primeros puestos de la
 * clasificación global; el resto de puestos muestran solo el número. */
function leaderboardRankIcon(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

/** Pinta en la tarjeta "Tus récords" los récords personales (nivel de
 * jugador, Desafío Infinito, Modo Historia, Modo Difícil, Modo Combate y
 * uno por cada región del Modo Normal), que ya se tienen en local y no
 * requieren pedirlos al backend. */
function renderLeaderboardPersonalBests() {
  const levelEl = document.getElementById("leaderboard-personal-level");
  if (levelEl) levelEl.textContent = computeLevelInfo(profile.xp).level;
  const infiniteEl = document.getElementById("leaderboard-personal-infinite");
  if (infiniteEl) infiniteEl.textContent = achievementsData.stats.bestInfiniteScore || 0;
  const storyEl = document.getElementById("leaderboard-personal-story");
  if (storyEl) storyEl.textContent = achievementsData.stats.bestStoryScore || 0;
  const hardEl = document.getElementById("leaderboard-personal-hard");
  if (hardEl) hardEl.textContent = achievementsData.stats.bestHardScore || 0;
  const combatEl = document.getElementById("leaderboard-personal-combat");
  if (combatEl) combatEl.textContent = achievementsData.stats.bestCombatScore || 0;

  // Un récord por región (Modo Normal): se genera aquí, no como filas
  // fijas en index.html, porque depende de REGIONS/regionDisplayName
  // (game.js/i18n.js, que cargan después que ui.js) — seguro porque esta
  // función solo se ejecuta al abrir la pantalla de Clasificaciones,
  // nunca durante la carga inicial de la página. Mismo criterio de fila
  // (streak-row) que renderStreaksCard().
  const regionsWrap = document.getElementById("leaderboard-personal-regions");
  if (regionsWrap) {
    const bestByRegion = achievementsData.stats.bestRegionScore || {};
    regionsWrap.innerHTML = REGIONS.map(r => `
      <div class="streak-row">
        <div class="streak-name">🗺️ ${regionDisplayName(r)}</div>
        <div class="streak-value">💰 ${bestByRegion[r] || 0}</div>
      </div>
    `).join("");
  }
}

/** Genera los 7 botones de subcategoría (uno por región) que se
 * muestran al pulsar la pestaña "Regiones" de Clasificaciones. Va en su
 * propia función (no como marcado fijo en index.html) por lo mismo que
 * la lista de récords por región de renderLeaderboardPersonalBests():
 * depende de REGIONS/REGION_META/regionDisplayName, de game.js, que
 * carga después que ui.js — seguro porque solo se llama al entrar en la
 * pantalla de Clasificaciones. */
function renderLeaderboardRegionTabs() {
  const wrap = document.getElementById("leaderboard-region-tabs");
  // Se reconstruye en cada llamada (no solo la primera vez): son solo 7
  // botones, y así sus etiquetas (regionDisplayName) se mantienen
  // correctas si el jugador cambia de idioma con esta pantalla abierta
  // (ver refreshLanguageDependentUI(), que vuelve a llamar a
  // renderLeaderboardScreen() en ese caso).
  if (!wrap) return;
  wrap.innerHTML = REGIONS.map(r => {
    const meta = REGION_META[r] || { icon: "🎮" };
    return `<button class="leaderboard-tab" data-region="${r}">${meta.icon} ${regionDisplayName(r)}</button>`;
  }).join("");
  wrap.querySelectorAll(".leaderboard-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const category = "region_" + btn.dataset.region;
      if (category === leaderboardActiveCategory) return;
      playSFX(SFX.go);
      leaderboardActiveRegion = btn.dataset.region;
      leaderboardActiveCategory = category;
      renderLeaderboardScreen();
    });
  });
}

/** Reconstruye la pantalla de Clasificaciones para la categoría
 * seleccionada (`leaderboardActiveCategory`). Los récords personales se
 * pintan al instante (ya los tenemos en local); el top 50 global de esa
 * categoría se pide de forma asíncrona a Leaderboard.fetchTop() y se
 * pinta en cuanto llega, mostrando un mensaje mientras carga o si no hay
 * datos/backend todavía (ver leaderboard.js). */
function renderLeaderboardScreen() {
  renderLeaderboardPersonalBests();
  renderLeaderboardRegionTabs();

  const tabsEl = document.getElementById("leaderboard-tabs");
  const regionTabsEl = document.getElementById("leaderboard-region-tabs");
  const statusEl = document.getElementById("leaderboard-status");
  const listEl = document.getElementById("leaderboard-list");
  if (!statusEl || !listEl) return;

  // true si la subcategoría activa es una de las 7 regiones (nunca el
  // id "regions" en sí, que es solo el botón agrupador — ver comentario
  // de leaderboardActiveCategory más arriba).
  const isRegionCategory = leaderboardActiveCategory.indexOf("region_") === 0;

  if (tabsEl) {
    tabsEl.querySelectorAll(".leaderboard-tab").forEach(btn => {
      const active = btn.dataset.category === "regions" ? isRegionCategory : btn.dataset.category === leaderboardActiveCategory;
      btn.classList.toggle("active", active);
    });
  }
  if (regionTabsEl) {
    regionTabsEl.style.display = isRegionCategory ? "flex" : "none";
    regionTabsEl.querySelectorAll(".leaderboard-tab").forEach(btn => {
      btn.classList.toggle("active", ("region_" + btn.dataset.region) === leaderboardActiveCategory);
    });
  }

  const tab = LEADERBOARD_TABS[leaderboardActiveCategory] || LEADERBOARD_DEFAULT_TAB;
  statusEl.textContent = t("leaderboard.loading");
  listEl.innerHTML = "";

  const requestToken = ++leaderboardRenderToken;
  Leaderboard.fetchTop(leaderboardActiveCategory, 50).then(top => {
    if (requestToken !== leaderboardRenderToken) return; // respuesta obsoleta, ya no aplica

    if (top === null) {
      statusEl.textContent = t("leaderboard.error");
      return;
    }
    if (top.length === 0) {
      statusEl.textContent = t("leaderboard.empty");
      return;
    }
    statusEl.textContent = "";
    listEl.innerHTML = top.slice(0, 50).map((entry, i) => `
      <div class="leaderboard-row">
        <div class="leaderboard-rank">${leaderboardRankIcon(i + 1)}</div>
        <div class="profile-avatar-frame leaderboard-avatar"><img src="${getAvatarUrl(entry.avatarId)}" alt=""></div>
        <div class="leaderboard-name">${entry.username || "???"}</div>
        <div class="leaderboard-score">${tab.formatValue(entry.value)}</div>
      </div>
    `).join("");
  });
}

// Cambiar de pestaña vuelve a pintar la pantalla con la categoría elegida.
document.getElementById("leaderboard-tabs")?.querySelectorAll(".leaderboard-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    // El botón "Regiones" no es una categoría real de LEADERBOARD_CATEGORIES
    // (leaderboard.js): agrupa las 7 subcategorías "region_<Región>" y, al
    // pulsarlo, abre la última región vista (leaderboardActiveRegion) o,
    // la primera vez, la primera de REGIONS (game.js — seguro referenciarla
    // aquí porque este listener solo se dispara con la página ya cargada).
    const isRegionsBtn = btn.dataset.category === "regions";
    const targetCategory = isRegionsBtn ? ("region_" + (leaderboardActiveRegion || REGIONS[0])) : btn.dataset.category;
    if (targetCategory === leaderboardActiveCategory) return;
    playSFX(SFX.go);
    if (isRegionsBtn) leaderboardActiveRegion = leaderboardActiveRegion || REGIONS[0];
    leaderboardActiveCategory = targetCategory;
    renderLeaderboardScreen();
  });
});

// ── Pantalla Sonidex ──
const SONIDEX_GROUPS = [
  { title: "Kanto",    filter: s => s.group === "main" && s.region === "Kanto" },
  { title: "Johto",    filter: s => s.group === "main" && s.region === "Johto" },
  { title: "Hoenn",    filter: s => s.group === "main" && s.region === "Hoenn" },
  { title: "Sinnoh",   filter: s => s.group === "main" && s.region === "Sinnoh" },
  { title: "Teselia",  filter: s => s.group === "main" && s.region === "Teselia" },
  { title: "Kalos",    filter: s => s.group === "main" && s.region === "Kalos" },
  { title: "Alola",    filter: s => s.group === "main" && s.region === "Alola" },
  { title: "Música de Combate", filter: s => s.group === "combat" },
  // ── Minijuegos (mismo orden que en la pantalla de Minijuegos) ──
  { title: "Centros Pokémon",      filter: s => s.group === "other" && s.other === "centro-pokemon" },
  { title: "Laboratorios",         filter: s => s.group === "other" && s.other === "laboratorios" },
  { title: "Bicicletas",           filter: s => s.group === "other" && s.other === "bicicletas" },
  { title: "Música de Surf",       filter: s => s.group === "other" && s.other === "surf" },
  { title: "Pantallas de Título",  filter: s => s.group === "other" && s.other === "title-screens" },
  { title: "Openings del Anime",   filter: s => s.group === "other" && s.other === "openings-anime" },
  { title: "Mundo Misterioso",     filter: s => s.group === "other" && s.other === "mystery-dungeon" },
  { title: "Pokémon Colosseum / XD", filter: s => s.group === "other" && s.other === "colosseum-xd" },
  { title: "Pokémon Ranger",       filter: s => s.group === "other" && s.other === "ranger" },
];

// Emoji corto para el botón de cambiar idioma de una ficha con varias
// variantes en la Sonidex (ver sonidexVariantsFor() en game.js). Usa los
// mismos emojis que la pantalla previa de selección de doblaje de Openings
// del Anime (screen-openings-lang-select, España/Latino en index.html), más
// uno para Inglés.
const SONIDEX_VARIANT_FLAGS = { spain: "🇪🇸", latino: "🌎", english: "🇬🇧" };
function sonidexVariantFlag(song) {
  return SONIDEX_VARIANT_FLAGS[song.variant || "spain"] || "🌐";
}

/** Construye la tarjeta (carátula + botón reproducir/detener) de una
 * canción dentro de la pantalla Sonidex, en estado bloqueado o
 * desbloqueado según isSongUnlocked. */
function sonidexSongCard(song) {
  const s = achievementsData.stats;
  const count = (s.songCorrectCounts && s.songCorrectCounts[sonidexKey(song)]) || 0;
  const unlocked = count >= SONIDEX_UNLOCK_COUNT;

  const div = document.createElement("div");
  div.className = "sonidex-card " + (unlocked ? "unlocked" : "locked");

  const imgWrap = document.createElement("div");
  imgWrap.className = "sonidex-img-wrap";
  if (unlocked) {
    const img = new Image();
    img.className = "sonidex-img";
    img.alt = songDisplayName(song);
    img.onerror = () => { img.outerHTML = `<div class="sonidex-img-locked">🎵</div>`; };
    img.src = song.image;
    imgWrap.appendChild(img);
  } else {
    imgWrap.innerHTML = `<div class="sonidex-img-locked">🔒</div>`;
  }
  div.appendChild(imgWrap);

  const titleEl = document.createElement("div");
  titleEl.className = "sonidex-title";
  titleEl.textContent = unlocked ? songDisplayName(song) : "???";
  div.appendChild(titleEl);

  if (!unlocked) {
    const prog = document.createElement("div");
    prog.className = "sonidex-progress";
    prog.textContent = `${Math.min(count, SONIDEX_UNLOCK_COUNT)}/${SONIDEX_UNLOCK_COUNT}`;
    div.appendChild(prog);
  } else {
    // Ficha desbloqueada: se puede reproducir la canción desde la Sonidex
    const controls = document.createElement("div");
    controls.className = "sonidex-controls";

    // Variantes de idioma/doblaje disponibles para esta ficha (ver
    // sonidexVariantsFor() en game.js): más de una solo en fichas como los
    // openings del anime (España/Latino/Inglés). `currentVariantSong` es la
    // que se reproduce ahora mismo con playBtn; empieza siendo `song` (el
    // representante que ya eligió sonidexGroupSongs() según el idioma actual
    // del juego) y cambia al pulsar el botón de idioma, sin afectar en nada
    // al contador de aciertos de la ficha (sonidexKey() no depende de qué
    // variante se escuche).
    const variants = sonidexVariantsFor(song);
    let currentVariantSong = song;

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "sonidex-play-btn";
    playBtn.innerHTML = "▶️";
    playBtn.setAttribute("aria-label", `Reproducir ${songDisplayName(song)}`);

    const stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "sonidex-stop-btn";
    stopBtn.innerHTML = "⏹️";
    stopBtn.setAttribute("aria-label", `Detener ${songDisplayName(song)}`);
    stopBtn.style.display = "none";

    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playSonidexSong(currentVariantSong, div, playBtn, stopBtn);
    });
    stopBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      stopSonidexPlayback(true);
    });

    controls.appendChild(playBtn);
    controls.appendChild(stopBtn);

    // Botón de cambiar idioma: solo si esta ficha tiene más de una variante.
    let langBtn = null;
    if (variants.length > 1) {
      langBtn = document.createElement("button");
      langBtn.type = "button";
      langBtn.className = "sonidex-lang-btn";
      langBtn.textContent = sonidexVariantFlag(currentVariantSong);
      langBtn.setAttribute("aria-label", t("sonidex.changeLanguage"));
      langBtn.title = t("sonidex.changeLanguage");
      langBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = variants.indexOf(currentVariantSong);
        currentVariantSong = variants[(idx + 1) % variants.length];
        langBtn.textContent = sonidexVariantFlag(currentVariantSong);
        // Si esta ficha se está reproduciendo ahora mismo, la reiniciamos ya
        // en el idioma recién elegido; si no, el cambio se aplicará la
        // próxima vez que se pulse "reproducir".
        if (div.classList.contains("playing")) {
          playSonidexSong(currentVariantSong, div, playBtn, stopBtn);
        }
      });
      controls.appendChild(langBtn);
    }

    div.appendChild(controls);

    // Si esta misma ficha (en cualquiera de sus variantes de idioma) ya se
    // estaba reproduciendo (p. ej. tras volver a renderizar la Sonidex),
    // restauramos el estado "sonando" con la variante correcta seleccionada.
    const playingVariant = variants.find(v => v.file === sonidexCurrentFile);
    if (playingVariant) {
      currentVariantSong = playingVariant;
      if (langBtn) langBtn.textContent = sonidexVariantFlag(currentVariantSong);
      div.classList.add("playing");
      playBtn.style.display = "none";
      stopBtn.style.display = "";
      sonidexCurrentButtons = { card: div, playBtn, stopBtn };
    }
  }

  return div;
}

/** Reconstruye la pantalla Sonidex completa: agrupa las canciones por
 * SONIDEX_GROUPS y crea sus tarjetas, y actualiza el contador total de
 * fichas desbloqueadas. */
function renderSonidexScreen() {
  const wrap = document.getElementById("sonidex-groups");
  wrap.innerHTML = "";

  let totalSongs = 0, totalUnlocked = 0;

  SONIDEX_GROUPS.forEach(group => {
    // sonidexGroupSongs() colapsa a una sola ficha las canciones que son la
    // misma canción en varios idiomas/doblajes (p. ej. los tres `variant` de
    // un mismo opening — ver su comentario en game.js), para no mostrar (ni
    // contar) una ficha duplicada por cada versión de idioma.
    const groupSongs = sonidexGroupSongs(songs.filter(group.filter));
    if (!groupSongs.length) return;

    const unlockedInGroup = groupSongs.filter(isSongUnlocked).length;
    totalSongs += groupSongs.length;
    totalUnlocked += unlockedInGroup;

    const card = document.createElement("div");
    card.className = "card";

    const titleEl = document.createElement("div");
    titleEl.className = "sonidex-group-title";
    titleEl.innerHTML = `${regionDisplayName(group.title)} <span class="count">(${unlockedInGroup} / ${groupSongs.length})</span>`;
    card.appendChild(titleEl);

    const grid = document.createElement("div");
    grid.className = "sonidex-grid";
    groupSongs.forEach(song => grid.appendChild(sonidexSongCard(song)));
    card.appendChild(grid);

    wrap.appendChild(card);
  });

  document.getElementById("sonidex-progress-subtitle").textContent = t("sonidex.progress", { n: totalUnlocked, total: totalSongs });
  document.getElementById("sonidex-progress-bar-fill").style.width = (totalSongs ? (totalUnlocked / totalSongs * 100) : 0) + "%";
  updateHomeSonidexSummary(totalUnlocked, totalSongs);
}

/** Calcula cuántas fichas de la Sonidex están desbloqueadas y cuántas
 * hay en total (Main + Combate + todos los Minijuegos), colapsando antes
 * las variantes de idioma de una misma canción con sonidexGroupSongs()
 * para que cuenten como una sola ficha. La usan tanto
 * updateHomeSonidexSummary() como renderProfileStats(), para no repetir
 * el mismo cálculo en dos sitios (Regla nº2 de CLAUDE.md). */
function computeSonidexTotals() {
  const allSonidexSongs = sonidexGroupSongs(songs);
  return { unlocked: allSonidexSongs.filter(isSongUnlocked).length, total: allSonidexSongs.length };
}

/** Actualiza el resumen "X / Y fichas" de la Sonidex en la pantalla de
 * Inicio. Si no se le pasan los totales ya calculados, los recalcula
 * con computeSonidexTotals() (main + combate + minijuegos). */
function updateHomeSonidexSummary(unlockedArg, totalArg) {
  const el = document.getElementById("home-sonidex-summary");
  if (!el) return;
  let unlockedCount = unlockedArg, totalCount = totalArg;
  if (unlockedCount === undefined || totalCount === undefined) {
    // Recuento total de todas las fichas de la Sonidex: incluye Main, Combate
    // y TODOS los Minijuegos (Centros Pokémon, Laboratorios, Bicicletas, Surf,
    // Mundo Misterioso, Pokémon Colosseum/XD y Pokémon Ranger), para que la
    // cifra mostrada en el Inicio coincida siempre con la de la pantalla Sonidex.
    const totals = computeSonidexTotals();
    unlockedCount = totals.unlocked;
    totalCount = totals.total;
  }
  el.textContent = t("sonidex.progressShort", { n: unlockedCount, total: totalCount });
}

// ═══════════════════════════════════════════════
//  🖼 BACKGROUND CANVAS
// ═══════════════════════════════════════════════
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

let stars = [];
let clouds = [];
let shootingStars = [];
let hillLayers = [];
let mountainLayer = [];
let fireflies = [];
let birdFlocks = [];

/** Número aleatorio en el rango [min, max). */
function rand(min, max) { return Math.random() * (max - min) + min; }

// ── Genera colinas estilo Pokémon: capas de montículos redondeados ──
function generateHills() {
  hillLayers = [];
  // de fondo (más alta, más clara) a frente (más baja, más oscura)
  const defs = [
    { heightRatio: 0.24, bumps: 4 },
    { heightRatio: 0.17, bumps: 5 },
    { heightRatio: 0.11, bumps: 6 },
  ];
  defs.forEach((def, idx) => {
    const pts = [];
    for (let i = 0; i <= def.bumps; i++) {
      pts.push({ xRatio: i / def.bumps, bump: rand(0.35, 1) });
    }
    hillLayers.push({ ...def, pts, idx });
  });
}

/** Genera una cordillera lejana (una única capa, más alta y con picos más
 * angulosos que las colinas) que se dibuja DETRÁS de `hillLayers`, entre
 * el cielo y las colinas, para dar sensación de profundidad/perspectiva
 * atmosférica — sobre todo se nota en pantallas grandes, donde queda
 * mucho cielo visible a los lados de #app (ver drawMountains). */
function generateMountains() {
  const bumps = 7;
  const pts = [];
  for (let i = 0; i <= bumps; i++) {
    pts.push({ xRatio: i / bumps, bump: rand(0.3, 1) });
  }
  mountainLayer = { heightRatio: 0.34, pts };
}

/** Genera las luciérnagas que flotan delante de la línea de colinas en
 * modo oscuro: puro detalle ambiental, sin ningún efecto sobre el juego.
 * `driftRX`/`driftRY` y `speedX`/`speedY` van por separado (en vez de un
 * único radio/velocidad de deriva) para que cada una describa una
 * pequeña elipse propia en vez de un círculo uniforme. */
function generateFireflies() {
  fireflies = [];
  for (let i = 0; i < 16; i++) {
    fireflies.push({
      xRatio: rand(0, 1),
      yRatio: rand(0.75, 0.97),
      r: rand(0.6, 1.3),
      driftRX: rand(14, 34),
      driftRY: rand(6, 16),
      speedX: rand(0.5, 1.1),
      speedY: rand(0.5, 1.1),
      phase: rand(0, Math.PI * 2),
      phaseY: rand(0, Math.PI * 2),
      blinkSpeed: rand(0.6, 1.4),
      blinkPhase: rand(0, Math.PI * 2),
    });
  }
}

/** Genera un par de bandadas de aves (grupos de "M" simplificadas) que
 * cruzan muy lentamente el cielo diurno, como detalle ambiental. */
function generateBirds() {
  birdFlocks = [];
  for (let i = 0; i < 2; i++) {
    const count = Math.round(rand(3, 6));
    const members = [];
    for (let j = 0; j < count; j++) {
      members.push({ dx: (j - (count - 1) / 2) * 15, dy: rand(-6, 6) });
    }
    birdFlocks.push({
      x: rand(-0.2, 1.2),
      yRatio: rand(0.08, 0.24),
      scale: rand(0.8, 1.3),
      speed: rand(0.0012, 0.0024) * (Math.random() < 0.5 ? 1 : -1),
      wingPhase: rand(0, Math.PI * 2),
      members,
    });
  }
}

/** Genera la forma aleatoria de una nube del fondo como una lista de
 * "bultos" (puffs) con posición y radio relativos a su centro. */
function generateCloudPuffs() {
  const puffs = [];
  const count = Math.round(rand(5, 8));
  let cursorX = 0;
  for (let i = 0; i < count; i++) {
    const r = rand(13, 26);
    puffs.push({
      dx: cursorX + r * 0.55,
      dy: rand(-9, 9) - r * 0.12,
      r,
    });
    cursorX += r * 1.1;
  }
  const avgX = puffs.reduce((s, p) => s + p.dx, 0) / puffs.length;
  puffs.forEach(p => { p.dx -= avgX; });
  return puffs;
}

/** (Re)genera todos los elementos aleatorios del fondo animado: estrellas,
 * nubes y colinas, ajustando el lienzo (canvas) al tamaño actual de la
 * ventana. Se llama al cargar y al cambiar de tema claro/oscuro. */
function initBG() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  const w = bgCanvas.width, h = bgCanvas.height;

  stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: rand(0, w),
      y: rand(0, h * 0.78),
      r: rand(0.4, 1.9),
      baseOp: rand(0.35, 1),
      speed: rand(0.5, 2.2),
      phase: rand(0, Math.PI * 2),
    });
  }

  clouds = [];
  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: rand(0, w),
      y: rand(h * 0.05, h * 0.38),
      scale: rand(0.6, 1.35),
      speed: rand(4, 12),
      op: rand(0.85, 1),
      puffs: generateCloudPuffs(),
    });
  }

  shootingStars = [];
  generateHills();
  generateMountains();
  generateFireflies();
  generateBirds();
}

/** Dibuja una nube del fondo en el canvas a partir de sus "puffs"
 * (ver generateCloudPuffs), incluyendo una sombra suave para dar
 * volumen. */
function drawCloud(cloud) {
  const { x, y, scale, op, puffs } = cloud;
  bgCtx.save();
  bgCtx.globalAlpha = op;

  // sombra suave que da volumen y separa la nube del cielo
  bgCtx.beginPath();
  puffs.forEach(p => {
    const cx = x + p.dx * scale, cy = y + p.dy * scale + 6 * scale;
    const r = p.r * scale * 0.96;
    bgCtx.moveTo(cx + r, cy);
    bgCtx.arc(cx, cy, r, 0, Math.PI * 2);
  });
  bgCtx.fillStyle = 'rgba(90,120,155,0.16)';
  bgCtx.fill();

  // cuerpo principal, un único trazado (sin costuras) relleno con degradado luz→sombra
  bgCtx.beginPath();
  let minY = Infinity, maxY = -Infinity;
  puffs.forEach(p => {
    const cx = x + p.dx * scale, cy = y + p.dy * scale, r = p.r * scale;
    bgCtx.moveTo(cx + r, cy);
    bgCtx.arc(cx, cy, r, 0, Math.PI * 2);
    minY = Math.min(minY, cy - r);
    maxY = Math.max(maxY, cy + r);
  });
  const grad = bgCtx.createLinearGradient(0, minY, 0, maxY);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#f6fafd');
  grad.addColorStop(1, '#d6e6f2');
  bgCtx.fillStyle = grad;
  bgCtx.fill();

  // brillo cálido superior, como si el sol iluminase la parte alta
  bgCtx.beginPath();
  puffs.forEach(p => {
    if (p.dy > -2) return;
    const cx = x + p.dx * scale, cy = y + p.dy * scale - p.r * scale * 0.28;
    const r = p.r * scale * 0.5;
    bgCtx.moveTo(cx + r, cy);
    bgCtx.arc(cx, cy, r, 0, Math.PI * 2);
  });
  bgCtx.fillStyle = 'rgba(255,255,255,0.6)';
  bgCtx.fill();

  bgCtx.restore();
}

/** Dibuja el degradado de cielo nocturno, un par de manchas de "nebulosa"
 * muy tenues (solo color, sin detalle) para dar riqueza al cielo, la luna
 * con resplandor, y las estrellas parpadeantes (modo oscuro). */
function drawSkyNight(w, h, t) {
  const g = bgCtx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#050a17');
  g.addColorStop(0.55, '#0b1330');
  g.addColorStop(1, '#182a4d');
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0, 0, w, h);

  // manchas de nebulosa: un par de resplandores de color muy difuminados
  // y translúcidos, fijos, que rompen la monotonía del degradado liso en
  // pantallas grandes sin distraer de la interfaz.
  bgCtx.save();
  bgCtx.globalCompositeOperation = 'lighter';
  const neb1 = bgCtx.createRadialGradient(w*0.18, h*0.22, 0, w*0.18, h*0.22, Math.min(w,h)*0.4);
  neb1.addColorStop(0, 'rgba(90,60,150,0.10)');
  neb1.addColorStop(1, 'rgba(90,60,150,0)');
  bgCtx.fillStyle = neb1;
  bgCtx.fillRect(0, 0, w, h);
  const neb2 = bgCtx.createRadialGradient(w*0.55, h*0.4, 0, w*0.55, h*0.4, Math.min(w,h)*0.35);
  neb2.addColorStop(0, 'rgba(30,90,140,0.09)');
  neb2.addColorStop(1, 'rgba(30,90,140,0)');
  bgCtx.fillStyle = neb2;
  bgCtx.fillRect(0, 0, w, h);
  bgCtx.restore();

  // luna con resplandor
  const moonX = w * 0.8, moonY = h * 0.15, moonR = Math.min(w, h) * 0.045;
  const glow = bgCtx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 4.5);
  glow.addColorStop(0, 'rgba(255,250,220,0.35)');
  glow.addColorStop(1, 'rgba(255,250,220,0)');
  bgCtx.fillStyle = glow;
  bgCtx.beginPath(); bgCtx.arc(moonX, moonY, moonR * 4.5, 0, Math.PI*2); bgCtx.fill();
  bgCtx.fillStyle = '#fef9e7';
  bgCtx.beginPath(); bgCtx.arc(moonX, moonY, moonR, 0, Math.PI*2); bgCtx.fill();
  bgCtx.fillStyle = 'rgba(200,190,160,0.28)';
  bgCtx.beginPath(); bgCtx.arc(moonX - moonR*0.3, moonY - moonR*0.2, moonR*0.18, 0, Math.PI*2); bgCtx.fill();
  bgCtx.beginPath(); bgCtx.arc(moonX + moonR*0.25, moonY + moonR*0.32, moonR*0.12, 0, Math.PI*2); bgCtx.fill();

  // estrellas titilantes (las más grandes llevan un ligero destello en
  // cruz, para que el cielo no se vea como puntos uniformes)
  stars.forEach(s => {
    const op = s.baseOp * (0.45 + 0.55 * Math.sin(t * 0.0011 * s.speed + s.phase));
    const finalOp = Math.max(0, op);
    bgCtx.beginPath();
    bgCtx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    bgCtx.fillStyle = `rgba(255,255,255,${finalOp.toFixed(2)})`;
    bgCtx.fill();
    if (s.r > 1.4) {
      bgCtx.strokeStyle = `rgba(255,255,255,${(finalOp * 0.5).toFixed(2)})`;
      bgCtx.lineWidth = 0.6;
      const sp = s.r * 3.2;
      bgCtx.beginPath();
      bgCtx.moveTo(s.x - sp, s.y); bgCtx.lineTo(s.x + sp, s.y);
      bgCtx.moveTo(s.x, s.y - sp); bgCtx.lineTo(s.x, s.y + sp);
      bgCtx.stroke();
    }
  });

  // estrellas fugaces ocasionales
  if (Math.random() < 0.004 && shootingStars.length < 2) {
    shootingStars.push({
      x: rand(w * 0.15, w * 0.9), y: rand(0, h * 0.22),
      len: rand(60, 110), speed: rand(7, 11), angle: Math.PI * 0.82, life: 1,
    });
  }
  shootingStars.forEach(s => {
    const tailX = s.x - Math.cos(s.angle) * s.len;
    const tailY = s.y - Math.sin(s.angle) * s.len;
    const grad = bgCtx.createLinearGradient(s.x, s.y, tailX, tailY);
    grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    bgCtx.strokeStyle = grad;
    bgCtx.lineWidth = 2;
    bgCtx.beginPath();
    bgCtx.moveTo(s.x, s.y);
    bgCtx.lineTo(tailX, tailY);
    bgCtx.stroke();
    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.life -= 0.014;
  });
  shootingStars = shootingStars.filter(s => s.life > 0 && s.y < h);
}

/** Dibuja las luciérnagas: puntitos de luz amarilla, muy pequeños, que
 * flotan delante de las colinas describiendo una pequeña deriva elíptica
 * (una frecuencia distinta en X y en Y, así el recorrido no es un
 * círculo perfecto) con un halo suave que les da volumen. El parpadeo no
 * sigue una onda seno "en crudo" (encendido/apagado a ritmo uniforme):
 * se eleva al cuadrado para que la luciérnaga pase más tiempo apagada o
 * muy tenue y el encendido llegue como un destello progresivo, más
 * parecido al parpadeo real del insecto que a un simple parpadeo de luz.
 * Se llama DESPUÉS de `drawHills` (ver `drawBG`) para que las luciérnagas
 * floten visiblemente por delante del terreno en vez de quedar tapadas
 * por él; es puro detalle ambiental del modo oscuro, sin ningún efecto
 * sobre el juego. */
function drawFireflies(w, h, t) {
  fireflies.forEach(f => {
    const cx = f.xRatio * w + Math.cos(t * 0.00055 * f.speedX + f.phase) * f.driftRX;
    const cy = f.yRatio * h + Math.sin(t * 0.0008 * f.speedY + f.phaseY) * f.driftRY;

    const raw = Math.max(0, Math.sin(t * 0.0011 * f.blinkSpeed + f.blinkPhase));
    const blink = raw * raw;
    if (blink < 0.05) return;

    // halo cálido difuminado, para dar volumen sin que deje de leerse
    // como un punto diminuto
    const glowR = f.r * 6;
    const glow = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    glow.addColorStop(0, `rgba(255,214,90,${(blink * 0.5).toFixed(2)})`);
    glow.addColorStop(0.55, `rgba(255,193,60,${(blink * 0.18).toFixed(2)})`);
    glow.addColorStop(1, 'rgba(255,193,60,0)');
    bgCtx.fillStyle = glow;
    bgCtx.beginPath(); bgCtx.arc(cx, cy, glowR, 0, Math.PI * 2); bgCtx.fill();

    // núcleo: amarillo cálido, muy pequeño
    bgCtx.fillStyle = `rgba(255,241,180,${blink.toFixed(2)})`;
    bgCtx.beginPath(); bgCtx.arc(cx, cy, f.r, 0, Math.PI * 2); bgCtx.fill();
  });
}

/** Dibuja el degradado de cielo diurno, el sol con resplandor, las nubes
 * animadas y un par de bandadas de aves lejanas (modo claro). */
function drawSkyDay(w, h, t) {
  const g = bgCtx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#4fa8e6');
  g.addColorStop(0.35, '#6fc0ee');
  g.addColorStop(0.68, '#a6ddf6');
  g.addColorStop(1, '#e4f6ff');
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0, 0, w, h);

  // sol: resplandor y disco
  const sunX = w * 0.82, sunY = h * 0.13, sunR = Math.min(w, h) * 0.05;
  const glow = bgCtx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 4);
  glow.addColorStop(0, 'rgba(255,244,180,0.55)');
  glow.addColorStop(1, 'rgba(255,244,180,0)');
  bgCtx.fillStyle = glow;
  bgCtx.beginPath(); bgCtx.arc(sunX, sunY, sunR * 4, 0, Math.PI*2); bgCtx.fill();
  bgCtx.fillStyle = '#fff6d0';
  bgCtx.beginPath(); bgCtx.arc(sunX, sunY, sunR, 0, Math.PI*2); bgCtx.fill();

  // aves lejanas: siluetas simples en "M" que cruzan el cielo muy despacio
  birdFlocks.forEach(flock => {
    flock.x += flock.speed;
    if (flock.speed > 0 && flock.x > 1.3) flock.x = -0.3;
    if (flock.speed < 0 && flock.x < -0.3) flock.x = 1.3;
    const cx = flock.x * w, cy = flock.yRatio * h;
    const wing = 4 * Math.sin(t * 0.004 + flock.wingPhase);
    bgCtx.strokeStyle = 'rgba(60,70,90,0.4)';
    bgCtx.lineWidth = 1.6 * flock.scale;
    bgCtx.lineCap = 'round';
    flock.members.forEach(m => {
      const bx = cx + m.dx * flock.scale, by = cy + m.dy * flock.scale;
      const wspan = 6 * flock.scale;
      bgCtx.beginPath();
      bgCtx.moveTo(bx - wspan, by + wing * 0.3);
      bgCtx.quadraticCurveTo(bx, by - wing, bx, by);
      bgCtx.quadraticCurveTo(bx, by - wing, bx + wspan, by + wing * 0.3);
      bgCtx.stroke();
    });
  });

  // nubes animadas
  clouds.forEach(c => {
    drawCloud(c);
    c.x += c.speed * 0.016;
    if (c.x - 90 * c.scale > w) c.x = -90 * c.scale;
  });
}

// ── Cordillera lejana, entre el cielo y las colinas ──
/** Dibuja la silueta de montañas lejanas generada por `generateMountains`,
 * teñida casi del mismo tono que el cielo en su base (perspectiva
 * atmosférica: cuanto más lejos, más se "disuelve" un elemento en el
 * color del cielo) para dar profundidad sin competir con las colinas,
 * que son las que de verdad enmarcan el juego. */
function drawMountains(w, h, isDark) {
  if (!mountainLayer.pts) return;
  const { heightRatio, pts } = mountainLayer;
  const topY = h * (1 - heightRatio);

  bgCtx.beginPath();
  bgCtx.moveTo(0, h + 2);
  bgCtx.lineTo(0, topY + pts[0].bump * h * 0.05);
  for (let j = 0; j < pts.length; j++) {
    const p = pts[j];
    const x = p.xRatio * w;
    const y = topY - p.bump * h * 0.09;
    const prevX = j === 0 ? 0 : pts[j-1].xRatio * w;
    const midX = (prevX + x) / 2;
    bgCtx.lineTo(midX, y + h * 0.015);
    bgCtx.lineTo(x, y);
  }
  bgCtx.lineTo(w, h + 2);
  bgCtx.closePath();

  const grad = bgCtx.createLinearGradient(0, topY - h * 0.09, 0, h * (1 - heightRatio * 0.35));
  if (isDark) {
    grad.addColorStop(0, '#26365c');
    grad.addColorStop(1, '#182a4d');
  } else {
    grad.addColorStop(0, '#7fa9cf');
    grad.addColorStop(1, '#a6ddf6');
  }
  bgCtx.fillStyle = grad;
  bgCtx.fill();

  // nieve/bruma en las cumbres más altas, muy sutil (solo en modo día;
  // en modo noche no se dibuja ningún brillo sobre los picos)
  if (!isDark) {
    bgCtx.save();
    bgCtx.clip();
    pts.forEach(p => {
      if (p.bump < 0.72) return;
      const x = p.xRatio * w, y = topY - p.bump * h * 0.09;
      const capGrad = bgCtx.createRadialGradient(x, y, 0, x, y, h * 0.05);
      capGrad.addColorStop(0, 'rgba(255,255,255,0.65)');
      capGrad.addColorStop(1, 'rgba(255,255,255,0)');
      bgCtx.fillStyle = capGrad;
      bgCtx.beginPath(); bgCtx.arc(x, y, h * 0.05, 0, Math.PI*2); bgCtx.fill();
    });
    bgCtx.restore();
  }
}

// ── Colinas redondeadas tipo Pokémon, en capas con perspectiva ──
function drawHills(w, h, isDark) {
  const palette = isDark
    ? ['#15301d', '#1c4026', '#234d2c']
    : ['#6cc464', '#54ab4e', '#3f9640'];
  const rimPalette = isDark
    ? ['#26502f', '#2d5a35', '#356840']
    : ['#8fdb84', '#79c96f', '#63b95e'];

  hillLayers.forEach((layer, i) => {
    const topY = h * (1 - layer.heightRatio);
    bgCtx.beginPath();
    bgCtx.moveTo(0, h + 2);
    bgCtx.lineTo(0, topY + layer.pts[0].bump * h * 0.02);
    for (let j = 0; j < layer.pts.length; j++) {
      const p = layer.pts[j];
      const x = p.xRatio * w;
      const y = topY - p.bump * h * 0.05;
      const prevX = j === 0 ? 0 : layer.pts[j-1].xRatio * w;
      const cpX = (prevX + x) / 2;
      bgCtx.quadraticCurveTo(cpX, y - h * 0.03, x, y);
    }
    bgCtx.lineTo(w, h + 2);
    bgCtx.closePath();
    // relleno con un ligero degradado (en vez de color plano) para dar
    // algo de volumen: más claro arriba (recibe más luz), más oscuro
    // hacia la base donde se funde con la capa de delante.
    const grad = bgCtx.createLinearGradient(0, topY - h * 0.08, 0, h);
    grad.addColorStop(0, rimPalette[i % rimPalette.length]);
    grad.addColorStop(0.35, palette[i % palette.length]);
    grad.addColorStop(1, palette[i % palette.length]);
    bgCtx.fillStyle = grad;
    bgCtx.fill();
  });
}

/** Viñeta final: oscurece muy levemente las esquinas del lienzo para que
 * la mirada se centre en la tarjeta de la app en pantallas grandes, donde
 * queda mucho fondo visible a los lados. Se aplica igual en ambos temas,
 * con más intensidad en modo oscuro (donde aporta más profundidad) que en
 * modo claro (donde solo debe insinuarse, para no ensuciar el cielo). */
function drawVignette(w, h, isDark) {
  const g = bgCtx.createRadialGradient(
    w/2, h*0.42, Math.min(w,h)*0.35,
    w/2, h*0.42, Math.max(w,h)*0.75
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, isDark ? 'rgba(0,0,0,0.45)' : 'rgba(10,20,40,0.16)');
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0, 0, w, h);
}

/** Bucle principal de animación del fondo: limpia el canvas, dibuja el
 * cielo (noche o día según el tema), la cordillera lejana, las colinas,
 * las luciérnagas por delante de ellas (solo en modo oscuro) y, por
 * último, la viñeta que enmarca la app, y se reprograma a sí mismo en el
 * siguiente frame con requestAnimationFrame. */
function drawBG(now) {
  const w = bgCanvas.width, h = bgCanvas.height;
  const isDark = !document.body.classList.contains('light');
  bgCtx.clearRect(0, 0, w, h);
  if (isDark) drawSkyNight(w, h, now || 0);
  else drawSkyDay(w, h, now || 0);
  drawMountains(w, h, isDark);
  drawHills(w, h, isDark);
  if (isDark) drawFireflies(w, h, now || 0);
  drawVignette(w, h, isDark);
  requestAnimationFrame(drawBG);
}

initBG();
requestAnimationFrame(drawBG);
window.addEventListener('resize', initBG);

// ═══════════════════════════════════════════════
//  🌊 WAVEFORM (decorativo)
// ═══════════════════════════════════════════════
const waveCanvas = document.getElementById('waveform-canvas');
const waveCtx = waveCanvas.getContext('2d');

/** Ajusta el tamaño del canvas del visualizador de ondas al tamaño real
 * en pantalla, compensando la densidad de píxeles del dispositivo. */
function resizeWave() {
  // evitar acumulación de scale
  waveCtx.setTransform(1,0,0,1,0,0);
  waveCanvas.width = waveCanvas.offsetWidth * window.devicePixelRatio;
  waveCanvas.height = waveCanvas.offsetHeight * window.devicePixelRatio;
  waveCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

/** Dibuja el visualizador de barras animado (decorativo, con movimiento
 * tipo "idle") y se reprograma en cada frame. */
function drawWave() {
  animFrame = requestAnimationFrame(drawWave);
  const W = waveCanvas.offsetWidth, H = waveCanvas.offsetHeight;
  waveCtx.clearRect(0, 0, W, H);

  // idle wave (el analyser está a null por diseño)
  const t = Date.now() / 1000;
  const bars = 40;
  const bw = W / bars;
  for (let i = 0; i < bars; i++) {
    const h = 4 + Math.sin(i * 0.5 + t * 2) * 3;
    waveCtx.fillStyle = 'rgba(255,255,255,0.10)';
    waveCtx.beginPath();
    waveCtx.roundRect(i * bw + 2, H/2 - h/2, bw - 4, h, 2);
    waveCtx.fill();
  }

  if (!isNaN(audio.duration) && audio.duration > 0) {
    const pct = (audio.currentTime / audio.duration * 100).toFixed(1);
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('time-current').textContent = fmtTime(audio.currentTime);
    document.getElementById('time-total').textContent = fmtTime(audio.duration);
  }
}
/** Formatea segundos como "m:ss" (usado en textos de tiempo). */
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}
window.addEventListener('resize', resizeWave);
setTimeout(() => { resizeWave(); drawWave(); }, 100);


// ═══════════════════════════════════════════════
//  🏷️ ETIQUETA DE MODO (texto superior de la pantalla de quiz)
// ═══════════════════════════════════════════════
/** Actualiza el texto que indica, en la pantalla de quiz, qué modo y
 * configuración está activa (región, dificultad, minijuego...). */
function setModeLabel() {
  const el = document.getElementById("mode-label");
  if (session.mode === GameMode.EASY) el.textContent = t("quiz.modeEasy");
  else if (session.mode === GameMode.NORMAL) el.textContent = t("quiz.modeNormalRegion", { region: regionDisplayName(session.normalRegion) });
  else if (session.mode === GameMode.HARD) el.textContent = t("quiz.modeHard");
  else if (session.mode === GameMode.OTHER) el.textContent = t("quiz.modeOther", { game: prettyOther(session.otherGame) });
  else if (session.mode === GameMode.INFINITE) el.textContent = t("quiz.modeInfinite");
  else if (session.mode === GameMode.STORY) {
    el.textContent = (session.normalRegion === "Combate")
      ? t("quiz.modeStoryEnemy")
      : t("quiz.modeStoryRegion", { region: regionDisplayName(session.normalRegion) });
  }
  if (session.mode === GameMode.NORMAL && session.normalRegion === "Combate") el.textContent = t("quiz.modeCombat");
}

/** Muestra u oculta el botón de "Pista visual" según el modo activo (solo
 * disponible en Fácil, Normal —incluido Combate— e Historia) y lo deja
 * listo (habilitado, con su texto por defecto) para la ronda que empieza.
 * Se llama una vez por ronda desde startRound(); la decisión de en qué
 * modos existe la pista es puramente de presentación, igual que el resto
 * de setModeLabel(). */
function resetHintButton() {
  const btn = document.getElementById("hint-btn");
  if (!btn) return;
  const allowed = session.mode === GameMode.EASY
    || session.mode === GameMode.NORMAL
    || session.mode === GameMode.STORY;
  btn.style.display = allowed ? "inline-flex" : "none";
  btn.disabled = false;
  btn.innerHTML = `${t("quiz.hint")} <span class="hint-btn-cost">${t("quiz.hintCost")}</span>`;
}

/** Refleja en el botón de "Pista visual" que ya se ha usado esta ronda
 * (deshabilitado + texto de confirmación), tras decidirlo game.js. */
function markHintButtonUsed() {
  const btn = document.getElementById("hint-btn");
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `${t("quiz.hintUsed")} <span class="hint-btn-cost">${t("quiz.hintCost")}</span>`;
}

/** Convierte la clave interna de una categoría de Minijuegos
 * ("mystery-dungeon", "colosseum-xd"...) en su nombre legible. */
function prettyOther(key){
  if (key === "centro-pokemon") return t("other.centro.title");
  if (key === "laboratorios") return t("other.lab.title");
  if (key === "surf") return t("other.surf.title");
  if (key === "mystery-dungeon") return t("other.mysterydungeon.title");
  if (key === "colosseum-xd") return t("other.colosseum.title");
  if (key === "ranger") return t("other.ranger.title");
  if (key === "bicicletas") return t("other.bike.title");
  if (key === "title-screens") return t("other.titlescreens.title");
  if (key === "openings-anime") return t("other.openinganime.title");
  return key;
}

// ═══════════════════════════════════════════════
//  🎯 QUIZ: BOTONES DE RESPUESTA, CONTADORES Y CARÁTULA
// ═══════════════════════════════════════════════
/** Crea un único botón de respuesta dentro de `gridEl` con el texto y el
 * estado correcto/incorrecto indicados, y engancha su clic a
 * handleAnswer. Extraído como helper para que tanto
 * renderAnswerButtons() como cualquier efecto de Evento Pokémon que
 * necesite añadir opciones extra fuera de la generación normal de la
 * ronda (p. ej. el evento Mewtwo, que añade dos respuestas falsas más
 * — ver su onAnswers() en pokemon.js) creen los botones exactamente
 * igual, en vez de generar el HTML "a mano" en otro sitio. */
function addAnswerButton(gridEl, label, isCorrect) {
  const btn = document.createElement("button");
  btn.className = "answer-btn";
  btn.textContent = label;
  btn.disabled = false;
  btn.dataset.correct = isCorrect ? "1" : "0";
  btn.onclick = () => handleAnswer(btn, isCorrect);
  gridEl.appendChild(btn);
  return btn;
}

/** Pinta en pantalla los botones de respuesta a partir de la lista de
 * opciones generada (ver generateOptionsForCurrent), enganchando el
 * manejador de clic de cada uno a handleAnswer. */
function renderAnswerButtons(options) {
  const grid = document.getElementById("answers-grid");
  grid.innerHTML = "";
  // 6 opciones -> 2 columnas, 3 filas. 4 opciones -> 2x2.
  options.forEach((opt) => addAnswerButton(grid, opt.label, opt.isCorrect));
}

/** Refresca los contadores de ronda, puntuación y racha en la pantalla
 * de quiz. */
function updateStatsUI(){
  document.getElementById('round-val').textContent = state.round;
  document.getElementById('score-val').textContent = state.score;
  document.getElementById('streak-val').textContent = state.streak;
}

/** Cambia la carátula mostrada, precargando la imagen antes de
 * insertarla (para evitar parpadeos) y usando una imagen de
 * repuesto si la de la canción no carga. */
function setSongImage(song){
  const wrap = document.getElementById('song-image');
  const img = new Image();
  img.onload = () => {
    const cur = document.getElementById('song-image');
    cur.outerHTML = `<img class="song-image" id="song-image" src="${song.image}" alt="portada">`;
  };
  img.onerror = () => {
    const cur = document.getElementById('song-image');
    if (cur && cur.tagName !== 'DIV') cur.outerHTML = `<div class="song-image-placeholder" id="song-image">🎵</div>`;
  };
  img.src = song.image;
}

// ═══════════════════════════════════════════════
//  💗 VIDAS (CORAZONES): INDICADOR VISUAL DEL MODO HISTORIA / DESAFÍO INFINITO
// ═══════════════════════════════════════════════
const livesWrap = document.getElementById('lives-wrap');
const nervousOverlay = document.getElementById('nervous-overlay');
const heartEls = livesWrap ? Array.from(livesWrap.querySelectorAll('.heart')) : [];

/** Sincroniza el indicador visual de vidas (corazones) con el estado
 * actual, incluyendo el aviso "nervioso" cuando quedan pocas. */
function renderLives() {
  if (!livesWrap) return;
  const active = hasActiveLivesSystem();
  livesWrap.style.display = active ? "flex" : "none";
  if (!active) {
    livesWrap.classList.remove('critical');
    nervousOverlay.classList.remove('show');
    return;
  }
  const currentLives = getCurrentLives();
  heartEls.forEach((el, idx) => {
    el.classList.remove('losing');
    if (idx < currentLives) el.classList.remove('lost');
    else el.classList.add('lost');
  });
  updateNervousState();
}

// Activa/desactiva el efecto de "nervios" (1 sola vida restante).
function updateNervousState() {
  if (!livesWrap) return;
  const critical = hasActiveLivesSystem() && getCurrentLives() === 1;
  livesWrap.classList.toggle('critical', critical);
  nervousOverlay.classList.toggle('show', critical);
}

// ═══════════════════════════════════════════════
//  😴 EFECTO VISUAL: EVENTO POKÉMON JIGGLYPUFF (canta y adormece)
// ═══════════════════════════════════════════════
// ── Evento Pokémon Jigglypuff: canta su canción durante los primeros 8s de
// la ronda. Mientras canta: (1) suena sounds/jigglypuff.mp3 una sola vez
// sobre #jigglypuff-audio, (2) su sprite (images/jigglypuff.png, orientado
// por defecto hacia la derecha) desciende desde arriba de la pantalla y se
// balancea de lado a lado durante esos mismos 8s, y (3) la canción de la
// ronda suena con el volumen reducido al 15%. Justo antes de terminar, el
// filtro de somnolencia hace un parpadeo final (los "párpados" se cierran
// del todo, tapando la pantalla por completo un instante) y aprovechamos
// ese instante de pantalla cerrada para iluminar ya la respuesta correcta,
// así que al reabrirse los ojos el jugador la ve brillando desde el primer
// fotograma. Al terminar de cantar se restaura el volumen normal de la ronda.
const JIGGLYPUFF_SONG_MS = 8000; // duración de sounds/jigglypuff.mp3 (8s)
const JIGGLYPUFF_FINAL_BLINK_MS = 1100; // duración del parpadeo final (debe ser menor que JIGGLYPUFF_SONG_MS)
const JIGGLYPUFF_BLINK_REVEAL_MS = 460; // instante dentro del parpadeo en el que los ojos ya están cerrados del todo (ver keyframes jigglypuff-final-blink)
const jigglypuffAudio = document.getElementById('jigglypuff-audio');
let jigglypuffGlowTimeout = null;
let jigglypuffVolumeTimeout = null;
let jigglypuffBlinkRevealTimeout = null;
let jigglypuffHideTimeout = null;

// Arranca el sprite cantando y su canción. Se llama desde el hook
// onAnswers() del evento Jigglypuff (ver catálogo de Eventos Pokémon), una
// vez por ronda, justo después de renderAnswerButtons().
function startJigglypuffSinging() {
  clearTimeout(jigglypuffGlowTimeout);
  jigglypuffGlowTimeout = null;
  clearTimeout(jigglypuffBlinkRevealTimeout);
  jigglypuffBlinkRevealTimeout = null;
  clearTimeout(jigglypuffHideTimeout);
  jigglypuffHideTimeout = null;

  const overlay = document.getElementById('jigglypuff-sing-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    void overlay.offsetWidth; // fuerza el reinicio de la animación CSS de descenso
    overlay.classList.add('show');
  }

  // Filtro de somnolencia: activo en toda la app mientras dura la canción
  const drowsyOverlay = document.getElementById('jigglypuff-drowsy-overlay');
  drowsyOverlay?.classList.remove('blink-final');
  drowsyOverlay?.classList.add('show');

  try {
    jigglypuffAudio.src = SFX.jigglypuff;
    jigglypuffAudio.loop = false; // solo debe sonar una vez
    jigglypuffAudio.currentTime = 0;
    jigglypuffAudio.volume = settings.sfxVol;
    jigglypuffAudio.play().catch(() => {});
  } catch (e) {}

  // Referencia a la canción de esta ronda: si al cumplirse los 8s el
  // jugador ya está en otra ronda, no tocamos sus respuestas.
  const songAtStart = state.currentSong;

  // A los (JIGGLYPUFF_SONG_MS - JIGGLYPUFF_FINAL_BLINK_MS) arranca el
  // parpadeo final: los párpados pasan de su vaivén sutil habitual a
  // cerrarse del todo y volver a abrirse una sola vez, terminando justo
  // cuando acaba la canción.
  jigglypuffGlowTimeout = setTimeout(() => {
    jigglypuffGlowTimeout = null;
    drowsyOverlay?.classList.add('blink-final');

    // A mitad del parpadeo, con los párpados ya completamente cerrados,
    // iluminamos la respuesta correcta sin que se note el cambio.
    jigglypuffBlinkRevealTimeout = setTimeout(() => {
      jigglypuffBlinkRevealTimeout = null;
      if (state.currentSong !== songAtStart || state.answered) return;
      // dataset.correct en vez del texto del botón: en EASY el texto
      // puede estar traducido (p. ej. "Unova" en vez de "Teselia") y
      // dejaría de coincidir con la clave interna de la región.
      document.querySelectorAll('.answer-btn').forEach(b => {
        if (b.dataset.correct === "1") b.classList.add('jigglypuff-glow');
      });
    }, JIGGLYPUFF_BLINK_REVEAL_MS);
  }, Math.max(0, JIGGLYPUFF_SONG_MS - JIGGLYPUFF_FINAL_BLINK_MS));

  // Al terminar el parpadeo final (coincide con el final real de la
  // canción) se retira todo: sprite y filtro de somnolencia.
  jigglypuffHideTimeout = setTimeout(() => {
    jigglypuffHideTimeout = null;
    if (overlay) overlay.classList.remove('show');
    if (drowsyOverlay) {
      drowsyOverlay.classList.remove('show');
      drowsyOverlay.classList.remove('blink-final');
    }
  }, JIGGLYPUFF_SONG_MS);
}

// Reduce el volumen de la canción de la ronda un 70% mientras dura la
// canción de Jigglypuff, y lo restaura pasados los 8s. Se llama desde el
// hook onAudio() del evento Jigglypuff, justo después de que startRound()
// fije el volumen normal de la ronda (por eso el ducking se aplica aquí y
// no en startJigglypuffSinging(), para que no se sobrescriba).
function duckAudioForJigglypuff(audioEl) {
  clearTimeout(jigglypuffVolumeTimeout);
  audioEl.volume = Math.max(0, settings.musicVol * 0.15); // -85% de volumen

  const songAtStart = state.currentSong;
  jigglypuffVolumeTimeout = setTimeout(() => {
    jigglypuffVolumeTimeout = null;
    if (state.currentSong === songAtStart) audioEl.volume = settings.musicVol;
  }, JIGGLYPUFF_SONG_MS);
}

// Detiene de golpe la interpretación de Jigglypuff (sonido, temporizadores y
// sprite en pantalla). Se llama al empezar cualquier ronda nueva (por si
// quedó una colgada de la ronda anterior) y al salir de la pantalla del quiz.
function stopJigglypuffSinging() {
  clearTimeout(jigglypuffGlowTimeout);
  jigglypuffGlowTimeout = null;
  clearTimeout(jigglypuffVolumeTimeout);
  jigglypuffVolumeTimeout = null;
  clearTimeout(jigglypuffBlinkRevealTimeout);
  jigglypuffBlinkRevealTimeout = null;
  clearTimeout(jigglypuffHideTimeout);
  jigglypuffHideTimeout = null;
  try { jigglypuffAudio.pause(); jigglypuffAudio.currentTime = 0; } catch (e) {}
  const overlay = document.getElementById('jigglypuff-sing-overlay');
  if (overlay) overlay.classList.remove('show');
  const drowsyOverlay = document.getElementById('jigglypuff-drowsy-overlay');
  drowsyOverlay?.classList.remove('show');
  drowsyOverlay?.classList.remove('blink-final');
}

// ═══════════════════════════════════════════════
//  ⚡ EFECTO VISUAL: EVENTO POKÉMON ELECTRODE (temporizador en pantalla)
// ═══════════════════════════════════════════════
// ── Evento Pokémon Electrode: explota al segundo 10 de la canción de la ronda ──
const ELECTRODE_FUSE_SECONDS = 10;
let electrodeTickInterval = null;
let electrodeFuseTimeout = null;

// Arranca el temporizador en pantalla y programa la explosión a los
// ELECTRODE_FUSE_SECONDS. Se llama desde el hook onAnswers() del evento
// Electrode (ver catálogo de Eventos Pokémon), una vez por ronda.
function startElectrodeTimer() {
  stopElectrodeTimer(); // por seguridad, nunca debería haber uno colgado ya
  const el = document.getElementById('electrode-timer');
  const val = document.getElementById('electrode-timer-val');
  if (!el || !val) return;

  let remaining = ELECTRODE_FUSE_SECONDS;
  val.textContent = remaining;
  // La variable --electrode-fuse marca en CSS cuánto dura la animación de
  // "carga" del sprite (electrode-charge), para que quede sincronizada con
  // ELECTRODE_FUSE_SECONDS sin duplicar el número en styles.css.
  el.style.setProperty('--electrode-fuse', ELECTRODE_FUSE_SECONDS + 's');
  el.classList.add('show', 'charging');

  electrodeTickInterval = setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    val.textContent = remaining;
  }, 1000);

  electrodeFuseTimeout = setTimeout(electrodeExplode, ELECTRODE_FUSE_SECONDS * 1000);
}

// Desactiva el temporizador de Electrode y oculta el contador en pantalla.
// Se llama al responder la ronda, al empezar cualquier ronda nueva (por si
// quedó uno colgado) y al salir de la pantalla del quiz. Si `exploded` es
// true (solo lo pasa electrodeExplode() en game.js), antes de ocultar el
// badge añade un instante el destello de explosión (.exploding, ver
// styles.css) sobre el sprite, que ya está blanco por la animación de carga.
function stopElectrodeTimer(exploded = false) {
  clearInterval(electrodeTickInterval);
  clearTimeout(electrodeFuseTimeout);
  electrodeTickInterval = null;
  electrodeFuseTimeout = null;
  const el = document.getElementById('electrode-timer');
  if (!el) return;
  if (exploded) {
    el.classList.add('exploding');
    setTimeout(() => el.classList.remove('exploding'), 400);
  }
  el.classList.remove('show', 'charging');
}

// ═══════════════════════════════════════════════
//  📺 EFECTO VISUAL: EVENTO POKÉMON PORYGON (glitch de texto)
// ═══════════════════════════════════════════════
// ── Evento Pokémon Porygon: parpadeo de caracteres en el texto ──
// Además del glitch visual (CSS) sobre botones y pantalla, este efecto hace
// que, de forma aleatoria y momentánea, algunos caracteres de la pregunta y
// de las respuestas se sustituyan por símbolos "corruptos", simulando un
// fallo de codificación de texto. Se llama desde el hook onAnswers() del
// evento Porygon (ver catálogo de Eventos Pokémon) y se detiene junto con el
// resto de efectos de la ronda en startRound().
const PORYGON_GLITCH_CHARS = "01#$%&@!?█▓▒░<>/\\¤§ｱｲｳｴｵﾊﾟﾜｾﾁｸ";
let porygonGlitchInterval = null;
const porygonScrambledEls = new Map(); // elemento -> { original, timeoutId }

// Sustituye 1-3 caracteres (no espacios) del texto de `el` por símbolos de
// glitch durante un instante muy breve y luego restaura el texto original.
// Si el elemento ya está siendo "glitcheado", no hace nada (evita solapar
// dos sustituciones sobre el mismo texto).
function porygonScrambleText(el) {
  if (!el || porygonScrambledEls.has(el)) return;
  const original = el.textContent;
  if (!original || !original.trim()) return;

  const chars = original.split("");
  const editableIdx = chars.map((c, i) => i).filter(i => chars[i].trim() !== "");
  const glitchCount = Math.max(1, Math.min(3, Math.round(editableIdx.length * 0.25)));
  for (let n = 0; n < glitchCount && editableIdx.length; n++) {
    const pick = editableIdx.splice(Math.floor(Math.random() * editableIdx.length), 1)[0];
    chars[pick] = PORYGON_GLITCH_CHARS[Math.floor(Math.random() * PORYGON_GLITCH_CHARS.length)];
  }
  el.textContent = chars.join("");
  el.classList.add("porygon-text-glitching");

  const timeoutId = setTimeout(() => {
    el.textContent = original;
    el.classList.remove("porygon-text-glitching");
    porygonScrambledEls.delete(el);
  }, 130 + Math.random() * 110);
  porygonScrambledEls.set(el, { original, timeoutId });
}

// Arranca el intervalo que, cada pocos cientos de ms, elige 1-2 elementos de
// texto al azar (la pregunta y/o alguna respuesta) y los "glitchea".
function startPorygonTextGlitch() {
  stopPorygonTextGlitch(); // por seguridad, nunca debería haber uno colgado ya
  porygonGlitchInterval = setInterval(() => {
    const grid = document.getElementById("answers-grid");
    if (!grid || !grid.classList.contains("event-porygon")) { stopPorygonTextGlitch(); return; }
    const question = document.getElementById("song-question");
    const targets = [question, ...grid.querySelectorAll(".answer-btn")].filter(Boolean);
    if (!targets.length) return;
    const picks = shuffle(targets).slice(0, 1 + Math.floor(Math.random() * 2));
    picks.forEach(porygonScrambleText);
  }, 420);
}

// Detiene el intervalo y restaura de inmediato el texto original de
// cualquier elemento que estuviera a media sustitución, para no dejar nunca
// texto "corrupto" colgado al terminar la ronda o el evento.
function stopPorygonTextGlitch() {
  if (porygonGlitchInterval) { clearInterval(porygonGlitchInterval); porygonGlitchInterval = null; }
  porygonScrambledEls.forEach(({ original, timeoutId }, el) => {
    clearTimeout(timeoutId);
    el.textContent = original;
    el.classList.remove("porygon-text-glitching");
  });
  porygonScrambledEls.clear();
}

// ═══════════════════════════════════════════════
//  💥 COMBO Y PARTÍCULAS DE ACIERTO
// ═══════════════════════════════════════════════
/** Muestra brevemente el indicador de racha ("combo") con el número
 * actual de aciertos seguidos. */
function showCombo() {
  const badge = document.getElementById('combo-badge');
  document.getElementById('combo-num').textContent = state.streak;
  badge.classList.add('show');
  setTimeout(() => badge.classList.remove('show'), 2000);
}

/** Lanza una pequeña explosión de partículas decorativas junto al botón
 * de respuesta acertado, si el ajuste de partículas está activado. */
function spawnParticles(btn) {
  const rect = btn.getBoundingClientRect();
  spawnParticleBurst({
    cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2,
    emojis: ['⭐', '✨', '💛', '🎵', '🌟'],
    count: 8, spread: 60, sizeRange: [0.8, 0.8], delayStep: 0.08,
  });
}

// ═══════════════════════════════════════════════
//  🔊 Opciones UI ↔ Settings
// ═══════════════════════════════════════════════
const musicSlider = document.getElementById("music-vol");
const sfxSlider = document.getElementById("sfx-vol");
const darkToggle = document.getElementById("dark-toggle");
const bgToggle = document.getElementById("bg-toggle");
const particlesToggle = document.getElementById("particles-toggle");

/** Aplica el tema claro/oscuro guardado en `settings` a toda la
 * interfaz (clase en <body>, interruptor de Opciones) y regenera el
 * fondo animado con la paleta correspondiente. */
function applyTheme(){
  document.body.classList.toggle("light", !settings.darkMode);
  darkToggle.checked = settings.darkMode;
  darkToggle.nextElementSibling.textContent = settings.darkMode ? t("options.toggleOn") : t("options.toggleOff");
  initBG(); // reajustar partículas con la nueva paleta
}

/** Aplica el volumen de música guardado en `settings` al elemento de
 * audio de la ronda. */
function applyAudioVolumes(){
  audio.volume = settings.musicVol;
}

// ── Opciones gráficas: fondo animado y efectos de partículas ──
function applyGraphicsSettings(){
  if (bgToggle) {
    bgToggle.checked = settings.animatedBg;
    bgToggle.nextElementSibling.textContent = settings.animatedBg ? t("options.toggleOn") : t("options.toggleOff");
  }
  if (particlesToggle) {
    particlesToggle.checked = settings.particles;
    particlesToggle.nextElementSibling.textContent = settings.particles ? t("options.toggleOn") : t("options.toggleOff");
  }
  if (bgCanvas) bgCanvas.style.display = settings.animatedBg ? "" : "none";
  if (bgPokeLayer) bgPokeLayer.style.display = settings.animatedBg ? "" : "none";
  renderCursorGrid();
  applyCursorStyle();
}

// ── Rejilla de estilos de puntero del ratón (Opciones > Opciones
// gráficas): "Normal" + un botón por cada entrada de CURSOR_CATALOG
// (storage.js). Mismo patrón que renderAvatarGrid(): los estilos
// todavía no desbloqueados (isCursorUnlocked()/CURSOR_UNLOCKS, en
// game.js) se pintan en gris con un candado y, al pulsarlos, muestran
// un aviso con el logro que falta en vez de seleccionarse. ──
function cursorStyleName(cursorId) {
  if (cursorId === "normal") return t("options.cursor.normalName");
  const c = CURSOR_CATALOG.find(x => x.id === cursorId);
  return c ? tData(`cursorStyle.${cursorId}.name`, c.name) : cursorId;
}
function renderCursorGrid() {
  const gridEl = document.getElementById("cursor-style-grid");
  if (!gridEl) return;
  gridEl.innerHTML = "";
  [{ id: "normal" }].concat(CURSOR_CATALOG).forEach(entry => {
    const unlocked = typeof isCursorUnlocked === "function" && isCursorUnlocked(entry.id);
    const name = cursorStyleName(entry.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cursor-style-option"
      + (settings.cursorStyle === entry.id ? " selected" : "")
      + (unlocked ? "" : " locked");
    btn.title = unlocked ? name : t("cursorStyle.lockedTitle", { name, req: cursorLockRequirementText(entry.id) });
    btn.innerHTML = (entry.id === "normal"
        ? `<span class="cursor-style-icon">🖱️</span>`
        : `<img src="${entry.url}" alt="${name}" loading="lazy" onerror="this.closest('.cursor-style-option').style.display='none'">`)
      + `<span class="cursor-style-name">${name}</span>`
      + (unlocked ? "" : `<span class="cursor-style-lock-badge">🔒</span>`);
    btn.addEventListener("click", () => {
      if (!unlocked) {
        queueAchievementToasts([{ icon: "🔒", label: t("lock.badge"), title: t("cursorStyle.lockedToast", { req: cursorLockRequirementText(entry.id) }) }]);
        return;
      }
      settings.cursorStyle = entry.id;
      saveSettings();
      renderCursorGrid();
      applyCursorStyle();
    });
    gridEl.appendChild(btn);
  });
}

/** Aplica (o quita) al <body> el puntero del ratón sustituido por el
 * sprite del estilo elegido en `settings.cursorStyle`. Comprueba también
 * isCursorUnlocked() (no solo el valor guardado), para que un estilo
 * guardado de una partida antigua no tenga efecto si, por lo que sea, su
 * logro ya no constara como desbloqueado. */
function applyCursorStyle() {
  const id = settings.cursorStyle;
  const unlocked = id !== "normal" && typeof isCursorUnlocked === "function" && isCursorUnlocked(id);
  const cursorData = unlocked ? CURSOR_CATALOG.find(c => c.id === id) : null;
  if (cursorData) {
    document.body.classList.add("custom-cursor");
    document.body.style.setProperty("--cursor-url", `url("${cursorData.url}")`);
  } else {
    document.body.classList.remove("custom-cursor");
    document.body.style.removeProperty("--cursor-url");
  }
}

musicSlider.addEventListener("input", () => {
  settings.musicVol = clamp01(parseInt(musicSlider.value, 10) / 100);
  applyAudioVolumes();
  menuAudio.volume=settings.musicVol;
  saveSettings();
});
sfxSlider.addEventListener("input", () => {
  settings.sfxVol = clamp01(parseInt(sfxSlider.value, 10) / 100);
  saveSettings();
});
darkToggle.addEventListener("change", () => {
  settings.darkMode = !!darkToggle.checked;
  applyTheme();
  saveSettings();
});
if (bgToggle) {
  bgToggle.addEventListener("change", () => {
    settings.animatedBg = !!bgToggle.checked;
    applyGraphicsSettings();
    saveSettings();
  });
}
if (particlesToggle) {
  particlesToggle.addEventListener("change", () => {
    settings.particles = !!particlesToggle.checked;
    applyGraphicsSettings();
    saveSettings();
  });
}

// ── Selector de idioma de los menús ──
const langEsBtn = document.getElementById("lang-es-btn");
const langEnBtn = document.getElementById("lang-en-btn");

/** Refleja en los dos botones del selector de idioma cuál está activo
 * ahora mismo (según `settings.language`). */
function applyLanguageSwitchUI(){
  if (langEsBtn) langEsBtn.classList.toggle("active", settings.language === "es");
  if (langEnBtn) langEnBtn.classList.toggle("active", settings.language === "en");
}
if (langEsBtn) langEsBtn.addEventListener("click", () => { setLanguage("es"); applyLanguageSwitchUI(); });
if (langEnBtn) langEnBtn.addEventListener("click", () => { setLanguage("en"); applyLanguageSwitchUI(); });

/** Refresca el nombre visible de las tarjetas de región del Modo Normal
 * (pantalla `#screen-region-select`, generadas una única vez en game.js
 * al arrancar la app con `regionDisplayName()` ya aplicado en ese
 * momento). Si el jugador cambia de idioma después de que esas tarjetas
 * ya estén pintadas, hay que repintar aquí el texto visible; la clave
 * interna de la región (`REGIONS`, `session.normalRegion`...) no se
 * toca. Se apoya en que las tarjetas se crean en el mismo orden que
 * `REGIONS` (ver game.js) para saber a qué región corresponde cada una. */
function refreshRegionPillNames(){
  const names = document.querySelectorAll("#region-pills .region-card-name");
  names.forEach((el, i) => { el.textContent = regionDisplayName(REGIONS[i]); });
}

/** Punto de enganche que llama i18n.js (`setLanguage()`) tras cambiar el
 * idioma: además de re-aplicar el marcado estático (`applyTranslations`,
 * ya hecho por i18n.js), refresca aquí los textos que ui.js/game.js
 * generan a mano y que pudieran estar ya pintados en pantalla con el
 * idioma anterior (toggles de Opciones, resumen de Logros/Sonidex en
 * Inicio, pantalla de Clasificaciones, cabecera de la ronda en curso...). */
function refreshLanguageDependentUI(){
  applyLanguageSwitchUI();
  applyTheme();
  applyGraphicsSettings();
  if (typeof updateHomeAchievementSummary === "function") updateHomeAchievementSummary();
  if (typeof updateHomeSonidexSummary === "function") updateHomeSonidexSummary();
  if (typeof updateModeLocksUI === "function") updateModeLocksUI();
  if (typeof updateOtherLocksUI === "function") updateOtherLocksUI();
  refreshRegionPillNames();
  if (document.getElementById("profile-overlay").classList.contains("show") && typeof renderProfileStats === "function") {
    renderProfileStats();
  }
  if (document.getElementById("screen-achievements").classList.contains("show") && typeof renderAchievementsScreen === "function") {
    renderAchievementsScreen();
  }
  if (document.getElementById("screen-sonidex").classList.contains("show") && typeof renderSonidexScreen === "function") {
    renderSonidexScreen();
  }
  if (document.getElementById("screen-leaderboard").classList.contains("show") && typeof renderLeaderboardScreen === "function") {
    renderLeaderboardScreen();
  }
  if (document.getElementById("screen-quiz").classList.contains("show") && typeof setModeLabel === "function") {
    setModeLabel();
  }
}

// Unlock audio on first interaction (mobile / políticas de autoplay)
['touchstart', 'click', 'keydown', 'pointerdown'].forEach(ev => {
  document.addEventListener(ev, () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    // quita el silencio inicial de la música de menú (ya estaba sonando muteada)
    unlockMenuMusic();
  }, { passive: true });
});


// ═══════════════════════════════════════════════
//  🌟 PANTALLA PREVIA (SPLASH)
// ═══════════════════════════════════════════════
// La música del menú permanece en pausa hasta que el jugador toque la
// pantalla previa: no se llama a ensureMenuMusicPlaying()/unlockMenuMusic()
// en ningún sitio antes de este punto.
const splashScreen = document.getElementById('splash-screen');
/** Cierra la pantalla previa (splash) al primer toque del jugador:
 * desmutea y arranca la música de menú (debe ocurrir dentro del gesto
 * del usuario para que el navegador permita el audio) y, tras la
 * animación de salida, comprueba si hay que pedirle nombre y avatar
 * por ser la primera partida. */
function dismissSplash(){
  if (!splashScreen || splashScreen.classList.contains('hide')) return;
  splashScreen.classList.add('hide');
  // Justo en el gesto del usuario: desmutea y arranca la música del menú
  unlockMenuMusic();
  setTimeout(() => {
    splashScreen.style.display = 'none';
    // Si es la primera vez que juega, pide nombre y avatar antes de seguir
    showProfileSetupIfNeeded();
  }, 550);
}
splashScreen.addEventListener('click', dismissSplash);
splashScreen.addEventListener('touchend', (e) => { e.preventDefault(); dismissSplash(); }, { passive: false });

// ═══════════════════════════════════════════════
//  👤 PERFIL DE JUGADOR: pantalla inicial + modal de estadísticas
// ═══════════════════════════════════════════════
const profileSetupOverlay = document.getElementById('profile-setup-overlay');
const profileSetupNameInput = document.getElementById('profile-setup-name');
const profileSetupNameError = document.getElementById('profile-setup-name-error');
const profileSetupAvatarGrid = document.getElementById('profile-setup-avatar-grid');
const profileSetupConfirmBtn = document.getElementById('profile-setup-confirm');
const profileSetupConfirmBtnDefaultHTML = profileSetupConfirmBtn.innerHTML;

let pendingSetupAvatarId = DEFAULT_AVATAR_ID;

/** Habilita el botón "Empezar a jugar" de la pantalla de configuración
 * inicial solo cuando el jugador ha escrito un nombre. */
function updateSetupConfirmState() {
  const nameOk = profileSetupNameInput.value.trim().length > 0;
  profileSetupConfirmBtn.disabled = !nameOk;
}

/** Oculta el aviso de "nombre ya en uso" (p. ej. al reabrir la pantalla
 * o al retomar la edición tras un intento fallido). */
function clearSetupNameError() {
  profileSetupNameInput.classList.remove('has-error');
  profileSetupNameError.style.display = 'none';
  profileSetupNameError.textContent = '';
}

/** Muestra la pantalla de creación de perfil (nombre + avatar) si el
 * jugador todavía no tiene uno guardado; no hace nada si ya existe. */
function showProfileSetupIfNeeded() {
  if (hasProfile()) return;
  pendingSetupAvatarId = DEFAULT_AVATAR_ID;
  profileSetupNameInput.value = "";
  clearSetupNameError();
  renderAvatarGrid(profileSetupAvatarGrid, pendingSetupAvatarId, (id) => { pendingSetupAvatarId = id; });
  updateSetupConfirmState();
  profileSetupOverlay.classList.add('show');
  setTimeout(() => profileSetupNameInput.focus(), 300);
}
profileSetupNameInput.addEventListener('input', () => {
  clearSetupNameError();
  updateSetupConfirmState();
});
profileSetupNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !profileSetupConfirmBtn.disabled) profileSetupConfirmBtn.click();
});
/** Confirma la pantalla de configuración inicial: intenta reservar el
 * nombre de entrenador elegido en el registro global de nicknames
 * (Leaderboard.claimUsername(), leaderboard.js) antes de crear el
 * perfil, para que dos jugadores no puedan quedarse con el mismo
 * nombre. Si el nombre ya está cogido por otro jugador, no se crea el
 * perfil y se muestra el aviso en `profile-setup-name-error`; si no se
 * ha podido comprobar (sin Firestore, sin conexión...) se deja crear
 * el perfil igualmente, para que el juego siga siendo jugable sin
 * backend (mismo criterio que el resto de `Leaderboard`, ver su
 * cabecera en leaderboard.js). */
profileSetupConfirmBtn.addEventListener('click', async () => {
  const name = profileSetupNameInput.value.trim().slice(0, 16);
  if (!name) return;

  clearSetupNameError();
  profileSetupConfirmBtn.disabled = true;
  profileSetupNameInput.disabled = true;
  profileSetupConfirmBtn.textContent = t("profileSetup.checking");

  const result = await Leaderboard.claimUsername(name, ensurePlayerId());

  if (!result.ok && result.reason === "taken") {
    profileSetupNameInput.disabled = false;
    profileSetupNameInput.classList.add('has-error');
    profileSetupNameError.textContent = t("profileSetup.nameTaken");
    profileSetupNameError.style.display = '';
    profileSetupConfirmBtn.innerHTML = profileSetupConfirmBtnDefaultHTML;
    updateSetupConfirmState();
    profileSetupNameInput.focus();
    return;
  }

  // result.ok === true (reservado, o ya reservado por este mismo
  // playerId), o no se pudo comprobar (reason: "unverified"/"invalid"):
  // en ambos casos se deja continuar, el juego no debe bloquearse por
  // un fallo de red/permisos de Firestore.
  profile.username = name;
  profile.avatarId = pendingSetupAvatarId;
  saveProfile();
  renderProfileBar();
  profileSetupNameInput.disabled = false;
  profileSetupConfirmBtn.innerHTML = profileSetupConfirmBtnDefaultHTML;
  profileSetupOverlay.classList.remove('show');
});

// ── Modal de perfil: estadísticas del jugador + cambio de avatar ──
const profileOverlay = document.getElementById('profile-overlay');
const profileBar = document.getElementById('profile-bar');
const profileCloseBtn = document.getElementById('profile-close-btn');
const profileModalAvatarImg = document.getElementById('profile-modal-avatar-img');
const profileModalName = document.getElementById('profile-modal-name');
const profileStatsList = document.getElementById('profile-stats-list');
const profileChangeAvatarBtn = document.getElementById('profile-change-avatar-btn');
const profileModalAvatarGrid = document.getElementById('profile-modal-avatar-grid');

/** Refresca la insignia de nivel, el texto "Nivel N" y la barra de
 * progreso de experiencia dentro del modal de perfil. */
function renderProfileLevelUI() {
  const info = computeLevelInfo(profile.xp);
  const badge = document.getElementById('profile-modal-level-badge');
  const numEl = document.getElementById('profile-level-num');
  const barFill = document.getElementById('profile-xp-bar-fill');
  const label = document.getElementById('profile-xp-label');
  if (badge) badge.textContent = info.level;
  if (numEl) numEl.textContent = info.level;
  if (barFill) barFill.style.width = Math.min(100, Math.round((info.xpIntoLevel / info.xpForNextLevel) * 100)) + '%';
  if (label) label.textContent = t("profile.xpLabel", { into: info.xpIntoLevel, need: info.xpForNextLevel, next: info.level + 1 });
}

/** Reconstruye la lista de estadísticas del modal de perfil (puntos
 * totales, logros, partidas jugadas, rachas, récords...) y actualiza
 * también el bloque de nivel/experiencia. */
function renderProfileStats() {
  const s = achievementsData.stats;
  const unlockedCount = Object.keys(achievementsData.unlocked).length;
  const sonidexTotals = computeSonidexTotals();
  const pts = t("common.pts");
  const rows = [
    { label: t("profile.stats.totalPoints"), value: profile.xp || 0 },
    { label: t("profile.stats.achievementsUnlocked"), value: `${unlockedCount} / ${ACHIEVEMENTS.length}` },
    { label: t("profile.stats.gamesPlayed"), value: s.gamesPlayed || 0 },
    { label: t("profile.stats.correctAnswers"), value: s.totalCorrect || 0 },
    { label: t("profile.stats.bestStreak"), value: s.bestStreak || 0 },
    { label: t("profile.stats.infiniteRecord"), value: `${s.bestInfiniteScore || 0} ${pts}` },
    { label: t("profile.stats.storyRecord"), value: `${s.bestStoryScore || 0} ${pts}` },
    { label: t("profile.stats.hardRecord"), value: `${s.bestHardScore || 0} ${pts}` },
    { label: t("profile.stats.combatRecord"), value: `${s.bestCombatScore || 0} ${pts}` },
    { label: t("profile.stats.sonidexUnlocked"), value: `${sonidexTotals.unlocked} / ${sonidexTotals.total}` },
  ];

  // Un récord por región (Modo Normal): igual que en la tarjeta "Tus
  // récords" de la pantalla de Clasificaciones (ver
  // renderLeaderboardPersonalBests()), se genera aquí a partir de
  // REGIONS/regionDisplayName (game.js, que carga después que ui.js) en
  // vez de como filas fijas en index.html — seguro porque esta función
  // solo se ejecuta al abrir el modal de perfil, nunca durante la carga
  // inicial de la página.
  const bestByRegion = s.bestRegionScore || {};
  const regionRows = REGIONS.map(r => `
    <div class="streak-row">
      <div class="streak-name">🗺️ ${regionDisplayName(r)}</div>
      <div class="streak-value">${bestByRegion[r] || 0} ${pts}</div>
    </div>
  `).join("");

  profileStatsList.innerHTML = `<div class="profile-stats-title">${t("profile.stats.title")}</div>` +
    rows.map(r => `<div class="streak-row"><div class="streak-name">${r.label}</div><div class="streak-value">${r.value}</div></div>`).join("") +
    `<div class="profile-stats-title">${t("profile.stats.regionRecordsTitle")}</div>` +
    regionRows;
  renderProfileLevelUI();
}

/** Abre el modal de perfil: rellena avatar, nombre y estadísticas
 * actuales y lo muestra en pantalla. */
function openProfileModal() {
  profileModalAvatarImg.src = getAvatarUrl(profile.avatarId);
  profileModalName.textContent = profile.username || t("common.trainerDefault");
  profileModalAvatarGrid.style.display = 'none';
  renderProfileStats();
  profileOverlay.classList.add('show');
}
/** Cierra el modal de perfil. */
function closeProfileModal() {
  profileOverlay.classList.remove('show');
}
profileBar.addEventListener('click', openProfileModal);
profileCloseBtn.addEventListener('click', closeProfileModal);
profileOverlay.addEventListener('click', (e) => { if (e.target === profileOverlay) closeProfileModal(); });

// Nota: el nombre de entrenador ya NO se puede editar desde este modal
// (solo se elige una vez, en la pantalla de configuración inicial —
// ver profileSetupConfirmBtn más abajo) porque queda reservado en
// Firestore vía Leaderboard.claimUsername(): permitir cambiarlo aquí
// sin liberar ni volver a reservar el nombre anterior/nuevo dejaría el
// registro de nicknames desincronizado con lo que ve cada jugador.

// Cambiar imagen de perfil desde el modal
profileChangeAvatarBtn.addEventListener('click', () => {
  const showing = profileModalAvatarGrid.style.display !== 'none';
  if (showing) {
    profileModalAvatarGrid.style.display = 'none';
    return;
  }
  renderAvatarGrid(profileModalAvatarGrid, profile.avatarId, (id) => {
    profile.avatarId = id;
    saveProfile();
    renderProfileBar();
    profileModalAvatarImg.src = getAvatarUrl(id);
  });
  profileModalAvatarGrid.style.display = 'grid';
});


// ═══════════════════════════════════════════════
//  📖 MODO HISTORIA: OVERLAYS DE REGIÓN/COMBATE Y RECURSOS VISUALES
// ═══════════════════════════════════════════════
const storyOverlay = document.getElementById('story-overlay');
const storyOverlayTitle = document.getElementById('story-overlay-title');
const storyOverlaySubtitle = document.getElementById('story-overlay-subtitle');
const storyOverlayTap = document.getElementById('story-overlay-tap');
const storyOverlayBall = document.getElementById('story-overlay-ball');
const storyCompleteOverlay = document.getElementById('story-complete-overlay');
const storyCompleteTitle = document.getElementById('story-complete-title');
const storyCompleteSubtitle = document.getElementById('story-complete-subtitle');
const storyCompleteBall = document.getElementById('story-complete-ball');

// Sprites (PokeAPI/sprites) usados en las pantallas previas del Modo
// Historia en vez de emoticonos: una Poké Ball estándar para la llegada a
// una nueva región y para las pantallas de "completado", y una Master Ball
// para el aviso de enemigo poderoso (transmite que es un encuentro especial).
const STORY_BALL_NORMAL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
const STORY_BALL_COMBAT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png";
// Corazón roto (SVG inline) usado en la pantalla de Game Over del Modo Historia
// en vez de la Poké Ball en gris: dos mitades con sombreado e iluminación
// propios, un contorno definido, brillo especular, sombra de apoyo y una
// grieta central con efecto "tallado" (sombra + línea de luz), para un
// acabado más pulido que una simple silueta plana.
const STORY_BROKEN_HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="hgL" x1="0" y1="0" x2="0.9" y2="1">
<stop offset="0%" stop-color="#ff8c8c"/>
<stop offset="55%" stop-color="#e5302f"/>
<stop offset="100%" stop-color="#8f1016"/>
</linearGradient>
<linearGradient id="hgR" x1="1" y1="0" x2="0.1" y2="1">
<stop offset="0%" stop-color="#ffa8a8"/>
<stop offset="55%" stop-color="#ef3b3a"/>
<stop offset="100%" stop-color="#a5171c"/>
</linearGradient>
<radialGradient id="gloss" cx="50%" cy="18%" r="55%">
<stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<clipPath id="lh">
<polygon points="0,0 50,17 45,28 55,36 43,46 57,56 44,68 50,88 50,100 0,100"/>
</clipPath>
<clipPath id="rh">
<polygon points="100,0 50,17 45,28 55,36 43,46 57,56 44,68 50,88 50,100 100,100"/>
</clipPath>
</defs>
<ellipse cx="50" cy="92" rx="27" ry="5" fill="#000000" opacity="0.3"/>
<g clip-path="url(#lh)" transform="translate(-3.5,-2) rotate(-3.5 50 50)">
<path d="M50,88 C50,88 8,58 8,32 C8,14 22,4 37,4 C44,4 50,9 50,17 C50,9 56,4 63,4 C78,4 92,14 92,32 C92,58 50,88 50,88 Z" fill="url(#hgL)" stroke="#6b0e12" stroke-width="2" stroke-linejoin="round"/>
<path d="M50,88 C50,88 8,58 8,32 C8,14 22,4 37,4 C44,4 50,9 50,17 C50,9 56,4 63,4 C78,4 92,14 92,32 C92,58 50,88 50,88 Z" fill="url(#gloss)" opacity="0.55"/>
</g>
<g clip-path="url(#rh)" transform="translate(3.5,2.5) rotate(3.5 50 50)">
<path d="M50,88 C50,88 8,58 8,32 C8,14 22,4 37,4 C44,4 50,9 50,17 C50,9 56,4 63,4 C78,4 92,14 92,32 C92,58 50,88 50,88 Z" fill="url(#hgR)" stroke="#6b0e12" stroke-width="2" stroke-linejoin="round"/>
<path d="M50,88 C50,88 8,58 8,32 C8,14 22,4 37,4 C44,4 50,9 50,17 C50,9 56,4 63,4 C78,4 92,14 92,32 C92,58 50,88 50,88 Z" fill="url(#gloss)" opacity="0.35"/>
</g>
<polyline points="50,17 45,28 55,36 43,46 57,56 44,68 50,88" fill="none" stroke="#570a0d" stroke-width="4.4" stroke-linejoin="round" stroke-linecap="round" opacity="0.6"/>
<polyline points="50,17 45,28 55,36 43,46 57,56 44,68 50,88" fill="none" stroke="#ffe1e1" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
const STORY_BROKEN_HEART = "data:image/svg+xml," + encodeURIComponent(STORY_BROKEN_HEART_SVG);

let storyOverlayAction = null; // acción a ejecutar cuando el jugador toque story-overlay

// Pantalla previa de región: muestra el título de la región; al tocar,
// arranca las 10 rondas normales de esa región.
function storyShowRegionSplash() {
  const region = REGIONS[session.storyRegionIndex];
  storyOverlayTitle.textContent = regionDisplayName(region);
  storyOverlaySubtitle.textContent = t("story.subtitleMain");
  storyOverlayTap.textContent = t("story.tapStart");
  storyOverlayBall.src = STORY_BALL_NORMAL;
  storyOverlay.classList.remove('combat');
  storyOverlayAction = () => {
    session.storyPhase = "region";
    startGame(GameMode.STORY, region);
  };
  showScreen("home", false);
  storyOverlay.classList.add('show');
  // Si veníamos del overlay "Región Completada" (transición entre regiones),
  // lo ocultamos ahora que el overlay de la nueva región ya está por encima,
  // para que el menú principal de fondo nunca quede expuesto.
  storyCompleteOverlay.classList.remove('show');
}

// Pantalla de aviso de enemigo: al tocar, arranca las 3 rondas de combate.
function storyShowEnemyScreen() {
  storyOverlayTitle.textContent = t("story.enemyTitle");
  storyOverlaySubtitle.textContent = t("story.subtitleCombat");
  storyOverlayTap.textContent = t("story.tapFight");
  storyOverlayBall.src = STORY_BALL_COMBAT;
  storyOverlay.classList.add('combat');
  storyOverlayAction = () => {
    session.storyPhase = "combat";
    startGame(GameMode.STORY, "Combate");
  };
  storyOverlay.classList.add('show');
}

/** Cierra la pantalla previa del Modo Historia (región / aviso de
 * combate) al tocarla y ejecuta la acción pendiente asociada
 * (normalmente, arrancar la siguiente ronda o fase). */
function dismissStoryOverlay() {
  if (!storyOverlay.classList.contains('show')) return;
  storyOverlay.classList.remove('show');
  const action = storyOverlayAction;
  storyOverlayAction = null;
  if (action) action();
}
storyOverlay.addEventListener('click', dismissStoryOverlay);
storyOverlay.addEventListener('touchend', (e) => { e.preventDefault(); dismissStoryOverlay(); }, { passive: false });

// ── Modal de información de Eventos Pokémon (botón "ⓘ" de la pantalla
// previa de región del Modo Historia) ──
// Se rellena a partir de PokeEvents.list(), así que si se añade un evento
// nuevo al catálogo, aparece aquí automáticamente sin tocar nada más.
const pokeEventsInfoOverlay = document.getElementById('poke-events-info-overlay');
const storyInfoBtn = document.getElementById('story-info-btn');
const pokeEventsInfoClose = document.getElementById('poke-events-info-close');

/** Rellena la lista del overlay informativo de Eventos Pokémon con el
 * icono y nombre de cada evento posible. */
function renderPokeEventsInfo() {
  const listEl = document.getElementById('poke-events-info-list');
  if (!listEl) return;
  listEl.innerHTML = PokeEvents.list().map(ev => {
    const spritePath = ev.shiny ? `shiny/${ev.pokemonId}` : `${ev.pokemonId}`;
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spritePath}.png`;
    const name = tData(`pokeEvent.${ev.id}.name`, ev.name);
    const description = tData(`pokeEvent.${ev.id}.desc`, ev.description);
    return `
      <div class="poke-event-info-item">
        <img class="poke-event-info-icon" src="${spriteUrl}" alt="${name}" loading="lazy">
        <div class="poke-event-info-text">
          <div class="guide-item-title">${name}</div>
          <div class="guide-item-desc">${description}</div>
        </div>
      </div>`;
  }).join('');
}

/** Abre el overlay que explica los distintos Eventos Pokémon que pueden
 * aparecer durante una ronda. */
function openPokeEventsInfo() {
  renderPokeEventsInfo();
  pokeEventsInfoOverlay.classList.add('show');
}
/** Cierra el overlay informativo de Eventos Pokémon. */
function closePokeEventsInfo() {
  pokeEventsInfoOverlay.classList.remove('show');
}
if (storyInfoBtn) {
  // stopPropagation: el botón vive dentro de #story-overlay, que tiene su
  // propio listener de click/touchend para arrancar la partida al tocar la
  // pantalla; sin esto, pulsar "ⓘ" también dispararía dismissStoryOverlay().
  storyInfoBtn.addEventListener('click', (e) => { e.stopPropagation(); openPokeEventsInfo(); });
  storyInfoBtn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); openPokeEventsInfo(); }, { passive: false });
}
if (pokeEventsInfoClose) {
  pokeEventsInfoClose.addEventListener('click', (e) => { e.stopPropagation(); closePokeEventsInfo(); });
  pokeEventsInfoClose.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); closePokeEventsInfo(); }, { passive: false });
}
// Tocar el fondo oscurecido (fuera de la tarjeta) también cierra el modal.
if (pokeEventsInfoOverlay) {
  pokeEventsInfoOverlay.addEventListener('click', (e) => {
    if (e.target === pokeEventsInfoOverlay) closePokeEventsInfo();
  });
}

// Animación "<Región> Completado": aparece, se mantiene un instante y
// desaparece con otra animación; entonces se ejecuta onDone (pasar a la
// siguiente región o finalizar el recorrido).
function storyShowRegionComplete(regionName, onDone) {
  storyCompleteTitle.textContent = t("story.regionCompleted", { region: regionDisplayName(regionName) });
  storyCompleteBall.src = STORY_BALL_NORMAL;
  storyCompleteOverlay.classList.remove('gameover');
  storyCompleteOverlay.classList.add('show');
  playSFX(SFX.victory);
  // Nota: NO ocultamos storyCompleteOverlay aquí. Se oculta desde
  // storyShowRegionSplash() justo después de mostrar el overlay de la
  // siguiente región, para que en ningún momento quede expuesto (ni sea
  // clicable) el menú principal de fondo durante la transición.
  setTimeout(onDone, 1800);
}
