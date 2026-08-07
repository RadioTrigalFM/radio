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

### Corregido
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
