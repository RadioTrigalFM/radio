# CHANGELOG.md

Historial de cambios del proyecto **Radio Trigal FM (PokéQuiz Music
Edition)**.

El formato sigue, a grandes rasgos, [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/):
cada versión agrupa sus cambios en `Añadido`, `Cambiado`, `Corregido` y
`Eliminado`. Las fechas están en formato AAAA-MM-DD.

> Nota: este changelog se crea en la sesión en la que se documenta por
> primera vez la arquitectura del proyecto (ver `PROJECT.md`), a partir
> del estado actual del código. No existía un registro de versiones
> previo, así que la primera entrada describe el estado actual como
> punto de partida en lugar de reconstruir el historial completo.
> A partir de aquí, cada cambio nuevo debe añadir su propia entrada.

## [Unreleased]

### Cambiado
- **Ronquido de Snorlax al doble de volumen**: el sonido ambiente de
  ronquido en bucle del evento Pokémon de Snorlax ahora suena al doble
  de fuerte que el resto de efectos de sonido (acotado siempre a 1, el
  volumen máximo que admite `<audio>`), para que se note bien por
  encima de la canción de la ronda.

  Cambios de código:
  - `audio.js`: `startAmbientLoop(el, src, volumeMultiplier)` admite
    ahora un multiplicador de volumen opcional (por defecto 1, sin
    cambios para el resto de sonidos ambiente como la lluvia de
    Blastoise); `startSnorlaxSnoreSound()` lo llama con `2`.

### Añadido
- **Nueva categoría de Minijuegos: Calle Victoria** 🏔️, situada justo
  debajo de Pantallas de Título en la pantalla de Minijuegos. Se
  desbloquea al alcanzar el nivel 11 de perfil. 7 canciones, una por
  región (Kanto → Alola, esta última titulada "Monte Lanakila" / "Mount
  Lanakila", el nombre real de la Calle Victoria de esa región en los
  juegos — el archivo sigue llamándose `calle-victoria-alola.mp3`/
  `.png`, solo cambia el título mostrado), en
  `songs/other/calle-victoria/calle-victoria-<región>.mp3` con carátula
  `images/calle-victoria-<región>.png`.

  Cambios de código (mismo patrón que el resto de categorías de
  Minijuegos — ver tabla de `OTHER_UNLOCKS` en `game.js`):
  - `game.js`: 7 entradas nuevas en `songs` (`other: "calle-victoria"`),
    entrada en `OTHER_UNLOCKS`, `"calle-victoria": false` en
    `otherEndlessToggle`.
  - `index.html`: nuevo botón en `#screen-other-games`
    (`data-other="calle-victoria"`) y ambas menciones de la lista de
    categorías en la Guía de Juego actualizadas.
  - `ui.js`: nueva entrada en `SONIDEX_GROUPS` (pantalla Sonidex) y en
    `prettyOther()`.
  - `i18n.js`: `other.callevictoria.title/desc` (ES/EN, "Victory Road"
    en inglés), `otherUnlock.calle-victoria.name/reqTitle` (solo EN,
    mismo criterio que el resto de `otherUnlock.*`), `song.Monte
    Lanakila` (traducción a "Mount Lanakila" del título de la pista de
    Alola); actualizadas las dos menciones de la Guía de Juego (ES/EN).
  - `PROJECT.md`: actualizado el recuento y listado de categorías de
    Minijuegos (de paso se corrige que ya estaba desactualizado: no
    incluía Openings del Anime y decía "8" en vez de "9").

  > Nota: faltan por añadir los 7 archivos de audio
  > (`songs/other/calle-victoria/calle-victoria-*.mp3`) y las 7 imágenes
  > (`images/calle-victoria-*.png`) a sus carpetas; sin ellos la
  > categoría se ve en el menú pero las canciones no sonarán ni se verá
  > la carátula.

### Añadido
- **Logro "partida perfecta" para Calle Victoria**: nuevo logro
  `perfect_calle_victoria` ("Ruta perfecta" 🏁), que se consigue al
  completar una partida perfecta (100 % de aciertos) en la categoría de
  Minijuegos Calle Victoria — mismo patrón que el resto de categorías
  (p. ej. `perfect_title_screens`). Este logro pasa a ser la nueva
  forma de desbloquear el puntero de ratón "Caramelo Raro", en
  sustitución del logro "Explorador" (`all_modes`), que deja de
  desbloquear ningún puntero.

  Cambios de código:
  - `game.js`: nueva entrada `perfect_calle_victoria` en `ACHIEVEMENTS`
    (sección `mastery`) y en el mapa de condiciones de logros; nueva
    rama `otherGame === "calle-victoria"` en `trackGameFinished()` que
    marca `perfectCalleVictoriaGame`; `CURSOR_UNLOCKS.rare_candy` ahora
    apunta a `achId: "perfect_calle_victoria"` en vez de `"all_modes"`.
  - `storage.js`: nuevo campo `perfectCalleVictoriaGame: false` en
    `defaultAchStats()`.
  - `i18n.js`: `achv.perfect_calle_victoria.title/desc` (solo EN; en ES
    se usa directamente el texto de `game.js`, mismo criterio que el
    resto de logros).

### Añadido
- **Perfil público de otros jugadores desde Clasificaciones**: ahora se
  puede pulsar (clic o Enter/Espacio) cualquier fila del top 50 de la
  pantalla de Clasificaciones para abrir una ficha de solo lectura de
  ese jugador (avatar, nombre, nivel y todas sus puntuaciones —
  Desafío Infinito, Modo Historia, Modo Difícil, Modo Combate y una por
  cada región del Modo Normal), reutilizando el mismo diseño visual que
  el modal de "mi perfil" pero sin barra de XP ni botón de cambiar
  avatar (de otro jugador solo conocemos lo que guarda su documento de
  Firestore).

  Cambios de código:
  - `leaderboard.js`: `fetchTop()` ahora devuelve también un campo
    `stats` por fila con TODAS las categorías del jugador (no solo la
    pedida), reaprovechando el documento que Firestore ya trae para
    ordenar — sin ninguna consulta extra a la base de datos al abrir un
    perfil.
  - `ui.js`:
    - Nueva variable `leaderboardCurrentTop`, que guarda el último top
      recibido para poder recuperar la fila pulsada por su índice.
    - Las filas de `.leaderboard-list` ahora llevan la clase
      `clickable`, `role="button"` y `tabindex="0"`; un listener
      delegado en `#leaderboard-list` (clic y teclado) abre el perfil.
    - Nuevas `openPublicProfileModal(entry)` / `closePublicProfileModal()`,
      mismo patrón que `openProfileModal()`/`closeProfileModal()` pero
      de solo lectura.
    - `refreshLanguageDependentUI()` cierra el modal de perfil público
      si está abierto al cambiar de idioma (no guarda a quién muestra,
      así que no puede volver a traducirlo sobre la marcha).
  - `index.html`: nuevo overlay `#public-profile-overlay`.
  - `styles.css`: estilos de `#public-profile-overlay` y
    `.leaderboard-row.clickable` (cursor, hover/foco).
  - `i18n.js`: nuevas claves `leaderboard.viewProfile` y
    `publicProfile.scoresTitle` (ES/EN); el resto de textos reutiliza
    claves ya existentes (`leaderboard.infinite/story/hard/combat`,
    `profile.stats.regionRecordsTitle`, `common.pts`,
    `common.trainerDefault`).

### Cambiado
- **Los récords por región del modal de perfil** (pantalla Perfil → "Tus
  récords") **ahora muestran el emoticono propio de cada región**
  (`REGION_META[r].icon`, game.js) en vez del icono genérico 🗺️ fijo para
  todas — el mismo que ya se usa en la pantalla de selección de región
  del Modo Normal y en la pestaña "Regiones" de Clasificaciones. Cambio
  solo en `ui.js` (`renderProfileStats()`), reutilizando `REGION_META`
  ya existente, mismo patrón que `renderLeaderboardRegionTabs()`.

- **`all_encounters` ("Avistamiento total") ahora desbloquea el avatar
  Pikachu gordo** (`pikachu-gordo`, `images/avatar-pikachu-gordo.png`,
  no desbloqueaba nada antes). Entrada nueva en `AVATAR_CATALOG`
  (`storage.js`) y en `AVATAR_UNLOCKS` (`game.js`); no hace falta
  traducción en `i18n.js` (los avatares usan directamente el nombre del
  catálogo).

  > Nota: falta añadir `images/avatar-pikachu-gordo.png` a la carpeta
  > `images/` del proyecto; sin ella el avatar no se verá aunque el
  > logro ya lo desbloquee.

- **`games_100` ("Leyenda de Radio Trigal FM") ahora desbloquea el
  puntero Meloetta** (`meloetta`, `images/cursor-meloetta.png`, no
  desbloqueaba nada antes). Mismo patrón que la reasignación anterior:
  entrada nueva en `CURSOR_CATALOG` (`storage.js`) y en `CURSOR_UNLOCKS`
  (`game.js`), más su traducción `cursorStyle.meloetta.name` en
  `i18n.js` (es/en).

  > Nota: falta añadir `images/cursor-meloetta.png` a la carpeta
  > `images/` del proyecto; sin ella el puntero no se verá aunque el
  > logro ya lo desbloquee.

- **Reasignación del contenido desbloqueable (avatares/punteros) de 14
  logros**, moviendo lo que desbloqueaba cada uno a lo pedido:
  - `hispanohablante` ahora desbloquea el puntero **Ludicolo** (antes no
    desbloqueaba nada).
  - `perfect_openings_anime` ("Opening perfecto") → avatar **Greninja**.
  - `perfect_title_screens` ("Portada perfecta") → avatar **Zarude**.
  - `perfect_ranger` ("Estilo perfecto") → puntero **Manaphy**.
  - `perfect_surf` ("Ola perfecta") → puntero **Supercaña** (`super_rod`,
    antes desbloqueado por `sonidex_5`).
  - `perfect_laboratorios` ("Bata perfecta") → puntero **Magnemite**.
  - `perfect_centro_pokemon` ("Enfermera perfecta") → puntero **Chansey**.
  - `perfect_bicicletas` ("Pedalada perfecta") → avatar **Corviknight**.
  - `streak_5_thrice` ("Racha reincidente") → avatar **Cloyster**.
  - `streak_100` ("Racha mítica") → puntero **Rayquaza**.
  - `soldado_clicker` ("Soldado del clicker") → puntero **Jigglypuff**.
  - `hard_infinite_round_20` ("Maratón difícil") → puntero **Regigigas**.
  - `hard_infinite_round_50` ("Ultramaratón difícil") → puntero
    **Rayquaza shiny**.
  - `sonidex_5` ("Primeras notas") → avatar **Butterfree** (antes
    desbloqueaba el puntero Supercaña, que ahora pasa a `perfect_surf`).

  Cambios de código:
  - `storage.js`:
    - `AVATAR_CATALOG` — 5 avatares nuevos: `greninja` (imagen local
      `images/avatar-greninja.png`, ya existente en el proyecto),
      `zarude`, `corviknight`, `cloyster` y `butterfree` (estos cuatro
      con retrato de PMDCollab, mismo origen que el resto del catálogo).
    - `CURSOR_CATALOG` — 8 punteros nuevos con forma de Pokémon
      (`ludicolo`, `manaphy`, `magnemite`, `chansey`, `rayquaza`,
      `jigglypuff`, `regigigas`, `rayquaza_shiny`), todos con imagen
      local en `images/cursor-<id>.png` y `scale: 1/3`, mismo patrón que
      `shuckle`/`cosmog`/etc.
  - `game.js`:
    - `AVATAR_UNLOCKS` — 5 entradas nuevas (`greninja`, `zarude`,
      `corviknight`, `cloyster`, `butterfree`) apuntando cada una al
      `achId` que le corresponde según la lista de arriba.
    - `CURSOR_UNLOCKS` — 8 entradas nuevas (mismos 8 punteros) más el
      cambio del `achId` de `super_rod`, que pasa de `sonidex_5` a
      `perfect_surf`.
  - `i18n.js`: traducción (`cursorStyle.<id>.name`) de los 8 punteros
    nuevos, en español e inglés (los avatares no necesitan traducción:
    ya usan directamente el nombre del Pokémon en `AVATAR_CATALOG`).

  > Nota: las imágenes `images/cursor-ludicolo.png`, `cursor-manaphy.png`,
  > `cursor-magnemite.png`, `cursor-chansey.png`, `cursor-rayquaza.png`,
  > `cursor-jigglypuff.png`, `cursor-regigigas.png` y
  > `cursor-rayquaza-shiny.png` deben añadirse a la carpeta `images/` del
  > proyecto (no se han generado en esta sesión); sin ellas, esos
  > punteros no se verán aunque el logro correspondiente ya los
  > desbloquee.

### Añadido
- **Nuevo logro oculto: `soldado_clicker` 🖱️ "Soldado del clicker"**, en
  la sección Progreso y rachas. Se desbloquea al tocar 100 veces el logo
  de Radio Trigal FM del menú principal. Al ser un logro oculto
  (`hidden: true`), no aparece en la pestaña de Logros ni cuenta en el
  recuento total ("X / Y") hasta que se consigue: el recuento marca
  99 mientras sigue bloqueado y pasa a 100 en el momento exacto en que
  se desbloquea.

  Cambios de código:
  - `game.js`:
    - Nueva entrada en `ACHIEVEMENTS` con `hidden: true` y en
      `ACHIEVEMENT_CONDITIONS` (`s.logoClicks >= 100`).
    - Nueva función `visibleAchievements()`, que filtra los logros
      `hidden` mientras sigan bloqueados; es la que deben usar
      `ui.js`/estadísticas de perfil para calcular el total en vez de
      leer `ACHIEVEMENTS` directamente, para que un logro oculto no se
      "adelante" en el recuento antes de conseguirse.
    - Nueva función `trackLogoClick()` (mismo patrón que
      `trackPokeWoken()`), que incrementa `s.logoClicks` y llama a
      `checkAchievements()`.
  - `storage.js`: `defaultAchStats()` — nuevo campo `logoClicks: 0`.
  - `ui.js`:
    - El listener de clic del logo del menú principal (ya existente,
      solo reacción visual/sonora) ahora también llama a
      `trackLogoClick()` tras el efecto visual.
    - `renderAchievementsScreen()`, `updateHomeAchievementSummary()` y
      `renderProfileStats()` usan `visibleAchievements()` en vez de
      `ACHIEVEMENTS` para el total mostrado.
  - `i18n.js`: traducción al inglés (`achv.soldado_clicker.title`/`.desc`).


- **6 logros nuevos, cada uno en su categoría:**
  - Progreso y rachas:
    - `games_100` 🏵️ "Leyenda de Radio Trigal FM" — jugar 100 partidas
      (reutiliza `s.gamesPlayed`, ya existente).
    - `streak_5_thrice` 🔁 "Racha reincidente" — alcanzar una racha de 5
      respuestas correctas consecutivas en 3 ocasiones distintas.
  - Eventos Pokémon:
    - `all_encounters` 🔭 "Avistamiento total" — que aparezca cada Evento
      Pokémon al menos una vez.
  - Maestría y partidas perfectas:
    - `hispanohablante` 🗣️ — jugar Openings del Anime tanto en español de
      España como en español latino.
    - `hard_infinite_round_20` 🏃 "Maratón difícil" y
      `hard_infinite_round_50` 🚀 "Ultramaratón difícil" — alcanzar la
      ronda 20/50 del modo Difícil con el interruptor ♾️ activado.

  Cambios de código:
  - `game.js`:
    - 6 nuevas entradas en `ACHIEVEMENTS` y en `ACHIEVEMENT_CONDITIONS`
      (la de `all_encounters` se añade tras `ENCOUNTER_CONDITION_IDS`,
      reutilizando esa misma lista, en vez de duplicarla).
    - `trackCorrectAnswer()`: incrementa el nuevo contador
      `s.streaksOf5Count` cada vez que `state.streak` pasa a valer
      exactamente 5.
    - `trackModePlayed()`: registra en el nuevo array
      `s.openingsVariantsPlayed` (`"spain"`/`"latino"`) qué doblaje de
      Openings del Anime se ha jugado, a partir de
      `session.openingsVariant`, solo cuando `settings.language === "es"`.
    - Nueva función `trackHardInfiniteRound()` (separada de
      `trackGameFinished()` a propósito, para no marcar `perfect_hard`
      en partidas infinitas) que guarda en `s.bestHardEndlessRound` la
      ronda más alta alcanzada; se llama desde `showResult()` cuando
      `session.mode === GameMode.HARD` dentro de una sesión infinita.
  - `storage.js`: `defaultAchStats()` — nuevos campos
    `bestHardEndlessRound`, `streaksOf5Count` y `openingsVariantsPlayed`.
  - `i18n.js`: traducción al inglés (`achv.<id>.title`/`.desc`) de los 6
    logros nuevos.

- **Nuevo logro de racha: `streak_100` "Racha mítica"** 🌌, en la sección
  Progreso y rachas, por encima del ya existente `streak_50` ("Racha
  legendaria"). Se desbloquea al alcanzar una racha de 100 respuestas
  correctas consecutivas. No se ha añadido un logro de "racha de 50"
  porque ya existía (`streak_50`, vinculado también al avatar de
  Melmetal).
  - `game.js`: nueva entrada en `ACHIEVEMENTS` y en
    `ACHIEVEMENT_CONDITIONS` (`s.bestStreak >= 100`); reutiliza el mismo
    contador `bestStreak` que ya usan el resto de logros de racha, sin
    tocar el tracking.
  - `i18n.js`: traducción al inglés (`achv.streak_100.title`/`.desc`).

### Añadido
- **Un logro de partida perfecta para cada categoría de Minijuegos que
  todavía no lo tenía.** Ya existían `perfect_colosseum_xd` ("Sombra
  perfecta") y `perfect_mystery_dungeon` ("Mazmorra perfecta"); ahora se
  añade el mismo tipo de logro al resto de categorías de la pantalla de
  Minijuegos:
  - `perfect_centro_pokemon` 🏥 "Enfermera perfecta" (Centro Pokémon)
  - `perfect_laboratorios` 🧪 "Bata perfecta" (Laboratorios)
  - `perfect_bicicletas` 🚲 "Pedalada perfecta" (Bicicletas)
  - `perfect_surf` 🏄 "Ola perfecta" (Surf)
  - `perfect_ranger` 🧭 "Estilo perfecto" (Pokémon Ranger)
  - `perfect_title_screens` 🖼️ "Portada perfecta" (Pantallas de Título)
  - `perfect_openings_anime` 🎬 "Opening perfecto" (Openings del Anime)

  Mismo patrón que los dos logros ya existentes: se desbloquean al
  terminar una partida con el 100 % de aciertos en esa categoría
  concreta de Minijuegos (no dan ninguna recompensa adicional aparte de
  la insignia, igual que ellos).
  - `game.js`: 7 nuevas entradas en `ACHIEVEMENTS` (sección `mastery`) y
    en `ACHIEVEMENT_CONDITIONS`; `trackGameFinished()` amplía la cadena
    `if/else` de `opts.otherGame` para marcar el flag correspondiente de
    cada nueva categoría.
  - `storage.js`: `defaultAchStats()` — 7 nuevos flags booleanos
    (`perfectCentroPokemonGame`, `perfectLaboratoriosGame`,
    `perfectBicicletasGame`, `perfectSurfGame`, `perfectRangerGame`,
    `perfectTitleScreensGame`, `perfectOpeningsAnimeGame`).
  - `i18n.js`: traducción al inglés (`achv.<id>.title`/`.desc`) de los 7
    logros nuevos, mismo patrón que el resto de `ACHIEVEMENTS`.

### Cambiado
- **Rejilla de avatares: los desbloqueados van primero.** `renderAvatarGrid()`
  (usada tanto en la creación de perfil como en el modal de perfil) ahora
  ordena primero todos los avatares ya desbloqueados y deja los bloqueados
  al final, en vez de intercalarlos según su nivel/logro requerido. Dentro
  de cada uno de esos dos grupos se mantiene el orden de siempre (menor a
  mayor nivel requerido, logros al final).
  - `ui.js`: `renderAvatarGrid()` — el comparador del `sort()` ahora
    compara primero por `isAvatarUnlocked()` y solo usa `avatarSortWeight()`
    como criterio de desempate.

### Añadido
- **Nuevo avatar de perfil: Lotad**, desbloqueado por el logro
  `correct_20` ("Oído entrenado"). Mismo patrón que el resto del
  catálogo (retrato PMDCollab/SpriteCollab, sin clave de traducción
  propia porque el nombre es igual en español e inglés).
  - `storage.js`: nueva entrada `lotad` en `AVATAR_CATALOG`.
  - `game.js`: nueva entrada `lotad: { achId: "correct_20" }` en
    `AVATAR_UNLOCKS`.

- **Nuevo puntero con forma de Pokémon: Spinda**, desbloqueado por el
  logro `streak_5` ("En racha"). Mismo patrón que el resto de punteros
  de Pokémon (sprite local, `scale: 1/3`, sin cursor de objeto nativo).
  - `storage.js`: nueva entrada `spinda` en `CURSOR_CATALOG`.
  - `game.js`: nueva entrada `spinda: { achId: "streak_5" }` en
    `CURSOR_UNLOCKS`.
  - `i18n.js`: `cursorStyle.spinda.name` en español e inglés.

  (El otro puntero pedido junto a este, Charizard Y desbloqueado por
  "Entrenador dedicado", ya existía: `charizard_y` en `CURSOR_CATALOG`
  ya estaba enlazado a `games_30` — no ha hecho falta ningún cambio
  para él.)

- **Estilos de puntero del ratón desbloqueables por logro**: cuatro
  logros desbloquean, además de su insignia, un estilo de puntero
  alternativo que sustituye la flecha del ratón por el sprite de un
  objeto (mismo origen que el resto de sprites del proyecto:
  PokeAPI/sprites, `sprites/items/*.png`): `poke_flute` ("Poké Flauta")
  → Poké Flauta, `correct_50` ("Conocedor musical") → Poké Ball,
  `sonidex_5` ("Primeras notas") → Supercaña, y `all_modes`
  ("Explorador") → Caramelo Raro. El ajuste vive en Opciones → Opciones
  gráficas, como una rejilla de opciones ("Normal" + un botón por
  estilo, mismo patrón visual que la rejilla de avatares de perfil):
  los estilos todavía no desbloqueados se ven en gris con un candado y,
  al pulsarlos, muestran un aviso con el logro que falta en vez de
  seleccionarse.
  - `storage.js`: catálogo nuevo `CURSOR_CATALOG` (id, nombre, sprite
    de cada estilo — mismo patrón que `AVATAR_CATALOG`), justo tras
    `getAvatarUrl()`; nuevo campo `settings.cursorStyle` (`"normal"` o
    un id de `CURSOR_CATALOG`), con su validación en `loadSettings()`.
  - `game.js`: `CURSOR_UNLOCKS` (qué logro desbloquea cada id de
    `CURSOR_CATALOG` — mismo patrón que `AVATAR_UNLOCKS`),
    `isCursorUnlocked()` y `cursorLockRequirementText()`; entrada nueva
    (bucle sobre `CURSOR_UNLOCKS`) en `getFeatureUnlocksForAchievement()`
    para que cada logro muestre la ⭐ y el modal de "esto desbloquea" en
    la pantalla de Logros; en `checkAchievements()`, un toast propio
    ("¡Nuevo puntero disponible: {name}!") por cada estilo que se
    desbloquee a la vez, y refresco de `applyGraphicsSettings()` si la
    pantalla de Opciones está abierta.
  - `ui.js`: `renderCursorGrid()` (pinta la rejilla de Opciones, mismo
    patrón que `renderAvatarGrid()`) y `applyCursorStyle()` (añade/quita
    la clase `custom-cursor` en `<body>` y la variable CSS
    `--cursor-url` con el sprite elegido, comprobando tanto el ajuste
    como el logro), ambas llamadas desde `applyGraphicsSettings()`.
  - `index.html`: nueva fila en la tarjeta "Opciones gráficas" de la
    pantalla de Opciones, con el contenedor `#cursor-style-grid` que
    rellena `renderCursorGrid()`.
  - `styles.css`: regla `body.custom-cursor { cursor: var(--cursor-url)
    4 4, auto; }` (con variante para botones/enlaces, manteniendo el
    hotspot tipo "pointer") en vez de una regla por estilo, ya que
    varios estilos comparten la misma regla; `.cursor-style-grid`/
    `.cursor-style-option` (mismo criterio visual que
    `.profile-avatar-grid`/`.profile-avatar-option`, con botones
    cuadrados y una etiqueta de texto bajo cada sprite).

- **18 estilos de puntero nuevos con forma de Pokémon**, ampliando el
  catálogo anterior (Poké Flauta/Poké Ball/Supercaña/Caramelo Raro).
  A diferencia de esos cuatro, estos sprites no vienen de PokeAPI: son
  locales, en `images/cursor-<nombre>.png` (p. ej.
  `images/cursor-pikachu.png`). Logro que desbloquea cada uno:
  `story_johto` ("Historia: Johto") → Shuckle, `perfect_normal_region`
  ("Región perfecta") → Cosmog, `sonidex_alola` ("Sonidex de Alola") →
  Togedemaru, `games_50` ("Veterano") → Zygarde, `sonidex_kalos`
  ("Sonidex de Kalos") → Dedenne, `sonidex_teselia` ("Sonidex de
  Teselia") → Emolga, `story_sinnoh` ("Historia: Sinnoh") → Rotom,
  `sonidex_sinnoh` ("Sonidex de Sinnoh") → Pachirisu, `sonidex_hoenn`
  ("Sonidex de Hoenn") → Plusle, `sonidex_johto` ("Sonidex de Johto") →
  Pichu, `hard_correct_8` ("Reto superado") → Mew, `perfect_easy`
  ("Fácil perfecto") → Meowth, `sonidex_kanto` ("Sonidex de Kanto") →
  Pikachu, y `story_kanto` ("Historia: Kanto") → Bulbasaur, Squirtle y
  Charmander a la vez (tres punteros comparten ese mismo logro), igual
  que `games_30` ("Entrenador dedicado") → Charizard Y y Charizard X a
  la vez.
  - `storage.js`: 18 entradas nuevas en `CURSOR_CATALOG`.
  - `game.js`: 18 entradas nuevas en `CURSOR_UNLOCKS`, mapeando cada id
    nuevo a su logro (sin tocar `isCursorUnlocked()` ni
    `getFeatureUnlocksForAchievement()`, que ya son genéricas sobre
    `CURSOR_UNLOCKS`).
  - `i18n.js`: `cursorStyle.<id>.name` en español e inglés para los 18
    ids nuevos.
  - No ha hecho falta tocar `ui.js`, `index.html` ni `styles.css`: la
    rejilla de Opciones (`renderCursorGrid()`) ya itera sobre
    `CURSOR_CATALOG` de forma genérica.

### Cambiado
- **Los récords por región de la tarjeta "Tus récords" en la pantalla
  de Clasificaciones ahora muestran el emoticono propio de cada región**
  (`REGION_META[r].icon`, game.js) en vez del icono genérico 🗺️ fijo
  para todas — mismo cambio que ya se hizo antes en el modal de Perfil
  (ver entrada anterior de `renderProfileStats()`) y mismo icono que ya
  usaban las pestañas de región de esta misma pantalla
  (`renderLeaderboardRegionTabs()`). Cambio solo en `ui.js`
  (`renderLeaderboardPersonalBests()`).

### Corregido
- **El aviso de "nervios" del Modo Historia (`#nervous-overlay`, el
  pulso rojo en toda la pantalla cuando queda 1 sola vida) podía
  quedarse "colgado" tras salir de la partida**: `storyGameOver()` y
  `storyFinish()` ya lo apagaban correctamente al perder todas las
  vidas o al completar las 7 regiones (resetean `session.mode` y
  llaman a `renderLives()`), pero al salir del Modo Historia a medias
  con el botón "Atrás" (confirmando "Salir igualmente" en el aviso de
  "¿Salir del Modo Historia?") no se limpiaba nada de la sesión de
  Historia, así que si esto ocurría con 1 sola vida el overlay seguía
  activo sobre el menú al que se volvía.
  - `game.js`: nueva función `abandonStoryMode()`, junto a
    `storyGameOver()`, con el mismo patrón de limpieza (resetea
    `session.storyRegionIndex`/`storyLives`, pone `session.mode` a
    `null` y llama a `renderLives()`).
  - `ui.js`: el `onConfirmExit` que se pasa a `showLeaveStoryConfirm()`
    desde el listener de `backBtn` ahora llama primero a
    `abandonStoryMode()` antes de `goBackFromCurrentScreen()`.
  - No hace falta tocar el `exit-btn` de la pantalla de resultado
    (`exitGame()`) ni `storyShowEnemyScreen()`/`storyShowRegionSplash()`:
    ninguno de esos otros caminos puede alcanzarse con el Modo Historia
    a medias y el aviso de "nervios" todavía activo.

- **Tamaño y punto de clic de los punteros con forma de Pokémon**: se
  mostraban a tamaño completo y con el punto de clic en la esquina
  superior izquierda del sprite (heredado del hotspot fijo "4 4"
  pensado para los sprites de objeto, de solo 30×30). Ahora estos 18
  estilos se reescalan a 1/3 de su tamaño original y el punto de clic
  queda centrado en el sprite ya reescalado.
  - `storage.js`: nuevo campo opcional `scale` en `CURSOR_CATALOG`
    (`1/3` en los 18 estilos de Pokémon; ausente, por tanto sin cambio
    de comportamiento, en los 4 estilos de objeto).
  - `ui.js`: `buildScaledCursor()` (nueva) genera, la primera vez que
    se elige cada estilo con `scale`, una versión reescalada del
    sprite en un `<canvas>` oculto y calcula su hotspot como el centro
    exacto de ese canvas; el resultado se cachea en memoria
    (`scaledCursorCache`) para no regenerarlo en cada cambio de
    pantalla. `applyCursorStyle()` ahora decide, por estilo, si pasa
    por `buildScaledCursor()` (Pokémon) o usa el sprite tal cual con
    el hotspot fijo "4 4" de siempre (objetos), y compone el hotspot
    directamente dentro de la variable CSS `--cursor-url` (antes
    llevaba solo la URL).
  - `styles.css`: la regla `body.custom-cursor` ya no fija "4 4" a
    mano — usa `var(--cursor-url)` completo (URL + hotspot), porque
    ahora el hotspot varía según el estilo elegido en vez de ser el
    mismo para todos.
  - `ui.js` (corrección posterior, mismo día): los punteros de Pokémon
    seguían apareciendo en la esquina superior izquierda del sprite (o
    directamente no se veían) pese al primer intento de arreglo
    (reescalado + hotspot centrado vía `<canvas>`/`toDataURL()`). Se
    descarta ese enfoque —el cursor CSS nativo tiene un límite de
    tamaño que el navegador ignora en silencio si se supera, y
    `toDataURL()` puede fallar si el juego se abre como archivo local—
    y se sustituye por una `<img>` real que seguía al ratón por JS
    (`pokemon-cursor-overlay`, ver index.html) y se centra siempre
    sobre él con `transform: translate(-50%, -50%)` en CSS, sea cual
    sea su tamaño; el "1/3 del tamaño" ahora se aplica poniendo el
    `width`/`height` de esa imagen a 1/3 del tamaño natural del sprite
    (medido una vez y cacheado). Los estilos de objeto (Poké Flauta...)
    no se han tocado: siguen usando el cursor nativo del navegador de
    siempre.
  - `index.html`: nuevo elemento `<img id="pokemon-cursor-overlay">`
    (oculto por defecto), justo antes de los `<script>` finales.
  - `styles.css`: `.pokemon-cursor-overlay` (posición fija, centrada
    sobre el ratón, sin interceptar clics) y `body.pokemon-cursor-active`
    (oculta el cursor real del sistema mientras se muestra esa imagen).
  - `styles.css` (segunda corrección, mismo día): al restaurar la regla
    de los estilos de objeto en el cambio anterior se dejó, por error,
    un `4 4` fijo tras `var(--cursor-url)` — pero esa variable, puesta
    por `applyCursorStyle()` en ui.js, ya incluye su propio `4 4` dentro
    del valor. El resultado (`cursor: url("...") 4 4 4 4, auto;`) es una
    declaración inválida que el navegador descarta entera, así que
    Poké Flauta/Poké Ball/Supercaña/Caramelo Raro dejaban de verse.
    Se quita el `4 4` duplicado de la regla CSS.
  - `ui.js`/`styles.css` (tercera corrección, mismo día): el puntero de
    Pokémon iba con retraso ("lag") al mover el ratón. Causa: se movía
    la `<img>` flotante con `left`/`top`, que en un elemento `position:
    fixed` obligan al navegador a recalcular el layout de toda la
    página en cada `mousemove` (potencialmente decenas de veces por
    fotograma). Se cambia a mover la imagen solo con `transform`
    (`translate(x,y) translate(-50%,-50%)`, sin tocar left/top —
    compositing por GPU, sin recalcular layout), y se agrupan las
    actualizaciones con `requestAnimationFrame` para pintar como mucho
    una vez por fotograma, siempre con la posición más reciente del
    ratón conocida en ese momento.
  - `ui.js`/`styles.css` (cuarta corrección): el puntero de Pokémon
    seguía notándose con retraso frente a los estilos de objeto (cursor
    nativo del navegador, sin JS de por medio). Causa: aunque `transform`
    ya no obliga a recalcular layout, seguir agrupando su actualización
    con `requestAnimationFrame` retrasaba el pintado hasta el siguiente
    fotograma en vez de hacerlo en el propio `mousemove` — un fotograma
    entero de más que no ahorraba ningún trabajo real, porque `transform`
    no toca layout. Se quita el `requestAnimationFrame`: ahora
    `paintPokemonCursorPosition()` se llama directamente en cada
    `mousemove`.
  - `i18n.js`: claves nuevas en español e inglés (`options.cursor.*`,
    `cursorStyle.<id>.name` por cada estilo, `cursorStyle.lockedTitle`/
    `lockedToast`, `toast.newCursorTitle`, `feature.cursorName`,
    `feature.cursorType`).

- **Tres logros nuevos**: `streak_50` ("Racha legendaria", sección
  Progreso y rachas — alcanzar una racha de 50 aciertos consecutivos),
  `sonidex_1` ("Primera ficha", sección Sonidex — desbloquear la primera
  ficha de la Sonidex) y `poke_flute` ("Poké Flauta", sección Eventos
  Pokémon — despertar a un Pokémon dormido de las colinas tocándolo).
  `streak_50` desbloquea además el avatar de Melmetal (nueva entrada en
  `AVATAR_CATALOG`, justo tras la de Meltan).
  - `storage.js`: nueva entrada `melmetal` en `AVATAR_CATALOG`; nuevo
    campo `pokeWoken` en `defaultAchStats()`.
  - `game.js`: las tres entradas en `ACHIEVEMENTS` y sus condiciones en
    `ACHIEVEMENT_CONDITIONS`; `melmetal: { achId: "streak_50" }` en
    `AVATAR_UNLOCKS`; nueva `trackPokeWoken()` (mismo patrón que
    `trackEncounter()`), que incrementa `stats.pokeWoken`.
  - `pokemon.js`: `wrap._bgPokeWakeNow()` (ver la entrada de "Emoticonos
    'Z'..." más abajo) llama a `trackPokeWoken()` tras despertar al
    Pokémon manualmente, solo cuando el despertar lo provoca el
    jugador (no cuando despierta por su cuenta al terminar la siesta).
  - `i18n.js`: traducción al inglés de los tres logros nuevos
    (`achv.streak_50.*`, `achv.sonidex_1.*`, `achv.poke_flute.*`).
- **Siestas para los Pokémon de las colinas con sprite animado PMD**: de
  vez en cuando, cada uno se queda dormido por su cuenta —sustituyendo su
  spritesheet "Walk" por el de su animación "Sleep" (mismo repositorio
  PMDCollab/SpriteCollab) y dejando de pasear— durante un rato de entre
  15 segundos y 2 minutos, tras el cual despierta y retoma el paseo
  donde lo dejó. La probabilidad de dormirse se tira de forma
  independiente para cada Pokémon (su propio temporizador, su propia
  tirada), así que nunca se duermen ni se despiertan todos a la vez. Un
  Pokémon sin animación "Sleep" en el repositorio simplemente no se
  duerme nunca (sigue paseando con normalidad).
  - `pokemon.js`: `loadPmdWalkAnim()` se generaliza a `loadPmdAnim(pokemonId,
    animName)` (ya sirve tanto para "Walk" como para "Sleep", con su
    caché `_pmdAnimCache` indexada por ambos); de `applyPmdWalkSprite()`
    se extrae `applyPmdAnim()` (aplica una animación ya cargada al
    `<div>` de sprite existente, sin recrearlo) y `tickPmdSprite()` (un
    único temporizador de fotogramas por Pokémon, que lee en cada tic
    la animación activa en `sprite._pmdAnim`, sea Walk o Sleep).
    `applyPmdWalkSprite()` ahora devuelve el `<div>` creado.
    `initBgPokeWalk()` guarda su temporizador de paseo en
    `wrap._bgPokeStepTimer` y su función `step` en
    `wrap._bgPokeResumeWalk`, para que la nueva `initBgPokeSleep()`
    pueda cancelar el próximo paso al dormirse y retomarlo al
    despertar. `buildBgPokeElement()` arranca `initBgPokeSleep()` tras
    aplicar el sprite animado con éxito.
  - `styles.css`: nueva `.bg-poke.asleep .bg-poke-sprite` que pausa la
    animación de flotar (`bg-poke-bounce`) mientras el Pokémon duerme,
    incluso en los que normalmente flotan (Inkay, Mew, Mewtwo).
- **Emoticonos "Z" sobre los Pokémon de las colinas mientras duermen, y
  despertarlos al tocarlos**: mientras un Pokémon de las colinas está
  en su siesta (ver punto anterior), le flotan tres emoticonos 💤 por
  encima, con la misma animación de flotado que ya usaban las
  partículas del evento de Snorlax. Además, tocar (o pulsar Intro/
  Espacio sobre) un Pokémon dormido ahora lo despierta al instante en
  vez de esperar a que termine su siesta por su cuenta.
  - `pokemon.js`: `initBgPokeSleep()` guarda el temporizador del
    despertar programado en `wrap._bgPokeSleepTimer` y cuelga
    `wrap._bgPokeWakeNow()` (cancela ese temporizador y despierta ya);
    `wakeUp()` se protege para no hacer nada si ya está despierto.
    `buildBgPokeElement()` añade el `<div class="bg-poke-zzz-wrap">`
    (tres `<span class="bg-poke-zzz-particle">💤</span>`, mismo patrón
    que `.snorlax-zzz-particle`) y sus listeners de "click"/"keydown"
    llaman a `wrap._bgPokeWakeNow()` antes de la reacción visual
    habitual (`reactBgPoke()`).
  - `styles.css`: `.bg-poke-zzz-wrap`/`.bg-poke-zzz-particle`
    (ocultos salvo con `.bg-poke.asleep`), reutilizando el `@keyframes
    snorlax-zzz-float` ya existente en vez de duplicarlo.

### Cambiado
- **Sombra de los Pokémon de las colinas, más pegada al cuerpo (excepto
  Porygon, Mew, Mewtwo e Inkay)**: en la mayoría de sprites "Walk" de
  PMDCollab el personaje deja bastante margen vacío por debajo dentro
  del fotograma, así que la sombra (anclada al borde inferior real del
  sprite) quedaba demasiado separada de los pies. Se sube para
  compensarlo en todos los Pokémon de las colinas salvo esos cuatro,
  cuyo fotograma ya llegaba casi hasta el borde y se veían bien tal
  cual.
  - `pokemon.js`: nueva `BG_POKE_SHADOW_DEFAULT_IDS` (ids que NO llevan
    el ajuste); `buildBgPokeElement()` añade la clase `shadow-fix` al
    resto.
  - `styles.css`: nueva regla `.bg-poke.shadow-fix .bg-poke-shadow`
    que sube `bottom` de `-3px` a `14%`.

### Cambiado
- **Animación de flotar de los Pokémon de las colinas, limitada a
  Inkay, Mew y Mewtwo**: el resto de Pokémon de las colinas ya no se
  balancea verticalmente de forma continua (`bg-poke-bounce`); siguen
  caminando por el suelo (`initBgPokeWalk`) y apareciendo con el mismo
  fundido de entrada (`bg-poke-appear`) que antes, solo sin el rebote.
  - `pokemon.js`: nueva `BG_POKE_BOUNCE_IDS` (set con los ids de evento
    `inkay`, `mew` y `mewtwo`); `buildBgPokeElement()` añade la clase
    `no-bounce` al resto.
  - `styles.css`: nueva regla `.bg-poke.no-bounce .bg-poke-sprite` (y su
    equivalente `.bg-poke.no-bounce.is-shiny .bg-poke-sprite`) que deja
    solo `bg-poke-appear` (más el brillo shiny cuando aplique), sin
    `bg-poke-bounce`.

### Cambiado
- **Caterpie ya no usa su sprite shiny estático en las colinas del
  fondo**: aunque su único evento de colinas (`id: "shiny"`, en
  `PokeEvents`) sigue siendo shiny de por sí durante la partida (overlay
  de colores al acertar, x5 puntos...), en las colinas ahora se muestra
  siempre como el Caterpie normal, con su sprite animado PMD (el mismo
  sistema de animación "Walk" que ya usan el resto de Pokémon de las
  colinas), en vez del PNG estático shiny de PokeAPI.
  - `pokemon.js`: `hillPokemonSpriteInfo()` añade una excepción para
    Caterpie (nº de Pokédex 10), devolviendo siempre `shiny: false` para
    él pase lo que pase en `ev.shiny`; `usesPmdWalkSprite()` pierde la
    exclusión explícita que tenía para Caterpie (ya no hace falta: al no
    llegarle nunca `shiny: true` desde `hillPokemonSpriteInfo()`, el
    `!shiny` de siempre ya basta).

### Corregido
- **Texto de la Guía sobre "Eventos Pokémon" (`guide.achievements.events.desc`)
  desactualizado en `index.html`**: el fallback en español escrito
  directamente en el HTML seguía mencionando que, a las 20 apariciones,
  el Pokémon de las colinas luce su sprite shiny (y que el Caterpie
  Shiny evoluciona ahí a un Metapod Shiny) — una función ya eliminada
  (ver más abajo, "Eliminado"). La clave equivalente en `i18n.js`
  (ES/EN) ya no mencionaba esto; solo faltaba igualar el texto fijo del
  HTML, que es el que se ve un instante antes de que `data-i18n`
  aplique la traducción.
  - `index.html`: se quita esa última frase del `<div class="guide-item-desc"
    data-i18n="guide.achievements.events.desc">`, igualándolo al texto
    ya vigente en `i18n.js`.

### Eliminado
- **Los logros de "brillo" que exigían 20 apariciones de un Pokémon/
  evento para que su Pokémon de las colinas luciera su sprite shiny**
  (`encounter_charizard_20`, `encounter_slowpoke_20`,
  `encounter_rapidash_20`, `encounter_ditto_20`, `encounter_inkay_20`,
  `encounter_hypno_20`, `encounter_chansey_20`, `encounter_gengar_20`,
  `encounter_pikachu_20`, `encounter_blastoise_20`,
  `encounter_venusaur_20`, `encounter_electrode_20`,
  `encounter_porygon_20`, `encounter_snorlax_20`,
  `encounter_jigglypuff_20`, `encounter_shiny_20`, `encounter_mewtwo_20`
  y `encounter_mew_20`), junto con los sprites shiny que desbloqueaban
  para esos Pokémon de las colinas (incluida la evolución especial de
  Caterpie Shiny a Metapod Shiny). El logro "de las colinas" a 5
  apariciones y el de avatar a 10 apariciones de cada Pokémon/evento no
  se ven afectados.
  - `game.js`: se quitan las 18 entradas de `ACHIEVEMENTS`, la
    constante `ENCOUNTER_THRESHOLD_20` y su generación de condiciones
    en el bucle sobre `ENCOUNTER_CONDITION_IDS`, la rama de
    `achievementFeaturesFor()` (o equivalente) que anunciaba el sprite
    shiny desbloqueado, y el bloque de `hillShinyToasts`/
    `shinyHillPokemon` (junto a su llamada a `refreshBgPokemonSprite`)
    en el manejo de logros recién desbloqueados.
  - `pokemon.js`: se quita `isHillPokemonShinyUnlocked()` y
    `refreshBgPokemonSprite()`; `hillPokemonSpriteInfo()` se simplifica
    para devolver siempre el `pokemonId`/`shiny` propios del evento
    (sin el caso especial de Metapod Shiny), y se quita la
    comprobación de `is-shiny` en `applyPmdWalkSprite()` (el sprite ya
    no cambia en caliente). También se quita el `dataset.eventId` que
    solo servía para localizar el Pokémon al refrescar su sprite.
  - `i18n.js`: se quitan las traducciones al inglés
    `achv.encounter_<id>_20.title/desc` (18 logros), las claves
    `toast.newHillShinyLabel/Title`, `toast.metapodShinyTitle`,
    `feature.hillPokemonShinyName` y `feature.metapodShinyName` (en
    español e inglés), y se actualiza `guide.achievements.events.desc`
    (en ambos idiomas) para no mencionar ya el sprite shiny a las 20
    apariciones.

### Añadido
- **21 avatares nuevos en el catálogo de perfil**: Cobalion, Terrakion,
  Virizion, Tornadus, Thundurus, Landorus, Volcanion, Necrozma,
  Magearna, Zeraora, Meltan, Dragapult, Zacian, Zamazenta, Eternatus,
  Urshifu, Regieleki, Regidrago, Glastrier, Spectrier y Calyrex. Los 21
  se desbloquean por logro (ver la entrada siguiente), no desde el
  principio.
  - `storage.js`: se añaden al final de `AVATAR_CATALOG`, siguiendo el
    mismo formato (`id`/`name`/`url` de retrato PMDCollab/SpriteCollab)
    que el resto del catálogo.
- **Esos 21 avatares nuevos, ligados al logro que los desbloquea**
  (en vez de quedar disponibles desde el principio): Dragapult →
  "Fanático de la música" (`correct_250`), Eternatus → "Enciclopedia
  musical" (`correct_500`), Necrozma → "Racha imparable" (`streak_30`),
  Meltan → "Leyenda viviente" (`streak_20`), Tornadus/Thundurus/
  Landorus → "Genio musical" (`perfect_hard`), Magearna → "Especialista
  regional" (`perfect_regions_normal_5`), Terrakion/Virizion/Cobalion →
  "Historia: Teselia" (`story_teselia`), Volcanion → "Historia: Kalos"
  (`story_kalos`), Zacian/Zamazenta → "Historia perfecta"
  (`story_complete_100`), Calyrex → "Biblioteca sonora"
  (`sonidex_200`), Spectrier/Glastrier → "Archivo sonoro"
  (`sonidex_100`), Regieleki/Regidrago → "Melómano experto"
  (`sonidex_50`), Urshifu → "Oído fino" (`sonidex_20`), Zeraora →
  "Coleccionista de sonidos" (`sonidex_10`).
  - `game.js`: 21 entradas nuevas en `AVATAR_UNLOCKS`, cada una con
    `{ achId: "..." }` apuntando al logro correspondiente de
    `ACHIEVEMENTS` (varios avatares pueden compartir el mismo logro,
    igual que ya ocurría con Espeon/Umbreon → `perfect_colosseum_xd`).

### Cambiado
- **Sprite de los Pokémon de las colinas (fondo del menú), animado en su
  versión normal**: el PNG estático de PokeAPI se sustituye por el
  spritesheet de la animación "Walk" de PMDCollab/SpriteCollab (el mismo
  repositorio que ya usan los retratos de `AVATAR_CATALOG`, ver
  https://sprites.pmdcollab.org/), así que ahora se les ve caminar en vez
  de solo deslizarse por la pantalla. Solo afecta a la versión NORMAL: la
  versión shiny (incluida la que se desbloquea con el logro de 20
  apariciones) sigue usando el PNG estático de PokeAPI tal cual, y
  Caterpie tampoco usa este sistema (queda excluido explícitamente,
  aunque su único evento de colinas ya era shiny de por sí y nunca habría
  entrado en este camino). Si el spritesheet o su `AnimData.xml` no
  llegan a cargar (sin conexión, Pokémon sin animación "Walk" en el
  repositorio...), el Pokémon se queda con el PNG estático de siempre.
  - `pokemon.js`: nuevas `usesPmdWalkSprite()`, `loadPmdWalkAnim()`
    (pide y analiza `AnimData.xml` para el tamaño de fotograma y nº de
    fotogramas de "Walk", con caché por nº de Pokédex) y
    `applyPmdWalkSprite()` (sustituye el `<img>` por un `<div>` con el
    spritesheet como fondo y un temporizador que avanza el fotograma),
    llamadas desde `buildBgPokeElement()`. `refreshBgPokemonSprite()`
    (logro de 20 apariciones) ahora también sabe volver a crear el
    `<img>` estático si el sprite actual era el `<div>` animado.
  - `styles.css`: sin cambios — el `<div>` animado reutiliza la misma
    clase `bg-poke-sprite` que ya tenía el `<img>`, así que hereda sus
    animaciones (rebote, aparición, espejado al cambiar de sentido...)
    sin tocar ninguna regla.

### Cambiado
- **Fila "Partidas perfectas" del modal de perfil, sustituida por
  "Fichas de la Sonidex desbloqueadas"**: la estadística de partidas
  perfectas (`achievementsData.stats.perfectGamesCount`) se sigue
  contabilizando igual en `game.js`/`storage.js` (no se toca), pero deja
  de mostrarse en el perfil; en su lugar aparece el mismo recuento
  "X / Y" que ya se veía en Inicio y en la pantalla Sonidex.
  - `ui.js`: se extrae `computeSonidexTotals()` (fichas desbloqueadas y
    total, colapsando variantes de idioma con `sonidexGroupSongs()`) a
    partir del cálculo que ya hacía `updateHomeSonidexSummary()`, para
    que ambas funciones —y ahora también `renderProfileStats()`— usen la
    misma lógica en vez de repetirla (Regla nº2 de `CLAUDE.md`).
  - `i18n.js`: la clave `profile.stats.perfectGames` (ES/EN), que ya no
    se usaba en ningún sitio, se sustituye por
    `profile.stats.sonidexUnlocked` (ES/EN).

### Cambiado
- **Orden de los 3 logros de encuentro de cada Pokémon/evento
  (`ACHIEVEMENTS`, sección "encounters")**: dentro de cada trío (mismo
  Pokémon, mismo icono), las dos primeras entradas estaban en el orden
  contrario a su umbral real de apariciones — p. ej. Charizard mostraba
  primero "Avistamiento: Charizard" (10 apariciones) y después "Cazador
  de llamas" (5 apariciones). Ahora cada trío sigue siempre el orden
  5 → 10 → 20 apariciones (p. ej. "Cazador de llamas" → "Avistamiento:
  Charizard" → "Brillo de Charizard"), igual para los 18 Pokémon/eventos.
  - `game.js`: solo se reordenan las 54 líneas de `ACHIEVEMENTS`
    correspondientes (intercambiando la 1ª y 2ª de cada trío de tres,
    sin tocar la 3ª); no cambian ids, descripciones ni umbrales
    (`ACHIEVEMENT_CONDITIONS`, generadas en bucle a partir de
    `ENCOUNTER_CONDITION_IDS`, no dependen del orden del array).

### Añadido
- **Récord de Difícil, Combate y Modo Normal (por región) en el modal
  de perfil personal**: la tarjeta de estadísticas del perfil (icono de
  perfil → modal) ya mostraba el récord de Desafío Infinito y de Modo
  Historia; ahora añade también el récord de Modo Difícil, el de Modo
  Combate y uno por cada una de las 7 regiones del Modo Normal (Kanto,
  Johto, Hoenn, Sinnoh, Teselia, Kalos, Alola), bajo un subtítulo
  "🗺️ Récords por región" nuevo. Mismos datos que ya usaba la tarjeta
  "Tus récords" de la pantalla de Clasificaciones
  (`achievementsData.stats.bestHardScore`/`bestCombatScore`/
  `bestRegionScore`), sin pedir nada nuevo al backend.
  - `ui.js`: `renderProfileStats()` añade dos filas fijas
    (`profile.stats.hardRecord`/`combatRecord`) al array `rows` ya
    existente, y genera las 7 filas de región reutilizando
    `REGIONS`/`regionDisplayName` (mismo criterio que
    `renderLeaderboardPersonalBests()`, sin duplicar esa lógica).
  - `i18n.js`: nuevas claves `profile.stats.hardRecord`,
    `profile.stats.combatRecord` y `profile.stats.regionRecordsTitle`
    (ES/EN).

- **Dos clasificaciones globales nuevas: "Combate" y "Regiones"**: junto
  a Nivel/Infinito/Historia/Difícil, la pantalla de Clasificaciones
  incorpora ahora una pestaña "⚔️ Combate" (récord de puntuación del
  Modo Combate) y una pestaña "🗺️ Regiones" que, al pulsarla, despliega
  7 subcategorías (una por región: Kanto, Johto, Hoenn, Sinnoh, Teselia,
  Kalos, Alola), cada una con su propio Top 50 global y su propio récord
  personal — el de una región no compite con el de otra, ni con el de
  Combate. El récord/envío al backend se actualiza igual con o sin el
  interruptor ♾️ activado (ver también el cambio correspondiente más
  abajo, en la sección "Cambiado").
  - `leaderboard.js`: `LEADERBOARD_CATEGORIES` pasa de 4 a 12 entradas —
    añade `combat` (campo `combatScore`) y `region_Kanto`…`region_Alola`
    (campos `regionKantoScore`…`regionAlolaScore`), un campo más en el
    mismo documento por jugador de la colección `leaderboard`
    (`fetchTop()`/`submitScore()` no cambian, ya eran genéricos respecto
    a la categoría).
  - `storage.js`: `defaultAchStats()` añade `bestCombatScore` (número,
    igual que `bestHardScore`) y `bestRegionScore` (objeto por región,
    igual que `bestStreakByRegion`).
  - `game.js`: en `showResult()`, junto al bloque ya existente de
    `bestHardScore`, un bloque nuevo que distingue Modo Combate
    (`session.normalRegion === "Combate"`) del resto de regiones del
    Modo Normal para actualizar `bestCombatScore`/`bestRegionScore[región]`
    y enviar a `Leaderboard.submitScore("combat", ...)` /
    `Leaderboard.submitScore("region_" + región, ...)` solo al superar el
    récord personal correspondiente.
  - `ui.js`: `LEADERBOARD_TABS` añade `combat`; nuevo
    `LEADERBOARD_DEFAULT_TAB` para formatear las 7 categorías de región
    sin tener que listarlas una a una. Nuevo estado
    `leaderboardActiveRegion` (recuerda la última región vista al volver
    a pulsar "Regiones"). `renderLeaderboardPersonalBests()` pinta ahora
    también el récord de Combate y uno por región (generado con
    `REGIONS`/`regionDisplayName`, ver `#leaderboard-personal-regions`).
    Nueva `renderLeaderboardRegionTabs()`, que construye los 7 botones de
    subcategoría de región (icono + nombre traducido, vía
    `REGION_META`/`regionDisplayName`) dentro de
    `#leaderboard-region-tabs` y engancha su click. `renderLeaderboardScreen()`
    muestra/oculta esa fila de subcategorías y resalta como activa la
    pestaña "Regiones" mientras la categoría activa sea cualquiera de las
    7 `region_*`; el listener de las pestañas fijas traduce un click en
    "Regiones" a la última región vista (o la primera de `REGIONS` la
    primera vez).
  - `index.html`: pestañas `data-category="combat"` y
    `data-category="regions"` en `#leaderboard-tabs`; nuevo contenedor
    `#leaderboard-region-tabs` (relleno por JS) para las 7 subcategorías;
    en la tarjeta "Tus récords", fila de Combate y contenedor
    `#leaderboard-personal-regions` (relleno por JS) para los 7 récords
    por región.
  - `i18n.js`: claves nuevas `leaderboard.combat`, `leaderboard.regionsGroup`,
    `leaderboard.tab.combat` y `leaderboard.tab.regions` (ES/EN); los
    nombres de cada región reutilizan las claves `region.*` ya existentes
    (vía `regionDisplayName()`).
  - `styles.css`: `.leaderboard-tabs` pasa a `flex-wrap: wrap` (ya son 6
    pestañas en la fila principal) y nueva `.leaderboard-subtabs` para el
    pequeño ajuste de margen de la fila de regiones.

- **Interruptor ♾️ de "modo infinito" en Fácil/Normal/Difícil/Combate y en
  las nueve categorías de Minijuegos**: cada uno de los cuatro botones
  grandes del menú de Jugar, y también cada uno de los botones de
  categoría de Minijuegos (Centro Pokémon, Laboratorios, Bicicletas,
  Surf, Pantallas de Título, Openings del Anime, Mundo Misterioso,
  Colosseum/XD, Ranger), incorpora un pequeño interruptor con el símbolo
  del infinito. Al activarlo, la siguiente partida de ESE modo/categoría
  (con sus propias reglas: región de Fácil/Normal, temporizador de 10s
  de Difícil, música de Combate, pool propio de cada categoría de
  Minijuegos...) se juega con rondas sin límite y un fallo termina la
  partida directamente, en vez de las rondas habituales del modo (o de
  `OTHER_ROUNDS`/`OTHER_ROUNDS_OVERRIDES` en Minijuegos) — igual que ya
  hacía el Desafío Infinito, pero sin adoptar sus reglas propias (número
  de opciones, pool de cualquier región, Eventos Pokémon). El propio
  botón "Modo Desafío Infinito" no lleva este interruptor, porque ya es
  infinito por sí mismo.
  - `index.html`: un `<span class="menu-btn-endless-toggle" role="button">`
    con el icono ♾️ dentro de cada uno de esos cuatro `<button class="menu-btn">`
    de modo (no puede ser un `<button>` real anidado dentro de otro
    `<button>`), y otro más dentro de cada uno de los nueve `<button
    class="menu-btn" data-other="...">` de Minijuegos.
  - `styles.css`: nueva clase `.menu-btn-endless-toggle` (círculo pequeño
    en la esquina del botón grande, se resalta con la clase `.active`) y
    `.menu-btn.locked .menu-btn-endless-toggle` (se deshabilita
    visualmente si el modo/categoría aún está bloqueado por nivel/logro)
    — al ser reglas genéricas de `.menu-btn`, no hizo falta CSS nuevo
    para los botones de Minijuegos.
  - `game.js`: nuevo estado `endlessToggle = {easy, normal, hard, combat}`
    y `otherEndlessToggle = {"centro-pokemon", "laboratorios", ...}` (uno
    por cada `data-other`), y nuevo campo `session.endless` (si la
    partida EN CURSO se está jugando así). `setupEndlessToggle()` pasa a
    recibir el objeto de estado (`endlessToggle` u `otherEndlessToggle`)
    como parámetro en vez de asumir siempre el mismo, para no duplicar
    la lógica de "enganchar un interruptor" entre modos y Minijuegos
    (Regla nº2 de `CLAUDE.md`). Nueva función `isEndlessSession()` que
    unifica `mode === GameMode.INFINITE` y `session.endless` en un único
    punto de comprobación; `nextRound()`, `handleAnswer()` y
    `showResult()` (antes escritos solo para `GameMode.INFINITE`) pasan a
    usarla, así que las reglas de "sin límite de rondas" y "un fallo
    termina la partida" quedan en un único sitio válido para todos los
    casos. El récord personal y el envío a la clasificación global
    "infinite" (dentro de `showResult()`) siguen aplicando solo al
    Desafío Infinito real, para no mezclar con esa clasificación
    puntuaciones obtenidas con reglas distintas (menos opciones, región
    fija, pool de una sola categoría de Minijuegos...). `startGame()`
    acepta un parámetro opcional `opts.endless` (ya válido para
    `GameMode.OTHER`, no solo para Fácil/Normal/Difícil/Combate);
    `restartGame()` conserva el valor de `session.endless` de la partida
    anterior al reiniciar, también para Minijuegos (antes solo lo hacía
    para Fácil/Normal/Difícil/Combate — corregido de paso, ya que ahora
    también aplica a Minijuegos).
  - `ui.js`: nueva función `renderEndlessTogglesUI()` (solo pinta la
    clase `active`/`aria-pressed` de los interruptores según
    `endlessToggle`/`otherEndlessToggle`, decidido en `game.js` — Regla
    nº1 de `CLAUDE.md`).
  - `i18n.js`: nueva clave `modes.endlessToggle.title` (ES/EN) para el
    tooltip/aria-label del interruptor (compartida por los botones de
    modo y de Minijuegos).
- **Aviso informativo al activar el interruptor ♾️**: cada vez que el
  jugador ACTIVA (no al desactivar) el interruptor de modo infinito de
  Fácil/Normal/Difícil/Combate o de una categoría de Minijuegos, aparece
  un aviso emergente explicando que las rondas pasarán a ser infinitas y
  que un solo fallo termina la partida. Incluye una casilla "No volver a
  mostrar" que, una vez marcada, deja de mostrar el aviso en cualquiera
  de esos modos/categorías.
  - `storage.js`: nuevo campo `settings.hideEndlessInfo` (por defecto
    `false`), con su validación de tipo en `loadSettings()` (Regla nº6
    de `CLAUDE.md`).
  - `index.html`: nuevo overlay `#endless-info-overlay` (mismo patrón
    visual que `#leave-story-confirm-overlay`), con una casilla
    `#endless-info-dont-show` y un botón `#endless-info-ok-btn`.
  - `styles.css`: nuevas reglas `#endless-info-overlay` y
    `.dont-show-again` (misma familia visual que
    `#leave-story-confirm-overlay`/`.result-card`).
  - `ui.js`: nuevas funciones `showEndlessInfoModal()` (pinta el aviso,
    respetando `settings.hideEndlessInfo`) y `closeEndlessInfoModal()`
    (cierra el aviso y persiste la casilla "No volver a mostrar" si está
    marcada) — Regla nº1 de `CLAUDE.md`: solo pintan un estado, no
    deciden reglas de juego.
  - `game.js`: `setupEndlessToggle()` llama a `showEndlessInfoModal()`
    solo cuando `toggleState[key]` pasa a `true` (al activar, no al
    desactivar), tanto para los interruptores de modo como para los de
    Minijuegos.
  - `i18n.js`: nuevas claves `endlessInfo.title`, `endlessInfo.body`,
    `endlessInfo.dontShowAgain` y `endlessInfo.ok` (ES/EN).

### Cambiado
- **Envío a la clasificación global de Normal/Difícil/Combate jugados
  con el interruptor ♾️ activado**: antes, superar el propio récord en
  Difícil, Combate o cualquier región del Modo Normal mientras estaba
  activado el interruptor ♾️ de ese modo no se enviaba a la
  clasificación global (`showResult()` salía de la función antes de
  llegar a esa comprobación, por compartir camino con el Desafío
  Infinito). Ahora sí se envía, exactamente igual que en una partida sin
  ♾️: solo cambia lo que ya cambiaba antes (menos/otras opciones, región
  fija, sin Eventos Pokémon...), no si el récord cuenta para la
  clasificación.
  - `game.js`: en `showResult()`, el `return` anticipado del bloque de
    `isEndlessSession()` pasa a ejecutarse solo cuando `session.mode ===
    GameMode.INFINITE` (el único caso que de verdad no debe mezclarse
    con las demás clasificaciones); para el resto de modos con ♾️
    activado, la función continúa hacia los bloques ya existentes de
    `bestHardScore`/`bestCombatScore`/`bestRegionScore`, sin duplicar esa
    lógica.

- **Botón "ⓘ" de información de Eventos Pokémon (pantalla previa de
  región del Modo Historia)**: se duplica su tamaño (de 50×50px a
  100×100px, con el icono escalado a juego) para que destaque más. Ya se
  mostraba en la pantalla previa de CUALQUIER región del recorrido
  (Kanto, Johto...), no solo en Kanto — es el mismo `#story-info-btn`
  reutilizado por `storyShowRegionSplash()` (ui.js) en cada región; solo
  se oculta en el aviso de enemigo poderoso (`.combat`). Cambio
  únicamente visual en `styles.css` (`.story-info-btn`), sin tocar
  `index.html`/`ui.js`/`game.js`.
- **Umbrales de los logros de "encuentro" de Eventos Pokémon** (los que
  cuentan cuántas veces ha aparecido cada Pokémon de evento): se
  intercambian los dos primeros escalones.
  - El que desbloquea el **avatar de perfil** de ese Pokémon
    (`encounter_<id>_5` en `AVATAR_UNLOCKS`/`ACHIEVEMENTS`) pasa de
    requerir 5 apariciones a requerir **10**.
  - El que lo desbloquea para **pasear por las colinas** del fondo
    (`encounter_<id>`, sin sufijo) pasa de requerir 10 apariciones a
    requerir **5**.
  - El tercer escalón, que cambia el sprite de las colinas a shiny
    (`encounter_<id>_20`, 20 apariciones), no cambia.
  - `game.js`: las constantes `ENCOUNTER_THRESHOLD_5`/`ENCOUNTER_THRESHOLD`
    (usadas para generar en bucle las condiciones de todos los Pokémon de
    evento — ver `ENCOUNTER_CONDITION_IDS`) se renombran a
    `ENCOUNTER_THRESHOLD_AVATAR = 10`/`ENCOUNTER_THRESHOLD_HILL = 5` para
    que el nombre siga describiendo su propósito y no un número que ya no
    le corresponde; las descripciones de los 18 logros afectados (en
    `ACHIEVEMENTS`) se actualizan para seguir diciendo el número correcto
    de apariciones.
  - `i18n.js`: mismo intercambio en las 18 traducciones al inglés
    correspondientes (`achv.encounter_<id>_5.desc` /
    `achv.encounter_<id>.desc`).
  - Los ids de los logros no cambian (solo su umbral y su descripción),
    así que un jugador que ya tuviera alguno desbloqueado lo conserva sin
    necesidad de migración (Regla nº6 de `CLAUDE.md`).
  - `PROJECT.md`: se actualiza la mención al número de apariciones
    necesario para desbloquear un Pokémon de las colinas.

- **Evento Pokémon Venusaur en el Desafío Infinito**: antes, la vida
  extra que concedía al acertar no servía de nada en la práctica, porque
  cualquier fallo posterior terminaba la partida igualmente (el sistema
  de vidas del Desafío Infinito no se consultaba al fallar, solo al
  activarse Electrode). Ahora, si el jugador falla teniendo alguna vida
  Venusaur disponible (`session.infiniteLives > 0`), se resta una de esas
  vidas y la partida continúa con normalidad; solo termina la partida si
  ya no le queda ninguna.
  - `game.js`: nueva función `loseInfiniteLife()` (análoga a `loseLife()`
    pero para `session.infiniteLives`, sin terminar nunca la partida por
    sí sola) que se llama ahora desde `handleAnswer()` en el fallo del
    Desafío Infinito cuando quedan vidas Venusaur, y que además sustituye
    a la lógica que ya tenía `electrodeExplode()` para ese mismo caso
    (Regla nº2 de `CLAUDE.md`: se unifica en un único sitio en vez de
    mantener dos copias de la misma lógica).

### Corregido
- **Bug: al completar el Modo Historia entero con 1 sola vida
  restante, el aviso de "nervios" (pulso rojo en toda la pantalla,
  `#nervous-overlay`) se quedaba encendido sobre el menú principal**
  incluso después de terminar la partida. `storyFinish()` (la partida
  termina con éxito) nunca llamaba a `renderLives()` ni salía del Modo
  Historia (`session.mode` seguía siendo `GameMode.STORY`), a diferencia
  de `storyGameOver()` (la partida termina por Game Over), que sí lo
  hacía. Como `#nervous-overlay` es un overlay fijo que se pinta por
  encima de cualquier pantalla, se quedaba "colgado" tal cual estaba en
  el último instante de la última ronda.
  - `game.js`: `storyFinish()` ahora también resetea `session.storyLives`
    a 3 y pone `session.mode` a `null` (saliendo así del Modo Historia) y
    llama a `renderLives()`, igual que ya hacía `storyGameOver()` para el
    caso de fallo — mismo criterio (Regla nº1/nº2 de `CLAUDE.md`) para
    ambas formas de terminar la partida.

- **Bug: pulsar repetidamente la pantalla mientras se muestra la
  notificación de un Evento Pokémon podía saltarse una ronda entera**
  (la ronda saltada no llegaba a mostrarse). Pasaba porque el botón
  "Siguiente Ronda" seguía siendo pulsable (clase `visible`, que solo se
  quita dentro de `startRound()`) durante todo el tiempo que tarda en
  aparecer y desaparecer la notificación del evento; cada pulsación de
  más durante esa ventana disparaba su propia llamada a `nextRound()`.
  - `game.js`: se añade `goToNextRound()` como punto único de entrada
    para pasar de ronda (usado tanto por el click del botón como por el
    atajo de barra espaciadora), que ignora cualquier pulsación mientras
    ya hay una en curso (`nextRoundInFlight`) y solo se desbloquea dentro
    de `startRound()`, cuando la ronda siguiente arranca de verdad. Sin
    querer, esto también simplifica el atajo de teclado: ya no hace falta
    el cooldown de 2s (`lastNextRoundKeyPress`) que se usaba para paliar
    el mismo problema solo en ese caso.

### Eliminado
- **El logro "Campeón Pokémon"** (`games_100`, jugar 100 partidas).
  - `game.js`: se quita su entrada de la lista de logros y su condición
    de desbloqueo (`s => s.gamesPlayed >= 100`). El resto de logros que
    también usan la estadística `gamesPlayed` (`games_10`/`20`/`30`/`50`)
    no se ven afectados, así que `storage.js` no necesita ningún cambio.
  - `i18n.js`: se quita la traducción al inglés (`achv.games_100.*`).

### Cambiado
- **Luciérnagas del fondo nocturno**: ahora se dibujan por delante de las
  colinas (antes quedaban tapadas por ellas al pintarse antes de
  `drawHills`), su luz es amarilla cálida en vez de verdosa, son más
  pequeñas y su deriva y parpadeo son más orgánicos (elipse propia por
  luciérnaga y un parpadeo que se eleva al cuadrado en vez de una onda
  seno lineal).
  - `ui.js`: el dibujo se extrae de `drawSkyNight()` a una función nueva
    `drawFireflies()`, invocada desde `drawBG()` después de `drawHills()`
    y solo en modo oscuro. `generateFireflies()` ahora genera radio de
    deriva y velocidad por separado en X/Y (antes un único valor
    compartido) para que cada una describa una elipse distinta.

### Añadido
- **63 avatares de perfil nuevos** (legendarios, singulares y algunos
  populares que faltaban): Abomasnow, Arceus, Articuno, Azelf, Bidoof,
  Chandelure, Cosmog, Cresselia, Darkrai, Deoxys, Dialga, Diancie, Entei,
  Excadrill, Giratina, Gliscor, Groudon, Heatran, Hoopa, Hydreigon,
  Keldeo, Kommo-o, Kricketune, Kyogre, Kyurem, Litten, Lopunny, Lunala,
  Luxray, Manaphy, Marshadow, Meloetta, Mesprit, Moltres, Pachirisu,
  Palkia, Popplio, Raikou, Rayquaza, Regice, Regigigas, Regirock,
  Registeel, Reshiram, Rotom, Rowlet, Scrafty, Shaymin, Solgaleo,
  Staraptor, Suicune, Tapu Bulu, Tapu Fini, Tapu Koko, Tapu Lele, Uxie,
  Weavile, Xerneas, Yveltal, Zapdos, Zekrom y Zygarde. (Celebi y Jirachi
  no se añaden porque ya estaban en el catálogo.) Todos quedan
  disponibles desde el principio, sin entrada en `AVATAR_UNLOCKS`.
  - `storage.js`: 63 entradas nuevas al final de `AVATAR_CATALOG`, mismo
    formato que las existentes (retrato de PMDCollab/SpriteCollab según
    su número de la Pokédex nacional).

### Cambiado
- **Los avatares de Gible y Jynx ahora requieren nivel de perfil**, en
  vez de estar desbloqueados desde el principio.
  - `game.js`: dos entradas nuevas en `AVATAR_UNLOCKS` —
    `gible: { level: 10 }` y `jynx: { level: 11 }` —, junto al resto de
    avatares de esos mismos niveles.

- **Nueva categoría de clasificación global: Modo Difícil**, junto a
  Nivel, Desafío Infinito y Modo Historia.
  - `storage.js`: nuevo campo `bestHardScore` en `defaultAchStats()`
    (récord personal de puntuación en Modo Difícil).
  - `game.js`: en `showResult()`, al terminar una partida de Modo
    Difícil se compara `state.score` con `achievementsData.stats.bestHardScore`
    y, si es un récord nuevo, se guarda y se envía a
    `Leaderboard.submitScore("hard", ...)` — mismo patrón ya usado para
    Desafío Infinito y Modo Historia.
  - `leaderboard.js`: nueva entrada `hard: "hardScore"` en
    `LEADERBOARD_CATEGORIES` (campo `hardScore` en el documento del
    jugador en Firestore).
  - `ui.js`: nueva entrada `hard` en `LEADERBOARD_TABS`, y
    `renderLeaderboardPersonalBests()` ahora también pinta el récord
    personal de Modo Difícil.
  - `index.html`: nueva fila de récord personal y nueva pestaña
    "🔴 Difícil" en la pantalla de Clasificaciones; texto de la guía de
    Clasificación Global actualizado de "tres" a "cuatro" categorías.
  - `i18n.js` (es/en): claves nuevas `leaderboard.hard` y
    `leaderboard.tab.hard`; `guide.leaderboard.intro`/`.update`
    actualizadas para mencionar las cuatro categorías.

- **El minijuego Pokémon Ranger ahora se desbloquea con el logro
  "Aficionado"** (jugar 10 partidas), en vez de con "Entrenador
  dedicado" (jugar 30 partidas).
  - `game.js`: en `OTHER_UNLOCKS`, la entrada `ranger` cambia su
    `achId` de `"games_30"` a `"games_10"` y su `reqTitle` de
    "Entrenador dedicado" a "Aficionado".
  - `i18n.js`: `"otherUnlock.ranger.reqTitle"` en inglés actualizada de
    "Dedicated trainer" a "Enthusiast" (traducción ya usada para el
    logro `games_10` en `"achv.games_10.title"`).

- **Las bandadas de aves del fondo animado cruzan el cielo mucho más
  despacio.**
  - `ui.js`: en `generateBirds()`, el rango de `speed` de cada bandada
    pasa de `rand(0.006, 0.012)` a `rand(0.0012, 0.0024)` (una quinta
    parte de la velocidad anterior).

### Eliminado
- **Los rayos (líneas rectas) que giraban alrededor del sol y de la
  luna en el fondo animado.** Ambos astros conservan su resplandor y su
  disco; solo desaparecen las líneas giratorias.
  - `ui.js`: eliminado el bloque de dibujo de rayos dentro de
    `drawSkyDay()` (sol) y de `drawSkyNight()` (luna).

- **El brillo/nieve en los picos de la cordillera lejana en modo
  noche.** En modo día se mantiene igual que antes.
  - `ui.js`: en `drawMountains()`, el bloque que dibuja la "nieve/bruma"
    sobre las cumbres más altas ahora solo se ejecuta cuando
    `!isDark`.

### Corregido
- **Los textos del Evento Pokémon Snorlax (etiqueta "Snorlax se ha
  quedado dormido", el aviso "Tócalo N veces para despertarlo" y su
  actualización en cada clic "¡Sigue tocando!"/"¡Se ha despertado!")
  se veían en español aunque el idioma de la interfaz estuviera en
  inglés.** Igual que le pasaba al aviso de búsqueda de Gengar (ver
  entrada siguiente), este overlay se generaba con `innerHTML`
  directamente en español dentro de `onAnswers()`, sin pasar por el
  sistema de traducción, a diferencia del nombre/descripción de
  Snorlax que se muestran al aparecer la carta del evento (ya
  traducidos vía `tData()`).
  - `pokemon.js`: la etiqueta, el hint inicial y la actualización en
    cada clic ahora se resuelven con `tData("pokeEvent.snorlax.label",
    ...)`, `tData("pokeEvent.snorlax.hint", ..., { n: CLICKS_NEEDED })`,
    `tData("pokeEvent.snorlax.progress", ..., { clicks, n:
    CLICKS_NEEDED })` y `tData("pokeEvent.snorlax.awake", ...)`, mismo
    patrón que `pokeEvent.gengar.searchHint`.
  - `i18n.js`: nuevas claves `"pokeEvent.snorlax.label"`,
    `"pokeEvent.snorlax.hint"`, `"pokeEvent.snorlax.progress"` y
    `"pokeEvent.snorlax.awake"` en inglés (no hace falta en español:
    `tData()` ya usa el texto español original como valor por defecto
    si no hay traducción, siguiendo la Regla nº2 de `CLAUDE.md`).

- **El aviso "Gengar se esconde en la oscuridad... Ilumina la pantalla
  con el cursor para encontrarlo" (cuadro que tapa las respuestas
  durante el Evento Pokémon Gengar) se veía en español aunque el idioma
  de la interfaz estuviera en inglés.** A diferencia del nombre/
  descripción de Gengar que se muestran al aparecer la carta del evento
  (ya traducidos vía `tData()`), este texto del `.gengar-search-hint` se
  generaba con `innerHTML` directamente en español dentro de
  `onAnswers()`, sin pasar por el sistema de traducción.
  - `pokemon.js`: el texto ahora se resuelve con
    `tData("pokeEvent.gengar.searchHint", ...)`, mismo patrón que
    `pokeEvent.gengar.name`/`.desc`.
  - `i18n.js`: nueva clave `"pokeEvent.gengar.searchHint"` en inglés
    (no hace falta en español: `tData()` ya usa el texto español
    original como valor por defecto si no hay traducción, siguiendo la
    Regla nº2 de `CLAUDE.md`).

- **La etiqueta "✨ Evento Pokémon" de la carta de aparición se veía en
  español aunque el idioma de la interfaz estuviera en inglés.** El
  `<div class="poke-event-tag">` de `index.html` tenía el texto escrito
  a mano, sin atributo `data-i18n`, así que `applyTranslations()` nunca
  lo tocaba (a diferencia del resto de la carta, cuyo nombre/descripción
  del Pokémon sí se resuelven aparte vía `tData()`).
  - `index.html`: añadido `data-i18n="pokeEvent.tag"` a ese `<div>`.
  - `i18n.js`: nueva clave `"pokeEvent.tag"` en español ("✨ Evento
    Pokémon") e inglés ("✨ Pokémon Event").
- Aprovechando el cambio anterior, se elimina de
  `"options.language.desc"` (pantalla de Ajustes) el inciso "(los
  títulos de las canciones siguen en español)" / "(song titles stay in
  Spanish)", que ya no aportaba nada relevante en ese contexto.

- **Los títulos de "Openings del Anime" no cambiaban según el doblaje/idioma
  con el que sonaba la canción.** Las tres entradas de cada opening real
  (España/Latino/Inglés en `game.js`, distinguidas por `variant`) compartían
  el mismo `title` en español de España aunque `file` sí apuntara al mp3 del
  doblaje correcto, así que un opening que sonaba en latino o en inglés se
  mostraba (título de la ronda, pantalla de resultado, Sonidex...) con su
  nombre en español de España en vez del nombre real de esa versión.
  - `game.js`: cada una de las 17 entradas `variant: "latino"` y
    `variant: "english"` del bloque "Openings del Anime" tiene ahora su
    `title` correcto para ese doblaje (p. ej. "¡Atrápalos Ya!" en latino /
    "Indigo League" en inglés, en vez de "Hazte con Todos"). De paso, las
    dos entradas de España cuyo `title` no coincidía con el nombre real del
    doblaje español se corrigen también: "Negro y Blanco" → "Blanco y
    Negro", "Aventuras en Teselia" → "Aventuras en Unova". No se toca
    `file`, `image` ni `sonidexId` de ninguna entrada.

- **No se podía abrir el modal de perfil (bug introducido en un cambio
  anterior que quitó la edición de nombre).** El marcado de
  `#profile-overlay` en `index.html` había dejado de tener el botón
  "editar nombre" y su campo de texto (`#profile-edit-name-btn`/
  `#profile-modal-name-input`), pero `ui.js` seguía intentando
  engancharles un listener nada más cargar el script
  (`profileEditNameBtn.addEventListener(...)`, fuera de cualquier
  función). Al ser `null`, esa línea lanzaba una excepción en cuanto se
  cargaba la página y detenía la ejecución del resto de `ui.js`
  (Modo Historia, logros, router de pantallas...), así que ni siquiera
  hacía falta abrir el perfil para notar el problema.
  - `ui.js`: eliminadas las referencias a `profile-edit-name-btn`/
    `profile-modal-name-input` (ya no existen en el HTML) y toda la
    lógica de `commitProfileNameEdit()` que dependía de ellas.
    `openProfileModal()` ya no intenta tocar el campo de edición. El
    nombre de entrenador vuelve a poder verse con normalidad en el
    modal de perfil; sigue sin poder editarse ahí (comportamiento ya
    buscado en el cambio anterior, solo que ahora sin romper el resto
    de la app).

### Añadido
- **Botón para cambiar el idioma/doblaje del opening desde su ficha de la
  Sonidex**: cada ficha de "Openings del Anime" que tenga más de una
  variante de idioma (España/Latino/Inglés) muestra ahora, junto a los
  botones de reproducir/detener, un pequeño botón con una bandera que va
  rotando entre esas variantes; el que se reproduce con ▶️ es siempre la
  variante seleccionada en ese momento, sin que esto afecte para nada al
  contador de aciertos de la ficha (sigue siendo uno solo, compartido entre
  las tres — ver el cambio anterior).
  - `game.js`: nueva función `sonidexVariantsFor(song)` (con
    `SONIDEX_VARIANT_ORDER` para el orden España → Latino → Inglés), que
    devuelve todas las canciones del catálogo que comparten `sonidexId` con
    `song`; para el resto de canciones (sin `sonidexId`) devuelve solo
    `[song]`, así que no les afecta.
  - `ui.js`: `sonidexSongCard()` guarda en `currentVariantSong` la variante
    que se está escuchando en esa ficha (empieza siendo el representante
    que ya elegía `sonidexGroupSongs()`) y añade el botón `.sonidex-lang-btn`
    (solo si `sonidexVariantsFor(song).length > 1`) que la va rotando y
    reinicia la reproducción si la ficha ya estaba sonando. Nueva función
    `sonidexVariantFlag()` para el emoji de cada variante (🇪🇸/🌎/🇬🇧). El
    "restaurar estado sonando" al volver a pintar la Sonidex ahora
    comprueba todas las variantes de la ficha, no solo `song.file`.
  - `i18n.js`: nueva clave `sonidex.changeLanguage` (aria-label/title del
    botón) en español e inglés.
  - `styles.css`: estilo `.sonidex-lang-btn` (mismo lenguaje visual que
    `.sonidex-play-btn`/`.sonidex-stop-btn`, más pequeño).

### Corregido
- **La Sonidex mostraba (y contaba) una ficha distinta por cada variante de
  idioma de un mismo opening de "Openings del Anime"** (hasta 3 fichas —
  España/Latino/Inglés— para lo que en realidad es una sola canción), porque
  el contador de aciertos y el listado de la pantalla Sonidex usaban
  `song.file` como identificador de ficha, y cada variante tiene su propio
  archivo de audio.
  - `game.js`: catálogo `songs` — las 51 entradas de Openings del Anime
    tienen ahora un `sonidexId` compartido entre sus tres variantes (p. ej.
    `sonidexId: "hazte-con-todos"` en las tres versiones de esa canción).
    Nuevas funciones `sonidexKey(song)` (devuelve `song.sonidexId ||
    song.file`) y `sonidexGroupSongs(list)` (colapsa una lista de canciones a
    una por ficha, prefiriendo como representante la variante del idioma
    actual). `isSongUnlocked()`, `trackSongCorrect()` y
    `sonidexUnlockedCountForList()` usan ahora `sonidexKey()` en vez de
    `song.file` directamente, así que acertar cualquiera de las tres
    versiones de un opening suma al mismo contador.
  - `ui.js`: `renderSonidexScreen()` deduplica cada grupo con
    `sonidexGroupSongs()` antes de pintar sus tarjetas (17 fichas para
    Openings del Anime, no 51); `sonidexSongCard()` consulta el contador con
    `sonidexKey()`; `updateHomeSonidexSummary()` deduplica igual el catálogo
    completo para que el resumen "X / Y fichas" del Inicio siga cuadrando con
    la pantalla Sonidex.
  - No afecta a ninguna otra canción del catálogo (todas siguen sin
    `sonidexId`, así que `sonidexKey()` sigue devolviendo `song.file` para
    ellas exactamente igual que antes — ni se pierde progreso ya guardado en
    `songCorrectCounts`, ni cambia el comportamiento de ninguna otra
    categoría).

### Añadido
- **Catálogo real de "Openings del Anime" + versión inglesa del minijuego**:
  las 17 canciones de ejemplo (`Opening Kanto`...`Opening Alola`) se han
  sustituido por los 17 openings reales de la serie (de "Hazte con Todos" a
  "Expediciones en Kalos"), cada uno con sus tres doblajes/idiomas
  (España/Latino/Inglés — mismo `title` e `image` en las tres, solo cambia
  `file` y el campo `variant`).
  - `game.js`: catálogo `songs` actualizado (51 entradas: 17 openings × 3
    variantes). Las de España viven en `songs/other/openings/españa/`, sin
    `variant`; las de Latino en `songs/openings/latino/` con
    `variant: "latino"`; las de Inglés en `songs/openings/english/` con
    `variant: "english"` (nótese que Latino e Inglés NO cuelgan de `other/`,
    a diferencia de España — así están las carpetas reales). `buildPool()`
    ahora calcula `wantedVariant` también a partir de `settings.language`
    (antes solo miraba `session.openingsVariant`): con el juego en inglés se
    fuerza siempre la variante `"english"`, sin pasar por la pantalla previa
    de selección de doblaje (que sigue existiendo tal cual para español,
    ofreciendo España/Latino).
  - `i18n.js`: traducciones al inglés (`song.<título original>`) de los 17
    títulos nuevos, sustituyendo a las 7 de los openings de ejemplo
    anteriores.
- **Reserva de nicknames al registrarse**: al confirmar la pantalla de
  configuración inicial (nombre + avatar, la primera vez que se juega),
  ahora se intenta reservar ese nombre de entrenador en el registro
  global de Firestore antes de crear el perfil, usando
  `Leaderboard.claimUsername()` (`leaderboard.js`, ya existía pero no
  se llamaba desde ningún sitio).
  - `ui.js`: el listener de `profileSetupConfirmBtn` es ahora
    `async`; mientras se comprueba el nombre, el botón se deshabilita y
    muestra `profileSetup.checking` ("Comprobando…"). Si
    `claimUsername()` devuelve `{ok: false, reason: "taken"}` (nombre
    ya reservado por otro jugador), no se crea el perfil: se marca
    `#profile-setup-name` con la clase `has-error` y se muestra el
    aviso `profileSetup.nameTaken` en `#profile-setup-name-error`
    (ambos ya existían en `index.html`/`styles.css`, preparados para
    esto pero sin usar). En cualquier otro caso (reserva conseguida, o
    no se pudo comprobar por falta de red/permisos de Firestore —
    `reason: "unverified"`/`"invalid"`) se deja crear el perfil con
    normalidad, para que el juego siga siendo jugable sin backend
    (mismo criterio que el resto de `leaderboard.js`).
  - `i18n.js`: nuevas claves `profileSetup.checking`/
    `profileSetup.nameTaken` en español e inglés.
- **Con el idioma de la interfaz en inglés, los avisos de "candado"
  (contenido todavía bloqueado) mezclaban texto en español.**
  - `game.js`: `avatarLockRequirementText()` (usada en el título del
    botón y en el aviso emergente al pulsar un avatar bloqueado)
    construía el texto a mano en español ("nivel X de perfil", "el
    logro «...»"), en vez de usar `t()`/`tData()` como el resto del
    proyecto — así que en inglés se veía ese texto en español sin
    traducir, y además el nombre del logro nunca pasaba por `tData()`
    (mostraba siempre `ACHIEVEMENTS.title`, en español). Ahora usa las
    claves nuevas `avatar.lockReqLevel`/`avatar.lockReqAchievement`/
    `avatar.lockReqUnknown` de `i18n.js`, y el nombre del logro se
    traduce con `tData(\`achv.${ach.id}.title\`, ach.title)` (mismo
    patrón que ya usa `game.js` para los avisos de logro desbloqueado).
  - `ui.js`: `lockReqText()` (candado y aviso emergente de Modos y
    categorías de Minijuegos bloqueados por logro, p. ej. "Desafío
    Infinito" o "Pokémon Mundo Misterioso") usaba directamente
    `cfg.reqTitle`, el texto en español definido en `MODE_UNLOCKS`/
    `OTHER_UNLOCKS` (`game.js`), en vez del valor ya traducido que
    `i18n.js` define para esas mismas claves
    (`modeUnlock.<id>.reqTitle`/`otherUnlock.<id>.reqTitle` — existían
    y estaban bien traducidas, pero no se usaban). `updateLocksUI()` y
    `showLockedMessage()` reciben ahora un `i18nPrefix`
    (`"modeUnlock"`/`"otherUnlock"`) para poder pedir esa traducción
    con `tData()` antes de componer el mensaje.
  - No afecta a la versión en español (`tData()` devuelve el mismo
    texto de siempre cuando no hay traducción o el idioma es español).

### Añadido
- **Selección de doblaje (España/Latino) para "Openings del Anime"**
  (`game.js`, `index.html`, `ui.js`, `i18n.js`): si el jugador tiene el
  idioma de la interfaz en español y entra en el minijuego "Openings del
  Anime", ahora se le pregunta primero si quiere las canciones con el
  doblaje de España o el latinoamericano, antes de arrancar la partida.
  - `index.html`: nueva pantalla `#screen-openings-lang-select` con dos
    botones (`#openings-lang-spain` / `#openings-lang-latino`), con el
    mismo estilo (`menu-btn`/`menu-grid`) que el resto de menús.
  - `ui.js`: la nueva pantalla se registra en el router (`screens.openingsLangSelect`)
    para que `showScreen()`/el botón "Atrás" la traten como cualquier otra.
  - `game.js`: el listener de `[data-other]` desvía a la nueva pantalla
    solo para la clave `"openings-anime"` y solo si `settings.language === "es"`
    (en inglés se arranca directo, como hasta ahora). Nuevo campo
    `session.openingsVariant` (`null` = España, `"latino"` = Latino) y
    nuevas entradas de catálogo en `songs` con `variant: "latino"`
    (ejemplo incluido: `songs/other/openings-latino/temporada1.mp3`).
    `buildPool()` filtra por `session.openingsVariant` cuando la
    categoría es `"openings-anime"`; el resto de categorías, al no usar
    nunca el campo `variant`, no se ven afectadas por el nuevo filtro.
  - `i18n.js`: claves nuevas `openingsLang.*` en español e inglés para
    los textos de la pantalla previa.
  - `ui.js`: las canciones con `variant: "latino"` quedan excluidas de
    la Sonidex (`SONIDEX_GROUPS` y `updateHomeSonidexSummary`), tanto
    del recuento total como de las tarjetas mostradas — son una versión
    alternativa de la misma canción, no una ficha nueva.

- **Traducción al inglés de los 3 títulos de Combate que quedaban
  pendientes por referencia poco clara** (`i18n.js`): `"song.Helio":
  "Cyrus"`, `"song.Aquiles / Magno": "Archie / Maxie"` y
  `"song.Samina": "Lusamine"`. `game.js` no necesitaba ningún cambio
  (esas 3 canciones ya tenían su título en español, `songDisplayName()`
  ya las usa de forma genérica); solo faltaban sus claves en el
  diccionario `en`. De paso, actualizado el comentario de cabecera del
  bloque `song.*` en `i18n.js`, que las mencionaba como pendientes de
  revisar.

### Corregido
- **El mismo problema de títulos en inglés (ver entrada anterior, ya
  corregida para Kanto/Johto) afectaba también al resto de regiones,
  a Combate y a la mayoría de categorías de Minijuegos: 207 canciones
  más tenían el campo `title` con el nombre oficial en inglés en vez
  del título original en español que espera `songDisplayName()`.**
  - `game.js`: revertido el campo `title` de esas 207 canciones a su
    título original en español (Hoenn, Sinnoh, Teselia, Kalos, Alola,
    la mayor parte de Combate, y las categorías de Minijuegos
    Laboratorios, Bicicletas, Centro Pokémon, Surf, Colosseum/XD,
    Ranger, Pantallas de Título y Openings del Anime), usando en cada
    caso la clave `song.<título en español>` que ya existía en el
    diccionario `en` de `i18n.js` (mismo criterio que la entrada
    anterior: no se ha tocado `file`/`image`/`group`/`region`/`other`
    de ninguna entrada). Comprobado que ninguna de las 207 canciones
    queda con el título duplicado dentro de su propia región/categoría
    tras el cambio.
  - Quedan **sin tocar**, tal y como ya estaban en español, las
    canciones que `i18n.js` señala explícitamente como pendientes de
    traducir: las 30 de Pokémon Mundo Misterioso y un puñado de
    títulos de Combate que son nombres propios (Pokémon legendarios,
    equipos villanos, "N"...) o cuya referencia real no está clara
    todavía (Kahuna, Helio, Aquiles / Magno, Samina) — para estas no
    hay ninguna entrada `song.*` en `i18n.js`, así que se siguen
    mostrando igual en los dos idiomas hasta que se traduzcan.
  - `i18n.js`: sin cambios en esta entrada (el diccionario ya tenía
    las 207 traducciones correctas; solo hizo falta que `game.js`
    volviera a usar la clave en español que esas traducciones
    esperan).

### Corregido
- **Los títulos de las 15 canciones de Kanto y las 17 de Johto se
  mostraban en inglés sin importar el idioma seleccionado.** El campo
  `title` de esas 32 entradas del catálogo `songs` (`game.js`) se había
  quedado con el nombre oficial en inglés en vez de con el título
  original en español, que es la clave que espera `songDisplayName()`
  (`i18n.js`) para buscar su traducción (`tData("song."+song.title,
  song.title)` — ver su cabecera). Como resultado, en español no había
  ninguna entrada `song.Pallet Town` (la clave real pasó a ser el
  título en inglés) y se enseñaba tal cual; en inglés tampoco había
  traducción y se mostraba el mismo texto: el idioma dejaba de influir
  en el título mostrado.
  - `game.js`: revertido el campo `title` de esas 32 canciones a su
    título original en español (p. ej. `"Pallet Town"` →
    `"Pueblo Paleta"`, `"Goldenrod City"` → `"Ciudad Trigal"`...), el
    mismo que ya usan como clave las 32 entradas `song.<título en
    español>` ya existentes en el diccionario `en` de `i18n.js`. No se
    ha tocado `file`/`image`/`group`/`region` de ninguna entrada, y
    `songDisplayName()` ya se llama de forma genérica desde `game.js`/
    `ui.js` allá donde se muestra un título, así que no hizo falta
    tocar nada más para que Kanto y Johto vuelvan a traducirse: en
    español se ve el título tal cual (no hay entrada `es.song.*`, cae
    al valor por defecto) y en inglés se traduce vía la entrada
    `song.*` correspondiente.
  - `i18n.js`: de paso, corregida la traducción al inglés de
    `"song.Torre Bellsprout"`, que decía `"Bellsprout Tower"` y no
    `"Sprout Tower"` (nombre oficial en inglés de ese lugar de Johto).

### Añadido
- **Selector de idioma Español/English** (`i18n.js`, fichero nuevo,
  cargado tras `storage.js` y antes de `leaderboard.js`): diccionario
  `I18N` con las cadenas de ambos idiomas, `t(key, vars)` para
  traducir con placeholders y `applyTranslations()` para aplicar el
  idioma actual a todo el marcado con `data-i18n`/
  `data-i18n-placeholder`/`data-i18n-title`/`data-i18n-aria`. El
  idioma elegido se persiste en `settings.language` (`storage.js`) y
  se pinta ya en el primer render: el bloque INIT de `game.js` llama a
  `applyTranslations()` y a `applyLanguageSwitchUI()` (`ui.js`, marca
  qué botón Español/English está activo) justo después de
  `loadSettings()`, para que no haga falta cambiar de idioma a mano
  para verlo reflejado. `setLanguage()` (`i18n.js`) dispara además
  `refreshLanguageDependentUI()` (`ui.js`) para refrescar en caliente
  las pantallas ya renderizadas dinámicamente (resumen de Logros/
  Sonidex en Inicio, Clasificaciones, cabecera de la ronda...).
- **8 canciones nuevas del catálogo principal** (`game.js`, array
  `songs`), 5 de Alola (Escuela de Entrenadores, Cueva Sotobosque,
  Colina Dequilate, Avenida Royale, Poké Resort) y 3 de Kalos (Palacio
  Cénit, Cueva Brillante, Fábrica de Poké Balls). Mismo formato y
  criterio que las anteriores: insertadas al final del bloque de su
  región, sin reordenar las existentes.
- **33 canciones nuevas del catálogo principal** (`game.js`, array
  `songs`). Repartidas por región: 4 de Kanto (Casino de Ciudad
  Azulona, Mansión Pokémon, Silph S.A., Torre Pokémon), 5 de Johto
  (Casino de Ciudad Trigal, Chicas Kimono, Ruinas Alpha, Ruinas
  Sinjoh, Ruta Helada), 10 de Hoenn (Barco del Sr. Arenque, Buceo,
  Cámara Sellada, Cascada Meteoro, Concurso Pokémon, Desierto de
  Hoenn, Guarida del Team Aqua/Magma, Interior del Monte Pírico, Nao
  Abandonada, Pilar Celeste), 3 de Sinnoh (Sala Final de Cintia,
  Ribera Valor, Valle Eólico), 7 de Teselia (Bosque de los Perdidos,
  Castillo de N, Despedida de N, Habitación de N, Solar de los
  Sueños, Torre Duodraco, Un Corazón Inquebrantable) y 4 de Combate
  (Entei, Raikou, Los Regis, Suicune). Cada entrada sigue el formato
  ya usado (`title`/`file`/`image`/`group`/`region`), insertada al
  final del bloque de su región/grupo correspondiente sin reordenar
  las ya existentes; el nombre del archivo de imagen coincide
  exactamente con el del `.mp3` (solo cambia la extensión).
- **3 canciones nuevas de menú** (`audio.js`). `MENU_SONGS` pasa de 7 a
  10 entradas, añadiendo `songs/general/pokemusic8.mp3` a
  `pokemusic10.mp3`; se reproducen en el mismo ciclo aleatorio sin
  repetición que ya usaban las 7 anteriores (`refillMenuSongQueue()`),
  sin necesidad de tocar nada más.
- **Nuevo logro de "brillo" (20 apariciones) para cada Evento Pokémon**
  (`game.js`, `pokemon.js`, `index.html`). Además de los logros ya
  existentes a 5 y 10 apariciones de cada evento, ahora hay un tercer
  escalón a las 20 apariciones (`encounter_<id>_20`) que, al
  conseguirse, cambia el sprite de ese Pokémon en las colinas del fondo
  por su variante shiny (sin añadir un Pokémon nuevo: el suyo ya
  paseaba desde el logro de 10). Caso especial: como el evento Caterpie
  Shiny (`id: "shiny"`) ya usa un sprite shiny de por sí, su logro de 20
  apariciones («Evolución brillante») no lo repite, sino que hace
  evolucionar a su Pokémon de las colinas a un Metapod Shiny.
  - `game.js`: nueva constante `ENCOUNTER_THRESHOLD_20` (20) y una
    tercera condición `encounter_<id>_20` generada en el mismo bucle que
    ya creaba las de 5 y 10 apariciones (`ACHIEVEMENT_CONDITIONS`), una
    entrada nueva en `ACHIEVEMENTS` por cada uno de los 18 eventos
    (sección `encounters`), un nuevo bloque en `getFeatureUnlocksForAchievement()`
    que describe la recompensa de estos logros, y en `checkAchievements()`
    un nuevo grupo de avisos ("Nuevo brillo") junto con
    `shinyHillPokemon.forEach(refreshBgPokemonSprite)` para actualizar el
    sprite sin reconstruir el resto del fondo.
  - `pokemon.js`: nuevas funciones `isHillPokemonShinyUnlocked()`,
    `hillPokemonSpriteInfo()` (resuelve nº de Pokédex + shiny a usar,
    con el caso especial de Caterpie Shiny → Metapod Shiny) y
    `refreshBgPokemonSprite()`. `bgPokeSpriteUrl()` y
    `buildBgPokeElement()` (para la clase `is-shiny`) ahora pasan por
    `hillPokemonSpriteInfo()` en vez de mirar directamente `ev.shiny`, y
    cada Pokémon de fondo lleva un `data-event-id` para poder
    localizarlo luego.
  - `index.html`: actualizada la Guía de Juego (sección "✨ Eventos
    Pokémon") para explicar este nuevo escalón.
- **Botón de "Pista visual" en Modo Fácil, Normal (incluido Combate) y
  Modo Historia** (`index.html`, `styles.css`, `game.js`, `ui.js`).
  Aparece en la pantalla de quiz entre la etiqueta de modo
  (`#mode-label`) y el estado del audio (`#audio-status`). Al pulsarlo,
  antes de responder, muestra la carátula de la canción que está
  sonando dentro del contenedor circular (reutilizando `setSongImage()`,
  ya existente para revelarla al terminar la ronda), a cambio de que esa
  ronda valga un 50% menos de puntos. Solo puede usarse una vez por
  ronda y no está disponible en Difícil, Minijuegos ni Desafío Infinito.
  - `game.js`: nuevo campo `state.hintUsed`, nueva función
    `useVisualHint()` (decide si se puede usar y aplica la marca), y el
    cálculo de `roundPoints` en `handleAnswer()` ahora multiplica por
    0.5 si `state.hintUsed` es `true`.
  - `ui.js`: nuevas funciones `resetHintButton()` (muestra/oculta y
    reinicia el botón cada ronda, según `session.mode`) y
    `markHintButtonUsed()` (lo deshabilita tras usarse).
- **Nueva categoría de Minijuegos: "Openings del Anime"** (clave interna
  `openings-anime`), con el mismo patrón que el resto de categorías de
  la tabla de `CLAUDE.md`:
  - `index.html`: nuevo botón `data-other="openings-anime"` en
    `#screen-other-games`, junto al de Pantallas de Título.
  - `game.js`: 7 canciones de ejemplo en el array `songs` (una por
    región, `songs/other/openings-anime/opening-<región>.mp3` —
    sustituir por los openings reales), nueva entrada en
    `OTHER_UNLOCKS` (se desbloquea en el **nivel 6 de perfil**, igual
    de genérico que el resto así que el aviso de desbloqueo al subir
    de nivel y el candado del botón funcionan sin tocar nada más), y
    añadida al comentario de `session.otherGame`.
  - `ui.js`: nueva entrada en `SONIDEX_GROUPS` (pantalla Sonidex) y
    en `prettyOther()`.
  - `i18n.js`: claves `other.openinganime.title`/`.desc` (ES/EN) y
    `otherUnlock.openings-anime.name`/`.reqTitle` (EN), más la
    categoría añadida al texto `guide.sonidex.organization`
    (ES/EN, también en su versión estática en `index.html`).

### Cambiado
- **Traducidos al inglés los títulos de las 17 canciones de Johto**
  (nombre oficial inglés de cada lugar), con el mismo mecanismo
  `songDisplayName()`/`song.<título original>` ya usado para Kanto:
  nuevas claves en el diccionario `en` de `i18n.js` (p. ej.
  `"song.Pueblo Primavera": "New Bark Town"`,
  `"song.Ciudad Trigal": "Goldenrod City"`...). No hizo falta tocar
  `game.js`/`ui.js`: ya llaman a `songDisplayName()` de forma genérica
  para cualquier canción, así que Johto queda cubierto sin más cambios.
- **Traducidos al inglés los títulos de las 15 canciones de Kanto**
  (nombre oficial inglés de cada lugar): nueva función
  `songDisplayName(song)` (`i18n.js`, junto a `regionDisplayName()`,
  mismo patrón: `tData("song."+song.title, song.title)`) y nuevas
  claves `song.<título original>` en el diccionario `en` para las 15
  canciones de Kanto (p. ej. `"song.Pueblo Paleta": "Pallet Town"`,
  `"song.Ciudad Celeste": "Cerulean City"`...). El resto de regiones se
  queda en español hasta que se traduzcan igual. `song.title` (el
  catálogo `songs` de `game.js`) sigue siendo la clave interna para
  comparar/identificar canciones (opciones de respuesta, Sonidex...) —
  nunca pasa por `songDisplayName()`, solo el texto que ve el jugador:
  - `game.js`: las opciones de respuesta del tipo "título" en
    `generateOptionsForCurrent()`, el nombre de la canción en el aviso
    de ficha Sonidex desbloqueada y el texto que revela la canción
    tras responder.
  - `ui.js`: título y `alt` de la imagen en la ficha de la Sonidex, y
    los `aria-label` de sus botones reproducir/detener.
- **Reestructurados los niveles de desbloqueo de modos y categorías de
  Minijuegos** (`game.js`: `MODE_UNLOCKS`/`OTHER_UNLOCKS`; `i18n.js`:
  claves `modeUnlock.*.reqTitle`/`otherUnlock.*.reqTitle` en inglés):
  - Modo Difícil: nivel 5 → **nivel 8**.
  - Modo Combate: nivel 8 → **nivel 10**.
  - Centro Pokémon: sin cambios (nivel 3).
  - Laboratorios: antes por logro "Aficionado" (`games_10`, jugar 10
    partidas) → ahora **nivel 4** de perfil (deja de depender de
    `achId`).
  - Bicicletas: nivel 10 → **nivel 5**.
  - Surf: nivel 14 → **nivel 6**.
  - Pantallas de Título: nivel 12 → **nivel 7**.
  - Openings del Anime: nivel 6 → **nivel 9**.
  - Sin cambios en las categorías que se desbloquean por logro:
    Pokémon Mundo Misterioso, Pokémon Colosseum / XD y Pokémon Ranger.
- **La región Teselia se muestra como "Unova" en inglés**: nueva
  función `regionDisplayName(region)` (`i18n.js`, junto a `t()`/
  `tData()`) que traduce el nombre de una región para mostrarlo al
  jugador, dejando cualquier región sin entrada `region.*` (todas menos
  Teselia, que se llaman igual en los dos idiomas) tal cual; la clave
  interna (`REGIONS`/`REGION_META` en `game.js`, el campo `region` de
  cada canción, `localStorage`...) sigue siendo "Teselia" en ambos
  idiomas, sin ninguna migración de datos necesaria. Se usa en: la
  tarjeta de región del selector de Modo Normal (`game.js`), las
  opciones de respuesta y el aviso de fin de región del Modo Historia
  en Modo Fácil (`generateOptionsForCurrent()`, `storyShowRegionSplash()`,
  `storyShowRegionComplete()`), la cabecera "Modo Normal: `<región>`" /
  "Modo Historia: `<región>`" durante la partida (`setModeLabel()`),
  el título de cada grupo de región en la Sonidex
  (`renderSonidexScreen()`) y el listado de mejores rachas por región
  (`renderStreaksCard()`). De paso, las tres comparaciones que
  detectaban la respuesta correcta comparando el texto del botón
  (`b.textContent === state.currentSong.region`, en el destello de
  Electrode, el resaltado de la respuesta correcta al fallar y el brillo
  de Jigglypuff) pasan a comparar `b.dataset.correct === "1"` — ya
  existía ese atributo en cada botón (`addAnswerButton()`) y es
  necesario ahora que el texto mostrado puede no coincidir con la clave
  interna de la región.
- **Traducción a inglés de textos generados a mano en `ui.js` (parte 1 de
  2)**: candado "Bloqueado" (avatares, Modos y Minijuegos) y sus textos
  de requisito de desbloqueo (`renderAvatarGrid()`, `updateLocksUI()`,
  `showLockedMessage()`), los 5 títulos de grupo de la tarjeta de Rachas
  (`renderStreaksCard()`), el tooltip del badge ⭐ de función especial y
  la fecha de desbloqueo de un logro (`achievementItemHTML()` — el
  `toLocaleDateString()` ya no fuerza `'es-ES'`, usa `'en-US'` cuando
  `settings.language === "en"`), las 8 etiquetas + el título
  "Estadísticas" de la tarjeta de estadísticas del perfil
  (`renderProfileStats()`) y el título "`<Región>` Completado" de la
  animación de fin de región (`storyShowRegionComplete()`). Todo pasa
  por claves nuevas en `i18n.js` (`lock.*`, `avatar.locked*`,
  `streaks.*`, `ach.starBadgeTooltip`, `ach.unlockedOn`,
  `profile.stats.*`, `common.pts`, `story.regionCompleted`) vía `t()`,
  con su traducción en ambos idiomas. También se añaden
  `updateModeLocksUI()`/`updateOtherLocksUI()` a
  `refreshLanguageDependentUI()` para que los candados ya pintados en
  pantalla cambien de idioma al vuelo, no solo al volver a abrir esa
  pantalla. Los nombres de región y de modo (p. ej. "Combate", "Fácil")
  se dejan sin traducir a propósito, igual que el resto de contenido de
  datos del juego (ver cabecera de `i18n.js`). Pendiente la parte 2.
- **El aviso de avatar desbloqueado muestra la imagen real del avatar en
  vez del emoticono 🖼️** (`styles.css`, `ui.js`, `game.js`). El aviso
  ahora puede llevar un campo `image` (URL) en vez de `icon`: si está
  presente, `processAchToastQueue()` inserta un `<img>` recortado en
  círculo dentro de `#ach-toast-icon` en lugar del emoji; si no,
  mantiene el comportamiento anterior. Los dos avisos de avatar
  desbloqueado (por nivel en `addProfileXp()`, por logro en
  `checkAchievements()`) ahora pasan `image: av.url` del avatar
  correspondiente (`AVATAR_CATALOG`).
- **El minijuego Pokémon Mundo Misterioso pasa de 5 a 10 rondas por
  partida** (`game.js`). Nueva constante `OTHER_ROUNDS_OVERRIDES` (clave
  = `session.otherGame`) que permite dar a una categoría de Minijuegos
  una duración distinta de la de `OTHER_ROUNDS` (5, que sigue aplicando
  al resto); `startGame()` la consulta al calcular `session.roundsTarget`.
  Guía de Juego (`index.html`) actualizada para reflejar la excepción.
- **El aviso emergente ("toast") ya no dice siempre "Logro
  desbloqueado"** cuando lo que se desbloquea no es un logro
  (`index.html`, `ui.js`, `game.js`). La etiqueta pequeña del aviso
  (`#ach-toast-label`) ahora depende de cada notificación: solo los
  logros reales (`ACHIEVEMENTS`) siguen diciendo "Logro desbloqueado";
  subir de nivel dice "Subida de nivel"; desbloquear un modo o un
  minijuego (por nivel o por logro) dice "Modo desbloqueado" /
  "Minijuego desbloqueado"; un avatar nuevo dice "Avatar desbloqueado";
  una ficha de Sonidex dice "Ficha desbloqueada"; un Pokémon nuevo en
  las colinas dice "Nuevo encuentro"; los avisos de "candado" (modo,
  minijuego o avatar todavía bloqueado) dicen "Bloqueado".
  - `ui.js`: `queueAchievementToasts()`/`processAchToastQueue()` ahora
    leen un campo `label` opcional de cada aviso (con "Aviso" como
    valor por defecto si no se especifica) y lo pintan en el nuevo
    `#ach-toast-label` del HTML.
  - `game.js`: todas las llamadas a `queueAchievementToasts()`
    (`addProfileXp()`, `trackSongCorrect()`, `checkAchievements()`)
    pasan ahora su propia `label` según el tipo de aviso.
- **Revisión completa de la Guía de Juego (`index.html`, pantalla de
  Ajustes → Guía).** Corregidos varios datos que habían quedado
  desactualizados por cambios anteriores:
  - Modo Fácil/Normal/Difícil/Combate/Minijuegos ya no dicen tener
    "3 vidas": esos modos nunca han tenido sistema de eliminación
    (`loseLife()` solo actúa en Modo Historia), un fallo solo corta la
    racha. La sección "❤️ Vidas" se reescribe para reflejar que solo
    Modo Historia tiene corazones desde el principio, y que el Desafío
    Infinito solo los tiene si el evento Venusaur concede alguno.
  - Modo Difícil y Modo Combate ya no dicen desbloquearse con el logro
    «Explorador»: ahora se desbloquean por nivel de perfil (5 y 8),
    como en `MODE_UNLOCKS` (`game.js`).
  - La sección de Minijuegos ya no dice que todas las categorías se
    desbloquean "con un logro": la mitad se desbloquean por nivel de
    perfil (`OTHER_UNLOCKS`, `game.js`).
  - Las 3 menciones al orden de las categorías de Minijuegos se
    actualizan para reflejar el orden real de la pantalla (Pantallas
    de Título entre Surf y Mundo Misterioso).
  - La lista de secciones de Logros pasa de una enumeración vaga a los
    5 bloques reales (`ACHIEVEMENT_SECTIONS`, `game.js`), incluyendo
    "Maestría y partidas perfectas", que no se mencionaba.
  - Añadidas 3 secciones que faltaban por completo: **Experiencia y
    nivel de perfil** (de dónde sale la XP y qué desbloquea), **Avatares**
    (cómo se desbloquean) y **Clasificación Global** (las 3 categorías
    online y cuándo se actualiza el puesto del jugador).
- **`SONIDEX_GROUPS` (`ui.js`) sincronizado con el orden real de la
  pantalla de Minijuegos.** Tras mover antes el botón de "Pantallas de
  Título" en `index.html`, el array de categorías de la Sonidex había
  quedado desincronizado con su propio comentario ("mismo orden que en
  la pantalla de Minijuegos"); se reordena para que vuelva a coincidir.
- **Orden de las categorías de Minijuegos en pantalla.** El botón
  "Pantallas de Título" (`index.html`, `screen-other-games`) se mueve
  para quedar entre "Surf" y "Pokémon Mundo Misterioso" (antes era el
  último de la lista). Solo cambia el orden visual de los botones; no
  afecta a lógica, desbloqueos ni datos guardados.
- **Categorías de Minijuegos: ahora pueden desbloquearse por nivel de
  perfil, no solo por logro.** `isOtherUnlocked()` (`game.js`) admite
  ahora, igual que `isModeUnlocked()`/`isAvatarUnlocked()`, una entrada
  `{ level }` además de `{ achId }` en `OTHER_UNLOCKS`. `addProfileXp()`
  comprueba también `OTHER_UNLOCKS` al subir de nivel (aviso "¡X
  desbloqueado!" + refresco de candados vía `updateOtherLocksUI()`),
  cosa que antes solo hacía para `MODE_UNLOCKS`.
- **Requisitos de desbloqueo de 2 modos y 4 categorías de Minijuegos.**
  En `MODE_UNLOCKS`: Modo Difícil pasa de nivel 3 a nivel 5, Modo
  Combate de nivel 5 a nivel 8. En `OTHER_UNLOCKS`: Centro Pokémon pasa
  del logro "Historia: Johto" a nivel 3, Bicicletas pasa del logro "En
  racha" a nivel 10, Pantallas de Título pasa del logro "Fácil
  perfecto" a nivel 12, Surf pasa del logro "Oído entrenado" a nivel
  14, y Pokémon Mundo Misterioso pasa del logro "Historia: Sinnoh" al
  logro "Historia: Hoenn" (`story_hoenn`). Los logros que antes servían
  de requisito (`story_johto`, `streak_5`, `perfect_easy`,
  `correct_20`, `story_sinnoh`) siguen existiendo como logros propios
  en `ACHIEVEMENTS`, solo dejan de estar ligados a desbloquear estas
  categorías/modos.
- **Lucario se desbloquea ahora con un logro, no por nivel.** En
  `AVATAR_UNLOCKS` (`game.js`), Lucario pasa de requerir nivel 40 (lo
  compartía con Aggron, que se queda solo en ese nivel) a requerir el
  logro `perfect_combat` ("As del combate": partida perfecta en Modo
  Combate).
- **Avatar por defecto de un jugador nuevo: Eevee en vez de Pikachu.**
  Nueva constante `DEFAULT_AVATAR_ID` (`storage.js`, valor `"eevee"`),
  usada tanto en el valor inicial de `profile.avatarId` como en
  `pendingSetupAvatarId` (`ui.js`), que es el avatar que aparece
  premarcado en la pantalla de creación de perfil (nombre + avatar) la
  primera vez que se abre el juego. Antes ambos usaban
  `AVATAR_CATALOG[0].id`, que apuntaba a Pikachu por ser el primero del
  catálogo.
- **Ajuste de niveles de 4 avatares.** En `AVATAR_UNLOCKS` (`game.js`):
  Cacnea pasa a requerir nivel 25 (antes disponible desde el
  principio, comparte nivel con Flareon), Whiscash pasa a requerir
  nivel 26 (antes disponible desde el principio, comparte nivel con
  Vaporeon), Aggron pasa del nivel 42 al 40 (comparte nivel con
  Lucario) y Salamence pasa a requerir nivel 42 (antes disponible
  desde el principio, ocupa el hueco que deja Aggron).
- **Traducción del texto de pregunta y del estado del audio durante la
  ronda** (`game.js`, `i18n.js`). Cinco cadenas que estaban "a pelo" en
  español en `startRound()`/`handleAnswer()` ahora pasan por `t()`:
  el texto de la pregunta central (`quiz.questionRegion` /
  `quiz.questionSong`), el estado "Reproduciendo..." (`quiz.playing`),
  el aviso de autoplay bloqueado (`quiz.tapToPlay`) y el mensaje del
  evento Chansey al fallar la primera vez (`quiz.chanseySecondChance`).
  Nuevas claves añadidas a `I18N` (ambos idiomas).

### Eliminado
- **Panel de depuración "Forzar Evento Pokémon" del Modo Historia.** Se
  retira por completo la herramienta temporal que permitía al jugador
  elegir manualmente el próximo Evento Pokémon en vez de dejarlo al
  azar: el botón "🧪 Forzar evento" y el overlay del selector
  (`index.html`), sus estilos (`styles.css`), la variable
  `debugForcedId` y la función `debugForceNext()` junto con el bloque
  que la consultaba en `tryTrigger()` (`pokemon.js`), las funciones
  `updateDebugEventButtonVisibility()` / `openDebugEventPanel()` /
  `closeDebugEventPanel()` y su inicialización (`pokemon.js`), y la
  llamada a `updateDebugEventButtonVisibility()` desde `ui.js`. No
  afecta a la probabilidad ni al comportamiento normal de los Eventos
  Pokémon, solo elimina la vía de forzarlos manualmente.
- **Evento Pokémon Weezing.** Se retira por completo del catálogo de
  `PokeEvents` (`pokemon.js`), junto con su overlay de humo tóxico y
  filtro SVG de turbulencia (`index.html`), sus estilos y animaciones
  (`styles.css`), y sus dos logros de "encuentro" — "Avistamiento:
  Weezing" (`encounter_weezing_5`) y "Humo tóxico" (`encounter_weezing`)
  — de la sección "Eventos Pokémon" en la pantalla de Logros
  (`game.js`). También se quita de las menciones informativas en la
  guía del juego (`index.html`) y de comentarios de código que lo
  listaban como ejemplo. Los jugadores que ya tuvieran esos logros
  desbloqueados no los pierden (`achievementsData.unlocked` no se
  toca), pero dejan de aparecer en la lista de logros a partir de
  ahora.

### Añadido
- **2 nuevos logros de partida perfecta en Minijuegos.** `perfect_colosseum_xd`
  ("Sombra perfecta") se desbloquea al completar una partida perfecta
  (100 % de aciertos) en el minijuego Pokémon Colosseum/XD, y
  `perfect_mystery_dungeon` ("Mazmorra perfecta") al completarla en el
  minijuego Pokémon Mundo Misterioso. `trackGameFinished()` (`game.js`)
  ahora recibe también `otherGame` desde `showResult()` y, si la
  partida es perfecta y el modo es `GameMode.OTHER`, marca la
  estadística correspondiente (`perfectColosseumGame`/
  `perfectMysteryDungeonGame`, nuevos campos en `defaultAchStats()`,
  `storage.js`) según `session.otherGame`. `perfect_colosseum_xd`
  desbloquea los avatares de Espeon y Umbreon; `perfect_mystery_dungeon`
  desbloquea los de Dusknoir, Grovyle y Wigglytuff (nuevas entradas en
  `AVATAR_UNLOCKS`, `game.js`). Wigglytuff pierde su desbloqueo por
  nivel (antes nivel 26): a partir de ahora solo se desbloquea con este
  logro nuevo.
- **Avatar de Volcarona.** Se amplía `AVATAR_CATALOG` (`storage.js`) con
  un retrato estilo Pokémon Mundo Misterioso (PMDCollab/SpriteCollab)
  de Volcarona, para poder usarlo como recompensa de nivel 43 (ver más
  abajo).

### Cambiado
- **Recompensas de avatar por nivel de perfil (niveles 11-50, tramo
  alto).** Se amplía `AVATAR_UNLOCKS` (`game.js`) con un nuevo tramo de
  desbloqueos por nivel: Swablu (11), Trapinch (13), Hoothoot (14),
  Spinda (31), Miltank/Spoink (32), Loudred (33), Dunsparce/Ledian (34),
  Torkoal/Sharpedo (35), Medicham/Shedinja (36), Mantine/Sableye (37),
  Lunatone/Solrock (38), Sunflora/Ninetales (39), Flygon (41), Aggron
  (42), Volcarona (43), Dragonite (44), Tyranitar (45), Garchomp (46),
  Metagross (47), Latios/Latias (48), Lugia/Ho-Oh (49) y Celebi/Jirachi
  (50). Todos estos avatares ya existían en `AVATAR_CATALOG` (salvo
  Volcarona, nuevo) y hasta ahora estaban disponibles desde el
  principio. Además, tres avatares que ya tenían nivel asignado cambian
  de nivel: Xatu (antes 11, ahora 31), Alakazam (antes 25, ahora 33) y
  Lucario (antes 31, ahora 40).
- **Avatares de perfil desbloqueables por logro de avistamiento, en vez
  de por nivel.** `AVATAR_UNLOCKS` (`game.js`) admite ahora, además de
  `{ level }`, una forma `{ achId }`: el avatar se desbloquea al
  conseguir ese logro en vez de al alcanzar un nivel de perfil
  (`isAvatarUnlocked()` comprueba una u otra según el avatar, mismo
  criterio que `isModeUnlocked()`/`isOtherUnlocked()`). Se usa para 18
  avatares —Charizard, Venusaur, Blastoise, Pikachu, Ditto, Inkay,
  Rapidash, Slowpoke, Hypno, Chansey, Porygon, Gengar, Electrode,
  Snorlax, Jigglypuff, Caterpie, Mewtwo y Mew—, cada uno ligado al
  logro "Avistamiento: `<nombre>`" (`encounter_<id>_5` en
  `ACHIEVEMENTS`, el de 5 apariciones de ese Evento Pokémon) salvo
  Caterpie, ligado a "Avistamiento brillante" (`encounter_shiny_5`).
  Estos avatares ya existían en `AVATAR_CATALOG` y hasta ahora estaban
  disponibles desde el principio. Al conseguir uno de estos logros
  (`checkAchievements()`) se muestra un aviso de avatar nuevo
  disponible, igual que al desbloquear un modo o categoría de
  Minijuegos; el logro correspondiente también enlaza al avatar desde
  la pantalla de Logros (`getFeatureUnlocksForAchievement()`).
- **Rejilla de avatares y aviso de bloqueo, adaptados a logros.**
  `renderAvatarGrid()` (`ui.js`) ordena ahora los avatares
  desbloqueables por logro después de los desbloqueables por nivel
  (nueva `avatarSortWeight()`), y tanto el título del botón como el
  aviso al pulsar un avatar bloqueado usan el nuevo
  `avatarLockRequirementText()` (`game.js`), que describe el requisito
  real (nivel de perfil o nombre del logro) en vez de asumir siempre un
  nivel.

### Añadido
- **4 nuevos avatares de perfil.** Se amplía `AVATAR_CATALOG`
  (`storage.js`) con retratos estilo Pokémon Mundo Misterioso
  (PMDCollab/SpriteCollab) de Gible, Chespin, Fennekin y Froakie, para
  poder usarlos como recompensa de nivel (ver más abajo).

### Cambiado
- **Recompensas de avatar por nivel de perfil (niveles 2-29, segunda
  tanda).** Se añaden a `AVATAR_UNLOCKS` (`game.js`) desbloqueos por
  nivel para 19 avatares que hasta ahora estaban disponibles desde el
  principio: Snubbull (2), Rattata/Geodude (3), Sunkern/Wooper (4),
  Togepi/Mareep (5), Staryu/Teddiursa (7), Ralts/Magikarp (8),
  Smeargle/Corsola (9), Marill/Growlithe (10), Riolu/Feebas (11),
  Unown (28) y Sneasler (29). Riolu pasa a requerir nivel 11 (antes
  disponible desde el principio, tras el cambio de la sesión
  anterior).

- **Recompensas de avatar por nivel de perfil (niveles 13-31).** Se
  amplía `AVATAR_UNLOCKS` (`game.js`) con un nuevo tramo de
  desbloqueos por nivel, del 13 al 31: Gyarados/Dratini (13),
  Scyther/Larvitar (14), Arcanine/Beldum (15), Bagon/Onix (16),
  Gible/Heracross (17), Turtwig/Piplup/Chimchar (18), Milotic/Magmar
  (19), Jynx/Wobbuffet (20), Chatot/Electabuzz (21), Sylveon/Tauros
  (22), Shuckle/Aerodactyl (23), Snivy/Oshawott/Tepig (24),
  Alakazam/Flareon (25), Wigglytuff/Vaporeon (26), Lapras/Jolteon (27),
  Zoroark (28), Scizor (29), Fennekin/Chespin/Froakie (30) y Lucario
  (31). Las recompensas de nivel 12 e inferiores se mantienen igual.
  Piplup cambia de nivel de desbloqueo (antes 22, ahora 18). Riolu,
  Umbreon y Espeon pierden su entrada en `AVATAR_UNLOCKS` y pasan a
  estar disponibles desde el principio.
- **Orden de la rejilla de avatares de perfil.** `renderAvatarGrid()`
  (`ui.js`) ahora pinta los avatares ordenados de menor a mayor según
  el nivel necesario para desbloquearlos (`AVATAR_UNLOCKS`, `game.js`);
  antes seguían el orden de declaración en `AVATAR_CATALOG`
  (`storage.js`). Los avatares sin requisito de nivel (desbloqueados
  desde el principio) van primero, conservando entre ellos su orden
  original en el catálogo.

### Añadido
- **33 nuevos avatares de perfil.** Se amplía `AVATAR_CATALOG`
  (`storage.js`) con retratos estilo Pokémon Mundo Misterioso
  (PMDCollab/SpriteCollab) de Rattata, Geodude, Onix, Staryu,
  Aerodactyl, Larvitar, Mantine, Smeargle, Miltank, Lugia, Ho-Oh,
  Ralts, Shedinja, Loudred, Sableye, Aggron, Medicham, Sharpedo,
  Torkoal, Spoink, Spinda, Trapinch, Flygon, Cacnea, Swablu, Lunatone,
  Solrock, Whiscash, Bagon, Beldum, Latias, Latios y Jirachi. Se omite
  Celebi porque ya tenía avatar en el catálogo. Igual que las tandas
  anteriores, se añaden sin entrada en `AVATAR_UNLOCKS` (`game.js`),
  por lo que quedan disponibles desde el principio.

- **32 nuevos avatares de perfil.** Se amplía `AVATAR_CATALOG`
  (`storage.js`) con retratos estilo Pokémon Mundo Misterioso
  (PMDCollab/SpriteCollab) de Feebas, Magikarp, Gyarados, Milotic,
  Growlithe, Magnemite, Scyther, Electabuzz, Magmar, Jynx, Tauros,
  Jolteon, Flareon, Vaporeon, Dratini, Hoothoot, Ledian, Togepi,
  Mareep, Marill, Sunkern, Sunflora, Wooper, Unown, Wobbuffet,
  Dunsparce, Snubbull, Shuckle, Heracross, Teddiursa, Corsola y
  Sneasler. Igual que la tanda anterior, se añaden sin entrada en
  `AVATAR_UNLOCKS` (`game.js`), por lo que quedan disponibles desde el
  principio.

- **45 nuevos avatares de perfil.** Se amplía `AVATAR_CATALOG`
  (`storage.js`) con retratos estilo Pokémon Mundo Misterioso
  (PMDCollab/SpriteCollab) de Venusaur, Blastoise, Charizard, Caterpie,
  Rapidash, Slowpoke, Hypno, Electrode, Chansey, Ditto, Porygon,
  Mewtwo, Mew, Inkay, Treecko, Turtwig, Chimchar, Snivy, Oshawott,
  Tepig, Skitty, Cubone, Alakazam, Xatu, Absol, Ninetales, Gardevoir,
  Wigglytuff, Chatot, Grovyle, Dusknoir, Celebi, Kangaskhan, Kecleon,
  Lucario, Garchomp, Dragonite, Lapras, Arcanine, Scizor, Tyranitar,
  Salamence, Metagross, Zoroark y Sylveon. Se omiten los Pokémon que ya
  tenían avatar (Bulbasaur, Squirtle, Charmander, Pikachu, Jigglypuff,
  Gengar, Snorlax, Meowth, Chikorita, Cyndaquil, Totodile, Riolu,
  Eevee, Torchic, Piplup, Mudkip). Los avatares nuevos se añaden sin
  entrada en `AVATAR_UNLOCKS` (`game.js`), por lo que quedan
  disponibles desde el principio, igual que los 10 primeros del
  catálogo original.

- **Evento Electrode: sprite real y animación de carga/explosión.** El
  badge del temporizador ya no usa el emoticono 💣, sino el sprite de
  `images/electrode.png`. Mientras la mecha está encendida, el sprite se
  va poniendo cada vez más blanco y brillante (sincronizado con los 10s
  de `ELECTRODE_FUSE_SECONDS`), con un halo de luz alrededor que empieza
  inapreciable y va ganando brillo y tamaño al mismo ritmo, y en el
  instante de la explosión ambos revientan en un destello final antes de
  que el badge desaparezca.
  - `index.html`: sustituido el emoji por `<img id="electrode-sprite">`
    dentro de `#electrode-timer`, envuelto en
    `<span id="electrode-sprite-wrap">` (necesario para poder pintar el
    halo detrás con un `::before` sin tocar el propio sprite).
  - `styles.css`: estilos de `#electrode-sprite`/`#electrode-sprite-wrap`
    y las animaciones `electrode-charge`/`electrode-glow` (blanqueo del
    sprite y crecimiento del halo, clase `.charging`) y
    `electrode-blast`/`electrode-glow-blast` (destello final, clase
    `.exploding`).
  - `ui.js`: `startElectrodeTimer()` añade la clase `charging` y fija
    `--electrode-fuse` para sincronizar la duración de ambas animaciones
    con `ELECTRODE_FUSE_SECONDS`. `stopElectrodeTimer(exploded)` acepta
    un nuevo parámetro opcional: si es `true`, añade brevemente la clase
    `exploding` antes de ocultar el badge.
  - `game.js`: `electrodeExplode()` ahora distingue entre "ya había
    respondido" (limpieza silenciosa) y "ha explotado de verdad" (llama
    a `stopElectrodeTimer(true)` para disparar el destello). Solo afecta
    al Electrode junto al temporizador, no al que pasea de fondo en el
    menú (otro elemento distinto, en `pokemon.js`).

### Añadido
- **19 nuevos logros «de primer avistamiento» para los Eventos Pokémon.**
  Junto a cada logro `encounter_<id>` ya existente (que ahora pide 10
  apariciones), se añade uno nuevo con id `encounter_<id>_5` que se
  desbloquea a las 5 apariciones de ese mismo Pokémon/evento — el mismo
  umbral que tenían todos estos logros antes del cambio anterior.
  Reutilizan el mismo contador `stats.encounterCounts` (no hace falta
  tocar `storage.js`), así que un jugador desbloquea primero el logro
  de 5 y, más adelante, el de 10 sin perder progreso. El desbloqueo de
  Pokémon en las colinas de fondo (`isHillPokemonUnlocked` en
  `pokemon.js`) sigue atado únicamente al logro de 10, como hasta
  ahora: los nuevos ids `_5` no coinciden con ningún `PokeEvents.list()`
  al quitarles el prefijo `encounter_`, así que no disparan ese
  desbloqueo por error.

### Cambiado
- **Umbral de los logros de Eventos Pokémon: de 5 a 10 apariciones.**
  Los 19 logros `encounter_*` (uno por cada Pokémon/evento, más el de
  Pokémon shiny) ahora exigen que su Evento Pokémon correspondiente
  haya aparecido 10 veces en vez de 5. Cambio centralizado en
  `game.js`, en el bucle que genera `ACHIEVEMENT_CONDITIONS[encounter_*]`
  a partir de la nueva constante `ENCOUNTER_THRESHOLD`, más la
  actualización del texto (`desc`) de cada logro en `ACHIEVEMENTS[]`.
  Como sigue usando el mismo contador `stats.encounterCounts` de
  siempre, el progreso ya acumulado por los jugadores no se pierde: los
  logros que antes estaban en 5/5 pasan a mostrarse como 5/10.

- **Botón de información de Eventos Pokémon más grande** en la pantalla
  previa de región del Modo Historia (`.story-info-btn`): de 38×38px y
  1.15rem de icono a 50×50px y 1.5rem.

- **Evento Porygon: glitch también en el audio**, no solo en lo visual.
  Mientras el evento está activo, la canción de la ronda suena
  entrecortada (pequeños saltos hacia atrás al azar cada pocos cientos
  de ms), a juego con las letras corruptas y los píxeles de la interfaz.
  - `audio.js`: nuevas `startPorygonAudioGlitch(audioEl)` /
    `stopPorygonAudioGlitch()`, que manipulan directamente
    `audioEl.currentTime` del `<audio>` de la ronda (no es un sonido
    ambiente aparte, como la lluvia de Blastoise o el ronquido de
    Snorlax). `stopAudioHard()` la llama también como red de seguridad.
  - `pokemon.js`: el evento `porygon` añade un hook `onAudio` que arranca
    el efecto; `clearPokeEventVisuals()` lo detiene junto al resto de
    efectos al cambiar de ronda o salir del quiz.
  - `game.js`: `startRound()` detiene el efecto de la ronda anterior
    junto al resto de resets de Eventos Pokémon.
- **Avatares de perfil desbloqueables por nivel**: de los 20 avatares de
  `AVATAR_CATALOG` (`storage.js`), ahora solo los 10 primeros están
  disponibles desde el principio; los otros 10 se desbloquean
  progresivamente al subir de nivel.
  - `game.js`: nueva constante `AVATAR_UNLOCKS` (avatar → nivel
    requerido) y helper `isAvatarUnlocked(avatarId)`. `addProfileXp()`
    ahora también avisa (toast "🖼️ ¡Nuevo avatar disponible!") cuando
    subir de nivel desbloquea algún avatar nuevo, igual que ya hacía con
    los modos de juego.
  - `ui.js`: `renderAvatarGrid()` (usada tanto en la configuración
    inicial de perfil como en el modal de perfil) pinta en gris y con
    candado los avatares todavía bloqueados; tocarlos muestra un aviso
    con el nivel necesario en vez de seleccionarlos.
  - `styles.css`: estilos `.profile-avatar-option.locked` y
    `.avatar-lock-badge` para el candado sobre el avatar.
- `game.js`: catálogo real de canciones del minijuego **Mundo
  Misterioso** (30 pistas), sustituyendo las 7 de ejemplo. Rutas
  actualizadas a `songs/other/mistery-dungeon/<pista>.mp3` /
  `images/<pista>.png` (antes `songs/other/mundo-misterioso/...`), ya
  que es donde se han añadido los ficheros reales. Los títulos son
  provisionales (nombre del propio fichero, en formato legible) a la
  espera de que se sustituyan por los títulos definitivos; la clave
  `other: "mystery-dungeon"` no cambia, así que no afecta a
  desbloqueos ni al resto del juego.

- **Clasificaciones ahora tienen tres categorías** en vez de solo el
  Desafío Infinito: **Nivel de Jugador**, **Desafío Infinito** y **Modo
  Historia**, seleccionables con pestañas en la pantalla de
  Clasificaciones.
  - `leaderboard.js`: `Leaderboard.fetchTop()` y
    `Leaderboard.submitScore()` ahora reciben un primer parámetro
    `category` (`"level"` / `"infinite"` / `"story"`, ver la nueva
    constante `LEADERBOARD_CATEGORIES`). Cada jugador sigue teniendo un
    único documento en Firestore (ID = `playerId`), pero ahora con un
    campo por categoría (`level`/`infiniteScore`/`storyScore`);
    `submitScore()` actualiza (`merge: true`) solo el campo de la
    categoría indicada, sin pisar las otras dos. `fetchTop()` devuelve
    cada fila como `{ username, avatarId, value }`.
  - `game.js`: además del envío ya existente al superar el récord de
    Desafío Infinito, ahora también se envía la puntuación al superar
    el récord de Modo Historia (`storyGameOver()`/`storyFinish()`) y el
    nivel de jugador al subir de nivel (`addProfileXp()`).
  - `ui.js`/`index.html`: la pantalla de Clasificaciones muestra ahora
    los tres récords personales a la vez (tarjeta "Tus récords") y un
    selector de pestañas para elegir qué top 50 global se pide/pinta.
  - `styles.css`: nuevo estilo `.leaderboard-tabs`/`.leaderboard-tab`
    para las pestañas.
  - ⚠️ Como esta integración con Firebase todavía no se había publicado
    (sigue en `[Unreleased]`), no hay datos reales en Firestore que
    migrar: el cambio de forma de los datos (de `score` a
    `level`/`infiniteScore`/`storyScore` por documento) no requiere
    ningún paso adicional.
  - `firestore.rules` (fichero de referencia, no se carga desde el
    juego): actualizado a los 3 campos nuevos (`level`/`infiniteScore`/
    `storyScore`, cada uno opcional en la escritura ya que
    `submitScore()` solo manda el campo de la categoría que mejoró).
- `leaderboard.js` conectado a un backend real (**Firebase/Firestore**):
  `Leaderboard.fetchTop(n)` y `Leaderboard.submitScore(...)` ya no son un
  stub, hablan de verdad con la colección `leaderboard` de Firestore.
  Es el único fichero del proyecto que se carga como
  `<script type="module">` (lo exige el SDK de Firebase); expone su API
  en `window.Leaderboard` para que el resto del juego lo siga usando
  igual que antes.
- `storage.js`: nuevo campo `profile.playerId` (identificador anónimo
  aleatorio) + helper `ensurePlayerId()`, que lo genera y guarda la
  primera vez que hace falta. Se usa como clave del documento de
  Firestore de cada jugador en la clasificación global, para que al
  mejorar su récord se actualice su fila en vez de crearse una nueva.
- `game.js`: `showResult()` pasa ahora `ensurePlayerId()` a
  `Leaderboard.submitScore()`.
- Nuevo fichero de referencia `firestore.rules` (no se carga desde el
  juego) con las reglas de seguridad a pegar en la Consola de Firebase:
  lectura pública de `leaderboard`, escritura validada por forma de los
  datos, borrado bloqueado.

### Añadido (entrada anterior de esta sesión)
- **Nuevo fichero `leaderboard.js`**: adaptador hacia el backend/API que
  alojará la clasificación global (`Leaderboard.fetchTop(n)` /
  `Leaderboard.submitScore(username, avatarId, score)`). Es un stub
  listo para conectar: mientras `API_BASE_URL` (dentro del propio
  fichero) siga a `null`, `fetchTop()` devuelve `[]` y `submitScore()`
  no hace nada (solo avisan por consola), sin romper el resto de la
  app. Se carga justo después de `storage.js` por no depender de nada
  más.
- `index.html`/`ui.js`/`game.js`: nueva sección **Clasificaciones**,
  accesible desde un botón nuevo en el menú principal. Muestra el
  récord personal de Desafío Infinito (ya existente en
  `achievementsData.stats.bestInfiniteScore`) y, debajo, una tabla con
  el top 50 global (avatar + nombre + puntuación) obtenida de forma
  asíncrona vía `Leaderboard.fetchTop(50)`, con mensajes de carga,
  error y "todavía sin datos" mientras no haya backend conectado.
  `game.js` envía la puntuación a `Leaderboard.submitScore()` solo
  cuando se supera el récord personal del Desafío Infinito (no en cada
  partida).
- `pokemon.js`/`index.html`/`styles.css`: nuevo Evento Pokémon **Mew**.
  Mew "se transforma": tras su carta de aparición, se muestra un
  selector con 3 eventos Pokémon aleatorios del catálogo (sprite +
  nombre de cada uno) y el jugador elige tocando uno; el evento activo
  de la ronda pasa a ser el elegido (su `onAnswers`/`onAudio`, y
  cualquier caso especial de `game.js` que consulte
  `PokeEvents.activeId()` como los multiplicadores de Shiny/Pikachu o la
  vida extra de Venusaur, se aplican exactamente igual que si ese
  Pokémon hubiera aparecido directamente). `pokemon.js` añade el nuevo
  helper interno `showActiveEventAndContinue()` (usado tanto por el
  disparo normal como por el forzado desde el panel de debug) para no
  repetir en dos sitios la comprobación del caso especial de Mew.
- `pokemon.js`: nuevo Evento Pokémon **Mewtwo**. Añade dos respuestas
  incorrectas extra (títulos de canciones del pool actual que no estén
  ya entre las opciones mostradas), cada una insertada en una posición
  aleatoria de la rejilla en vez de siempre al final. El brillo psíquico
  y la animación de aparición (`styles.css`) se aplican a TODAS las
  respuestas de la ronda, reales y falsas por igual (solo retocan borde
  y `box-shadow`, nunca el fondo ni el color del texto de
  `.answer-btn`, para que se lean bien en modo claro y oscuro), de forma
  que no se pueden distinguir ni por su aspecto ni por su posición.
- `ui.js`: extraído el helper `addAnswerButton(gridEl, label, isCorrect)`
  a partir de la lógica ya existente en `renderAnswerButtons()`, para que
  el evento Mewtwo cree sus respuestas extra exactamente igual que las
  normales en vez de generar el HTML "a mano" en `pokemon.js`.
- `game.js`: logros `encounter_mewtwo` ("Clon psíquico") y
  `encounter_mew` ("Transformista"), generados junto al resto de logros
  `encounter_*` vía `ENCOUNTER_CONDITION_IDS`.

### Cambiado
- `audio.js`: el glitch de audio del evento Porygon
  (`startPorygonAudioGlitch()`) saltaba con demasiada frecuencia; el
  intervalo entre saltos pasa de 650ms a 2600ms (x4, una cuarta parte de
  frecuencia).
- **Nubes de humo del evento Weezing: contorno estilo anime**. Cada
  degradado radial de `.weezing-cloud` mantiene ahora su color de
  relleno plano hasta cerca del borde y luego pasa, en un tramo muy
  estrecho, a un tono casi negro (`#170a2c`) totalmente opaco antes de
  desvanecerse a transparente — una "tinta" sólida que traza el
  contorno de la nube, en vez de un simple resplandor difuso sin línea.
  Al formar parte del propio degradado (y no un `border`/`box-shadow`
  aparte), esa línea pasa igual que el resto por el filtro de
  turbulencia de `#weezing-smoke-overlay`, así que queda pegada al
  borde irregular ya distorsionado de cada nube.
- **Pantalla de Logros reorganizada en secciones plegables**, en vez de
  una única rejilla plana con todos los logros a la vez.
  - `game.js`: cada logro de `ACHIEVEMENTS` declara ahora un campo
    `section`; nueva constante `ACHIEVEMENT_SECTIONS` (Progreso y
    rachas, Maestría y partidas perfectas, Sonidex, Modo Historia,
    Eventos Pokémon) que define esas categorías y su orden de
    aparición.
  - `ui.js`: `renderAchievementsScreen()` agrupa los logros por sección
    dentro de bloques `<details>` plegables, cada uno con su propio
    contador "X / Y". Todas las secciones empiezan plegadas, mostrando
    solo la cabecera con el título de la categoría (antes se abrían por
    defecto las secciones con algún logro pendiente).
  - `index.html`/`styles.css`: la lista de logros pasa de un único
    `.card` con `.ach-list` a `.ach-sections` (una tarjeta por
    categoría, con cabecera plegable `.ach-section-summary`).
- **Botones "Clasificaciones" y "Opciones" en pantalla de Inicio,
  agrupados en una fila compacta**: ya no son botones principales de
  ancho completo con título y subtítulo, sino dos botones uno junto al
  otro, cada uno mostrando solo su icono y ocupando la mitad del ancho
  horizontal que ocupa un botón principal (Jugar, Modo Historia...).
  - `index.html`: ambos botones (`#go-leaderboard`/`#go-options`) ahora
    van dentro de un contenedor `.menu-row-compact`, con la clase extra
    `.menu-btn-compact` y sin `.menu-btn-title` ni `<small>` (se añade
    `title`/`aria-label` para mantener el nombre accesible).
  - `styles.css`: nuevas reglas `.menu-row-compact` (fila flex) y
    `.menu-btn-compact` (variante compacta de `.menu-btn`, solo icono).
- **Pantalla de Logros: eliminada la tarjeta "Récords de puntuación"**
  (Desafío Infinito / Modo Historia); esos dos récords personales siguen
  visibles en la pantalla de Clasificaciones ("Tus récords") y en el
  modal de perfil, así que no se pierde el dato, solo se deja de
  duplicar en Logros.
  - `ui.js`: eliminada la función `renderRecordsCard()` y su llamada
    desde `renderAchievementsScreen()`.
  - `index.html`: eliminada la tarjeta y el contenedor `#records-list`
    de `#screen-achievements`.
- `pokemon.js`/`styles.css`: el evento Gengar ahora es un minijuego de
  búsqueda: la pantalla se oscurece por completo (negro totalmente
  opaco) y el sprite de Gengar aparece escondido en un punto aleatorio;
  el cursor actúa como una linterna (un hueco en el oscurecimiento que
  lo sigue) y es la única forma de ver, a través de ese hueco, el resto
  de la pantalla. El sprite y la linterna no aparecen hasta que termina
  la transición de oscurecimiento, para que Gengar no sea visible unos
  instantes mientras la pantalla todavía se está oscureciendo. Mientras
  Gengar no se ha encontrado, las respuestas no son pulsables y quedan
  cubiertas por un contenedor con fondo sólido y opaco propio (no
  depende del oscurecimiento ni de su hueco de linterna: las tapa pase
  lo que pase con el cursor), con el icono de fantasma y el texto
  pidiendo buscarlo pintados encima; ese contenedor y su texto quedan
  siempre visibles por encima del negro del oscurecimiento. Gengar
  nunca aparece dentro de esa zona (quedaría tapado sin forma de
  encontrarlo). Al clicar sobre Gengar, el oscurecimiento y el
  contenedor desaparecen y las respuestas vuelven a estar disponibles.
  `game.js` reutiliza el nuevo helper `clearGengarSearch()` (definido
  en `pokemon.js`) al empezar cada ronda, para no dejar colgados el
  sprite ni el listener de la linterna si la ronda anterior cambió
  antes de encontrarlo.

### Corregido
- `ui.js`/`i18n.js`: en la tarjeta "Rachas máximas" de la pantalla de
  Logros, los nombres de fila `Fácil`/`Difícil`/`Combate`/`Desafío`
  estaban escritos a mano en español dentro de `renderStreaksCard()` en
  vez de pasar por `t()`, así que se veían en español aunque el
  jugador tuviera el idioma en inglés. Añadidas las claves
  `streaks.easyLabel`/`streaks.hardLabel`/`streaks.combatLabel`/
  `streaks.infiniteLabel` (`i18n.js`, en los dos idiomas) y usadas
  desde `renderStreaksCard()` en vez del texto suelto.
- `game.js`: al acertar una respuesta, si mostrar el aviso de subida de
  nivel/logro/ficha de Sonidex desbloqueada (`addProfileXp()` /
  `trackCorrectAnswer()` / `trackSongCorrect()`, que además pueden tocar
  cosas más "delicadas" como `Leaderboard.submitScore()`) lanzaba una
  excepción inesperada, `handleAnswer()` se cortaba en ese punto y nunca
  llegaba a la línea final que muestra el botón "Siguiente Ronda": el
  botón se quedaba sin aparecer, dando la sensación de que "desaparecía"
  justo cuando saltaba una notificación. Ahora esas tres llamadas van
  cada una en su propio try/catch, así que un fallo ahí ya no puede
  impedir que el resto de la ronda (y el botón "Siguiente Ronda") siga
  su curso con normalidad.
- `game.js`: al pulsar repetidamente la barra espaciadora (atajo de
  "Siguiente Ronda") a veces se saltaba también la ronda siguiente,
  porque la clase `visible` del botón `#next-btn` se quita dentro de
  `startRound()`, que puede tardar en ejecutarse (Eventos Pokémon,
  timeouts...); si el jugador pulsaba varias veces antes de que
  desapareciera esa clase, cada pulsación llamaba a `nextRound()` por
  separado. Ahora el atajo, además de exigir que el botón esté visible,
  solo puede dispararse como mucho una vez cada 2 segundos.
- `pokemon.js`/`styles.css`: el aviso de "busca a Gengar" (icono + texto)
  no llegaba a verse por encima del oscurecimiento pese a tener un
  `z-index` mayor: al colgar de `gridEl` (dentro de `#app`, que tiene su
  propio `position:relative; z-index:1`), quedaba atrapado en el
  stacking context de `#app` y su `z-index` nunca llegaba a competir con
  el de `#gengar-dark-overlay` (fuera de `#app`). Ahora se ancla
  directamente a `<body>` en `position:fixed`, con sus coordenadas
  puestas por JS a partir de la posición real de la rejilla de
  respuestas, igual que ya se hacía con el sprite escondido: así queda
  siempre visible por encima del negro opaco, sin depender de la
  linterna del cursor.
- `styles.css`: durante el parpadeo final del evento Jigglypuff, el
  overlay de somnolencia (`#jigglypuff-drowsy-overlay`) quedaba por
  detrás del sprite cantando (`#jigglypuff-sing-overlay`), así que no
  llegaba a taparlo del todo. Ahora su `z-index` es mayor que el del
  sprite, tal y como ya indicaba el propio comentario del archivo.
- `game.js`: en Modo Difícil e Infinito, el punto de inicio aleatorio de
  la canción se recalculaba cada vez que el navegador volvía a disparar
  `canplaythrough` durante la misma ronda (p. ej. al rebufferear),
  haciendo que la canción saltara de sitio repetidamente en vez de
  fijarse una sola vez al empezar la ronda. Ahora el listener se
  desactiva nada más ejecutarse la primera vez.
- `ui.js`: las tarjetas de región del Modo Normal (`#region-pills`)
  se generan una única vez en `game.js` al arrancar la app, con el
  nombre ya traducido por `regionDisplayName()` en ese momento —
  pero `refreshLanguageDependentUI()` no las repintaba al cambiar de
  idioma después, así que la tarjeta de Teselia seguía diciendo
  "Teselia" en vez de "Unova" si el jugador cambiaba a inglés desde
  el menú de Opciones sin recargar la página. Añadido el helper
  `refreshRegionPillNames()` (`ui.js`), que repinta el texto de cada
  tarjeta apoyándose en que se crean en el mismo orden que `REGIONS`
  (`game.js`), y se llama desde `refreshLanguageDependentUI()`.

### Cambiado
- `ui.js`: mientras suena la canción del evento Jigglypuff, la canción
  de la ronda ahora se reduce al 15% de su volumen (antes, al 30%).
- `game.js`: el aviso de subida de nivel usa ahora el icono ⬆️ en vez
  de 🆙.
- Refactor interno (sin cambios de comportamiento visible) para eliminar
  código duplicado detectado en una auditoría:
  - `ui.js`: `spawnAchievementParticles()`, `spawnLogoParticles()` y
    `spawnParticles()` ahora son wrappers finos sobre un nuevo helper
    genérico `spawnParticleBurst()`.
  - `audio.js`: `startBlastoiseRainSound`/`stopBlastoiseRainSound` y
    `startSnorlaxSnoreSound`/`stopSnorlaxSnoreSound` ahora usan un
    helper genérico `startAmbientLoop()`/`stopAmbientLoop()`.
  - `ui.js`: `updateModeLocksUI()`/`updateOtherLocksUI()` y
    `showLockedModeMessage()`/`showLockedOtherMessage()` ahora
    comparten lógica a través de `updateLocksUI()`, `showLockedMessage()`
    y `lockReqText()`.
  - `game.js`: las 17 condiciones `encounter_*` de
    `ACHIEVEMENT_CONDITIONS` se generan ahora en un bucle a partir de
    `ENCOUNTER_CONDITION_IDS`, en vez de estar repetidas a mano.

### Eliminado
- `game.js`: eliminado el stub vacío `stopRoundTimer()` (ya no hacía
  nada desde que se quitó el cronómetro visual) y sus dos llamadas en
  `game.js` (`handleAnswer`) y `ui.js` (`showScreen`). Sin cambio de
  comportamiento. Actualizados también los comentarios de cabecera de
  `ui.js` y `PROJECT.md` que lo mencionaban como ejemplo.

### Cambiado
- `i18n.js` (diccionario `I18N.en`, claves `song.*`): añadida la
  traducción al nombre oficial en inglés para el resto de canciones
  del catálogo `songs` (`game.js`) que aún no la tenían — hasta ahora
  solo estaban Kanto y Johto. Se han añadido Hoenn, Sinnoh, Teselia,
  Kalos, Alola, Combate y las categorías de Minijuegos (Laboratorios,
  Bicicletas/Montura, Centro Pokémon, Surf, Pokémon Colosseum/XD,
  Pokémon Ranger, Pantallas de Título y Openings del Anime). `game.js`
  **no se toca**: `song.title` sigue siendo el nombre oficial en
  español (es la clave interna que usa `songDisplayName()` vía
  `tData()` para buscar la traducción, y la que se compara al generar
  las opciones de respuesta). Con el idioma en Español se sigue
  viendo el nombre español de siempre; con Inglés, el nuevo nombre
  inglés.
  Quedan sin traducir (se seguirán mostrando en español aunque el
  idioma sea inglés) los nombres propios que coinciden en ambos
  idiomas (Arceus, Giratina, N, los distintos Team, Lugia, Ho-Oh,
  Entei, Raikou, Suicune...), tres títulos de Combate cuya referencia
  no estaba clara ("Helio", "Aquiles / Magno", "Samina") y todo el
  bloque "Pokémon Mundo Misterioso" — pendientes de revisar a mano.
- `i18n.js`: corregidas dos claves `song.*` de Johto que ya existían
  y no coincidían con la localización oficial: `"Ciudad Orquídea"`
  apuntaba a "Olivine City" y ahora apunta a **Cianwood City**
  (Olivine City es "Ciudad Olivo", clave usada aparte en `Faro Ciudad
  Olivo`); `"Faro Ciudad Olivo"` apuntaba a "Glitter Lighthouse" y
  ahora apunta a **Olivine Lighthouse**.

### Cambiado
- **Crédito de la pantalla de Ajustes**: pasa de "Creado por @waizwidou"
  a "Creado por @RadioTrigalFM".
  - `index.html`: cambio de texto en la tarjeta de Ajustes.

### Añadido
- **Openings del Anime** se añade a la lista de categorías de Minijuegos
  que aparece en la Guía de Juego (faltaba, aunque la categoría ya
  existía y era jugable desde el menú de Minijuegos).
  - `index.html`/`i18n.js`: se añade "Openings del Anime" ("Anime
    Openings" en la traducción al inglés) a la enumeración de
    `guide.modes.minigames.desc` (sección "🕹️ Minijuegos") y de
    `guide.achievements.minigames.desc` (sección "🕹️ Categorías de
    Minijuegos"), en el mismo punto en que ya aparecía en
    `guide.sonidex.organization`.

## [0.1.0] — 2026-08-03 — Línea base documentada

Primera fotografía del proyecto en el momento de crear su
documentación (`PROJECT.md`, `CLAUDE.md`, este `CHANGELOG.md`).
Resumen del estado funcional en este punto:

### Añadido
- Estructura de 7 archivos: `index.html`, `styles.css`, `storage.js`,
  `audio.js`, `pokemon.js`, `ui.js`, `game.js`.
- 5 modos de juego principales: Fácil, Normal, Difícil, Combate y
  Desafío Infinito.
- Modo Historia: recorrido por 7 regiones (Kanto → Alola), cada una con
  fase de región (10 rondas) + fase de combate (3 rondas).
- Minijuegos: 8 categorías temáticas de 5 rondas cada una.
- Sistema de puntuación por velocidad de respuesta (20–100 pts) con
  multiplicador de racha (hasta x2 en racha 11+).
- Sistema de vidas (corazones) con recarga por región en Modo Historia.
- Perfil de jugador: nombre, avatar (catálogo de 20 avatares) y XP con
  sistema de niveles.
- Sistema de logros con condiciones de desbloqueo y desbloqueo de
  contenido (modos, minijuegos, Pokémon de fondo) ligado a logros
  concretos.
- Sonidex: colección de canciones que se desbloquean tras acertarlas
  10 veces (excepto en Modo Fácil).
- Sistema de Eventos Pokémon (módulo `PokeEvents` en `pokemon.js`):
  ~16 eventos con efectos visuales/de audio/de juego distintos
  (Gengar, Hypno, Weezing, Porygon, Jigglypuff, Electrode, Blastoise,
  Venusaur, Shiny, etc.), activos en Modo Historia y, tras completarlo,
  también en Desafío Infinito.
- Persistencia en `localStorage` de ajustes, perfil y logros/
  estadísticas (`storage.js`).
- Fondo animado (cielo, nubes, colinas con Pokémon paseando) y
  visualizador de forma de onda del audio en reproducción.
- Panel de depuración temporal para forzar Eventos Pokémon (pendiente
  de eliminar antes de una versión de producción — ver `CLAUDE.md`).

### Pendiente / conocido
- El array `songs[]` en `game.js` usa rutas de ejemplo
  (`songs/...`, `images/...`) que deben sustituirse/completarse por los
  archivos reales del proyecto.
- El botón/panel de depuración "Forzar evento" sigue presente en
  `index.html`, `pokemon.js` y `game.js`, marcado explícitamente como
  temporal.

---

_Añade aquí nuevas entradas por encima de esta línea, con la versión y
fecha correspondientes, cada vez que se haga un cambio funcional en el
proyecto._
