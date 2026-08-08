# PROJECT.md — Radio Trigal FM (PokéQuiz Music Edition)

Quiz musical de Pokémon, hecho con **HTML + CSS + JavaScript clásico**
(sin build step, sin frameworks, sin módulos ES). Todo el JS vive en el
ámbito global de la página: cada `<script>` declara `const`/`let`/
`function` que quedan disponibles para los scripts que se cargan después,
como si todo fuera un único fichero repartido en siete.

## 1. Idea general del juego

El jugador escucha canciones del universo Pokémon y tiene que adivinar
la región o el título exacto, según el modo. Hay:

- **5 modos principales**: Fácil, Normal, Difícil, Combate, Desafío
  Infinito.
- **Minijuegos**: 8 categorías temáticas (Centro Pokémon, Laboratorios,
  Bicicletas, Surf, Mundo Misterioso, Colosseum/XD, Ranger, Pantallas
  de Título), partidas cortas de 5 rondas.
- **Modo Historia**: recorrido por las 7 regiones (Kanto → Alola), cada
  una con una fase de 10 rondas normales + una fase de combate de 3
  rondas contra un "enemigo poderoso".
- **Sistema de progresión del jugador**: perfil (nombre + avatar + XP →
  nivel), logros con condiciones de desbloqueo, y una **Sonidex**
  (colección de canciones que se desbloquean tras acertarlas 10 veces).
- **Eventos Pokémon**: durante el Modo Historia (y, tras completarlo,
  también en el Desafío Infinito) puede aparecer al azar un Pokémon con
  un efecto especial en esa ronda (oscurecer pantalla, temporizador de
  explosión, distorsión visual, vidas extra, segunda oportunidad...).

## 2. Orden de carga (crítico)

```html
<script src="storage.js"></script>
<script src="i18n.js"></script>
<script type="module" src="leaderboard.js"></script>
<script src="audio.js"></script>
<script src="pokemon.js"></script>
<script src="ui.js"></script>
<script src="game.js"></script>
```

Este orden **no es arbitrario** y no debe cambiarse sin entender por qué:

1. `storage.js` no depende de nadie. Define `settings`, `profile`,
   `achievementsData` y sus `loadX()/saveX()` antes de que nadie los use.
2. `i18n.js` usa `settings.language` (de `storage.js`) dentro de `t()`,
   así que necesita ir después. Va justo después de `storage.js` porque
   `leaderboard.js`, `audio.js`, `pokemon.js`, `ui.js` y `game.js`
   pueden querer usar `t()`/`applyTranslations()` (p. ej. para textos
   dinámicos), así que conviene que esté disponible cuanto antes.
3. `leaderboard.js` habla con Firebase/Firestore y no depende de nada
   más del propio proyecto (solo del SDK de Firebase, que importa él
   mismo). Va justo después de `i18n.js` por orden lógico, aunque al
   ser `<script type="module">` en realidad se ejecuta un poco más
   tarde que los scripts clásicos que le siguen — no supone ningún
   problema porque nadie lo usa durante la carga inicial, solo dentro
   de manejadores de eventos posteriores (ver su cabecera para el
   detalle).
4. `audio.js` usa `settings` (dentro de funciones, no al cargarse).
5. `pokemon.js` usa `SFX` (de audio.js) **inmediatamente al registrarse**
   el catálogo de eventos (el evento Shiny referencia `SFX.shiny` al
   declarar el objeto del evento), así que audio.js debe ir antes.
6. `ui.js` usa datos/funciones de los anteriores
   (`settings`/`profile`/`AVATAR_CATALOG`, `t`/`applyTranslations`,
   `Leaderboard.fetchTop`, `playSFX`/`SFX`/`menuAudio`,
   `PokeEvents`/`bgPokeLayer`); además define aquí
   `applyLanguageSwitchUI()`/`refreshLanguageDependentUI()`, que
   `i18n.js` (`setLanguage()`) y `game.js` (INIT) invocan hacia
   adelante/atrás respectivamente.
7. `game.js` es el último: usa funciones de todos los anteriores en su
   bloque INIT final (`loadSettings()`, `applyTranslations()`,
   `applyLanguageSwitchUI()`, `buildBgPokemon()`,
   `renderProfileBar()`...) y en toda su lógica de partida (incluye
   `Leaderboard.submitScore()` al superar un récord de nivel de
   jugador, Desafío Infinito o Modo Historia).

Las referencias "hacia adelante" (p. ej. `ui.js` llamando a `startGame`
o `session`, que se definen en `game.js`, cargado después) son seguras
**solo** porque ocurren dentro de manejadores de eventos o funciones que
se ejecutan más tarde (clics, timers), nunca durante la carga inicial
del script.

## 3. Los nueve archivos

### `index.html`
Solo marcado: splash screen, overlays (perfil, Modo Historia, info de
eventos, confirmaciones...), las pantallas (`<section class="screen"
id="screen-...">`: home, main-modes, region-select, other-games,
options, guide, achievements, sonidex, quiz) y, al final del `<body>`,
la carga de los 5 scripts en el orden descrito arriba. No contiene JS
inline relevante ni estilos.

### `styles.css`
Todos los estilos visuales: variables CSS en `:root` (paleta de color
para modo oscuro, sobrescritas en `body.light` para modo claro),
tipografías, layout de cada pantalla, animaciones y los estilos de cada
overlay/evento Pokémon. No contiene lógica.

### `storage.js` — capa de persistencia
Única fuente de verdad sobre **qué se guarda en `localStorage`** y con
qué forma. Expone:

- `settings` (volumen música/SFX, modo oscuro, fondo animado,
  partículas) + `loadSettings()` / `saveSettings()`.
- `profile` (username, avatarId, xp) + `AVATAR_CATALOG` (20 avatares) +
  `getAvatarUrl()` + `loadProfile()` / `saveProfile()` / `hasProfile()`.
- `achievementsData` (`unlocked`: id→timestamp, `stats`: contadores y
  récords vía `defaultAchStats()`) + `loadAchievements()` /
  `saveAchievements()`.

Todas las funciones envuelven el acceso a `localStorage` en try/catch:
si falla (modo incógnito, storage deshabilitado...), simplemente no se
guarda/carga nada y se mantienen los valores por defecto. La *lógica de
negocio* que usa estos datos (calcular nivel a partir de xp, comprobar
si se desbloquea un logro...) vive en `game.js`, no aquí.

### `i18n.js` — traducciones (Español/English)
Única fuente de verdad sobre **los textos traducibles de la interfaz**
y sobre cómo se aplican. Expone:

- `I18N`: diccionario `{es: {clave: texto}, en: {clave: texto}}` con
  todas las cadenas traducibles del juego.
- `t(key, vars)`: devuelve el texto de `key` en `settings.language`
  (de `storage.js`), sustituyendo placeholders `{nombre}` por los
  valores de `vars`; si falta la clave en el idioma actual cae a
  español, y si no existe en ningún idioma devuelve la propia `key`
  (para detectar a simple vista un texto sin traducir).
- `applyTranslations()`: aplica el idioma actual a todo el marcado
  estático de `index.html` marcado con `data-i18n` (texto),
  `data-i18n-html`, `data-i18n-placeholder`, `data-i18n-title` o
  `data-i18n-aria`.
- `setLanguage(lang)`: cambia `settings.language`, lo persiste
  (`saveSettings()`, de `storage.js`) y llama a `applyTranslations()`
  y, si existe, a `refreshLanguageDependentUI()` (definida en `ui.js`)
  para refrescar también los textos que `ui.js`/`game.js` generan a
  mano en pantallas ya renderizadas (resumen de Logros/Sonidex en
  Inicio, Clasificaciones, cabecera de la ronda...).

`i18n.js` no decide reglas de juego ni pinta overlays/pantallas nuevas:
solo traduce. El *interruptor* visible (los botones Español/English de
Opciones) vive en `ui.js` (`applyLanguageSwitchUI()`, que marca cuál
está activo, y los listeners que llaman a `setLanguage()`), y el
arranque con el idioma guardado ya aplicado (`applyTranslations()` +
`applyLanguageSwitchUI()`, para no tener que cambiar de idioma a mano
para verlo reflejado) se dispara desde el bloque INIT de `game.js`,
justo después de `loadSettings()`.

### `leaderboard.js` — adaptador de clasificación global
Única fuente de verdad sobre **cómo se habla con Firebase/Firestore**,
donde viven las clasificaciones globales. Hay tres categorías (constante
`LEADERBOARD_CATEGORIES`): nivel de jugador (`level`), Desafío Infinito
(`infinite`) y Modo Historia (`story`). Expone únicamente
`Leaderboard.fetchTop(category, n)` (pide los N mejores de esa
categoría, cada fila como `{ username, avatarId, value }`) y
`Leaderboard.submitScore(category, username, avatarId, value, playerId)`
(guarda un nuevo récord en esa categoría), ambas `async` y sin lanzar
excepciones hacia fuera (igual que `storage.js` con `localStorage`: si
falla —p. ej. reglas de Firestore mal configuradas—, se registra en
consola y se devuelve un valor que quien llama sabe interpretar).

⚠️ Es el ÚNICO fichero del proyecto que se carga como
`<script type="module">` en vez de como script clásico (lo exige el SDK
de Firebase, que usa `import`). Por eso, a diferencia de todos los
demás, no basta con declarar `const`/`function`: al final del fichero
cuelga explícitamente su API de `window.Leaderboard` para que
ui.js/game.js lo seguir usando como si fuera un script clásico más. Las
reglas de seguridad de Firestore (quién puede leer/escribir la
colección "leaderboard") viven fuera del proyecto, en la Consola de
Firebase (ver `firestore.rules` como referencia de qué pegar ahí).

Cada jugador tiene un ÚNICO documento en Firestore (ID =
`profile.playerId`, un identificador anónimo generado por
`ensurePlayerId()` en `storage.js` la primera vez que hace falta), con
un campo por categoría (`level`/`infiniteScore`/`storyScore`).
`submitScore()` actualiza (`merge: true`) solo el campo de la categoría
que se le pide, sin crear una fila nueva ni pisar las otras dos, de
forma que un mismo jugador puede aparecer en las tres clasificaciones a
la vez.

### `audio.js` — motor de audio
Catálogo de sonidos (`SFX`, `AMBIENT_SFX`) y todo lo relacionado con
reproducirlos:

- Música de menú: `MENU_SONGS`, cola aleatoria sin repetir la última
  (`refillMenuSongQueue`/`getNextMenuSong`/`playRandomMenuSong`),
  `unlockMenuMusic()` (desbloqueo por gesto del usuario, requisito de
  los navegadores), `ensureMenuMusicPlaying()`.
- Sonidos ambiente en bucle de eventos: lluvia de Blastoise
  (`startBlastoiseRainSound`/`stopBlastoiseRainSound`), ronquido de
  Snorlax (`startSnorlaxSnoreSound`/`stopSnorlaxSnoreSound`).
- Audio principal de ronda: `audio` (elemento `<audio>`), Web Audio API
  para el visualizador de onda (`audioCtx`, `analyser`), temporizador de
  10s del Modo Difícil (`startHardRoundTimer`/`stopHardRoundTimer`/
  `hardRoundTimeUp`), `playSFX()`, `fadeVolume()`, `stopAudioHard()`.
- Sonidex: `playSonidexSong()` / `stopSonidexPlayback()`.

### `pokemon.js` — sistema de Pokémon
Dos cosas independientes entre sí:

1. **Módulo `PokeEvents`** (IIFE con API pública reducida): catálogo de
   ~16 Eventos Pokémon (Inkay, Porygon, Slowpoke, Gengar, Hypno,
   Chansey, Rapidash, Caterpie Shiny, Blastoise, Charizard,
   Pikachu, Electrode, Venusaur, Ditto, Jigglypuff, Snorlax) y el motor
   que decide **cuándo** aparece uno. Contrato con el resto del juego
   (los únicos puntos de contacto, usados desde `game.js`):
   - `PokeEvents.tryTrigger(onDone)` — tras terminar una canción, decide
     si activa un evento.
   - `PokeEvents.beginRound()` — red de seguridad al empezar cada ronda.
   - `PokeEvents.applyToAnswers(gridEl)` / `applyToAudio(audioEl)` —
     aplican el efecto del evento activo a las opciones/al audio.
   Los *efectos concretos* de cada evento (temblor de Hypno, canto de
   Jigglypuff, glitch de Porygon...) NO están aquí: viven en `game.js`
   (lógica) y `ui.js` (render), entrelazados con vidas/puntuación.
2. **Pokémon de fondo**: construidos automáticamente a partir del mismo
   catálogo (`buildBgPokemon`, `addBgPokemon`, `initBgPokeWalk`,
   `isHillPokemonUnlocked` — se desbloquean vía logros de "encuentro" a
   las 5 apariciones). Un segundo logro, más difícil, a las 20
   apariciones (`encounter_<id>_20`) no añade un Pokémon nuevo sino que
   le cambia el sprite al shiny (`isHillPokemonShinyUnlocked`,
   `hillPokemonSpriteInfo`, `refreshBgPokemonSprite` — caso especial: el
   propio Caterpie Shiny evoluciona ahí a un Metapod Shiny).

### `ui.js` — capa de interfaz
Todo lo que "pinta cosas en pantalla" sin decidir reglas de juego:
navegación (`showScreen`, `goBackFromCurrentScreen`, `navStack`),
render de tarjetas/listas (perfil, logros, Sonidex, vidas, botones de
respuesta, streaks, récords), overlays/modales (perfil, splash, Modo
Historia, info de eventos), el fondo animado (cielo/colinas, canvas) y
el visualizador de onda, popups y partículas decorativas, y los efectos
visuales de los eventos Jigglypuff/Electrode/Porygon.

Regla de separación (explícita en la cabecera del archivo): si la
función **decide** algo sobre las reglas del juego → `game.js`; si solo
**refleja en el DOM** un estado ya decidido en otro sitio → `ui.js`. Por
eso `healLife()`/`loseLife()` están en `game.js` pero
`renderLives()`/`updateNervousState()` están aquí. Mismo criterio para
`renderEndlessTogglesUI()`: solo pinta la clase `active`/`aria-pressed`
de los interruptores ♾️ de Fácil/Normal/Difícil/Combate a partir del
estado `endlessToggle`, decidido en `game.js`.

### `game.js` — núcleo del juego
El "cerebro": reglas y estado, no dibujado. Secciones principales (en
este orden dentro del archivo):

1. **Catálogo de canciones** (`REGIONS`, `EASY_REGIONS`, `songs[]` —
   objetos `{title, file, image, group, region}`).
2. **Cronómetro de ronda + sistema de puntos**
   (`startRoundTimer`/`getElapsedRoundTime`,
   `computeBasePoints` 20–100 pts según velocidad,
   `getStreakMultiplier` hasta x2 en racha 11+).
3. **Ajustes y perfil de jugador**: sistema de niveles a partir de xp
   (`xpNeededForLevel`, `computeLevelInfo`, `addProfileXp`) — usa
   `settings`/`profile` definidos en `storage.js`. Incluye también
   `AVATAR_UNLOCKS`/`isAvatarUnlocked()`: de los 20 avatares de
   `AVATAR_CATALOG` (storage.js), los 10 primeros están disponibles desde
   el principio y los otros 10 se desbloquean por nivel de perfil, mismo
   criterio que `MODE_UNLOCKS` pero solo por nivel (nunca por logro).
4. **Estado del juego/modo**: `GameMode` (enum de modos), `session`
   (config de la partida en curso: modo, región, pool, fase de
   historia, vidas...) y `state` (score, ronda, racha, canción actual).
5. **Sistema de logros**: `ACHIEVEMENTS[]` (catálogo, cada logro con un
   campo `section` que indica en qué categoría se agrupa visualmente),
   `ACHIEVEMENT_SECTIONS[]` (esas categorías, en el orden en que se
   pintan como bloques plegables en la pantalla de Logros — ver
   `renderAchievementsScreen()` en ui.js), `ACHIEVEMENT_CONDITIONS`
   (condición de desbloqueo por id), `MODE_UNLOCKS`/`OTHER_UNLOCKS` (qué
   logro desbloquea qué modo/minijuego), `trackModePlayed`/
   `trackCorrectAnswer`/`trackSongCorrect`/`trackEncounter`/
   `trackGameFinished` (registran estadísticas tras cada evento
   relevante) y `checkAchievements()` (comprueba y desbloquea).
6. **Lógica del quiz**: `shuffle`, `buildPool()` (arma `session.pool`
   según el modo), `getRandomSongFromPool`,
   `generateOptionsForCurrent`.
7. **Modo Historia: sistema de vidas** (`hasActiveLivesSystem`,
   `getCurrentLives`, `healLife`, `loseLife`, `storyGameOver`,
   `electrodeExplode`) y **flujo de partida**: `startGame`,
   `startRound`, `resumeAudio`, `handleAnswer`, `nextRound`,
   `showResult`, `restartGame`, `exitGame`. Incluye también
   `isEndlessSession()`: decide si la partida en curso tiene rondas sin
   límite y termina con el primer fallo, ya sea porque el modo es el
   propio Desafío Infinito (`GameMode.INFINITE`) o porque se activó el
   interruptor ♾️ de Fácil/Normal/Difícil/Combate al arrancarla
   (`session.endless`, fijado por `startGame(mode, extra, {endless})`).
   `nextRound()`/`handleAnswer()`/`showResult()` usan este único punto de
   comprobación en vez de mirar `GameMode.INFINITE` por separado.
8. **Menús: handlers** — listeners de los botones de cada pantalla,
   `REGION_META`, pills de región. Incluye `endlessToggle` (estado de
   los interruptores ♾️ de Fácil/Normal/Difícil/Combate — el propio
   Desafío Infinito no lleva uno, ya es infinito por sí mismo) y
   `setupEndlessToggle()`, que engancha el click/teclado de cada uno.
9. **Modo Historia** (recorrido): `startStoryMode`,
   `handleStoryStageComplete`, `storyFinish`.
10. **INIT**: bloque que arranca la app al cargar la página (carga
    settings/achievements/profile, aplica el idioma guardado con
    `applyTranslations()`/`applyLanguageSwitchUI()`, renderiza estado
    inicial, valida que haya canciones suficientes).

## 4. Flujo de datos resumido

```
storage.js  ──(settings, profile, achievementsData)──▶  game.js decide
                                                          │
i18n.js     ──(t, applyTranslations, setLanguage)─────────┤
                                                          │
audio.js    ──(SFX, playSFX, audio element)──────────────┤
                                                          │
pokemon.js  ──(PokeEvents.tryTrigger/applyToAnswers/──────┤
              applyToAudio, buildBgPokemon)               │
                                                          ▼
                                                    ui.js pinta el
                                                    resultado en el DOM
```

`game.js` es el único que **decide** (puntos, vidas, logros, qué evento
toca). `ui.js` es el único que **pinta**. `storage.js` es el único que
**persiste** localmente. `i18n.js` es el único que **traduce** (sabe
qué texto corresponde a cada idioma). `leaderboard.js` es el único que
**habla con el backend** de la clasificación global. `audio.js` es el
único que **reproduce sonido**. `pokemon.js` es el único que **decide
qué Evento Pokémon aparece y cuándo** (aunque su *efecto* se reparta
entre game.js y ui.js).
