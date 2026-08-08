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
      <div class="gengar-search-text">${tData("pokeEvent.gengar.searchHint", "Gengar se esconde en la oscuridad...<br>Ilumina la pantalla con el cursor para encontrarlo.")}</div>
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
        <div class="snorlax-label">${tData("pokeEvent.snorlax.label", "Snorlax se ha quedado dormido")}</div>
        <div class="snorlax-hint">${tData("pokeEvent.snorlax.hint", `Tócalo ${CLICKS_NEEDED} veces para despertarlo (0/${CLICKS_NEEDED})`, { n: CLICKS_NEEDED })}</div>
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
          ? tData("pokeEvent.snorlax.progress", `¡Sigue tocando! (${clicks}/${CLICKS_NEEDED})`, { clicks, n: CLICKS_NEEDED })
          : tData("pokeEvent.snorlax.awake", "¡Se ha despertado!");
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
    const candidates = session.pool.filter(s => !existingLabels.has(songDisplayName(s)));
    shuffle(candidates).slice(0, 2).forEach(song => {
      const btn = addAnswerButton(gridEl, songDisplayName(song), false);
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

/** Nº de Pokédex y variante (normal/shiny) que corresponde usar para el
 * sprite de las colinas de un evento: siempre el propio pokemonId del
 * evento, en su variante shiny solo si el evento ya es shiny de por sí
 * (p. ej. el Caterpie Shiny, ev.shiny === true).
 * EXCEPCIÓN: Caterpie (nº de Pokédex 10) nunca usa aquí su variante
 * shiny, aunque su evento sí lo sea (ev.shiny === true): en las colinas
 * siempre se muestra como el Caterpie normal, con su sprite animado PMD
 * (ver usesPmdWalkSprite), igual que el resto de Pokémon de las
 * colinas. El overlay de colores y el resto de efectos de "Caterpie
 * Shiny" (ver onAnswers en su registro) no se ven afectados: siguen
 * disparándose igual durante la partida; esto solo cambia su paseo
 * decorativo por el fondo. */
function hillPokemonSpriteInfo(ev) {
  return { pokemonId: ev.pokemonId, shiny: !!ev.shiny && ev.pokemonId !== 10 };
}

/** URL del sprite (normal o shiny) de un Pokémon de evento, usado para
 * los Pokémon que pasean por las colinas del fondo. */
function bgPokeSpriteUrl(ev) {
  const { pokemonId, shiny } = hillPokemonSpriteInfo(ev);
  const path = shiny ? `shiny/${pokemonId}` : `${pokemonId}`;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${path}.png`;
}

// ═══════════════════════════════════════════════
//  🚶 SPRITE ANIMADO PMD (colinas: caminar y dormir)
// ═══════════════════════════════════════════════
// Sustituye, únicamente para la versión NORMAL (no shiny) de un Pokémon de
// las colinas, el PNG estático de PokeAPI (bgPokeSpriteUrl) por el
// spritesheet de su animación "Walk" (caminar) del repositorio
// PMDCollab/SpriteCollab — el mismo que ya usa este proyecto para los
// retratos de AVATAR_CATALOG en storage.js, visible también en
// https://sprites.pmdcollab.org/. La versión shiny NO se toca: sigue
// usando bgPokeSpriteUrl tal cual, igual que antes de este bloque.
// Caterpie (nº de Pokédex 10) SÍ usa este sistema: aunque su único
// evento de colinas (`id: "shiny"`, ver más arriba) es shiny de por sí
// (ev.shiny === true), hillPokemonSpriteInfo() lo trata como no-shiny
// específicamente para Caterpie, así que en las colinas siempre luce su
// sprite animado PMD normal, no el PNG shiny estático.
//
// Además, cada Pokémon que consigue cargar su animación "Walk" se echa
// siestas por su cuenta (ver el bloque "💤 SIESTAS" más abajo): de vez
// en cuando se queda dormido, sustituyendo el spritesheet "Walk" por el
// de su animación "Sleep" (mismo repositorio) durante un rato, y luego
// retoma su paseo donde lo dejó.

const PMD_SPRITE_BASE = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite";

// Fila (de 8, 0-indexada) que ocupa la dirección "Izquierda" dentro del
// spritesheet de una animación de 8 direcciones en este repositorio;
// orden comprobado a mano sobre el spritesheet real de Pikachu:
// 0 Abajo, 1 AbajoDcha, 2 Dcha, 3 ArribaDcha, 4 Arriba, 5 ArribaIzq,
// 6 Izquierda, 7 AbajoIzq. La usamos como base sin espejar porque
// initBgPokeWalk() añade la clase `flip` (transform: scaleX(-1), ver
// styles.css) precisamente cuando el Pokémon camina hacia la derecha, así
// que partir de la dirección "Izquierda" hace que el espejado existente
// ya deje al Pokémon mirando hacia donde camina en ambos sentidos. Se
// reutiliza igual para la animación "Sleep": si su spritesheet también
// tiene 8 filas de dirección, se recorta la misma fila; si no llega a
// tenerla (algunas animaciones "Sleep" solo traen 1 fila), el propio
// cálculo de fila en applyPmdAnim() cae automáticamente a la fila 0.
const PMD_WALK_LEFT_ROW = 6;

// Un Pokémon de las colinas usa el sprite animado PMD solo si NO es su
// versión shiny (esa se deja como estaba). Caterpie ya no es una
// excepción aquí: como hillPokemonSpriteInfo() nunca le da `shiny: true`
// en las colinas, este `!shiny` ya basta para que también use el
// sprite animado PMD normal, igual que el resto de Pokémon.
function usesPmdWalkSprite(pokemonId, shiny) {
  return !shiny;
}

// Caché de animaciones PMD ya pedidas, una promesa por combinación
// "pokemonId:nombreAnim" (p. ej. "25:Walk", "25:Sleep"), para no volver
// a pedir su AnimData.xml cada vez que se reconstruyen las colinas (ver
// buildBgPokemon()) ni cada vez que un Pokémon se queda dormido.
const _pmdAnimCache = {};

/** Pide y analiza el AnimData.xml de un Pokémon en PMDCollab/SpriteCollab
 * para averiguar el tamaño de fotograma y nº de fotogramas de una de sus
 * animaciones con nombre `animName` (p. ej. "Walk" o "Sleep"), y precarga
 * el spritesheet para saber su tamaño real (con cuántas direcciones/filas
 * cuenta). Devuelve `null` si algo falla (sin conexión, Pokémon sin esa
 * animación en el repositorio...) para que quien llama pueda decidir una
 * alternativa: el PNG estático de PokeAPI para "Walk" (ver el
 * `img.onerror` de buildBgPokeElement), o simplemente no dormirse nunca
 * para "Sleep" (ver el bloque "💤 SIESTAS" más abajo).
 * @param {number} pokemonId
 * @param {string} animName
 * @returns {Promise<{sheetUrl:string, frameWidth:number, frameHeight:number,
 *   frameCount:number, sheetWidth:number, sheetHeight:number}|null>}
 */
function loadPmdAnim(pokemonId, animName) {
  const cacheKey = `${pokemonId}:${animName}`;
  if (_pmdAnimCache[cacheKey]) return _pmdAnimCache[cacheKey];
  const folder = String(pokemonId).padStart(4, "0");
  const sheetUrl = `${PMD_SPRITE_BASE}/${folder}/${animName}-Anim.png`;
  const promise = fetch(`${PMD_SPRITE_BASE}/${folder}/AnimData.xml`)
    .then(res => {
      if (!res.ok) throw new Error("AnimData.xml no disponible");
      return res.text();
    })
    .then(xmlText => {
      const xml = new DOMParser().parseFromString(xmlText, "application/xml");
      if (xml.querySelector("parsererror")) throw new Error("AnimData.xml inválido");
      const targetAnim = [...xml.querySelectorAll("Anim")].find(
        a => a.querySelector("Name")?.textContent === animName
      );
      const frameWidth = parseInt(targetAnim?.querySelector("FrameWidth")?.textContent, 10);
      const frameHeight = parseInt(targetAnim?.querySelector("FrameHeight")?.textContent, 10);
      const frameCount = targetAnim?.querySelectorAll("Durations > Duration").length;
      if (!frameWidth || !frameHeight || !frameCount) {
        throw new Error(`Animación ${animName} no disponible para este Pokémon`);
      }
      return new Promise((resolve, reject) => {
        const probe = new Image();
        probe.onload = () => resolve({
          sheetUrl, frameWidth, frameHeight, frameCount,
          sheetWidth: probe.naturalWidth, sheetHeight: probe.naturalHeight,
        });
        probe.onerror = () => reject(new Error(`${animName}-Anim.png no disponible`));
        probe.src = sheetUrl;
      });
    })
    .catch(() => null);
  _pmdAnimCache[cacheKey] = promise;
  return promise;
}

/** Aplica una animación PMD ya cargada (Walk o Sleep, ver loadPmdAnim) al
 * `<div>` de sprite animado de un Pokémon de las colinas: fija el tamaño
 * real de fotograma y recorta la fila de la dirección "Izquierda"
 * (PMD_WALK_LEFT_ROW) de su spritesheet. No toca el temporizador de
 * fotogramas (ver tickPmdSprite): este simplemente lee en el siguiente
 * tic los datos que se acaban de dejar en `sprite._pmdAnim`, así que
 * cambiar de animación (p. ej. al dormirse o despertar) no necesita
 * arrancar ni parar ningún temporizador nuevo. */
function applyPmdAnim(sprite, anim, size) {
  const scale = size / anim.frameWidth;
  const hasLeftRow = anim.sheetHeight >= anim.frameHeight * (PMD_WALK_LEFT_ROW + 1);
  const dirRow = hasLeftRow ? PMD_WALK_LEFT_ROW : 0;
  sprite.style.height = (anim.frameHeight * scale).toFixed(1) + "px";
  sprite.style.backgroundImage = `url("${anim.sheetUrl}")`;
  sprite.style.backgroundSize = `${(anim.sheetWidth * scale).toFixed(1)}px ${(anim.sheetHeight * scale).toFixed(1)}px`;
  sprite.style.backgroundPositionY = `-${(dirRow * anim.frameHeight * scale).toFixed(1)}px`;
  sprite._pmdAnim = anim;
  sprite._pmdScale = scale;
  sprite._pmdFrame = 0;
}

/** Avanza, cada 140ms, el fotograma de la animación PMD actualmente
 * activa en `sprite` (la que haya dejado applyPmdAnim() en
 * `sprite._pmdAnim` — Walk o Sleep). Un único temporizador por Pokémon,
 * arrancado una vez desde applyPmdWalkSprite() y que sigue corriendo
 * mientras esté en las colinas: no hace falta un temporizador aparte
 * para la animación "Sleep", ya que solo cambia qué spritesheet lee. Si
 * el elemento ya no está en el DOM (el Pokémon fue quitado de las
 * colinas), para el temporizador. */
function tickPmdSprite(wrap, sprite) {
  if (!wrap.isConnected) return;
  const anim = sprite._pmdAnim;
  if (anim) {
    sprite.style.backgroundPositionX =
      `-${(sprite._pmdFrame * anim.frameWidth * sprite._pmdScale).toFixed(1)}px`;
    sprite._pmdFrame = (sprite._pmdFrame + 1) % anim.frameCount;
  }
  setTimeout(() => tickPmdSprite(wrap, sprite), 140);
}

/** Sustituye el `<img>` estático (ya en el DOM, con el PNG de PokeAPI
 * como respaldo) de un Pokémon de las colinas por un `<div>` animado con
 * el spritesheet PMD "Walk" ya cargado por loadPmdAnim(pokemonId,
 * "Walk"), y arranca su temporizador de fotogramas (tickPmdSprite). Si
 * el elemento ya no está en el DOM (el Pokémon fue quitado de las
 * colinas mientras se cargaba su animación), no hace nada.
 * @returns {HTMLDivElement|undefined} el `<div>` de sprite creado, que
 *   quien llama necesita guardar para poder dormir a este Pokémon más
 *   adelante (ver initBgPokeSleep); `undefined` si `wrap` ya no estaba
 *   en el DOM. */
function applyPmdWalkSprite(wrap, img, anim) {
  if (!wrap.isConnected) return;
  // Por si el PNG de PokeAPI ya había fallado (ver img.onerror en
  // buildBgPokeElement) antes de que este sprite animado terminara de
  // cargar: al lograrlo, el Pokémon vuelve a mostrarse.
  wrap.style.display = "";
  const size = parseFloat(img.style.width) || img.width;

  const sprite = document.createElement("div");
  sprite.className = img.className; // conserva "bg-poke-sprite" (bounce, aparición... en styles.css)
  sprite.style.width = size.toFixed(1) + "px";
  sprite.style.backgroundRepeat = "no-repeat";
  sprite.style.imageRendering = "pixelated";
  applyPmdAnim(sprite, anim, size);
  img.replaceWith(sprite);

  tickPmdSprite(wrap, sprite);
  return sprite;
}

// ═══════════════════════════════════════════════
//  💤 SIESTAS (colinas, solo Pokémon con sprite animado PMD)
// ═══════════════════════════════════════════════
// De vez en cuando, cada Pokémon de las colinas con sprite animado PMD
// (ver applyPmdWalkSprite) se echa una siesta por su cuenta: deja de
// pasear y luce su animación "Sleep" (mismo repositorio PMDCollab que
// "Walk") durante un rato, para luego despertar y retomar el paseo. Cada
// Pokémon tira sus propios dados de forma independiente —su propio
// temporizador, su propia probabilidad en cada tirada—: no hay ningún
// reloj ni contador compartido entre ellos, así que nunca se duermen ni
// se despiertan todos a la vez.

// Cada cuánto "tira los dados" un Pokémon despierto para decidir si se
// queda dormido (segundos; rango aleatorio distinto en cada tirada).
const PMD_SLEEP_CHECK_MIN_S = 5;
const PMD_SLEEP_CHECK_MAX_S = 12;

// Probabilidad de quedarse dormido en cada una de esas tiradas.
const PMD_SLEEP_CHANCE = 0.07;

// Cuánto dura la siesta una vez empieza (segundos).
const PMD_SLEEP_MIN_S = 15;
const PMD_SLEEP_MAX_S = 120;

/** Pone en marcha el ciclo de siestas de un Pokémon de las colinas que ya
 * está paseando con su sprite animado PMD (ver applyPmdWalkSprite): a
 * intervalos aleatorios, tira una probabilidad de quedarse dormido; si le
 * toca, pide su animación "Sleep" (loadPmdAnim) y, si existe en el
 * repositorio, cancela su próximo paso de paseo pendiente (ver
 * `wrap._bgPokeStepTimer`, guardado por initBgPokeWalk), cambia su
 * sprite a la animación "Sleep" y programa que se despierte pasado un
 * rato aleatorio (PMD_SLEEP_MIN_S–PMD_SLEEP_MAX_S), guardando ese
 * temporizador en `wrap._bgPokeSleepTimer` para poder cancelarlo si se
 * despierta antes de tiempo (ver `wrap._bgPokeWakeNow` más abajo). Al
 * despertar, retoma su animación "Walk" y su paseo (llamando a
 * `wrap._bgPokeResumeWalk`, también guardado por initBgPokeWalk) y
 * vuelve a tirar dados para la próxima siesta. Si la animación "Sleep"
 * no existe para este Pokémon en el repositorio, retoma el paseo sin
 * dormirse y lo sigue intentando en cada tirada (por si solo fuera un
 * corte de red puntual).
 *
 * Además cuelga en `wrap._bgPokeWakeNow` una función que despierta al
 * Pokémon al instante si está dormido (no hace nada si ya está
 * despierto): cancela el temporizador de la siesta pendiente y llama a
 * `wakeUp()` directamente, para que tocar un Pokémon dormido (ver el
 * listener de "click"/"keydown" en buildBgPokeElement) lo despierte en
 * vez de esperar a que termine su siesta por su cuenta. También avisa a
 * `trackPokeWoken()` (game.js, logro "poke_flute") de que el jugador ha
 * despertado a un Pokémon, cosa que NO ocurre cuando despierta por su
 * cuenta al expirar el temporizador. */
function initBgPokeSleep(wrap, sprite, walkAnim, pokemonId, size) {
  function scheduleCheck() {
    setTimeout(roll, rand(PMD_SLEEP_CHECK_MIN_S, PMD_SLEEP_CHECK_MAX_S) * 1000);
  }
  function roll() {
    if (!wrap.isConnected) return;
    if (Math.random() < PMD_SLEEP_CHANCE) goToSleep();
    else scheduleCheck();
  }
  function goToSleep() {
    if (wrap._bgPokeStepTimer) clearTimeout(wrap._bgPokeStepTimer);
    loadPmdAnim(pokemonId, "Sleep").then(sleepAnim => {
      if (!wrap.isConnected) return;
      if (!sleepAnim) {
        // Sin animación "Sleep" en el repositorio para este Pokémon:
        // retoma el paso que se canceló arriba y prueba suerte de nuevo
        // en la próxima tirada.
        if (wrap._bgPokeResumeWalk) wrap._bgPokeResumeWalk();
        scheduleCheck();
        return;
      }
      wrap.classList.add("asleep");
      applyPmdAnim(sprite, sleepAnim, size);
      wrap._bgPokeSleepTimer = setTimeout(wakeUp, rand(PMD_SLEEP_MIN_S, PMD_SLEEP_MAX_S) * 1000);
    });
  }
  function wakeUp() {
    wrap._bgPokeSleepTimer = null;
    if (!wrap.isConnected || !wrap.classList.contains("asleep")) return;
    wrap.classList.remove("asleep");
    applyPmdAnim(sprite, walkAnim, size);
    if (wrap._bgPokeResumeWalk) wrap._bgPokeResumeWalk();
    scheduleCheck();
  }
  wrap._bgPokeWakeNow = function () {
    if (!wrap.classList.contains("asleep")) return;
    if (wrap._bgPokeSleepTimer) clearTimeout(wrap._bgPokeSleepTimer);
    wakeUp();
    if (typeof trackPokeWoken === "function") trackPokeWoken();
  };
  scheduleCheck();
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
//
// El temporizador de cada paso se guarda en `wrap._bgPokeStepTimer` y la
// propia función `step` en `wrap._bgPokeResumeWalk`: initBgPokeSleep()
// (ver el bloque "💤 SIESTAS" más arriba) los usa para cancelar el
// próximo paso cuando el Pokémon se queda dormido, y para retomar el
// paseo justo donde lo dejó al despertar.
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
    wrap._bgPokeStepTimer = setTimeout(step, (dur + pause) * 1000);
  }

  wrap._bgPokeResumeWalk = step;
  wrap._bgPokeStepTimer = setTimeout(step, rand(0.3, 2.5) * 1000);
}

// Crea el elemento DOM de un Pokémon de fondo (banda de profundidad, tamaño,
// posición vertical, listeners...). Se usa tanto al construir el fondo
// completo como al añadir un único Pokémon recién desbloqueado.
const BG_POKE_BAND_RANGES = {
  "band-far":  { bottom: [16, 24], size: [30, 38] },
  "band-mid":  { bottom: [9, 15],  size: [40, 48] },
  "band-near": { bottom: [2, 8],   size: [52, 62] },
};

// Ids de evento (ver PokeEvents.register más arriba) cuyo Pokémon de las
// colinas SÍ conserva la animación de flotar/rebote (bg-poke-bounce, ver
// styles.css). El resto camina sin ese balanceo vertical: solo se
// desplaza por el suelo (initBgPokeWalk) y aparece con bg-poke-appear.
const BG_POKE_BOUNCE_IDS = new Set(["inkay", "mew", "mewtwo"]);

// Ids de evento cuya sombra de las colinas se deja en su posición
// original (bg-poke-shadow, `bottom: -3px`): en el spritesheet "Walk"
// de PMDCollab de estos Pokémon el personaje ya llega prácticamente
// hasta el borde inferior del fotograma, así que esa posición ya
// encaja bien bajo sus pies. En el resto, el fotograma deja bastante
// margen vacío por debajo del personaje, y esa misma posición deja la
// sombra demasiado separada del cuerpo — de ahí la clase `shadow-fix`
// (ver styles.css) que se les añade para subirla.
const BG_POKE_SHADOW_DEFAULT_IDS = new Set(["porygon", "mew", "mewtwo", "inkay"]);

/** Crea el elemento DOM de un Pokémon de fondo dentro de una banda de
 * profundidad concreta (posición y tamaño aleatorios dentro del rango
 * de esa banda). */
function buildBgPokeElement(ev, bandCls, leftPct) {
  const range = BG_POKE_BAND_RANGES[bandCls];
  const bottom = rand(range.bottom[0], range.bottom[1]);
  const size = rand(range.size[0], range.size[1]);
  const flip = Math.random() < 0.5;

  const wrap = document.createElement("div");
  wrap.className = `bg-poke ${bandCls}${flip ? " flip" : ""}${hillPokemonSpriteInfo(ev).shiny ? " is-shiny" : ""}${BG_POKE_BOUNCE_IDS.has(ev.id) ? "" : " no-bounce"}${BG_POKE_SHADOW_DEFAULT_IDS.has(ev.id) ? "" : " shadow-fix"}`;
  wrap.style.left = leftPct.toFixed(2) + "%";
  wrap.style.bottom = bottom.toFixed(1) + "vh";
  wrap.style.setProperty("--delay", rand(0, 2.4).toFixed(2) + "s");
  wrap.style.setProperty("--bdur", rand(1.9, 2.8).toFixed(2) + "s");
  wrap.style.setProperty("--bdelay", rand(0, 2).toFixed(2) + "s");

  const shadow = document.createElement("span");
  shadow.className = "bg-poke-shadow";

  // Emoticonos "Z" que solo se muestran mientras el Pokémon está dormido
  // (ver initBgPokeSleep más abajo, que añade/quita la clase "asleep" en
  // `wrap`): ocultos por defecto y animados vía CSS, mismo patrón que
  // `.snorlax-zzz-particle` (ver styles.css) para el evento de Snorlax.
  const zzz = document.createElement("div");
  zzz.className = "bg-poke-zzz-wrap";
  zzz.innerHTML = `<span class="bg-poke-zzz-particle">💤</span><span class="bg-poke-zzz-particle">💤</span><span class="bg-poke-zzz-particle">💤</span>`;

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
  wrap.appendChild(zzz);

  // Versión normal (no shiny, no Caterpie): intenta sustituir este PNG
  // estático por el sprite animado PMD (ver applyPmdWalkSprite). Si falla
  // (sin conexión, Pokémon sin animación "Walk" en el repositorio...), el
  // PNG de PokeAPI de arriba se queda tal cual, y este Pokémon tampoco
  // se echa siestas (initBgPokeSleep necesita el sprite animado).
  const spriteInfo = hillPokemonSpriteInfo(ev);
  if (usesPmdWalkSprite(spriteInfo.pokemonId, spriteInfo.shiny)) {
    loadPmdAnim(spriteInfo.pokemonId, "Walk").then(anim => {
      if (!anim) return;
      const sprite = applyPmdWalkSprite(wrap, img, anim);
      if (sprite) initBgPokeSleep(wrap, sprite, anim, spriteInfo.pokemonId, size);
    });
  }
  wrap.setAttribute("role", "button");
  wrap.setAttribute("aria-label", ev.name);
  wrap.tabIndex = 0;
  // Si el Pokémon está dormido (ver initBgPokeSleep), tocarlo lo despierta
  // al instante (wrap._bgPokeWakeNow) en vez de esperar a que termine su
  // siesta por su cuenta; en cualquier caso, se dispara también la
  // reacción visual habitual (saltito + partículas).
  wrap.addEventListener("click", () => {
    if (wrap._bgPokeWakeNow) wrap._bgPokeWakeNow();
    reactBgPoke(wrap);
  });
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (wrap._bgPokeWakeNow) wrap._bgPokeWakeNow();
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
