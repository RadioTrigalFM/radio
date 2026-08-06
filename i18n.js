/* ══════════════════════════════════════════════════════════════════════
   RADIO TRIGAL FM — IDIOMA DE LOS MENÚS (i18n.js)
   ══════════════════════════════════════════════════════════════════════
   Único fichero que sabe **en qué idioma está escrito cada texto de la
   interfaz** y cómo pasar de uno a otro. Solo cubre los MENÚS y la
   estructura de la interfaz (pantallas de navegación, botones, ajustes,
   cabeceras, overlays de confirmación/resultado...) y los nombres de
   región que se le muestran al jugador. A propósito NO traduce el resto
   de contenido de datos del juego: descripciones de logros y Eventos
   Pokémon (game.js/pokemon.js), la Guía de Juego (`#screen-guide` en
   index.html), ni títulos de canciones — todo eso sigue solo en
   español.

   Este fichero no decide nada de reglas de juego ni pinta directamente
   nada complejo: solo expone `t(key, vars)` (traduce una clave),
   `tData(key, defaultText, vars)` (traduce, si existe traducción, un
   texto que vive como valor por defecto en otro fichero) y
   `regionDisplayName(region)` (traduce, si existe traducción, el
   nombre de una región — p. ej. "Teselia" → "Unova" en inglés), más
   `applyTranslations()` (aplica el idioma actual a todo el marcado
   estático de index.html) y `setLanguage(lang)` para cambiarlo. El
   resto de ficheros (ui.js/game.js) llaman a estas funciones cuando
   generan a mano un texto que antes estaba en español "a pelo", en vez
   de duplicar las cadenas. Importante: la clave interna de cada región
   (`REGIONS`/`REGION_META` en game.js, el campo `region` de cada
   canción, `localStorage`...) NUNCA pasa por `regionDisplayName()` —
   solo el texto que ve el jugador.

   Se carga justo después de `storage.js` (necesita leer/guardar
   `settings.language`) y antes de `audio.js`/`pokemon.js`/`ui.js`/
   `game.js`, que son quienes llaman a `t()`.
   ══════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
//  🌐 DICCIONARIO DE TEXTOS
// ═══════════════════════════════════════════════
// Cada clave usada en index.html (atributo data-i18n="...") o en una
// llamada a t("...") desde ui.js/game.js debe existir en AMBOS idiomas.
const I18N = {
  es: {
    "splash.tap": "Toca la pantalla para empezar",

    "common.close": "Cerrar",
    "common.trainerDefault": "Entrenador",

    "profileSetup.title": "¡Bienvenido, entrenador!",
    "profileSetup.desc": "Antes de empezar, elige tu nombre de entrenador y tu imagen de perfil.",
    "profileSetup.namePlaceholder": "Tu nombre de entrenador",
    "profileSetup.avatarLabel": "Elige tu imagen de perfil",
    "profileSetup.confirm": "✔ ¡Empezar a jugar!",

    "profile.editNameTitle": "Cambiar nombre",
    "profile.changeAvatarBtn": "🖼️ Cambiar imagen de perfil",
    "profile.levelLabel": "Nivel",
    "profile.xpLabel": "{into} / {need} XP para el nivel {next}",

    "profile.stats.title": "Estadísticas",
    "profile.stats.totalPoints": "💰 Puntos totales",
    "profile.stats.achievementsUnlocked": "🏅 Logros desbloqueados",
    "profile.stats.gamesPlayed": "🎮 Partidas jugadas",
    "profile.stats.correctAnswers": "✅ Respuestas correctas",
    "profile.stats.bestStreak": "🔥 Mejor racha",
    "profile.stats.infiniteRecord": "♾️ Récord Desafío Infinito",
    "profile.stats.storyRecord": "📖 Récord Modo Historia",
    "profile.stats.perfectGames": "🎯 Partidas perfectas",
    "common.pts": "pts",

    "lock.badge": "Bloqueado",
    "lock.levelReqBadge": "Se desbloquea al alcanzar el nivel {level} de perfil",
    "lock.achievementReqBadge": "Desbloquea con el logro «{title}»",
    "lock.levelReqToast": "Alcanza el nivel {level} de perfil para desbloquear",
    "lock.achievementReqToast": "Consigue «{title}» para desbloquear",
    "avatar.lockedTitle": "{name} (bloqueado — requiere {req})",
    "avatar.lockedToast": "Consigue {req} para desbloquear este avatar",

    "streaks.easyMode": "Modo fácil",
    "streaks.hardMode": "Modo difícil",
    "streaks.combatMode": "Modo combate",
    "streaks.infiniteMode": "Desafío infinito",
    "streaks.normalByRegion": "Modo normal · por región",
    "streaks.easyLabel": "🟢 Fácil",
    "streaks.hardLabel": "🔴 Difícil",
    "streaks.combatLabel": "⚔️ Combate",
    "streaks.infiniteLabel": "♾️ Desafío",

    "ach.starBadgeTooltip": "Desbloquea una función especial",
    "ach.unlockedOn": "Desbloqueado el {date}",

    "story.regionCompleted": "{region} Completado",

    "header.back": "Atrás",
    "header.points": "Puntos",
    "header.round": "Ronda",
    "header.streak": "Racha",

    "home.tagline": "Tu emisora Pokémon",
    "home.play.title": "Jugar",
    "home.play.desc": "5 modos y Minijuegos",
    "home.story.title": "Modo Historia",
    "home.story.desc": "Recorre todas las regiones, de Kanto a Alola",
    "home.achievements.title": "Logros",
    "home.sonidex.title": "Sonidex",
    "home.leaderboard.title": "Clasificaciones",
    "home.options.title": "Opciones",
    "home.achSummaryDefault": "Consulta tus logros desbloqueados",
    "home.sonidexSummaryDefault": "Desbloquea canciones acertándolas 10 veces",

    "modes.easy.title": "Modo Fácil",
    "modes.easy.desc": "Solo adivina la región (Kanto, Johto, …)",
    "modes.normal.title": "Modo Normal",
    "modes.normal.desc": "Primero elige región, luego adivina la canción",
    "modes.hard.title": "Modo Difícil",
    "modes.hard.desc": "6 opciones · canciones de cualquier juego · 10s por ronda",
    "modes.combat.title": "Modo Combate",
    "modes.combat.desc": "6 opciones · Adivina las canciones de combate",
    "modes.infinite.title": "Modo Desafío Infinito",
    "modes.infinite.desc": "6 opciones · Rondas sin límite · un fallo termina la partida",
    "modes.other.title": "Minijuegos",
    "modes.other.desc": "Laboratorios · Bicicleta · Otras Sagas",

    "region.title": "Modo Normal",
    "region.subtitle": "Elige una región. Las canciones y respuestas serán solo de esa región.",

    "other.title": "Minijuegos",
    "other.subtitle": "Selecciona una categoría. Solo sonarán canciones de esa opción.",
    "other.centro.title": "Centro Pokémon",
    "other.centro.desc": "Solo canciones y opciones de Centro Pokémon",
    "other.lab.title": "Laboratorios",
    "other.lab.desc": "Solo canciones y opciones de Laboratorios",
    "other.bike.title": "Bicicletas",
    "other.bike.desc": "Solo canciones y opciones de Bicicletas",
    "other.surf.title": "Surf",
    "other.surf.desc": "Solo canciones y opciones de Surf",
    "other.titlescreens.title": "Pantallas de Título",
    "other.titlescreens.desc": "Solo canciones y opciones de Pantallas de Título",
    "other.openinganime.title": "Openings del Anime",
    "other.openinganime.desc": "Solo canciones y opciones de Openings del Anime",
    "other.mysterydungeon.title": "Pokémon Mundo Misterioso",
    "other.mysterydungeon.desc": "Solo canciones y opciones de Mundo Misterioso",
    "other.colosseum.title": "Pokémon Colosseum / XD",
    "other.colosseum.desc": "Solo canciones y opciones de Colosseum/XD",
    "other.ranger.title": "Pokémon Ranger",
    "other.ranger.desc": "Solo canciones y opciones de Ranger",

    // Openings del Anime: pantalla previa de selección de doblaje (solo se
    // muestra jugando en español — ver el listener de [data-other] en game.js).
    "openingsLang.title": "Openings del Anime",
    "openingsLang.subtitle": "¿Con qué doblaje quieres las canciones?",
    "openingsLang.spain.title": "Español de España",
    "openingsLang.spain.desc": "Los openings tal y como se emitieron en España",
    "openingsLang.latino.title": "Español Latino",
    "openingsLang.latino.desc": "Los openings con el doblaje latinoamericano",

    "options.title": "Opciones",
    "options.subtitle": "Ajusta el audio y la apariencia.",
    "options.music.label": "Música",
    "options.music.desc": "Volumen de la canción",
    "options.sfx.label": "Efectos de sonido",
    "options.sfx.desc": "Volumen de acierto/error",
    "options.dark.label": "Modo Oscuro",
    "options.dark.desc": "Interfaz más oscura para poca luz",
    "options.toggleOn": "Activado",
    "options.toggleOff": "Desactivado",
    "options.saveNote": "💾 Estas opciones se guardan automáticamente.",
    "options.graphics.title": "🖼️ Opciones gráficas",
    "options.bg.label": "Fondo animado",
    "options.bg.desc": "Cielo, nubes y Pokémon caminando de fondo",
    "options.particles.label": "Efectos de partículas",
    "options.particles.desc": "Estrellas y chispas al acertar o desbloquear logros",
    "options.language.title": "🌐 Idioma",
    "options.language.desc": "Idioma de los menús, logros, Eventos Pokémon y Guía de Juego (los títulos de las canciones siguen en español)",
    "options.language.es": "Español",
    "options.language.en": "English",
    "options.guide.label": "📘 Guía de Juego",
    "options.guide.desc": "Modos, puntuación, logros y Sonidex explicados",

    "guide.header.title": "📘 Guía de Juego",
    "guide.header.subtitle": "Todo lo que necesitas saber para dominar Radio Trigal FM.",
    "guide.modes.title": "🎮 Modos de juego",
    "guide.modes.easy.title": "🟢 Modo Fácil",
    "guide.modes.easy.desc": "Suena una canción y solo tienes que acertar de qué <b>región</b> es (Kanto, Johto, Hoenn…). Es el modo más sencillo: ideal para empezar. Las partidas duran 10 rondas; fallar no te elimina, solo corta tu racha, así que siempre juegas las 10 rondas completas.",
    "guide.modes.normal.title": "🔵 Modo Normal",
    "guide.modes.normal.desc": "Primero eliges una región y después tienes que adivinar el <b>título exacto</b> de la canción entre varias opciones de esa misma región. 10 rondas; como en Fácil, fallar no termina la partida, solo corta tu racha.",
    "guide.modes.hard.title": "🔴 Modo Difícil",
    "guide.modes.hard.desc": "Las canciones pueden ser de <b>cualquier región</b>, se eligen entre 6 opciones y solo dispones de 10 segundos por ronda para responder. 10 rondas, sin eliminación por fallo. Se desbloquea al alcanzar el <b>nivel 5 de perfil</b>.",
    "guide.modes.battle.title": "⚔️ Modo Combate",
    "guide.modes.battle.desc": "Igual que el Difícil pero solo con música de combate (entrenadores, líderes, rivales…), también con 6 opciones. Se desbloquea al alcanzar el <b>nivel 8 de perfil</b>.",
    "guide.modes.infinite.title": "♾️ Modo Desafío Infinito",
    "guide.modes.infinite.desc": "Rondas sin límite con 6 opciones: la partida sigue mientras vayas acertando y termina en el primer fallo (normalmente no hay vidas de refuerzo). Cuanto más avances, más difícil y emocionante se vuelve. Se desbloquea con el logro «Viajero regional». Al completar el Modo Historia, además, pueden aparecer los Eventos Pokémon especiales también en este modo.",
    "guide.modes.story.title": "📖 Modo Historia",
    "guide.modes.story.desc": "Recorre todas las regiones en orden, de Kanto a Alola. En cada región juegas una fase de 10 rondas normales y, después, una fase de combate de 3 rondas contra un \"enemigo poderoso\". Aquí sí hay vidas ❤️: se recargan a 3 al empezar cada región y, al perderlas todas, termina la partida. La puntuación y la racha se acumulan durante todo el recorrido.",
    "guide.modes.minigames.title": "🕹️ Minijuegos",
    "guide.modes.minigames.desc": "Partidas cortas centradas en una categoría concreta: Centros Pokémon, Laboratorios, Bicicletas, Surf, Pantallas de Título, Pokémon Mundo Misterioso, Pokémon Colosseum/XD y Pokémon Ranger. La mayoría dura 5 rondas, salvo Pokémon Mundo Misterioso, que dura 10. Al igual que Fácil/Normal/Difícil/Combate, fallar no te elimina. Cada categoría se desbloquea al conseguir un logro concreto o al alcanzar un nivel de perfil determinado, según la categoría (puedes ver cuál en la propia pantalla de Minijuegos).",
    "guide.scoring.title": "🏆 Sistema de puntuación",
    "guide.scoring.speed.title": "⏱️ Velocidad de respuesta",
    "guide.scoring.speed.desc": "Cada acierto da entre 20 y 100 puntos base según lo rápido que respondas: cuanto antes contestes, más puntos consigues. A partir de 15 segundos, el acierto ya solo otorga el mínimo garantizado (20 pts).",
    "guide.scoring.streak.title": "🔥 Multiplicador de racha",
    "guide.scoring.streak.desc": "Encadenar aciertos aumenta tus puntos: desde la 2ª respuesta correcta seguida el multiplicador sube un x0.1 por cada racha (racha 2 = x1.1, racha 3 = x1.2…) hasta un tope de x2 a partir de una racha de 11.",
    "guide.scoring.lives.title": "❤️ Vidas",
    "guide.scoring.lives.desc": "Solo el Modo Historia tiene corazones desde el principio (3, y se recargan al pasar de región): cada fallo resta uno y, al perderlos todos, termina la partida. En Fácil, Normal, Difícil, Combate y Minijuegos no hay vidas: fallar solo corta la racha y siempre juegas la partida completa. El Desafío Infinito tampoco tiene vidas por defecto —cualquier fallo la acaba al instante—, salvo que el evento Venusaur te conceda alguna durante la partida.",
    "guide.achievements.title": "🏅 Logros y contenido desbloqueable",
    "guide.achievements.intro": "Puedes consultar todos tus logros en la pantalla de Logros, agrupados en 5 bloques: Progreso y rachas, Maestría y partidas perfectas, Sonidex, Modo Historia y Eventos Pokémon. Los logros marcados con una ⭐ desbloquean, además de la insignia, alguna función nueva:",
    "guide.achievements.modes.title": "🎮 Modos de juego",
    "guide.achievements.modes.desc": "El Modo Difícil se desbloquea al alcanzar el nivel 5 de perfil y el Modo Combate al alcanzar el nivel 8; el Desafío Infinito se desbloquea con el logro «Viajero regional» (jugar en todas las regiones).",
    "guide.achievements.minigames.title": "🕹️ Categorías de Minijuegos",
    "guide.achievements.minigames.desc": "Cada categoría de Minijuegos (Centros Pokémon, Laboratorios, Bicicletas, Surf, Pantallas de Título, Mundo Misterioso, Colosseum/XD, Ranger) se desbloquea al alcanzar un nivel de perfil concreto o al conseguir un logro concreto, según la categoría, indicado con un 🔒 en el botón mientras siga bloqueada.",
    "guide.achievements.events.title": "✨ Eventos Pokémon",
    "guide.achievements.events.desc": "Al completar el Modo Historia («Maestro de la Historia») se desbloquean los Eventos Pokémon sorpresa (Gengar, Hypno, Shiny, Porygon, Electrode, Blastoise, Venusaur…) también en el Desafío Infinito. Los logros de \"encuentro\" (por ejemplo, hacer aparecer 5 veces a un Pokémon) desbloquean, uno a uno, que ese Pokémon pueda pasear por el fondo del menú, y también el avatar de perfil de ese Pokémon. Si sigues haciéndolo aparecer hasta 20 veces, su Pokémon de las colinas pasa a lucir su sprite shiny (el propio Caterpie Shiny evoluciona ahí a un Metapod Shiny).",
    "guide.achievements.sonidex.title": "🎼 Fichas de la Sonidex",
    "guide.achievements.sonidex.desc": "Además de logros individuales por número de fichas desbloqueadas (5, 10, 20, 50, 100, 200) y por completar la Sonidex de cada región, cada acierto que suma para desbloquear una ficha también cuenta para tus logros de aciertos totales (como «Melómano»), y algunos de esos logros abren categorías de Minijuegos.",
    "guide.sonidex.title": "🎼 Sonidex",
    "guide.sonidex.intro": "La Sonidex es tu colección de canciones. Cada canción tiene una ficha bloqueada 🔒 hasta que la aciertas <b>10 veces</b> en cualquier modo excepto el Fácil (en el que solo se adivina la región, no la canción). Al desbloquear una ficha podrás reproducir esa canción libremente desde la propia Sonidex.",
    "guide.sonidex.organization": "Las fichas están organizadas por región (Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos y Alola), Música de Combate y todas las categorías de Minijuegos (Centros Pokémon, Laboratorios, Bicicletas, Surf, Pantallas de Título, Openings del Anime, Pokémon Mundo Misterioso, Pokémon Colosseum/XD y Pokémon Ranger). La barra de progreso y el contador «X / Y canciones desbloqueadas» tienen en cuenta absolutamente todas las canciones del juego.",
    "guide.sonidex.cities.title": "🏙️ ¿Por qué no aparecen todas las ciudades?",
    "guide.sonidex.cities.desc": "Algunas ciudades comparten exactamente la misma melodía dentro del juego original, así que en la Sonidex solo aparece una ficha para representarlas y no una por cada ciudad. Por ejemplo, Ciudad Azulona y Ciudad Fucsia suenan con la misma canción, por lo que comparten una única ficha en lugar de tener una cada una.",
    "guide.profile.title": "🧑‍🎤 Perfil, experiencia y avatares",
    "guide.profile.xp.title": "📈 Experiencia y nivel",
    "guide.profile.xp.desc": "Todos los puntos que ganas jugando (aciertos, rachas, eventos especiales…) se suman también como experiencia de tu perfil. Al acumular suficiente experiencia subes de nivel, y cada nivel necesita algo más que el anterior. Subir de nivel es lo que va desbloqueando, poco a poco, el Modo Difícil, el Modo Combate, varias categorías de Minijuegos y algunos avatares (mira los requisitos exactos en cada pantalla de desbloqueo).",
    "guide.profile.avatars.title": "🖼️ Avatares",
    "guide.profile.avatars.desc": "Puedes personalizar tu perfil eligiendo un avatar entre un catálogo muy amplio de Pokémon. Muchos están disponibles desde el principio; el resto se va desbloqueando al subir de nivel, al conseguir logros de \"encuentro\" con un Pokémon de un Evento Pokémon (5 apariciones), o al completar una partida perfecta en ciertos modos y minijuegos. Toca tu avatar en la barra de perfil para cambiarlo o para cambiar tu nombre de jugador.",
    "guide.leaderboard.title": "🏆 Clasificación Global",
    "guide.leaderboard.intro": "Desde el botón 🏆 de la pantalla principal puedes consultar tres tablas de clasificación online, con los mejores jugadores del mundo: nivel de perfil, mejor puntuación en Desafío Infinito y mejor puntuación en Modo Historia.",
    "guide.leaderboard.update": "Tu puesto se actualiza en automático cada vez que superas tu propio récord anterior en alguna de esas tres categorías; no hace falta enviarlo a mano. Apareces con el nombre y el avatar de tu perfil, así que si quieres identificarte en la clasificación, personalízalos desde la barra de perfil.",

    "achievements.title": "🏅 Logros",
    "achievements.streaksTitle": "🔥 Rachas máximas",
    "achievements.progress": "{n} / {total} desbloqueados",

    "sonidex.title": "🎼 Sonidex",
    "sonidex.note": "🔓 Acierta una misma canción 10 veces (en cualquier modo excepto el Fácil) para desbloquear su ficha.",
    "sonidex.progress": "{n} / {total} canciones desbloqueadas",
    "sonidex.progressShort": "{n} / {total} desbloqueadas",

    "leaderboard.title": "🏆 Clasificaciones",
    "leaderboard.subtitle": "Los 50 mejores de cada categoría",
    "leaderboard.yourRecords": "🙋 Tus récords",
    "leaderboard.level": "🧑 Nivel de Jugador",
    "leaderboard.infinite": "♾️ Desafío Infinito",
    "leaderboard.story": "📖 Modo Historia",
    "leaderboard.top50": "🌍 Top 50 global",
    "leaderboard.tab.level": "🧑 Nivel",
    "leaderboard.tab.infinite": "♾️ Infinito",
    "leaderboard.tab.story": "📖 Historia",
    "leaderboard.loading": "Cargando clasificación…",
    "leaderboard.error": "⚠️ No se ha podido cargar la clasificación. Inténtalo más tarde.",
    "leaderboard.empty": "Todavía no hay clasificación global disponible.",

    "quiz.loading": "Cargando…",
    "quiz.hint": "👁️ Pista visual",
    "quiz.hintUsed": "👁️ Pista usada",
    "quiz.hintCost": "-50% puntos",
    "quiz.next": "▶ Siguiente Ronda",
    "quiz.modeEasy": "Modo: Fácil · Adivina la región",
    "quiz.modeHard": "Modo: Difícil · 6 opciones · 10s por ronda",
    "quiz.modeInfinite": "Modo: Desafío Infinito · 6 opciones · Un fallo termina la partida",
    "quiz.modeCombat": "Modo: Combate · 6 opciones",
    "quiz.modeNormalRegion": "Modo: Normal · Región: {region}",
    "quiz.modeOther": "Modo: Minijuegos · {game}",
    "quiz.modeStoryEnemy": "📖 Modo Historia · ⚔️ Enemigo poderoso",
    "quiz.modeStoryRegion": "📖 Modo Historia · Región: {region}",
    "quiz.questionRegion": "🌍 ¿A qué región pertenece esta canción?",
    "quiz.questionSong": "🎶 ¿Qué canción está sonando?",
    "quiz.playing": "▶ Reproduciendo...",
    "quiz.tapToPlay": "▶ Toca la pantalla para reproducir",
    "quiz.chanseySecondChance": "💗 ¡Chansey te da otra oportunidad!",

    "result.title": "¡Fin del juego!",
    "result.scoreLabel": "Puntuación:",
    "result.restart": "🔄 Jugar de nuevo",
    "result.exit": "🚪 Salir",
    "result.attempt": "¡Buen intento!",
    "result.master": "¡Maestro Pokémon!",
    "result.great": "¡Muy bien!",
    "result.good": "¡Buen trabajo!",
    "result.infiniteScore": "{n} rondas superadas · 💰 {score} pts",
    "result.roundsScore": "{n} / {total} · 💰 {score} pts",

    "confirm.leaveStoryTitle": "¿Salir del Modo Historia?",
    "confirm.leaveStoryBody": "Si sales ahora perderás el progreso de esta partida.<br>La próxima vez tendrás que empezar de nuevo desde Kanto.",
    "confirm.keepPlaying": "🎮 Seguir jugando",
    "confirm.leaveAnyway": "🚪 Salir igualmente",

    "toast.levelUpLabel": "Subida de nivel",
    "toast.levelUpTitle": "¡Subiste al nivel {n}!",
    "toast.modeUnlockedLabel": "Modo desbloqueado",
    "toast.minigameUnlockedLabel": "Minijuego desbloqueado",
    "toast.unlockedTitle": "¡{name} desbloqueado!",
    "toast.avatarUnlockedLabel": "Avatar desbloqueado",
    "toast.newAvatarTitle": "¡Nuevo avatar disponible: {name}!",
    "toast.soundexUnlockedLabel": "Ficha desbloqueada",
    "toast.soundexUnlockedTitle": "¡Ficha desbloqueada en Sonidex!: {title}",
    "toast.featureUnlockedLabel": "Función desbloqueada",
    "toast.pokeEventsUnlockedTitle": "¡Eventos Pokémon desbloqueados en el Desafío Infinito!",
    "toast.newHillEncounterLabel": "Nuevo encuentro",
    "toast.newHillEncounterTitle": "¡{name} ahora pasea por las colinas!",
    "toast.newHillShinyLabel": "Nuevo brillo",
    "toast.newHillShinyTitle": "¡{name} ahora brilla en las colinas!",
    "toast.metapodShinyTitle": "¡Tu Caterpie Shiny de las colinas ha evolucionado a un Metapod Shiny!",
    "toast.achievementUnlockedLabel": "Logro desbloqueado",

    "feature.gameMode": "modo de juego",
    "feature.minigameCategory": "categoría de Minijuegos",
    "feature.pokeEventsInInfinite": "Eventos Pokémon",
    "feature.pokeEventsInInfiniteType": "en el Desafío Infinito",
    "feature.hillPokemon": "Pokémon del fondo",
    "feature.hillPokemonName": "{name} en las colinas",
    "feature.hillPokemonShinyName": "{name} Shiny en las colinas",
    "feature.metapodShinyName": "Metapod Shiny en las colinas",
    "feature.avatarType": "avatar de perfil",
    "feature.avatarName": "Avatar: {name}",
    "feature.avatarGeneric": "un avatar",
    "feature.unlocksLabel": "desbloquea:",

    "story.subtitleMain": "MODO HISTORIA",
    "story.tapStart": "Toca la pantalla para comenzar",
    "story.enemyTitle": "Ha aparecido un enemigo poderoso",
    "story.subtitleCombat": "COMBATE",
    "story.tapFight": "Toca la pantalla para luchar",
    "story.gameOverTitle": "Game Over",
    "story.gameOverDesc": "Has perdido tus 3 vidas. Vuelve a intentarlo desde Kanto.",
    "story.completeTitle": "¡Modo Historia Completado!",

    // Nombres de región (solo hace falta listar aquí las que difieren
    // del nombre interno usado como clave de datos — ver
    // regionDisplayName más abajo). En español el nombre interno YA es
    // el correcto, así que este idioma no necesita ninguna entrada
    // "region.*".
  },

  en: {
    "splash.tap": "Tap the screen to start",

    "common.close": "Close",
    "common.trainerDefault": "Trainer",

    "profileSetup.title": "Welcome, Trainer!",
    "profileSetup.desc": "Before you start, choose your trainer name and profile picture.",
    "profileSetup.namePlaceholder": "Your trainer name",
    "profileSetup.avatarLabel": "Choose your profile picture",
    "profileSetup.confirm": "✔ Start playing!",

    "profile.editNameTitle": "Change name",
    "profile.changeAvatarBtn": "🖼️ Change profile picture",
    "profile.levelLabel": "Level",
    "profile.xpLabel": "{into} / {need} XP to level {next}",

    "profile.stats.title": "Statistics",
    "profile.stats.totalPoints": "💰 Total points",
    "profile.stats.achievementsUnlocked": "🏅 Achievements unlocked",
    "profile.stats.gamesPlayed": "🎮 Games played",
    "profile.stats.correctAnswers": "✅ Correct answers",
    "profile.stats.bestStreak": "🔥 Best streak",
    "profile.stats.infiniteRecord": "♾️ Endless Challenge record",
    "profile.stats.storyRecord": "📖 Story Mode record",
    "profile.stats.perfectGames": "🎯 Perfect games",
    "common.pts": "pts",

    "lock.badge": "Locked",
    "lock.levelReqBadge": "Unlocks at profile level {level}",
    "lock.achievementReqBadge": "Unlocks with the “{title}” achievement",
    "lock.levelReqToast": "Reach profile level {level} to unlock",
    "lock.achievementReqToast": "Get “{title}” to unlock",
    "avatar.lockedTitle": "{name} (locked — requires {req})",
    "avatar.lockedToast": "Get {req} to unlock this avatar",

    "streaks.easyMode": "Easy mode",
    "streaks.hardMode": "Hard mode",
    "streaks.combatMode": "Battle mode",
    "streaks.infiniteMode": "Endless Challenge",
    "streaks.normalByRegion": "Normal mode · by region",
    "streaks.easyLabel": "🟢 Easy",
    "streaks.hardLabel": "🔴 Hard",
    "streaks.combatLabel": "⚔️ Battle",
    "streaks.infiniteLabel": "♾️ Challenge",

    "ach.starBadgeTooltip": "Unlocks a special feature",
    "ach.unlockedOn": "Unlocked on {date}",

    "story.regionCompleted": "{region} Completed",

    "header.back": "Back",
    "header.points": "Points",
    "header.round": "Round",
    "header.streak": "Streak",

    "home.tagline": "Your Pokémon radio station",
    "home.play.title": "Play",
    "home.play.desc": "5 modes and Minigames",
    "home.story.title": "Story Mode",
    "home.story.desc": "Journey through every region, from Kanto to Alola",
    "home.achievements.title": "Achievements",
    "home.sonidex.title": "Soundex",
    "home.leaderboard.title": "Leaderboards",
    "home.options.title": "Options",
    "home.achSummaryDefault": "Check your unlocked achievements",
    "home.sonidexSummaryDefault": "Unlock songs by guessing them 10 times",

    "modes.easy.title": "Easy Mode",
    "modes.easy.desc": "Just guess the region (Kanto, Johto, …)",
    "modes.normal.title": "Normal Mode",
    "modes.normal.desc": "Pick a region first, then guess the song",
    "modes.hard.title": "Hard Mode",
    "modes.hard.desc": "6 options · songs from any game · 10s per round",
    "modes.combat.title": "Battle Mode",
    "modes.combat.desc": "6 options · Guess the battle songs",
    "modes.infinite.title": "Endless Challenge",
    "modes.infinite.desc": "6 options · No round limit · one mistake ends the run",
    "modes.other.title": "Minigames",
    "modes.other.desc": "Labs · Bicycle · Other Sagas",

    "region.title": "Normal Mode",
    "region.subtitle": "Choose a region. Songs and answers will only be from that region.",

    "other.title": "Minigames",
    "other.subtitle": "Pick a category. Only songs from that option will play.",
    "other.centro.title": "Pokémon Center",
    "other.centro.desc": "Only Pokémon Center songs and options",
    "other.lab.title": "Labs",
    "other.lab.desc": "Only Lab songs and options",
    "other.bike.title": "Bicycles",
    "other.bike.desc": "Only Bicycle songs and options",
    "other.surf.title": "Surf",
    "other.surf.desc": "Only Surf songs and options",
    "other.titlescreens.title": "Title Screens",
    "other.titlescreens.desc": "Only Title Screen songs and options",
    "other.openinganime.title": "Anime Openings",
    "other.openinganime.desc": "Only Anime Opening songs and options",
    "other.mysterydungeon.title": "Pokémon Mystery Dungeon",
    "other.mysterydungeon.desc": "Only Mystery Dungeon songs and options",
    "other.colosseum.title": "Pokémon Colosseum / XD",
    "other.colosseum.desc": "Only Colosseum/XD songs and options",
    "other.ranger.title": "Pokémon Ranger",
    "other.ranger.desc": "Only Ranger songs and options",

    // Anime Openings pre-screen (dub choice). In practice only reachable when
    // playing in Spanish (see the [data-other] listener in game.js), but kept
    // translated too since every data-i18n key must exist in both languages.
    "openingsLang.title": "Anime Openings",
    "openingsLang.subtitle": "Which dub do you want the songs in?",
    "openingsLang.spain.title": "European Spanish",
    "openingsLang.spain.desc": "The openings as aired in Spain",
    "openingsLang.latino.title": "Latin American Spanish",
    "openingsLang.latino.desc": "The openings with the Latin American dub",

    "options.title": "Options",
    "options.subtitle": "Adjust audio and appearance.",
    "options.music.label": "Music",
    "options.music.desc": "Song volume",
    "options.sfx.label": "Sound effects",
    "options.sfx.desc": "Correct/wrong answer volume",
    "options.dark.label": "Dark Mode",
    "options.dark.desc": "Darker interface for low light",
    "options.toggleOn": "On",
    "options.toggleOff": "Off",
    "options.saveNote": "💾 These options are saved automatically.",
    "options.graphics.title": "🖼️ Graphics options",
    "options.bg.label": "Animated background",
    "options.bg.desc": "Sky, clouds and walking Pokémon in the background",
    "options.particles.label": "Particle effects",
    "options.particles.desc": "Stars and sparks on correct answers or achievements",
    "options.language.title": "🌐 Language",
    "options.language.desc": "Language for menus, achievements, Pokémon Events and the Game Guide (song titles stay in Spanish)",
    "options.language.es": "Español",
    "options.language.en": "English",
    "options.guide.label": "📘 Game Guide",
    "options.guide.desc": "Modes, scoring, achievements and Soundex explained",

    "guide.header.title": "📘 Game Guide",
    "guide.header.subtitle": "Everything you need to know to master Radio Trigal FM.",
    "guide.modes.title": "🎮 Game modes",
    "guide.modes.easy.title": "🟢 Easy Mode",
    "guide.modes.easy.desc": "A song plays and you just have to guess which <b>region</b> it's from (Kanto, Johto, Hoenn…). It's the simplest mode: perfect for getting started. Games last 10 rounds; a wrong answer doesn't eliminate you, it just breaks your streak, so you always play the full 10 rounds.",
    "guide.modes.normal.title": "🔵 Normal Mode",
    "guide.modes.normal.desc": "First you pick a region, then you have to guess the <b>exact title</b> of the song among several options from that same region. 10 rounds; like in Easy, a wrong answer doesn't end the game, it just breaks your streak.",
    "guide.modes.hard.title": "🔴 Hard Mode",
    "guide.modes.hard.desc": "Songs can be from <b>any region</b>, chosen among 6 options, and you only have 10 seconds per round to answer. 10 rounds, no elimination on a wrong answer. Unlocked at <b>profile level 5</b>.",
    "guide.modes.battle.title": "⚔️ Battle Mode",
    "guide.modes.battle.desc": "Same as Hard but only with battle music (trainers, gym leaders, rivals…), also with 6 options. Unlocked at <b>profile level 8</b>.",
    "guide.modes.infinite.title": "♾️ Infinite Challenge Mode",
    "guide.modes.infinite.desc": "Unlimited rounds with 6 options: the game continues as long as you keep answering correctly and ends on the first wrong answer (there are normally no bonus lives). The further you get, the harder and more exciting it becomes. Unlocked with the «Regional Traveler» achievement. After completing Story Mode, the special Pokémon Events can also appear in this mode.",
    "guide.modes.story.title": "📖 Story Mode",
    "guide.modes.story.desc": "Travel through every region in order, from Kanto to Alola. In each region you play a 10-round normal phase and then a 3-round battle phase against a \"powerful enemy\". This mode does have lives ❤️: they recharge to 3 at the start of each region, and losing them all ends the game. Score and streak carry over across the whole journey.",
    "guide.modes.minigames.title": "🕹️ Minigames",
    "guide.modes.minigames.desc": "Short games focused on one specific category: Pokémon Centers, Labs, Bicycles, Surfing, Title Screens, Pokémon Mystery Dungeon, Pokémon Colosseum/XD and Pokémon Ranger. Most last 5 rounds, except Pokémon Mystery Dungeon, which lasts 10. Like Easy/Normal/Hard/Battle, a wrong answer doesn't eliminate you. Each category unlocks by earning a specific achievement or reaching a certain profile level, depending on the category (you can check which on the Minigames screen itself).",
    "guide.scoring.title": "🏆 Scoring system",
    "guide.scoring.speed.title": "⏱️ Answer speed",
    "guide.scoring.speed.desc": "Each correct answer gives between 20 and 100 base points depending on how fast you answer: the sooner you answer, the more points you get. From 15 seconds onward, a correct answer only grants the guaranteed minimum (20 pts).",
    "guide.scoring.streak.title": "🔥 Streak multiplier",
    "guide.scoring.streak.desc": "Chaining correct answers boosts your points: from the 2nd correct answer in a row, the multiplier rises by x0.1 per streak (streak 2 = x1.1, streak 3 = x1.2…) up to a cap of x2 from a streak of 11 onward.",
    "guide.scoring.lives.title": "❤️ Lives",
    "guide.scoring.lives.desc": "Only Story Mode has hearts from the start (3, recharging when you move to a new region): each wrong answer removes one, and losing them all ends the game. In Easy, Normal, Hard, Battle and Minigames there are no lives: a wrong answer only breaks your streak and you always play the full game. Infinite Challenge also has no lives by default —any wrong answer ends it instantly— unless the Venusaur event grants you some during the game.",
    "guide.achievements.title": "🏅 Achievements and unlockable content",
    "guide.achievements.intro": "You can check all your achievements on the Achievements screen, grouped into 5 blocks: Progress and streaks, Mastery and perfect games, Sonidex, Story Mode and Pokémon Events. Achievements marked with a ⭐ unlock, besides the badge, some new feature:",
    "guide.achievements.modes.title": "🎮 Game modes",
    "guide.achievements.modes.desc": "Hard Mode unlocks at profile level 5 and Battle Mode at level 8; Infinite Challenge unlocks with the «Regional Traveler» achievement (playing in every region).",
    "guide.achievements.minigames.title": "🕹️ Minigame categories",
    "guide.achievements.minigames.desc": "Each Minigame category (Pokémon Centers, Labs, Bicycles, Surfing, Title Screens, Mystery Dungeon, Colosseum/XD, Ranger) unlocks at a specific profile level or by earning a specific achievement, depending on the category, shown with a 🔒 on the button while still locked.",
    "guide.achievements.events.title": "✨ Pokémon Events",
    "guide.achievements.events.desc": "Completing Story Mode («Story Master») unlocks the surprise Pokémon Events (Gengar, Hypno, Shiny, Porygon, Electrode, Blastoise, Venusaur…) in Infinite Challenge too. The \"encounter\" achievements (for example, making a Pokémon appear 5 times) unlock, one by one, that Pokémon wandering the menu background, as well as that Pokémon's profile avatar. If you keep making it appear up to 20 times, its hill Pokémon switches to its shiny sprite (the Shiny Caterpie itself even evolves there into a Shiny Metapod).",
    "guide.achievements.sonidex.title": "🎼 Sonidex entries",
    "guide.achievements.sonidex.desc": "Besides individual achievements for the number of unlocked entries (5, 10, 20, 50, 100, 200) and for completing each region's Sonidex, every correct answer that counts toward unlocking an entry also counts toward your total correct-answer achievements (like «Music Lover»), and some of those achievements open up Minigame categories.",
    "guide.sonidex.title": "🎼 Sonidex",
    "guide.sonidex.intro": "The Sonidex is your song collection. Each song has a locked 🔒 entry until you get it right <b>10 times</b> in any mode except Easy (where you only guess the region, not the song). Unlocking an entry lets you play that song freely from the Sonidex itself.",
    "guide.sonidex.organization": "Entries are organized by region (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos and Alola), Battle Music and every Minigame category (Pokémon Centers, Labs, Bicycles, Surfing, Title Screens, Anime Openings, Pokémon Mystery Dungeon, Pokémon Colosseum/XD and Pokémon Ranger). The progress bar and the «X / Y songs unlocked» counter take into account absolutely every song in the game.",
    "guide.sonidex.cities.title": "🏙️ Why don't all cities show up?",
    "guide.sonidex.cities.desc": "Some cities share the exact same tune in the original game, so the Sonidex only shows one entry to represent them instead of one per city. For example, Cerulean City and Fuchsia City play the same song, so they share a single entry instead of having one each.",
    "guide.profile.title": "🧑‍🎤 Profile, experience and avatars",
    "guide.profile.xp.title": "📈 Experience and level",
    "guide.profile.xp.desc": "All the points you earn while playing (correct answers, streaks, special events…) also add up as profile experience. Once you gather enough experience you level up, and each level needs a bit more than the last. Leveling up is what gradually unlocks Hard Mode, Battle Mode, several Minigame categories and some avatars (check the exact requirements on each unlock screen).",
    "guide.profile.avatars.title": "🖼️ Avatars",
    "guide.profile.avatars.desc": "You can customize your profile by picking an avatar from a very wide catalog of Pokémon. Many are available from the start; the rest unlock as you level up, by earning \"encounter\" achievements with a Pokémon Event Pokémon (5 appearances), or by completing a perfect game in certain modes and minigames. Tap your avatar in the profile bar to change it or to change your player name.",
    "guide.leaderboard.title": "🏆 Global Leaderboard",
    "guide.leaderboard.intro": "From the 🏆 button on the main screen you can check three online leaderboards with the best players in the world: profile level, best Infinite Challenge score and best Story Mode score.",
    "guide.leaderboard.update": "Your position updates automatically every time you beat your own previous record in any of those three categories; there's no need to submit it by hand. You show up with your profile's name and avatar, so if you want to be recognizable on the leaderboard, customize them from the profile bar.",

    "achievements.title": "🏅 Achievements",
    "achievements.streaksTitle": "🔥 Best streaks",
    "achievements.progress": "{n} / {total} unlocked",

    "sonidex.title": "🎼 Soundex",
    "sonidex.note": "🔓 Guess the same song 10 times (in any mode except Easy) to unlock its entry.",
    "sonidex.progress": "{n} / {total} songs unlocked",
    "sonidex.progressShort": "{n} / {total} unlocked",

    "leaderboard.title": "🏆 Leaderboards",
    "leaderboard.subtitle": "The top 50 of each category",
    "leaderboard.yourRecords": "🙋 Your records",
    "leaderboard.level": "🧑 Player Level",
    "leaderboard.infinite": "♾️ Endless Challenge",
    "leaderboard.story": "📖 Story Mode",
    "leaderboard.top50": "🌍 Global Top 50",
    "leaderboard.tab.level": "🧑 Level",
    "leaderboard.tab.infinite": "♾️ Endless",
    "leaderboard.tab.story": "📖 Story",
    "leaderboard.loading": "Loading leaderboard…",
    "leaderboard.error": "⚠️ Couldn't load the leaderboard. Try again later.",
    "leaderboard.empty": "There's no global leaderboard yet.",

    "quiz.loading": "Loading…",
    "quiz.hint": "👁️ Visual hint",
    "quiz.hintUsed": "👁️ Hint used",
    "quiz.hintCost": "-50% points",
    "quiz.next": "▶ Next Round",
    "quiz.modeEasy": "Mode: Easy · Guess the region",
    "quiz.modeHard": "Mode: Hard · 6 options · 10s per round",
    "quiz.modeInfinite": "Mode: Endless Challenge · 6 options · One mistake ends the run",
    "quiz.modeCombat": "Mode: Battle · 6 options",
    "quiz.modeNormalRegion": "Mode: Normal · Region: {region}",
    "quiz.modeOther": "Mode: Minigames · {game}",
    "quiz.modeStoryEnemy": "📖 Story Mode · ⚔️ Powerful enemy",
    "quiz.modeStoryRegion": "📖 Story Mode · Region: {region}",
    "quiz.questionRegion": "🌍 Which region does this song belong to?",
    "quiz.questionSong": "🎶 What song is playing?",
    "quiz.playing": "▶ Playing...",
    "quiz.tapToPlay": "▶ Tap the screen to play",
    "quiz.chanseySecondChance": "💗 Chansey gives you another chance!",

    "result.title": "Game over!",
    "result.scoreLabel": "Score:",
    "result.restart": "🔄 Play again",
    "result.exit": "🚪 Exit",
    "result.attempt": "Good effort!",
    "result.master": "Pokémon Master!",
    "result.great": "Great job!",
    "result.good": "Nice work!",
    "result.infiniteScore": "{n} rounds cleared · 💰 {score} pts",
    "result.roundsScore": "{n} / {total} · 💰 {score} pts",

    "confirm.leaveStoryTitle": "Leave Story Mode?",
    "confirm.leaveStoryBody": "If you leave now you'll lose this run's progress.<br>Next time you'll have to start over from Kanto.",
    "confirm.keepPlaying": "🎮 Keep playing",
    "confirm.leaveAnyway": "🚪 Leave anyway",

    "toast.levelUpLabel": "Level up",
    "toast.levelUpTitle": "You reached level {n}!",
    "toast.modeUnlockedLabel": "Mode unlocked",
    "toast.minigameUnlockedLabel": "Minigame unlocked",
    "toast.unlockedTitle": "{name} unlocked!",
    "toast.avatarUnlockedLabel": "Avatar unlocked",
    "toast.newAvatarTitle": "New avatar available: {name}!",
    "toast.soundexUnlockedLabel": "Entry unlocked",
    "toast.soundexUnlockedTitle": "Soundex entry unlocked!: {title}",
    "toast.featureUnlockedLabel": "Feature unlocked",
    "toast.pokeEventsUnlockedTitle": "Pokémon Events unlocked in the Endless Challenge!",
    "toast.newHillEncounterLabel": "New encounter",
    "toast.newHillEncounterTitle": "{name} now wanders the hills!",
    "toast.newHillShinyLabel": "New shine",
    "toast.newHillShinyTitle": "{name} now shines on the hills!",
    "toast.metapodShinyTitle": "Your shiny Caterpie on the hills has evolved into a shiny Metapod!",
    "toast.achievementUnlockedLabel": "Achievement unlocked",

    "feature.gameMode": "game mode",
    "feature.minigameCategory": "Minigame category",
    "feature.pokeEventsInInfinite": "Pokémon Events",
    "feature.pokeEventsInInfiniteType": "in the Endless Challenge",
    "feature.hillPokemon": "background Pokémon",
    "feature.hillPokemonName": "{name} on the hills",
    "feature.hillPokemonShinyName": "Shiny {name} on the hills",
    "feature.metapodShinyName": "Shiny Metapod on the hills",
    "feature.avatarType": "profile avatar",
    "feature.avatarName": "Avatar: {name}",
    "feature.avatarGeneric": "an avatar",
    "feature.unlocksLabel": "unlocks:",

    "story.subtitleMain": "STORY MODE",
    "story.tapStart": "Tap the screen to begin",
    "story.enemyTitle": "A powerful enemy has appeared",
    "story.subtitleCombat": "BATTLE",
    "story.tapFight": "Tap the screen to fight",
    "story.gameOverTitle": "Game Over",
    "story.gameOverDesc": "You lost all 3 lives. Try again from Kanto.",
    "story.completeTitle": "Story Mode Complete!",

    // ── Logros (ACHIEVEMENTS en game.js): solo estas claves en
    // inglés, el español ya vive en el propio catálogo (a.title/a.desc)
    // y se usa vía tData() para no duplicarlo — ver la cabecera de este
    // fichero y tData() más abajo. ──
    "achv.first_correct.title": "First correct answer",
    "achv.first_correct.desc": "Get your first correct answer.",
    "achv.streak_3.title": "Nice streak",
    "achv.streak_3.desc": "Reach a streak of 3 correct answers in a row.",
    "achv.streak_5.title": "On a roll",
    "achv.streak_5.desc": "Reach a streak of 5 correct answers in a row.",
    "achv.streak_20.title": "Living legend",
    "achv.streak_20.desc": "Reach a streak of 20 correct answers in a row.",
    "achv.streak_30.title": "Unstoppable streak",
    "achv.streak_30.desc": "Reach a streak of 30 correct answers in a row.",
    "achv.perfect_normal_region.title": "Perfect region",
    "achv.perfect_normal_region.desc": "Complete a perfect run in any region of Normal mode.",
    "achv.perfect_easy.title": "Perfect Easy",
    "achv.perfect_easy.desc": "Complete a perfect run in Easy mode.",
    "achv.hard_correct_8.title": "Challenge cleared",
    "achv.hard_correct_8.desc": "Get 8 or more correct answers in a Hard mode game.",
    "achv.perfect_hard.title": "Musical genius",
    "achv.perfect_hard.desc": "Complete a perfect run in Hard mode.",
    "achv.perfect_regions_normal_5.title": "Regional specialist",
    "achv.perfect_regions_normal_5.desc": "Complete 5 regions in Normal mode with 100% accuracy.",
    "achv.correct_10.title": "Good ear",
    "achv.correct_10.desc": "Answer 10 questions correctly.",
    "achv.correct_20.title": "Trained ear",
    "achv.correct_20.desc": "Answer 20 questions correctly.",
    "achv.correct_50.title": "Music connoisseur",
    "achv.correct_50.desc": "Answer 50 questions correctly.",
    "achv.correct_100.title": "Music lover",
    "achv.correct_100.desc": "Answer 100 questions correctly.",
    "achv.correct_250.title": "Music fanatic",
    "achv.correct_250.desc": "Answer 250 questions correctly.",
    "achv.correct_500.title": "Musical encyclopedia",
    "achv.correct_500.desc": "Answer 500 questions correctly.",
    "achv.games_10.title": "Enthusiast",
    "achv.games_10.desc": "Play 10 games.",
    "achv.games_20.title": "Regular player",
    "achv.games_20.desc": "Play 20 games.",
    "achv.games_30.title": "Dedicated trainer",
    "achv.games_30.desc": "Play 30 games.",
    "achv.games_50.title": "Veteran",
    "achv.games_50.desc": "Play 50 games.",
    "achv.games_100.title": "Pokémon champion",
    "achv.games_100.desc": "Play 100 games.",
    "achv.all_modes.title": "Explorer",
    "achv.all_modes.desc": "Complete at least one game in Easy, Normal and Hard modes.",
    "achv.all_regions.title": "Regional traveler",
    "achv.all_regions.desc": "Complete at least one game in every available region.",
    "achv.perfect_combat.title": "Battle ace",
    "achv.perfect_combat.desc": "Complete a perfect run in Combat mode.",
    "achv.perfect_colosseum_xd.title": "Perfect shadow",
    "achv.perfect_colosseum_xd.desc": "Complete a perfect run in the Pokémon Colosseum / XD minigame.",
    "achv.perfect_mystery_dungeon.title": "Perfect dungeon",
    "achv.perfect_mystery_dungeon.desc": "Complete a perfect run in the Pokémon Mystery Dungeon minigame.",
    "achv.sonidex_5.title": "First notes",
    "achv.sonidex_5.desc": "Unlock 5 Soundex entries.",
    "achv.sonidex_10.title": "Sound collector",
    "achv.sonidex_10.desc": "Unlock 10 Soundex entries.",
    "achv.sonidex_20.title": "Sharp ear",
    "achv.sonidex_20.desc": "Unlock 20 Soundex entries.",
    "achv.sonidex_50.title": "Expert music lover",
    "achv.sonidex_50.desc": "Unlock 50 Soundex entries.",
    "achv.sonidex_100.title": "Sound archive",
    "achv.sonidex_100.desc": "Unlock 100 Soundex entries.",
    "achv.sonidex_200.title": "Sound library",
    "achv.sonidex_200.desc": "Unlock 200 Soundex entries.",
    "achv.sonidex_kanto.title": "Kanto Soundex",
    "achv.sonidex_kanto.desc": "Unlock every Kanto entry.",
    "achv.sonidex_johto.title": "Johto Soundex",
    "achv.sonidex_johto.desc": "Unlock every Johto entry.",
    "achv.sonidex_hoenn.title": "Hoenn Soundex",
    "achv.sonidex_hoenn.desc": "Unlock every Hoenn entry.",
    "achv.sonidex_sinnoh.title": "Sinnoh Soundex",
    "achv.sonidex_sinnoh.desc": "Unlock every Sinnoh entry.",
    "achv.sonidex_teselia.title": "Unova Soundex",
    "achv.sonidex_teselia.desc": "Unlock every Unova entry.",
    "achv.sonidex_kalos.title": "Kalos Soundex",
    "achv.sonidex_kalos.desc": "Unlock every Kalos entry.",
    "achv.sonidex_alola.title": "Alola Soundex",
    "achv.sonidex_alola.desc": "Unlock every Alola entry.",
    "achv.story_kanto.title": "Story: Kanto",
    "achv.story_kanto.desc": "Complete Kanto in Story Mode.",
    "achv.story_johto.title": "Story: Johto",
    "achv.story_johto.desc": "Complete Johto in Story Mode.",
    "achv.story_hoenn.title": "Story: Hoenn",
    "achv.story_hoenn.desc": "Complete Hoenn in Story Mode.",
    "achv.story_sinnoh.title": "Story: Sinnoh",
    "achv.story_sinnoh.desc": "Complete Sinnoh in Story Mode.",
    "achv.story_teselia.title": "Story: Unova",
    "achv.story_teselia.desc": "Complete Unova in Story Mode.",
    "achv.story_kalos.title": "Story: Kalos",
    "achv.story_kalos.desc": "Complete Kalos in Story Mode.",
    "achv.story_complete.title": "Story Master",
    "achv.story_complete.desc": "Complete Story Mode.",
    "achv.story_complete_100.title": "Perfect story",
    "achv.story_complete_100.desc": "Complete Story Mode with 100% accuracy.",
    "achv.encounter_charizard_5.title": "Charizard sighting",
    "achv.encounter_charizard_5.desc": "Make Charizard appear 5 times.",
    "achv.encounter_charizard.title": "Flame hunter",
    "achv.encounter_charizard.desc": "Make Charizard appear 10 times.",
    "achv.encounter_charizard_20.title": "Charizard's shine",
    "achv.encounter_charizard_20.desc": "Make Charizard appear 20 times.",
    "achv.encounter_slowpoke_5.title": "Slowpoke sighting",
    "achv.encounter_slowpoke_5.desc": "Make Slowpoke appear 5 times.",
    "achv.encounter_slowpoke.title": "Slowpoke's patience",
    "achv.encounter_slowpoke.desc": "Make Slowpoke appear 10 times.",
    "achv.encounter_slowpoke_20.title": "Slowpoke's shine",
    "achv.encounter_slowpoke_20.desc": "Make Slowpoke appear 20 times.",
    "achv.encounter_rapidash_5.title": "Rapidash sighting",
    "achv.encounter_rapidash_5.desc": "Make Rapidash appear 5 times.",
    "achv.encounter_rapidash.title": "Rapidash speed",
    "achv.encounter_rapidash.desc": "Make Rapidash appear 10 times.",
    "achv.encounter_rapidash_20.title": "Rapidash's shine",
    "achv.encounter_rapidash_20.desc": "Make Rapidash appear 20 times.",
    "achv.encounter_ditto_5.title": "Ditto sighting",
    "achv.encounter_ditto_5.desc": "Make Ditto appear 5 times.",
    "achv.encounter_ditto.title": "Ditto the impersonator",
    "achv.encounter_ditto.desc": "Make Ditto appear 10 times.",
    "achv.encounter_ditto_20.title": "Ditto's shine",
    "achv.encounter_ditto_20.desc": "Make Ditto appear 20 times.",
    "achv.encounter_inkay_5.title": "Inkay sighting",
    "achv.encounter_inkay_5.desc": "Make Inkay appear 5 times.",
    "achv.encounter_inkay.title": "Inkay's spin",
    "achv.encounter_inkay.desc": "Make Inkay appear 10 times.",
    "achv.encounter_inkay_20.title": "Inkay's shine",
    "achv.encounter_inkay_20.desc": "Make Inkay appear 20 times.",
    "achv.encounter_hypno_5.title": "Hypno sighting",
    "achv.encounter_hypno_5.desc": "Make Hypno appear 5 times.",
    "achv.encounter_hypno.title": "Hypno's hypnosis",
    "achv.encounter_hypno.desc": "Make Hypno appear 10 times.",
    "achv.encounter_hypno_20.title": "Hypno's shine",
    "achv.encounter_hypno_20.desc": "Make Hypno appear 20 times.",
    "achv.encounter_chansey_5.title": "Chansey sighting",
    "achv.encounter_chansey_5.desc": "Make Chansey appear 5 times.",
    "achv.encounter_chansey.title": "Second chance",
    "achv.encounter_chansey.desc": "Make Chansey appear 10 times.",
    "achv.encounter_chansey_20.title": "Chansey's shine",
    "achv.encounter_chansey_20.desc": "Make Chansey appear 20 times.",
    "achv.encounter_gengar_5.title": "Gengar sighting",
    "achv.encounter_gengar_5.desc": "Make Gengar appear 5 times.",
    "achv.encounter_gengar.title": "Gengar's shadow",
    "achv.encounter_gengar.desc": "Make Gengar appear 10 times.",
    "achv.encounter_gengar_20.title": "Gengar's shine",
    "achv.encounter_gengar_20.desc": "Make Gengar appear 20 times.",
    "achv.encounter_pikachu_5.title": "Pikachu sighting",
    "achv.encounter_pikachu_5.desc": "Make Pikachu appear 5 times.",
    "achv.encounter_pikachu.title": "Pikachu's spark",
    "achv.encounter_pikachu.desc": "Make Pikachu appear 10 times.",
    "achv.encounter_pikachu_20.title": "Pikachu's shine",
    "achv.encounter_pikachu_20.desc": "Make Pikachu appear 20 times.",
    "achv.encounter_blastoise_5.title": "Blastoise sighting",
    "achv.encounter_blastoise_5.desc": "Make Blastoise appear 5 times.",
    "achv.encounter_blastoise.title": "Rain dance",
    "achv.encounter_blastoise.desc": "Make Blastoise appear 10 times.",
    "achv.encounter_blastoise_20.title": "Blastoise's shine",
    "achv.encounter_blastoise_20.desc": "Make Blastoise appear 20 times.",
    "achv.encounter_venusaur_5.title": "Venusaur sighting",
    "achv.encounter_venusaur_5.desc": "Make Venusaur appear 5 times.",
    "achv.encounter_venusaur.title": "Venusaur's scent",
    "achv.encounter_venusaur.desc": "Make Venusaur appear 10 times.",
    "achv.encounter_venusaur_20.title": "Venusaur's shine",
    "achv.encounter_venusaur_20.desc": "Make Venusaur appear 20 times.",
    "achv.encounter_electrode_5.title": "Electrode sighting",
    "achv.encounter_electrode_5.desc": "Make Electrode appear 5 times.",
    "achv.encounter_electrode.title": "Countdown",
    "achv.encounter_electrode.desc": "Make Electrode appear 10 times.",
    "achv.encounter_electrode_20.title": "Electrode's shine",
    "achv.encounter_electrode_20.desc": "Make Electrode appear 20 times.",
    "achv.encounter_porygon_5.title": "Porygon sighting",
    "achv.encounter_porygon_5.desc": "Make Porygon appear 5 times.",
    "achv.encounter_porygon.title": "Digital glitch",
    "achv.encounter_porygon.desc": "Make Porygon appear 10 times.",
    "achv.encounter_porygon_20.title": "Porygon's shine",
    "achv.encounter_porygon_20.desc": "Make Porygon appear 20 times.",
    "achv.encounter_snorlax_5.title": "Snorlax sighting",
    "achv.encounter_snorlax_5.desc": "Make Snorlax appear 5 times.",
    "achv.encounter_snorlax.title": "Snorlax's nap",
    "achv.encounter_snorlax.desc": "Make Snorlax appear 10 times.",
    "achv.encounter_snorlax_20.title": "Snorlax's shine",
    "achv.encounter_snorlax_20.desc": "Make Snorlax appear 20 times.",
    "achv.encounter_jigglypuff_5.title": "Jigglypuff sighting",
    "achv.encounter_jigglypuff_5.desc": "Make Jigglypuff appear 5 times.",
    "achv.encounter_jigglypuff.title": "Lullaby",
    "achv.encounter_jigglypuff.desc": "Make Jigglypuff appear 10 times.",
    "achv.encounter_jigglypuff_20.title": "Jigglypuff's shine",
    "achv.encounter_jigglypuff_20.desc": "Make Jigglypuff appear 20 times.",
    "achv.encounter_shiny_5.title": "Shiny sighting",
    "achv.encounter_shiny_5.desc": "Find a shiny Pokémon 5 times.",
    "achv.encounter_shiny.title": "Shiny hunter",
    "achv.encounter_shiny.desc": "Find a shiny Pokémon 10 times.",
    "achv.encounter_shiny_20.title": "Shiny evolution",
    "achv.encounter_shiny_20.desc": "Find a shiny Pokémon 20 times.",
    "achv.encounter_mewtwo_5.title": "Mewtwo sighting",
    "achv.encounter_mewtwo_5.desc": "Make Mewtwo appear 5 times.",
    "achv.encounter_mewtwo.title": "Psychic clone",
    "achv.encounter_mewtwo.desc": "Make Mewtwo appear 10 times.",
    "achv.encounter_mewtwo_20.title": "Mewtwo's shine",
    "achv.encounter_mewtwo_20.desc": "Make Mewtwo appear 20 times.",
    "achv.encounter_mew_5.title": "Mew sighting",
    "achv.encounter_mew_5.desc": "Make Mew appear 5 times.",
    "achv.encounter_mew.title": "Shapeshifter",
    "achv.encounter_mew.desc": "Make Mew appear 10 times.",
    "achv.encounter_mew_20.title": "Mew's shine",
    "achv.encounter_mew_20.desc": "Make Mew appear 20 times.",

    // ── Secciones de la pantalla de Logros (ACHIEVEMENT_SECTIONS en
    // game.js): mismo criterio que los logros, solo inglés vía tData(). ──
    "achSection.progress.title": "Progress and streaks",
    "achSection.mastery.title": "Mastery and perfect runs",
    "achSection.sonidex.title": "Soundex",
    "achSection.story.title": "Story Mode",
    "achSection.encounters.title": "Pokémon Events",

    // ── Eventos Pokémon (catálogo PokeEvents en pokemon.js): mismo
    // criterio que los logros, solo inglés vía tData(). ──
    "pokeEvent.inkay.name": "Inkay",
    "pokeEvent.inkay.desc": "Inkay has appeared! Its psychic powers spin the answers 180°.",
    "pokeEvent.porygon.name": "Porygon",
    "pokeEvent.porygon.desc": "Porygon has appeared! The interface suffers a digital glitch: corrupted pixels and letters flicker like a computer error, and the song itself sounds choppy.",
    "pokeEvent.slowpoke.name": "Slowpoke",
    "pokeEvent.slowpoke.desc": "Slowpoke has appeared! This round's song plays slower.",
    "pokeEvent.gengar.name": "Gengar",
    "pokeEvent.gengar.desc": "Gengar has appeared and is hiding in the dark! Move the cursor to light up the screen, find it and tap it to be able to answer.",
    "pokeEvent.hypno.name": "Hypno",
    "pokeEvent.hypno.desc": "Hypno swings its pendulum! The screen ripples like a liquid surface and the perspective wobbles, causing intense visual dizziness.",
    "pokeEvent.chansey.name": "Chansey",
    "pokeEvent.chansey.desc": "Chansey has appeared! If you get this question wrong, it'll give you another chance.",
    "pokeEvent.rapidash.name": "Rapidash",
    "pokeEvent.rapidash.desc": "Rapidash has appeared! Its gallop speeds up this round's song.",
    "pokeEvent.shiny.name": "Shiny Caterpie",
    "pokeEvent.shiny.desc": "A Shiny Caterpie has appeared! Its colors tint the screen and multiply your points x5.",
    "pokeEvent.blastoise.name": "Blastoise",
    "pokeEvent.blastoise.desc": "Blastoise uses Rain Dance! A torrential rain falls over the battlefield.",
    "pokeEvent.charizard.name": "Charizard",
    "pokeEvent.charizard.desc": "Charizard has appeared! Its flame burns two wrong answers away.",
    "pokeEvent.pikachu.name": "Pikachu",
    "pokeEvent.pikachu.desc": "Pikachu has appeared! Its energy multiplies this round's points x3.",
    "pokeEvent.electrode.name": "Electrode",
    "pokeEvent.electrode.desc": "Electrode has appeared! It will explode at second 10 of the song and take away a life if you don't answer before then.",
    "pokeEvent.venusaur.name": "Venusaur",
    "pokeEvent.venusaur.desc": "Venusaur has appeared! Get this round right so it uses Synthesis and restores a life (max. 3).",
    "pokeEvent.ditto.name": "Ditto",
    "pokeEvent.ditto.desc": "Ditto was disguised as one of the answers and fled! One wrong option disappears.",
    "pokeEvent.jigglypuff.name": "Jigglypuff",
    "pokeEvent.jigglypuff.desc": "Jigglypuff has appeared and is about to sing its song! While it sings, the round's music plays quieter, and the correct answer will glow once it's done.",
    "pokeEvent.snorlax.name": "Snorlax",
    "pokeEvent.snorlax.desc": "Snorlax has fallen asleep on top of the answers! Tap it several times to wake it up.",
    "pokeEvent.mewtwo.name": "Mewtwo",
    "pokeEvent.mewtwo.desc": "Mewtwo has appeared! It wraps every answer in psychic energy and conjures up two fake ones, mixed in with the real ones.",
    "pokeEvent.mew.name": "Mew",
    "pokeEvent.mew.desc": "Mew has appeared! It can transform into any other Pokémon... you choose which one.",

    // ── Modos y categorías de Minijuegos desbloqueables (MODE_UNLOCKS/
    // OTHER_UNLOCKS en game.js): mismo criterio, solo inglés vía tData().
    // reqTitle coincide con el título en inglés del logro correspondiente
    // (ver ACHIEVEMENTS/achv.*.title arriba) cuando el desbloqueo es por
    // logro, igual que ya ocurre con el texto en español en game.js. ──
    "modeUnlock.hard.name": "Hard Mode",
    "modeUnlock.hard.reqTitle": "Profile level 8",
    "modeUnlock.combat.name": "Battle Mode",
    "modeUnlock.combat.reqTitle": "Profile level 10",
    "modeUnlock.infinite.name": "Endless Challenge Mode",
    "modeUnlock.infinite.reqTitle": "Regional traveler",
    "otherUnlock.centro-pokemon.name": "Pokémon Center",
    "otherUnlock.centro-pokemon.reqTitle": "Profile level 3",
    "otherUnlock.laboratorios.name": "Labs",
    "otherUnlock.laboratorios.reqTitle": "Profile level 4",
    "otherUnlock.bicicletas.name": "Bicycles",
    "otherUnlock.bicicletas.reqTitle": "Profile level 5",
    "otherUnlock.surf.name": "Surf",
    "otherUnlock.surf.reqTitle": "Profile level 6",
    "otherUnlock.mystery-dungeon.name": "Pokémon Mystery Dungeon",
    "otherUnlock.mystery-dungeon.reqTitle": "Story: Hoenn",
    "otherUnlock.colosseum-xd.name": "Pokémon Colosseum / XD",
    "otherUnlock.colosseum-xd.reqTitle": "Music lover",
    "otherUnlock.ranger.name": "Pokémon Ranger",
    "otherUnlock.ranger.reqTitle": "Dedicated trainer",
    "otherUnlock.title-screens.name": "Title Screens",
    "otherUnlock.title-screens.reqTitle": "Profile level 7",
    "otherUnlock.openings-anime.name": "Anime Openings",
    "otherUnlock.openings-anime.reqTitle": "Profile level 9",

    // Nombres de región que difieren del nombre interno (clave usada en
    // REGION_META/REGIONS de game.js y en el campo `region` de cada
    // canción). Solo hace falta listar aquí las que cambian respecto al
    // español; el resto (Kanto, Johto, Hoenn, Sinnoh, Kalos, Alola) se
    // llaman igual en los dos idiomas y regionDisplayName() ya se
    // encarga de dejarlas tal cual si no aparecen aquí.
    "region.Teselia": "Unova",

    // ── Títulos de canciones (nombre oficial en inglés de cada lugar) ──
    // Misma idea que `region.*` de arriba, pero para `song.title`
    // (ver `songDisplayName()`): clave = título original en español tal
    // y como está en el catálogo `songs` de game.js, valor = nombre
    // oficial inglés del lugar/canción. Cubre las siete regiones,
    // Combate y las categorías de Minijuegos (Laboratorios, Bicicletas/
    // Montura, Centro Pokémon, Surf, Colosseum/XD, Ranger, Pantallas de
    // Título y Openings del Anime). Quedan sin traducir (se muestran en
    // español también en inglés) los nombres propios que coinciden en
    // ambos idiomas, y todo el bloque de "Pokémon Mundo Misterioso",
    // pendientes de revisar.
    "song.Pueblo Paleta": "Pallet Town",
    "song.Ciudad Celeste": "Cerulean City",
    "song.Ciudad Verde": "Viridian City",
    "song.Ciudad Azulona": "Celadon City",
    "song.Ciudad Carmín": "Vermilion City",
    "song.Pueblo Lavanda": "Lavender Town",
    "song.Isla Canela": "Cinnabar Island",
    "song.Monte Moon": "Mt. Moon",
    "song.Meseta Añil": "Indigo Plateau",
    "song.SS Anne": "S.S. Anne",
    "song.Bosque Verde": "Viridian Forest",
    "song.Casino Rocket": "Celadon Game Corner",
    "song.Mansión Pokémon": "Pokémon Mansion",
    "song.Silph S.A.": "Silph Co.",
    "song.Torre Pokémon": "Pokémon Tower",

    // Johto
    "song.Pueblo Primavera": "New Bark Town",
    "song.Ciudad Cerezo": "Cherrygrove City",
    "song.Ciudad Malva": "Violet City",
    "song.Pueblo Azalea": "Azalea Town",
    "song.Ciudad Trigal": "Goldenrod City",
    "song.Ciudad Iris": "Ecruteak City",
    "song.Ciudad Orquídea": "Cianwood City",
    "song.Encinar": "Ilex Forest",
    "song.Torre Bellsprout": "Sprout Tower",
    "song.Torre Quemada": "Burned Tower",
    "song.Faro Ciudad Olivo": "Olivine Lighthouse",
    "song.Parque Nacional": "National Park",
    "song.Casino de Ciudad Trigal": "Goldenrod Game Corner",
    "song.Chicas Kimono": "Kimono Girls",
    "song.Ruinas Alfa": "Ruins of Alph",
    "song.Ruinas Sinjoh": "Sinjoh Ruins",
    "song.Ruta Helada": "Ice Path",

    // Hoenn
    "song.Villa Raíz": "Littleroot Town",
    "song.Pueblo Escaso": "Oldale Town",
    "song.Ciudad Férrica": "Rustboro City",
    "song.Pueblo Azuliza": "Dewford Town",
    "song.Ciudad Portual": "Slateport City",
    "song.Pueblo Verdegal": "Verdanturf Town",
    "song.Pueblo Pardal": "Fallarbor Town",
    "song.Ciudad Arborada": "Fortree City",
    "song.Ciudad Calagua": "Lilycove City",
    "song.Arrecípolis": "Sootopolis City",
    "song.Ciudad Colosalia": "Ever Grande City",
    "song.Ciudad Petalia": "Petalburg City",
    "song.Museo Oceánico": "Oceanic Museum",
    "song.Monte Pírico": "Mt. Pyre",
    "song.Frente de Batalla": "Battle Frontier",
    "song.Barco del Sr. Arenque": "Mr. Briney's Boat",
    "song.Buceo": "Underwater",
    "song.Cámara Sellada": "Sealed Chamber",
    "song.Cascada Meteoro": "Meteor Falls",
    "song.Concurso Pokémon": "Pokémon Contest",
    "song.Desierto de Hoenn": "Hoenn Desert",
    "song.Guarida del Team Aqua/Magma": "Team Aqua/Magma Hideout",
    "song.Interior del Monte Pírico": "Inside Mt. Pyre",
    "song.Nao Abandonada": "Abandoned Ship",
    "song.Pilar Celeste": "Sky Pillar",

    // Sinnoh
    "song.Ciudad Canal": "Canalave City",
    "song.Ciudad Corazón": "Hearthome City",
    "song.Ciudad Jubileo": "Jubilife City",
    "song.Ciudad Marina": "Sunyshore City",
    "song.Ciudad Pirita": "Oreburgh City",
    "song.Ciudad Puntaneva": "Snowpoint City",
    "song.Ciudad Rocavelo": "Veilstone City",
    "song.Ciudad Vetusta": "Eterna City",
    "song.Pueblo Arena": "Sandgem Town",
    "song.Pueblo Aromaflor": "Floaroma Town",
    "song.Pueblo Hojaverde": "Twinleaf Town",
    "song.Liga Pokémon Sinnoh": "Sinnoh Pokémon League",
    "song.Lago Sinnoh": "Sinnoh Lake",
    "song.Subsuelo": "Sinnoh Underground",
    "song.Bosque Vetusto": "Eterna Forest",
    "song.Pueblo Sosiego": "Solaceon Town",
    "song.Sala Final de Cintia": "Cynthia's Champion Room",
    "song.Ribera Valor": "Valor Lakefront",
    "song.Valle Eólico": "Valley Windworks",

    // Teselia (Unova)
    "song.Ciudad Caolín": "Opelucid City",
    "song.Ciudad Engobe": "Aspertia City",
    "song.Ciudad Esmalte": "Nacrene City",
    "song.Ciudad Fayenza": "Driftveil City",
    "song.Ciudad Gres": "Striaton City",
    "song.Ciudad Hormigón": "Virbank City",
    "song.Ciudad Loza": "Mistralton City",
    "song.Ciudad Mayólica": "Nimbasa City",
    "song.Ciudad Negra": "Black City",
    "song.Ciudad Porcelana": "Castelia City",
    "song.Ciudad Teja": "Icirrus City",
    "song.Pueblo Arcilla": "Nuvema Town",
    "song.Pueblo Arenisca": "Undella Town",
    "song.Pueblo Biscuit": "Anville Town",
    "song.Pueblo Chamota": "Lentimas Town",
    "song.Pueblo Ladrillo": "Lacunosa Town",
    "song.Pueblo Ocre": "Floccesy Town",
    "song.Pueblo Terracota": "Accumula Town",
    "song.Bosque de los Perdidos": "Lostlorn Forest",
    "song.Palacio de N": "N's Castle",
    "song.Despedida de N": "N's Farewell",
    "song.Habitación de N": "N's Room",
    "song.Solar de los Sueños": "Dreamyard",
    "song.Torre Duodraco": "Dragonspiral Tower",
    "song.Un Corazón Inquebrantable": "An Unwavering Heart",

    // Kalos
    "song.Ciudad Batik": "Kiloude City",
    "song.Ciudad Fluxus": "Anistar City",
    "song.Bosque Novarte": "Santalune Forest",
    "song.Ciudad Fractal": "Snowbelle City",
    "song.Ciudad Luminalia": "Lumiose City",
    "song.Ciudad Novarte": "Santalune City",
    "song.Ciudad Relieve": "Cyllage City",
    "song.Ciudad Témpera": "Coumarine City",
    "song.Ciudad Yantra": "Shalour City",
    "song.Pueblo Acuarela": "Aquacorde Town",
    "song.Pueblo Boceto": "Vaniville Town",
    "song.Pueblo Crómlech": "Geosenge Town",
    "song.Pueblo Fresco": "Dendemille Town",
    "song.Pueblo Vánitas": "Camphrier Town",
    "song.Cueva Brillante": "Reflection Cave",
    "song.Fábrica de Poké Balls": "Poké Ball Factory",

    // Alola
    "song.Ciudad Hauoli": "Hau'oli City",
    "song.Ciudad Kantai": "Heahea City",
    "song.Ciudad Konikoni": "Konikoni City",
    "song.Ciudad Malíe": "Malie City",
    "song.Pueblo Lilii": "Iki Town",
    "song.Pueblo Ohana": "Paniola Town",
    "song.Pueblo Po": "Po Town",
    "song.Cañón de Poni": "Poni Canyon",
    "song.Paraíso Aether": "Aether Paradise",
    "song.Aldea Marina": "Seafolk Village",
    "song.Escuela de Entrenadores": "Trainers' School",
    "song.Colina Dequilate": "Ten Carat Hill",
    "song.Avenida Royale": "Royal Avenue",
    "song.Poké Resort": "Poké Pelago",

    // Combate
    "song.Salvaje Kanto": "Wild Kanto",
    "song.Salvaje Johto": "Wild Johto",
    "song.Salvaje Hoenn": "Wild Hoenn",
    "song.Salvaje Sinnoh": "Wild Sinnoh",
    "song.Salvaje Teselia": "Wild Unova",
    "song.Salvaje Kalos": "Wild Kalos",
    "song.Salvaje Alola": "Wild Alola",
    "song.Rival Johto": "Johto Rival",
    "song.Rival Hoenn": "Hoenn Rival",
    "song.Rival Sinnoh": "Sinnoh Rival",
    "song.Rival Teselia": "Unova Rival",
    "song.Rival Alola": "Alola Rival",
    "song.Amigos Kalos": "Kalos Friends",
    "song.Gimnasio Kanto": "Kanto Gym",
    "song.Gimnasio Johto": "Johto Gym",
    "song.Gimnasio Hoenn": "Hoenn Gym",
    "song.Gimnasio Sinnoh": "Sinnoh Gym",
    "song.Primeros Gimnasios Teselia": "Unova Gyms (Part 1)",
    "song.Últimos Gimnasios Teselia": "Unova Gyms (Part 2)",
    "song.Gimnasio Kalos": "Kalos Gym",
    "song.Entrenador Kanto": "Kanto Trainer",
    "song.Entrenador Johto": "Johto Trainer",
    "song.Entrenador Hoenn": "Hoenn Trainer",
    "song.Entrenador Sinnoh": "Sinnoh Trainer",
    "song.Entrenador Teselia": "Unova Trainer",
    "song.Entrenador Kalos": "Kalos Trainer",
    "song.Entrenador Alola": "Alola Trainer",
    "song.Alto Mando Hoenn": "Hoenn Elite Four",
    "song.Alto Mando Sinnoh": "Sinnoh Elite Four",
    "song.Alto Mando Teselia": "Unova Elite Four",
    "song.Alto Mando Kalos": "Kalos Elite Four",
    "song.Alto Mando Alola": "Alola Elite Four",
    "song.Pokémon Dominante": "Totem Pokémon",
    "song.Campeón Azul": "Champion Blue",
    "song.Campeona Cintia": "Champion Cynthia",
    "song.Campeona Dianta": "Champion Diantha",
    "song.Ghechis": "Ghetsis",
    "song.Guzmán": "Guzma",
    "song.Helio": "Cyrus",
    "song.Aquiles / Magno": "Archie / Maxie",
    "song.Samina": "Lusamine",
    "song.Campeón Kukui": "Champion Kukui",
    "song.Campeón Lance": "Champion Lance",
    "song.Legendario Kanto": "Kanto Legendary",
    "song.Campeón Máximo": "Champion Steven",
    "song.Lysson": "Lysandre",
    "song.Team Galaxia": "Team Galactic",
    "song.Los Regis": "The Regis",

    // Laboratorios
    "song.Laboratorio Kanto": "Kanto Lab",
    "song.Laboratorio Johto": "Johto Lab",
    "song.Laboratorio Hoenn": "Hoenn Lab",
    "song.Laboratorio Sinnoh": "Sinnoh Lab",
    "song.Laboratorio Teselia": "Unova Lab",
    "song.Laboratorio Kalos": "Kalos Lab",
    "song.Laboratorio Alola": "Alola Lab",

    // Bicicletas
    "song.Bicicleta Kanto": "Kanto Bike",
    "song.Bicicleta Johto": "Johto Bike",
    "song.Bicicleta Hoenn": "Hoenn Bike",
    "song.Bicicleta Sinnoh": "Sinnoh Bike",
    "song.Bicicleta Teselia": "Unova Bike",
    "song.Bicicleta Kalos": "Kalos Bike",
    "song.Montura Alola": "Alola Ride",

    // Centro Pokémon
    "song.Centro Pokémon Kanto": "Kanto Pokémon Center",
    "song.Centro Pokémon Johto": "Johto Pokémon Center",
    "song.Centro Pokémon Hoenn": "Hoenn Pokémon Center",
    "song.Centro Pokémon Sinnoh": "Sinnoh Pokémon Center",
    "song.Centro Pokémon Teselia": "Unova Pokémon Center",
    "song.Centro Pokémon Kalos": "Kalos Pokémon Center",
    "song.Centro Pokémon Alola": "Alola Pokémon Center",

    // Surf
    "song.Surf Kanto": "Kanto Surf",
    "song.Surf Johto": "Johto Surf",
    "song.Surf Hoenn": "Hoenn Surf",
    "song.Surf Sinnoh": "Sinnoh Surf",
    "song.Surf Teselia": "Unova Surf",
    "song.Surf Kalos": "Kalos Surf",
    "song.Montura Acuática Alola": "Alola Water Ride",

    // Pokémon Colosseum / XD
    "song.Ciudad Oasis": "Phenac City",
    "song.Guarida Equipo Cepo": "Cipher Peon Hideout",
    "song.Laboratorio Aura": "Lab (Aura)",
    "song.Laboratorio Pokémon Oscuros": "Shadow Pokémon Lab",
    "song.Monte Batalla": "Battle Mountain",
    "song.Pilar Legendario": "Relic Stone",
    "song.Pueblo Pirita": "Pyrite Town",
    "song.Puerto Ancla": "Gateon Port",
    "song.Puesto de Servicio": "Outskirt Stand",
    "song.Torre Colosal": "Colosseum",
    "song.Villa Ágata": "Agate Village",

    // Pokémon Ranger
    "song.Bosque Lira": "Lyra Forest",
    "song.Escuela Ranger": "Ranger School",
    "song.Fábrica Turnoche": "Chroma Ruins",
    "song.Otonia": "Fall City",
    "song.Puerto de Otonia": "Fall City Harbor",
    "song.Base Ranger": "Ranger Base",
    "song.Red Ranger": "Ranger Net",
    "song.Unión Ranger": "Ranger Union",
    "song.Villavera": "Ringtown",

    // Pantallas de Título
    "song.Pantalla de Título Kanto": "Kanto Title Screen",
    "song.Pantalla de Título Johto": "Johto Title Screen",
    "song.Pantalla de Título Hoenn": "Hoenn Title Screen",
    "song.Pantalla de Título Sinnoh": "Sinnoh Title Screen",
    "song.Pantalla de Título Teselia": "Unova Title Screen",
    "song.Pantalla de Título Kalos": "Kalos Title Screen",
    "song.Pantalla de Título Alola": "Alola Title Screen",

    // Openings del Anime
    "song.Opening Kanto": "Kanto Opening",
    "song.Opening Johto": "Johto Opening",
    "song.Opening Hoenn": "Hoenn Opening",
    "song.Opening Sinnoh": "Sinnoh Opening",
    "song.Opening Teselia": "Unova Opening",
    "song.Opening Kalos": "Kalos Opening",
    "song.Opening Alola": "Alola Opening",
  },
};

// ═══════════════════════════════════════════════
//  🔤 TRADUCIR Y APLICAR
// ═══════════════════════════════════════════════

/**
 * Devuelve el texto traducido para `key` en el idioma actual
 * (`settings.language`), sustituyendo placeholders `{nombre}` por los
 * valores de `vars`. Si la clave no existe, devuelve la propia clave
 * (para que un texto sin traducir sea visible/fácil de detectar en vez
 * de romper la interfaz).
 * @param {string} key
 * @param {Object<string, string|number>} [vars]
 * @returns {string}
 */
function t(key, vars) {
  const dict = I18N[settings.language] || I18N.es;
  let str = dict[key];
  if (str === undefined) str = I18N.es[key];
  if (str === undefined) return key;
  if (vars) {
    for (const k in vars) str = str.split(`{${k}}`).join(String(vars[k]));
  }
  return str;
}

/**
 * Como t(), pero para textos que viven como VALOR POR DEFECTO en otro
 * fichero en vez de en el propio diccionario `I18N` — el catálogo de
 * logros (`ACHIEVEMENTS` en game.js), el catálogo de Eventos Pokémon
 * (`pokemon.js`) o los desbloqueables (`MODE_UNLOCKS`/`OTHER_UNLOCKS`
 * en game.js). Esos catálogos solo tienen su texto en español (para no
 * duplicarlo, siguiendo la Regla nº2 de CLAUDE.md); esta función deja
 * ese español como está y solo lo sustituye si existe una traducción
 * para `key` en el idioma actual. A diferencia de `t()`, NUNCA devuelve
 * la propia `key`: si no hay traducción, devuelve `defaultText` tal
 * cual.
 * @param {string} key
 * @param {string} defaultText  el texto en español ya presente en el
 *   catálogo de origen, usado tal cual si no hay traducción.
 * @param {Object<string, string|number>} [vars]
 * @returns {string}
 */
function tData(key, defaultText, vars) {
  const dict = I18N[settings.language];
  let str = dict ? dict[key] : undefined;
  if (str === undefined) return defaultText;
  if (vars) {
    for (const k in vars) str = str.split(`{${k}}`).join(String(vars[k]));
  }
  return str;
}

/**
 * Como tData(), pero específica para nombres de región (la clave
 * interna usada en REGIONS/REGION_META de game.js y en el campo
 * `region` de cada canción — p. ej. "Teselia"). Devuelve la propia
 * región tal cual si el idioma actual no tiene una entrada
 * "region.<región>" (caso de la mayoría, que se llaman igual en
 * español e inglés). Los ficheros que solo NECESITAN la clave interna
 * (comparar `song.region`, guardar en localStorage, comprobar logros...)
 * deben seguir usando esa clave sin pasar por aquí; esta función es
 * solo para el texto que ve el jugador.
 * @param {string} region  clave interna de la región (p. ej. "Kanto",
 *   "Teselia"...).
 * @returns {string}
 */
function regionDisplayName(region) {
  return tData(`region.${region}`, region);
}

/**
 * Devuelve el título traducido de una canción para mostrarlo al
 * jugador (si existe traducción para su título original en español,
 * clave `song.<título original>`, ver más abajo). Si no hay traducción
 * para ese título, se devuelve tal cual (igual que `regionDisplayName`).
 * Importante: el título ORIGINAL (`song.title`, el que viene del
 * catálogo `songs` de game.js) sigue siendo la clave interna que se usa
 * para comparar/identificar canciones (p. ej. al generar las opciones
 * de respuesta o comprobar el acierto) — esa comparación NUNCA pasa por
 * aquí, solo el texto que ve el jugador en pantalla.
 */
function songDisplayName(song) {
  return tData(`song.${song.title}`, song.title);
}

/**
 * Aplica el idioma actual a todo el marcado estático de index.html
 * marcado con `data-i18n` (texto), `data-i18n-placeholder` (atributo
 * placeholder), `data-i18n-title` (atributo title) o
 * `data-i18n-aria` (atributo aria-label). Se llama al arrancar la app y
 * cada vez que el jugador cambia de idioma en Opciones.
 */
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.title = t(el.getAttribute("data-i18n-title"));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
  });
  document.documentElement.lang = settings.language;
}

/**
 * Cambia el idioma de los menús, lo persiste (storage.js) y refresca
 * tanto el marcado estático (`applyTranslations`) como las pantallas ya
 * renderizadas dinámicamente por ui.js que dependan del idioma (las que
 * estén cargadas en ese momento).
 * @param {"es"|"en"} lang
 */
function setLanguage(lang) {
  if (lang !== "es" && lang !== "en") return;
  settings.language = lang;
  saveSettings();
  applyTranslations();
  if (typeof refreshLanguageDependentUI === "function") refreshLanguageDependentUI();
}
