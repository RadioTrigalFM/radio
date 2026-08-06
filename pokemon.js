/* ══════════════════════════════════════════════════════════════════════
   RADIO TRIGAL FM — SISTEMA DE POKÉMON (pokemon.js)
   ══════════════════════════════════════════════════════════════════════
   Todo lo relacionado con los Pokémon "de sistema" del juego vive aquí:
   el módulo PokeEvents (catálogo y motor de los Eventos Pokémon del Modo
   Historia), los Pokémon animados que pasean por las colinas del fondo
   (construidos automáticamente a partir de ese mismo catálogo) y el
   panel de depuración para forzar un evento concreto durante las
   pruebas.

   Los EFECTOS concretos de cada evento (el temblor de pantalla de
   Hypno, el canto de Jigglypuff, la explosión de Electrode, el glitch
   de Porygon...) siguen viviendo en game.js, junto al resto de la
   lógica de la ronda/Modo Historia con la que están entrelazados
   (vidas, puntuación, PokeEvents.applyToAnswers/applyToAudio...); aquí
   solo está el catálogo que decide QUÉ evento aparece y CUÁNDO.

   Debe cargarse después de audio.js (el evento del Caterpie shiny usa
   `SFX.shiny` nada más registrarse, así que SFX ya debe existir) y
   antes de game.js (game.js llama a buildBgPokemon() en su bloque de
   INIT, al final de su propia carga). El resto de identificadores que
   este fichero usa pero no define (session, GameMode, achievementsData,
   trackEncounter, playSFX, shuffle, rand, spawnParticles,
   ACHIEVEMENT_CONDITIONS...) solo se referencian dentro de funciones
   que se invocan más tarde, nunca al cargarse el script.
   ══════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
//  🎉 SISTEMA DE EVENTOS POKÉMON (solo Modo Historia)
// ═══════════════════════════════════════════════
// Módulo autocontenido y desacoplado del resto del juego.
//
// Contrato con el "core" del juego (únicos puntos de contacto, ver más abajo
// en nextRound()/startRound()):
//   PokeEvents.tryTrigger(onDone)      → tras terminar una canción, decide si
//                                         activa un evento; siempre llama a
//                                         onDone() cuando puede continuarse.
//   PokeEvents.beginRound()            → comprobación de seguridad: se llama
//                                         al principio de CADA startRound()
//                                         y garantiza que no quede ningún
//                                         evento activo "colgado" si esa
//                                         ronda no viene de un tryTrigger()
//                                         recién resuelto.
//   PokeEvents.applyToAnswers(gridEl)  → aplica el efecto visual del evento
//                                         activo (si lo hay) sobre las
//                                         opciones de la ronda.
//   PokeEvents.applyToAudio(audioEl)   → aplica el efecto de audio del evento
//                                         activo (si lo hay) sobre la canción
//                                         de la ronda.
//
// El core NO conoce ningún evento en concreto: solo invoca estos 3 métodos
// (más PokeEvents.activeId(), una consulta de solo lectura que usa
// handleAnswer() para el caso puntual de Chansey, cuyo efecto no es visual
// sino que altera el propio flujo de "fallo de ronda").
// Añadir un evento nuevo = llamar a PokeEvents.register({...}) más abajo,
// sin tocar ninguna otra parte del código (salvo que, como Chansey, necesite
// afectar al flujo del core y no solo al aspecto visual/sonoro).
const PokeEvents = (function () {
  const TRIGGER_CHANCE = 0.15;   // 15% de probabilidad tras cada canción
  const PITY_STREAK = 7;         // rondas seguidas sin evento tras las que el siguiente se fuerza
  const PRE_DELAY_MS = 1000;     // pausa de 1s antes de mostrar la carta
  const CARD_VISIBLE_MS = 2400;  // tiempo que la carta permanece en pantalla
  const CARD_EXIT_MS = 500;      // debe coincidir con la transición CSS de salida

  const registry = [];           // catálogo de eventos disponibles
  let active = null;             // evento activo durante la ronda actual (o null)

  // Nº de rondas consecutivas (elegibles) en las que NO se ha activado un
  // evento. Al llegar a PITY_STREAK, la siguiente ronda fuerza un evento
  // seguro y el contador se reinicia a 0.
  let noEventStreak = 0;

  // Flag interno de "traspaso": solo es true en la ventana entre el momento
  // en que tryTrigger() decide activar un evento y el momento en que
  // startRound() lo consume a través de beginRound(). Es lo que permite a
  // beginRound() distinguir "esta ronda viene legítimamente de un evento
  // recién decidido" de "esta ronda se ha iniciado por otra vía" (nueva
  // partida, cambio de fase en Modo Historia, reintento, etc.), que es
  // precisamente el caso en el que active podía quedar "colgado" de una
  // ronda anterior.
  let pendingHandoff = false;

  // Un evento puede activarse en Modo Historia siempre, y en el Desafío
  // Infinito solo si el jugador ya ha completado el Modo Historia entero
  // (logro «story_complete»), momento en el que los eventos se desbloquean
  // también ahí.
  function isEligible() {
    if (typeof session === "undefined") return false;
    if (session.mode === GameMode.STORY) return true;
    if (session.mode === GameMode.INFINITE) {
      return typeof achievementsData !== "undefined" && !!(achievementsData.unlocked && achievementsData.unlocked["story_complete"]);
    }
    return false;
  }

  // Registra un nuevo evento. Forma de un evento:
  // {
  //   id: "inkay",                 // identificador único
  //   name: "Inkay",                // nombre mostrado en la carta
  //   description: "...",           // descripción mostrada en la carta
  //   pokemonId: 686,                // nº de Pokédex (sprite oficial vía PokeAPI)
  //   shiny: true,                    // (opcional) usa la variante shiny del sprite
  //   sfx: SFX.event,                // (opcional) sonido propio; si no, se usa SFX.event
  //   onAnswers(gridEl) {...},       // (opcional) efecto sobre #answers-grid
  //   onAudio(audioEl)  {...},       // (opcional) efecto sobre el <audio> de la ronda
  // }
  function register(event) {
    registry.push(event);
  }

  // Se llama justo después de terminar la canción de la ronda anterior
  // (ver nextRound()). Decide con un 15% de probabilidad si activar un
  // evento (o lo activa de forma segura si ya se ha acumulado la racha de
  // PITY_STREAK rondas sin evento); si lo activa, muestra la animación de
  // aparición y solo entonces llama a onDone() para que el juego continúe
  // con la siguiente ronda.
  function tryTrigger(onDone) {
    active = null;
    pendingHandoff = false;

    if (!isEligible() || registry.length === 0) {
      onDone();
      return;
    }

    const guaranteed = noEventStreak >= PITY_STREAK;
    if (!guaranteed && Math.random() >= TRIGGER_CHANCE) {
      noEventStreak++;
      onDone();
      return;
    }

    noEventStreak = 0;
    active = registry[Math.floor(Math.random() * registry.length)];
    pendingHandoff = true; // este evento sí debe sobrevivir hasta la próxima startRound()
    if (typeof trackEncounter === "function") trackEncounter(active.id);
    showActiveEventAndContinue(onDone);
  }

  // Comprobación de seguridad: DEBE llamarse al principio de cada
  // startRound(), antes de aplicar ningún efecto. Si la ronda que arranca
  // no viene de un tryTrigger() que acabe de dejar un evento pendiente de
  // aplicar (p. ej. porque startRound() se ha llamado directamente desde
  // startGame(), un cambio de fase del Modo Historia, un reintento, etc.),
  // se fuerza a que no quede ningún evento "colgado" de una ronda o
  // partida anterior.
  function beginRound() {
    if (!pendingHandoff) active = null;
    pendingHandoff = false;
  }

  // Muestra la carta de aparición del evento (sprite, nombre y descripción)
  // durante CARD_VISIBLE_MS y la retira con una animación de salida; solo
  // llama a onDone() cuando la carta ha desaparecido del todo, para que la
  // siguiente ronda no arranque mientras la animación sigue en pantalla.
  function playEventAnimation(ev, onDone) {
    const overlay = document.getElementById("poke-event-overlay");
    const sprite = document.getElementById("poke-event-sprite");
    const name = document.getElementById("poke-event-name");
    const desc = document.getElementById("poke-event-desc");
    if (!overlay) { onDone(); return; } // fallback de seguridad si falta el markup

    setTimeout(() => {
      const spritePath = ev.shiny ? `shiny/${ev.pokemonId}` : `${ev.pokemonId}`;
      sprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spritePath}.png`;
      const evName = tData(`pokeEvent.${ev.id}.name`, ev.name);
      sprite.alt = evName;
      name.textContent = evName;
      desc.textContent = tData(`pokeEvent.${ev.id}.desc`, ev.description);

      overlay.classList.add("show");
      playSFX(ev.sfx || SFX.event);

      setTimeout(() => {
        overlay.classList.remove("show");
        setTimeout(onDone, CARD_EXIT_MS);
      }, CARD_VISIBLE_MS);
    }, PRE_DELAY_MS);
  }

  // Muestra la animación de aparición del evento activo y continúa la
  // ronda cuando termina. Punto único de entrada usado por el disparo
  // normal de tryTrigger(), para no repetir la comprobación del caso
  // especial de Mew en dos sitios (Regla nº2 de CLAUDE.md).
  //
  // El evento Mew es un caso especial: en vez de aplicar directamente su
  // propio efecto, "se transforma" en uno de otros 3 eventos elegidos al
  // azar, y es el JUGADOR quien decide en cuál con un clic (ver
  // playMewTransformFlow más abajo). El resto de eventos siguen el
  // camino normal de playEventAnimation().
  function showActiveEventAndContinue(onDone) {
    if (active.id === "mew") {
      playMewTransformFlow(onDone);
    } else {
      playEventAnimation(active, onDone);
    }
  }

  // Muestra primero la carta de aparición normal de Mew (igual que
  // cualquier otro evento) y, en cuanto desaparece, encadena el selector
  // de transformación en vez de continuar la ronda directamente.
  function playMewTransformFlow(onDone) {
    playEventAnimation(active, () => showMewChoiceOverlay(onDone));
  }

  // Sortea 3 eventos distintos del catálogo (cualquiera menos el propio
  // Mew) y muestra un selector con su sprite y nombre para que el
  // jugador toque el que quiere que "sea" Mew esta ronda. Al elegir uno,
  // el evento activo pasa a ser ese Pokémon elegido: su onAnswers/
  // onAudio (y cualquier caso especial de game.js que consulte
  // PokeEvents.activeId(), como los multiplicadores de puntos de Shiny/
  // Pikachu o la vida extra de Venusaur) se aplican a la ronda exactamente
  // igual que si hubiera aparecido él directamente. Solo entonces se
  // llama a onDone() para continuar con la ronda.
  function showMewChoiceOverlay(onDone) {
    const overlay = document.getElementById("mew-choice-overlay");
    const optionsWrap = document.getElementById("mew-choice-options");
    if (!overlay || !optionsWrap) { onDone(); return; } // fallback si falta el markup

    const others = registry.filter(ev => ev.id !== "mew");
    const choices = shuffle(others).slice(0, Math.min(3, others.length));

    optionsWrap.innerHTML = "";
    choices.forEach(ev => {
      const btn = document.createElement("button");
      btn.className = "mew-choice-option";
      const spritePath = ev.shiny ? `shiny/${ev.pokemonId}` : `${ev.pokemonId}`;
      btn.innerHTML = `
        <img class="mew-choice-sprite" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spritePath}.png" alt="${ev.name}">
        <div class="mew-choice-name">${ev.name}</div>
      `;
      btn.onclick = () => {
        overlay.classList.remove("show");
        active = ev; // Mew "se convierte" en el Pokémon elegido por el jugador
        pendingHandoff = true; // sigue pendiente de aplicarse en el próximo startRound()
        setTimeout(onDone, CARD_EXIT_MS);
      };
      optionsWrap.appendChild(btn);
    });

    overlay.classList.add("show");
  }

  // Aplica el efecto del evento activo (si existe) sobre la rejilla de
  // respuestas. Si no hay evento activo, no hace nada (el core ya se
  // encarga de resetear el estado visual por defecto en cada ronda).
  function applyToAnswers(gridEl) {
    if (active && typeof active.onAnswers === "function") active.onAnswers(gridEl);
  }

  // Aplica el efecto del evento activo (si existe) sobre el audio de la ronda.
  function applyToAudio(audioEl) {
    if (active && typeof active.onAudio === "function") active.onAudio(audioEl);
  }

  // Devuelve el id del evento activo en la ronda actual (o null si no hay
  // ninguno). Se usa para lógicas de evento que afectan al flujo del core
  // (p. ej. Chansey, que da una segunda oportunidad en handleAnswer), y que
  // por tanto no encajan en los hooks genéricos onAnswers/onAudio.
  function activeId() {
    return active ? active.id : null;
  }

  // Cancela de golpe el evento activo (si lo hay), incluido cualquier
  // "traspaso" pendiente hacia la próxima startRound(). Se usa cuando el
  // jugador abandona la ronda en curso (botón Atrás, Salir, Game Over...)
  // antes de responder: sin esto, el evento seguiría "activo" internamente
  // aunque ya no hubiera ronda, y una siguiente ronda que arrancara por una
  // vía distinta a tryTrigger() podría heredarlo indebidamente a través de
  // pendingHandoff.
  function clearActive() {
    active = null;
    pendingHandoff = false;
  }

  // Devuelve una copia del catálogo completo de eventos registrados (id,
  // name, pokemonId, shiny...). Se usa, entre otras cosas, para poblar de
  // forma automática las colinas del fondo con los Pokémon de los eventos.
  function list() {
    return registry.slice();
  }

  return { register, tryTrigger, beginRound, clearActive, applyToAnswers, applyToAudio, activeId, list };
})();

// Handler de mousemove activo mientras el jugador busca a Gengar (o null si
// no hay ninguna búsqueda en curso). Se guarda en una variable de módulo para
// poder desengancharlo tanto al encontrar a Gengar como desde
// clearGengarSearch() si la ronda/el evento se interrumpe antes de eso.
let gengarMouseMoveHandler = null;

// Id del setTimeout que retrasa la aparición del sprite/linterna de Gengar
// hasta que la pantalla esté completamente oscurecida (o null si no hay
// ninguno pendiente). Debe cancelarse en clearGengarSearch() si la ronda
// cambia antes de que se cumpla ese retraso.
let gengarSpriteTimeout = null;

// Apaga el efecto del evento Gengar por completo: el oscurecimiento de
// pantalla, el listener de la "linterna" que sigue al cursor, el sprite de
// Gengar escondido (si seguía sin encontrarse) y el cuadro de aviso sobre
// las respuestas. Se usa tanto desde clearPokeEventVisuals() (inicio de
// ronda / salida del quiz) como para no dejar nada "colgado" si el jugador
// abandona la búsqueda a medias.
function clearGengarSearch() {
  document.getElementById('gengar-dark-overlay').classList.remove('show');
  if (gengarSpriteTimeout) {
    clearTimeout(gengarSpriteTimeout);
    gengarSpriteTimeout = null;
  }
  if (gengarMouseMoveHandler) {
    document.removeEventListener('mousemove', gengarMouseMoveHandler);
    gengarMouseMoveHandler = null;
  }
  const sprite = document.getElementById('gengar-hide-sprite');
  if (sprite) sprite.remove();
  document.querySelectorAll('.gengar-search-hint').forEach(el => el.remove());
}

// Apaga TODOS los efectos visuales/de audio que pueda haber dejado un
// Evento Pokémon (Hypno, Gengar, Shiny, Blastoise, Porygon,
// Electrode...), y cancela el evento activo a nivel interno (PokeEvents).
// Se llama tanto al empezar cada ronda nueva (startRound) como en
// cualquier punto en el que el jugador abandona la ronda en curso ANTES
// de responder (botón Atrás, "Salir", Game Over...), para que ningún
// efecto se quede "colgado" fuera del quiz, por ejemplo en el menú
// principal.
function clearPokeEventVisuals() {
  PokeEvents.clearActive();
  document.getElementById('answers-grid').classList.remove('event-inkay');
  document.getElementById('answers-grid').classList.remove('event-porygon');
  document.getElementById('answers-grid').classList.remove('event-mewtwo');
  clearGengarSearch();
  document.getElementById('hypno-overlay').classList.remove('show');
  document.getElementById('hypno-vignette').classList.remove('show');
  document.getElementById('app').classList.remove('hypno-warp-active');
  document.getElementById('shiny-color-overlay').classList.remove('show');
  document.getElementById('blastoise-rain-overlay').classList.remove('show');
  document.getElementById('porygon-glitch-overlay').classList.remove('show');
  stopPorygonTextGlitch();
  stopPorygonAudioGlitch();
  stopElectrodeTimer();
  stopJigglypuffSinging();
  if (typeof audio !== "undefined" && audio) audio.playbackRate = 1; // reset del efecto Slowpoke
}

// ── Catálogo de Eventos Pokémon ──
// Para añadir un evento nuevo, basta con llamar a PokeEvents.register({...})
// aquí abajo; el resto del sistema lo recoge automáticamente.

PokeEvents.register({
  id: "inkay",
  name: "Inkay",
  description: "¡Inkay ha aparecido! Sus poderes psíquicos giran las respuestas 180°.",
  pokemonId: 686,
  onAnswers(gridEl) {
    gridEl.classList.add("event-inkay");
  },
});

PokeEvents.register({
  id: "porygon",
  name: "Porygon",
  description: "¡Porygon ha aparecido! La interfaz sufre un fallo digital: glitches, píxeles y letras corruptas parpadean como un error informático, y la propia canción suena entrecortada.",
  pokemonId: 137,
  onAnswers(gridEl) {
    gridEl.classList.add("event-porygon");
    document.getElementById("porygon-glitch-overlay").classList.add("show");
    startPorygonTextGlitch();
  },
  onAudio(audioEl) {
    startPorygonAudioGlitch(audioEl);
  },
});

PokeEvents.register({
  id: "slowpoke",
  name: "Slowpoke",
  description: "¡Slowpoke ha aparecido! La canción de esta ronda suena más lenta.",
  pokemonId: 79,
  onAudio(audioEl) {
    audioEl.playbackRate = 0.7;
  },
});

PokeEvents.register({
  id: "gengar",
  name: "Gengar",
  description: "¡Gengar ha aparecido y se esconde en la oscuridad! Mueve el cursor para iluminar la pantalla, encuéntralo y tócalo para poder responder.",
  pokemonId: 94,
  /**
   * Oscurece toda la pantalla y esconde en ella un sprite de Gengar en una
   * posición aleatoria. El cursor actúa como una linterna (un hueco en el
   * oscurecimiento que lo sigue) con la que el jugador debe localizarlo.
   * Mientras no se haya encontrado y clicado, las respuestas quedan
   * deshabilitadas y se cubren con un cuadro pidiendo buscar a Gengar; al
   * encontrarlo, todo se retira y las respuestas vuelven a ser pulsables.
   */
  onAnswers(gridEl) {
    const overlay = document.getElementById("gengar-dark-overlay");
    overlay.style.setProperty("--gengar-x", "50%");
    overlay.style.setProperty("--gengar-y", "50%");
    overlay.classList.add("show");

    // Cuadro de aviso sobre la rejilla de respuestas: las tapa y explica qué
    // hay que hacer mientras Gengar siga sin encontrarse. Se ancla a <body>
    // (no a gridEl) y se posiciona con las coordenadas exactas de la
    // rejilla: #app tiene su propio "position:relative; z-index:1", así que
    // crea su propio stacking context, y cualquier z-index puesto en un
    // descendiente suyo (como sería este aviso si colgara de gridEl) queda
    // atrapado dentro de ese contexto y nunca puede pintarse por encima de
    // #gengar-dark-overlay (que vive fuera de #app, con z-index 45), por
    // alto que sea. Al colgarlo directamente de <body>, igual que ya se
    // hace con el sprite escondido, su z-index sí compite de verdad con el
    // del oscurecimiento y queda siempre visible por encima de él.
    const gridRect = gridEl.getBoundingClientRect();
    const hint = document.createElement("div");
    hint.className = "gengar-search-hint";
    hint.style.left = gridRect.left + "px";
    hint.style.top = gridRect.top + "px";
    hint.style.width = gridRect.width + "px";
    hint.style.height = gridRect.height + "px";
    hint.innerHTML = `
      <div class="gengar-search-icon">👻</div>
      <div class="gengar-search-text">Gengar se esconde en la oscuridad...<br>Ilumina la pantalla con el cursor para encontrarlo.</div>
    `;
    document.body.appendChild(hint);

    // Las respuestas no son elegibles hasta que se encuentre a Gengar.
    const answerBtns = Array.from(gridEl.querySelectorAll(".answer-btn"));
    answerBtns.forEach(b => b.disabled = true);

    // El oscurecimiento tarda 0.8s en llegar a su opacidad total (misma
    // duración que la transición de "background" de #gengar-dark-overlay
    // en styles.css). El sprite y la linterna no aparecen hasta pasado ese
    // tiempo: si aparecieran a la vez que empieza a oscurecerse, Gengar
    // sería visible unos instantes mientras la pantalla todavía se está
    // oscureciendo.
    const DARKEN_MS = 800;
    gengarSpriteTimeout = setTimeout(() => {
      gengarSpriteTimeout = null;

      // La "linterna" del oscurecimiento sigue la posición del cursor.
      gengarMouseMoveHandler = (e) => {
        overlay.style.setProperty("--gengar-x", e.clientX + "px");
        overlay.style.setProperty("--gengar-y", e.clientY + "px");
      };
      document.addEventListener("mousemove", gengarMouseMoveHandler);

      // Posición aleatoria del sprite de Gengar, con un margen para que no
      // quede pegado a los bordes de la pantalla. Se evita la zona de la
      // rejilla de respuestas (gridRect): ese área ahora queda cubierta con
      // el fondo sólido y opaco de .gengar-search-hint (ver más arriba), así
      // que si Gengar apareciera ahí quedaría tapado sin ninguna forma de
      // encontrarlo, ni siquiera con la linterna.
      const margin = 90;
      let x, y;
      for (let attempt = 0; attempt < 20; attempt++) {
        x = margin + Math.random() * Math.max(0, window.innerWidth - margin * 2);
        y = margin + Math.random() * Math.max(0, window.innerHeight - margin * 2);
        const insideAnswers = x > gridRect.left && x < gridRect.right && y > gridRect.top && y < gridRect.bottom;
        if (!insideAnswers) break;
      }

      const sprite = document.createElement("img");
      sprite.id = "gengar-hide-sprite";
      sprite.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png";
      sprite.alt = "Gengar";
      sprite.style.left = x + "px";
      sprite.style.top = y + "px";
      sprite.onclick = () => {
        // Encontrado: se retira todo el efecto y las respuestas se habilitan.
        document.removeEventListener("mousemove", gengarMouseMoveHandler);
        gengarMouseMoveHandler = null;
        overlay.classList.remove("show");
        sprite.remove();
        hint.remove();
        answerBtns.forEach(b => b.disabled = false);
      };
      document.body.appendChild(sprite);
    }, DARKEN_MS);
  },
});

PokeEvents.register({
  id: "hypno",
  name: "Hypno",
  description: "¡Hypno balancea su péndulo! La pantalla se ondula como una superficie líquida y la perspectiva fluctúa, provocando un intenso mareo visual.",
  pokemonId: 97,
  onAnswers() {
    document.getElementById("hypno-overlay").classList.add("show");
    document.getElementById("hypno-vignette").classList.add("show");
    document.getElementById("app").classList.add("hypno-warp-active");
  },
});

PokeEvents.register({
  id: "chansey",
  name: "Chansey",
  description: "¡Chansey ha aparecido! Si fallas esta pregunta, te dará otra oportunidad.",
  pokemonId: 113,
});

PokeEvents.register({
  id: "rapidash",
  name: "Rapidash",
  description: "¡Rapidash ha aparecido! Su galope acelera la canción de esta ronda.",
  pokemonId: 78,
  onAudio(audioEl) {
    audioEl.playbackRate = 1.5;
  },
});

PokeEvents.register({
  id: "shiny",
  name: "Caterpie Shiny",
  description: "¡Un Caterpie Shiny ha aparecido! Sus colores tiñen la pantalla y multiplican tus puntos x5.",
  pokemonId: 10,
  shiny: true,
  sfx: SFX.shiny,
  onAnswers() {
    document.getElementById("shiny-color-overlay").classList.add("show");
  },
});

PokeEvents.register({
  id: "blastoise",
  name: "Blastoise",
  description: "¡Blastoise usa Danza Lluvia! Una lluvia torrencial cae sobre el campo de batalla.",
  pokemonId: 9,
  onAnswers() {
    document.getElementById("blastoise-rain-overlay").classList.add("show");
    startBlastoiseRainSound();
  },
});

PokeEvents.register({
  id: "charizard",
  name: "Charizard",
  description: "¡Charizard ha aparecido! Su llamarada quema dos respuestas incorrectas.",
  pokemonId: 6,
  onAnswers(gridEl) {
    const wrongBtns = Array.from(gridEl.querySelectorAll(".answer-btn"))
      .filter(b => b.dataset.correct === "0");
    shuffle(wrongBtns).slice(0, 2).forEach(b => {
      b.classList.add("event-charizard-burned");
      b.disabled = true;
    });
  },
});

PokeEvents.register({
  id: "pikachu",
  name: "Pikachu",
  description: "¡Pikachu ha aparecido! Su energía multiplica x3 los puntos de esta ronda.",
  pokemonId: 25,
});

PokeEvents.register({
  id: "electrode",
  name: "Electrode",
  description: "¡Electrode ha aparecido! Explotará al segundo 10 de la canción y te quitará una vida si no respondes antes.",
  pokemonId: 101,
  onAnswers() {
    startElectrodeTimer();
  },
});

PokeEvents.register({
  id: "venusaur",
  name: "Venusaur",
  description: "¡Venusaur ha aparecido! Acierta esta ronda para que use síntesis y restaure una vida (máx. 3).",
  pokemonId: 3,
  // La curación ya no es automática al aparecer: solo se concede si el
  // jugador acierta la respuesta de esta ronda (ver handleAnswer()).
});

PokeEvents.register({
  id: "ditto",
  name: "Ditto",
  description: "¡Ditto estaba transformado en una de las respuestas y ha huido! Una opción incorrecta desaparece.",
  pokemonId: 132,
  onAnswers(gridEl) {
    const wrongBtns = Array.from(gridEl.querySelectorAll(".answer-btn"))
      .filter(b => b.dataset.correct === "0");
    if (wrongBtns.length === 0) return;
    const fled = shuffle(wrongBtns)[0];
    fled.disabled = true;
    fled.classList.add("event-ditto-fled");
    setTimeout(() => fled.remove(), 500);
  },
});

PokeEvents.register({
  id: "jigglypuff",
  name: "Jigglypuff",
  description: "¡Jigglypuff ha aparecido y va a cantar su canción! Mientras canta, la música de la ronda suena más bajo, y al terminar la respuesta correcta brillará.",
  pokemonId: 39,
  onAnswers() {
    startJigglypuffSinging();
  },
  onAudio(audioEl) {
    duckAudioForJigglypuff(audioEl);
  },
});

PokeEvents.register({
  id: "snorlax",
  name: "Snorlax",
  description: "¡Snorlax se ha quedado dormido sobre las respuestas! Tócalo varias veces para despertarlo.",
  pokemonId: 143,
  onAnswers(gridEl) {
    // Número de clics necesarios para despertarlo: aleatorio entre 8 y 20
    // (antes era un valor fijo de 5), distinto cada vez que aparece el evento.
    const CLICKS_NEEDED = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
    let clicks = 0;

    const overlay = document.createElement("div");
    overlay.className = "snorlax-overlay";
    overlay.innerHTML = `
      <div class="snorlax-zzz-wrap">
        <span class="snorlax-zzz-particle">💤</span>
        <span class="snorlax-zzz-particle">💤</span>
        <span class="snorlax-zzz-particle">💤</span>
      </div>
      <img class="snorlax-sprite" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png" alt="Snorlax">
      <div class="snorlax-text">
        <div class="snorlax-label">Snorlax se ha quedado dormido</div>
        <div class="snorlax-hint">Tócalo ${CLICKS_NEEDED} veces para despertarlo (0/${CLICKS_NEEDED})</div>
        <div class="snorlax-progress-track"><div class="snorlax-progress-fill"></div></div>
      </div>
    `;
    const hintEl = overlay.querySelector(".snorlax-hint");
    const fillEl = overlay.querySelector(".snorlax-progress-fill");
    startSnorlaxSnoreSound();
    overlay.addEventListener("click", () => {
      clicks++;
      overlay.classList.remove("shaken");
      void overlay.offsetWidth; // fuerza el reinicio de la animación de sacudida
      overlay.classList.add("shaken");
      if (fillEl) fillEl.style.width = Math.min(100, (clicks / CLICKS_NEEDED) * 100) + "%";
      if (hintEl) {
        hintEl.textContent = (clicks < CLICKS_NEEDED)
          ? `¡Sigue tocando! (${clicks}/${CLICKS_NEEDED})`
          : "¡Se ha despertado!";
      }
      if (clicks >= CLICKS_NEEDED) {
        overlay.classList.add("waking");
        stopSnorlaxSnoreSound();
        // Snorlax se está despertando: deshabilitamos las respuestas un
        // par de segundos para que un toque "de más" (al insistir tocando
        // a Snorlax) no caiga por error sobre una respuesta justo cuando
        // el overlay desaparece y deja de bloquear los clics.
        const answerBtns = Array.from(gridEl.querySelectorAll(".answer-btn"));
        answerBtns.forEach(b => b.disabled = true);
        setTimeout(() => overlay.remove(), 500);
        setTimeout(() => {
          if (!state.answered) answerBtns.forEach(b => b.disabled = false);
        }, 2000);
      }
    });
    gridEl.appendChild(overlay);
  },
});

PokeEvents.register({
  id: "mewtwo",
  name: "Mewtwo",
  description: "¡Mewtwo ha aparecido! Envuelve todas las respuestas en energía psíquica e invoca dos falsas más, mezcladas entre las reales.",
  pokemonId: 150,
  /**
   * Añade dos opciones incorrectas extra a la rejilla (títulos de
   * canciones del pool actual que no estén ya entre las opciones
   * mostradas), cada una insertada en una posición aleatoria dentro de
   * la rejilla en vez de siempre al final, para que no se puedan
   * identificar por su posición. Además marca la rejilla entera con la
   * clase "event-mewtwo": el brillo psíquico y la animación de aparición
   * (ver styles.css) se aplican a TODAS las respuestas, reales y falsas
   * por igual, así que tampoco se pueden distinguir por su aspecto.
   */
  onAnswers(gridEl) {
    const existingLabels = new Set(
      Array.from(gridEl.querySelectorAll(".answer-btn")).map(b => b.textContent)
    );
    const candidates = session.pool.filter(s => !existingLabels.has(s.title));
    shuffle(candidates).slice(0, 2).forEach(song => {
      const btn = addAnswerButton(gridEl, song.title, false);
      // addAnswerButton() la deja al final; la recolocamos en un hueco
      // aleatorio de la rejilla (incluido, de nuevo, el final).
      const others = Array.from(gridEl.querySelectorAll(".answer-btn")).filter(b => b !== btn);
      const refBtn = others[Math.floor(Math.random() * (others.length + 1))] || null;
      gridEl.insertBefore(btn, refBtn);
    });
    gridEl.classList.add("event-mewtwo");
  },
});

PokeEvents.register({
  id: "mew",
  name: "Mew",
  description: "¡Mew ha aparecido! Puede transformarse en cualquier otro Pokémon... tú eliges en cuál.",
  pokemonId: 151,
  // Mew no tiene efecto propio: su onAnswers/onAudio pasan a ser los del
  // evento que el jugador elija en el selector de transformación (ver
  // showMewChoiceOverlay más arriba, encadenado desde tryTrigger a través
  // de showActiveEventAndContinue()).
});

// ═══════════════════════════════════════════════
//  🐾 POKÉMON EN LAS COLINAS DEL FONDO
// ═══════════════════════════════════════════════
// Coloca de forma automática un pequeño sprite de cada Pokémon que tiene un
// evento registrado en PokeEvents (ver catálogo justo arriba) sobre las
// colinas del fondo animado, repartidos en 3 bandas de profundidad que
// imitan las 3 capas de colinas del canvas (drawHills). Si el catálogo de
// eventos cambia, el fondo se actualiza solo, sin tocar nada aquí.
const bgPokeLayer = document.getElementById("bg-pokemon-layer");

// Un Pokémon de las colinas "brilla" (usa su sprite shiny) si el jugador ya
// ha conseguido el logro de 20 apariciones de su evento
// («encounter_<id>_20»). Es un desbloqueo puramente visual: no afecta a
// isHillPokemonUnlocked() (que sigue dependiendo solo del logro de 10), así
// que el Pokémon lleva paseando desde antes y esto solo cambia su sprite.
function isHillPokemonShinyUnlocked(ev) {
  const achId = "encounter_" + ev.id + "_20";
  return typeof achievementsData !== "undefined" && !!(achievementsData.unlocked && achievementsData.unlocked[achId]);
}

/** Nº de Pokédex y variante (normal/shiny) que corresponde usar para el
 * sprite de las colinas de un evento, teniendo en cuenta si ya se
 * consiguió su logro de 20 apariciones. Caso especial: el propio evento
 * Caterpie Shiny (`id: "shiny"`) ya usa de por sí el sprite shiny de
 * Caterpie (ev.shiny === true), así que su logro de 20 apariciones no lo
 * "vuelve a hacer shiny" (ya lo es) sino que lo hace evolucionar: su
 * Pokémon de las colinas pasa a ser un Metapod Shiny (nº de Pokédex 11).
 */
function hillPokemonSpriteInfo(ev) {
  if (ev.id === "shiny" && isHillPokemonShinyUnlocked(ev)) {
    return { pokemonId: 11, shiny: true }; // Metapod Shiny
  }
  return { pokemonId: ev.pokemonId, shiny: ev.shiny || isHillPokemonShinyUnlocked(ev) };
}

/** URL del sprite (normal o shiny) de un Pokémon de evento, usado para
 * los Pokémon que pasean por las colinas del fondo. */
function bgPokeSpriteUrl(ev) {
  const { pokemonId, shiny } = hillPokemonSpriteInfo(ev);
  const path = shiny ? `shiny/${pokemonId}` : `${pokemonId}`;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${path}.png`;
}

// Un Pokémon de las colinas está desbloqueado si el logro «Haz que aparezca
// 10 veces» asociado a su evento ya se ha conseguido. Los eventos que no
// tienen un logro «encounter_<id>» asociado (p. ej. el Caterpie shiny) no
// están sujetos a este sistema y se muestran siempre.
function isHillPokemonUnlocked(ev) {
  const achId = "encounter_" + ev.id;
  if (typeof ACHIEVEMENT_CONDITIONS === "undefined" || !ACHIEVEMENT_CONDITIONS[achId]) return true;
  return typeof achievementsData !== "undefined" && !!(achievementsData.unlocked && achievementsData.unlocked[achId]);
}

// Hace que un Pokémon de fondo camine de forma aleatoria hacia los lados:
// en vez de oscilar en un bucle fijo, elige cada vez un nuevo destino al
// azar dentro de su corredor, camina hasta él a velocidad variable, hace
// una pausa aleatoria y vuelve a elegir otro destino. Así cada Pokémon
// sigue un recorrido distinto e impredecible.
function initBgPokeWalk(wrap, bandCls) {
  const startLeft = parseFloat(wrap.style.left) || 50;
  const roam = bandCls === "band-far" ? 14 : bandCls === "band-mid" ? 20 : 26;
  const minLeft = Math.max(3, startLeft - roam);
  const maxLeft = Math.min(97, startLeft + roam);
  const speed = bandCls === "band-far" ? rand(1.1, 1.9)
              : bandCls === "band-mid" ? rand(1.7, 2.7)
              :                          rand(2.3, 3.5); // % de pantalla por segundo

  // Un "paso" del recorrido: camina hasta un nuevo destino aleatorio y,
  // tras una pausa, se reprograma a sí misma para elegir el siguiente.
  function step() {
    if (!wrap.isConnected) return;
    const current = parseFloat(wrap.style.left) || startLeft;
    const target = rand(minLeft, maxLeft);
    const dist = Math.abs(target - current);
    const dur = Math.max(1.1, dist / speed);
    wrap.classList.toggle("flip", target > current);
    wrap.style.transition = `left ${dur.toFixed(2)}s linear`;
    requestAnimationFrame(() => {
      wrap.style.left = target.toFixed(2) + "%";
    });
    const pause = rand(0.8, 3.5);
    setTimeout(step, (dur + pause) * 1000);
  }

  setTimeout(step, rand(0.3, 2.5) * 1000);
}

// Crea el elemento DOM de un Pokémon de fondo (banda de profundidad, tamaño,
// posición vertical, listeners...). Se usa tanto al construir el fondo
// completo como al añadir un único Pokémon recién desbloqueado.
const BG_POKE_BAND_RANGES = {
  "band-far":  { bottom: [16, 24], size: [30, 38] },
  "band-mid":  { bottom: [9, 15],  size: [40, 48] },
  "band-near": { bottom: [2, 8],   size: [52, 62] },
};

/** Crea el elemento DOM de un Pokémon de fondo dentro de una banda de
 * profundidad concreta (posición y tamaño aleatorios dentro del rango
 * de esa banda). */
function buildBgPokeElement(ev, bandCls, leftPct) {
  const range = BG_POKE_BAND_RANGES[bandCls];
  const bottom = rand(range.bottom[0], range.bottom[1]);
  const size = rand(range.size[0], range.size[1]);
  const flip = Math.random() < 0.5;

  const wrap = document.createElement("div");
  wrap.className = `bg-poke ${bandCls}${flip ? " flip" : ""}${hillPokemonSpriteInfo(ev).shiny ? " is-shiny" : ""}`;
  wrap.dataset.eventId = ev.id; // permite localizarlo luego (ver refreshBgPokemonSprite)
  wrap.style.left = leftPct.toFixed(2) + "%";
  wrap.style.bottom = bottom.toFixed(1) + "vh";
  wrap.style.setProperty("--delay", rand(0, 2.4).toFixed(2) + "s");
  wrap.style.setProperty("--bdur", rand(1.9, 2.8).toFixed(2) + "s");
  wrap.style.setProperty("--bdelay", rand(0, 2).toFixed(2) + "s");

  const shadow = document.createElement("span");
  shadow.className = "bg-poke-shadow";

  const img = document.createElement("img");
  img.className = "bg-poke-sprite";
  img.src = bgPokeSpriteUrl(ev);
  img.alt = "";
  img.loading = "lazy";
  img.draggable = false;
  img.style.width = size.toFixed(0) + "px";
  // Si el sprite no carga (sin conexión, etc.), no dejamos un icono roto.
  img.onerror = () => { wrap.style.display = "none"; };

  wrap.appendChild(shadow);
  wrap.appendChild(img);
  wrap.setAttribute("role", "button");
  wrap.setAttribute("aria-label", ev.name);
  wrap.tabIndex = 0;
  wrap.addEventListener("click", () => reactBgPoke(wrap));
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      reactBgPoke(wrap);
    }
  });

  return wrap;
}

/** Repuebla la capa de Pokémon del fondo (colinas) con los eventos ya
 * desbloqueados, repartidos en 3 bandas de profundidad (lejos/medio/
 * cerca) para dar sensación de perspectiva. */
function buildBgPokemon() {
  if (!bgPokeLayer || typeof PokeEvents === "undefined") return;
  const events = PokeEvents.list().filter(ev => ev.pokemonId && isHillPokemonUnlocked(ev));
  bgPokeLayer.innerHTML = "";
  if (events.length === 0) return;

  // 3 bandas de profundidad, de más lejana (pequeña, sobre la colina de
  // fondo) a más cercana (grande, sobre la colina delantera).
  const farCount = Math.round(events.length * 0.32);
  const midCount = Math.round(events.length * 0.36);
  const bands = [
    { cls: "band-far",  count: farCount },
    { cls: "band-mid",  count: midCount },
    { cls: "band-near", count: events.length - farCount - midCount },
  ];

  const shuffled = shuffle(events.slice());
  let cursor = 0;

  bands.forEach(band => {
    const slice = shuffled.slice(cursor, cursor + band.count);
    cursor += band.count;
    const slots = slice.length;
    if (slots === 0) return;

    slice.forEach((ev, i) => {
      // Reparto uniforme dentro de su franja horizontal + jitter aleatorio,
      // para que no queden ni perfectamente alineados ni amontonados.
      const slotW = 100 / slots;
      const left = Math.min(96, Math.max(4, slotW * i + slotW * 0.5 + rand(-slotW * 0.3, slotW * 0.3)));
      const wrap = buildBgPokeElement(ev, band.cls, left);
      bgPokeLayer.appendChild(wrap);
      initBgPokeWalk(wrap, band.cls);
    });
  });
}

// Añade un único Pokémon nuevo a las colinas (al desbloquear su logro de
// aparición) sin reconstruir el resto: los que ya estaban paseando siguen
// su recorrido tal cual, en vez de saltar todos a una posición nueva.
function addBgPokemon(ev) {
  if (!bgPokeLayer || !ev || !ev.pokemonId) return;
  const bandCls = shuffle(["band-far", "band-mid", "band-near"])[0];
  const left = rand(6, 94);
  const wrap = buildBgPokeElement(ev, bandCls, left);
  bgPokeLayer.appendChild(wrap);
  initBgPokeWalk(wrap, bandCls);
}

// Actualiza el sprite de un Pokémon que YA está paseando por las colinas
// cuando se desbloquea su logro de 20 apariciones («encounter_<id>_20»),
// sin reconstruir el resto del fondo ni interrumpir su paseo en curso (a
// diferencia de addBgPokemon(), que añade un Pokémon nuevo que antes no
// estaba: aquí el Pokémon ya estaba, solo cambia su imagen a shiny).
function refreshBgPokemonSprite(ev) {
  if (!bgPokeLayer || !ev) return;
  const wrap = bgPokeLayer.querySelector(`.bg-poke[data-event-id="${ev.id}"]`);
  if (!wrap) return;
  const img = wrap.querySelector(".bg-poke-sprite");
  if (img) img.src = bgPokeSpriteUrl(ev);
  wrap.classList.add("is-shiny");
}

// Reacción visual al tocar un Pokémon de las colinas: un saltito con
// squash & stretch, un destello de brillo en el sprite y una lluvia de
// partículas, todo reiniciable aunque se toque varias veces seguidas.
function reactBgPoke(wrap) {
  wrap.classList.remove("poked");
  void wrap.offsetWidth; // fuerza el reinicio de la animación si ya estaba en marcha
  wrap.classList.add("poked");
  spawnParticles(wrap);
  setTimeout(() => wrap.classList.remove("poked"), 600);
}
