/* ══════════════════════════════════════════════════════════════════════
   RADIO TRIGAL FM — LÓGICA DEL JUEGO (game.js)
   ══════════════════════════════════════════════════════════════════════
   Este fichero contiene el "núcleo" del juego: las REGLAS y el ESTADO,
   no el dibujado en pantalla. Aquí viven el catálogo de canciones, el
   estado de partida (`session`/`state`), el sistema de puntos/rachas/
   niveles, la lógica de logros y sus condiciones de desbloqueo, la
   construcción del pool de preguntas de cada ronda, el flujo completo
   de una partida (empezar, responder, siguiente ronda, resultado...) y
   el recorrido del Modo Historia (avanzar de región, vidas, victoria/
   derrota). Cuando una función decide algo (¿cuántos puntos vale esta
   respuesta? ¿se ha desbloqueado un logro? ¿quedan vidas?), vive aquí.

   Todo lo que es puramente visual — pintar pantallas y overlays,
   animar el fondo, renderizar tarjetas de logros/Sonidex, mostrar
   popups y partículas, y los efectos concretos de los Eventos Pokémon
   Jigglypuff/Electrode/Porygon — vive ahora en ui.js. Este fichero
   llama a esas funciones de render con total normalidad (p. ej.
   showScreen(), renderProfileBar(), renderLives(), updateStatsUI())
   como si las hubiera declarado él mismo, porque ui.js se carga justo
   antes y, al ser scripts clásicos sin módulos, comparten un único
   ámbito global.

   El motor de audio (música, SFX, sonidos ambiente) vive aparte en
   audio.js, el catálogo/motor de los Eventos Pokémon (qué evento
   aparece y cuándo, más los Pokémon de las colinas del fondo) vive en
   pokemon.js, y toda la persistencia en localStorage (ajustes, perfil
   del jugador y logros: los objetos `settings`/`profile`/
   `achievementsData` y sus funciones loadX()/saveX()) vive en
   storage.js. Este fichero usa funciones y variables de los cuatro
   (SFX, playSFX, PokeEvents, buildBgPokemon, settings, profile,
   achievementsData, showScreen, renderLives...) con total normalidad,
   como si siguieran estando aquí mismo.

   Se cargan los cinco, en este orden, al final de <body> en index.html,
   después de que todo el HTML de las pantallas/overlays exista ya en
   el DOM (por eso pueden hacer document.getElementById(...) directamente
   al ejecutarse, sin esperar a ningún evento de carga):
     <script src="storage.js"></script>
     <script src="audio.js"></script>
     <script src="pokemon.js"></script>
     <script src="ui.js"></script>
     <script src="game.js"></script>
   El orden importa: storage.js no depende de nadie y define `settings`
   antes de que audio.js la use dentro de sus funciones; pokemon.js usa
   SFX (de audio.js) nada más cargarse; ui.js usa datos/funciones de los
   tres anteriores; y game.js usa funciones de los cuatro en su bloque
   de INIT (al final de este fichero) y en su lógica de partida, así que
   storage.js, audio.js, pokemon.js y ui.js deben existir ya cuando
   game.js termina de cargarse.

   No contiene marcado HTML ni reglas de estilo: la estructura vive en
   index.html y la presentación en styles.css. Cada sección importante
   va precedida de una cabecera "═══" y cada función relevante lleva su
   propio comentario explicativo justo encima.
   ══════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
//  🎮 POKÉMON MUSIC QUIZ — MENÚS + MODOS
// ═══════════════════════════════════════════════
//
// ✅ Reorganización de carpetas (recomendada):
// songs/
//   main/
//     kanto/ ...
//     johto/ ...
//     hoenn/ ...
//     sinnoh/ ...
//     teselia/ ...
//     kalos/ ...
//     alola/ ...
//   other/
//     mystery-dungeon/ ...
//     colosseum-xd/ ...
//     ranger/ ...
//     title/ ...
//     openings/españa/ ...   (doblaje España, ver más abajo)
//   openings/
//     latino/ ...            (doblaje Latino, fuera de other/, ¡ojo!)
//     english/ ...           (versión inglesa, fuera de other/, ¡ojo!)
// images/
// sounds/
//
// Nota: Las rutas de file/image aquí debajo deben coincidir con tu estructura real.

// ═══════════════════════════════════════════════
//  📚 CATÁLOGO DE CANCIONES
// ═══════════════════════════════════════════════
const REGIONS = ["Kanto","Johto","Hoenn","Sinnoh","Teselia","Kalos","Alola"];
const EASY_REGIONS = [...REGIONS];

const songs = [
  // ── EJEMPLOS (sustituye / añade los tuyos) ─────────────────────────────
  // Main — Kanto
  { title: "Pueblo Paleta",  file: "songs/main/kanto/pallet-town.mp3",     image: "images/pueblo-paleta.png",   group: "main",  region: "Kanto" },
  { title: "Ciudad Celeste", file: "songs/main/kanto/cerulean-city.mp3",   image: "images/ciudad-celeste.png",  group: "main",  region: "Kanto" },
  { title: "Ciudad Verde",   file: "songs/main/kanto/viridian-city.mp3",   image: "images/ciudad-verde.png",    group: "main",  region: "Kanto" },
  { title: "Ciudad Azulona", file: "songs/main/kanto/celadon-city.mp3",    image: "images/ciudad-azulona.png",  group: "main",  region: "Kanto" },
  { title: "Ciudad Carmín", file: "songs/main/kanto/vermillion-city.mp3",    image: "images/ciudad-carmin.png",  group: "main",  region: "Kanto" },
  { title: "Pueblo Lavanda", file: "songs/main/kanto/lavender-town.mp3",   image: "images/pueblo-lavanda.png",  group: "main",  region: "Kanto" },
  { title: "Isla Canela",  file: "songs/main/kanto/isla-canela.mp3",     image: "images/isla-canela.png",   group: "main",  region: "Kanto" },
  { title: "Monte Moon",  file: "songs/main/kanto/mt-moon.mp3",     image: "images/mt-moon.png",   group: "main",  region: "Kanto" },
  { title: "Meseta Añil",  file: "songs/main/kanto/liga-kanto.mp3",     image: "images/liga-kanto.png",   group: "main",  region: "Kanto" },
  { title: "SS Anne",  file: "songs/main/kanto/ss-anne.mp3",     image: "images/ss-anne.png",   group: "main",  region: "Kanto" },
  { title: "Bosque Verde",  file: "songs/main/kanto/bosque-verde.mp3",     image: "images/bosque-verde.png",   group: "main",  region: "Kanto" },
  { title: "Casino Rocket", file: "songs/main/kanto/casino-kanto.mp3", image: "images/casino-kanto.png", group: "main", region: "Kanto" },
  { title: "Mansión Pokémon", file: "songs/main/kanto/mansion-pokemon.mp3", image: "images/mansion-pokemon.png", group: "main", region: "Kanto" },
  { title: "Silph S.A.", file: "songs/main/kanto/silph-sa.mp3", image: "images/silph-sa.png", group: "main", region: "Kanto" },
  { title: "Torre Pokémon", file: "songs/main/kanto/torre-pokemon.mp3", image: "images/torre-pokemon.png", group: "main", region: "Kanto" },
  { title: "Pueblo Primavera",  file: "songs/main/johto/pueblo-primavera.mp3",     image: "images/pueblo-primavera.png",   group: "main",  region: "Johto" },
  { title: "Ciudad Cerezo",  file: "songs/main/johto/ciudad-cerezo.mp3",     image: "images/ciudad-cerezo.png",   group: "main",  region: "Johto" },
  { title: "Ciudad Malva",  file: "songs/main/johto/ciudad-malva.mp3",     image: "images/ciudad-malva.png",   group: "main",  region: "Johto" },
  { title: "Pueblo Azalea",  file: "songs/main/johto/pueblo-azalea.mp3",     image: "images/pueblo-azalea.png",   group: "main",  region: "Johto" },
  { title: "Ciudad Trigal",  file: "songs/main/johto/ciudad-trigal.mp3",     image: "images/ciudad-trigal.png",   group: "main",  region: "Johto" },
  { title: "Ciudad Iris",  file: "songs/main/johto/ciudad-iris.mp3",     image: "images/ciudad-iris.png",   group: "main",  region: "Johto" },
  { title: "Ciudad Orquídea",  file: "songs/main/johto/ciudad-orquidea.mp3",     image: "images/ciudad-orquidea.png",   group: "main",  region: "Johto" },
  { title: "Encinar",  file: "songs/main/johto/encinar.mp3",     image: "images/encinar.png",   group: "main",  region: "Johto" },
  { title: "Torre Bellsprout",  file: "songs/main/johto/torre-bellsprout.mp3",     image: "images/torre-bellsprout.png",   group: "main",  region: "Johto" },
  { title: "Torre Quemada",  file: "songs/main/johto/torre-quemada.mp3",     image: "images/torre-quemada.png",   group: "main",  region: "Johto" },
  { title: "Faro Ciudad Olivo",  file: "songs/main/johto/faro-johto.mp3",     image: "images/faro-johto.png",   group: "main",  region: "Johto" },
  { title: "Parque Nacional",  file: "songs/main/johto/parque-nacional.mp3",     image: "images/parque-nacional.png",   group: "main",  region: "Johto" },
  { title: "Casino de Ciudad Trigal", file: "songs/main/johto/casino-johto.mp3", image: "images/casino-johto.png", group: "main", region: "Johto" },
  { title: "Chicas Kimono", file: "songs/main/johto/chicas-komono.mp3", image: "images/chicas-kimono.png", group: "main", region: "Johto" },
  { title: "Ruinas Sinjoh", file: "songs/main/johto/ruinas-sinjoh.mp3", image: "images/ruinas-sinjoh.png", group: "main", region: "Johto" },
  { title: "Ruta Helada", file: "songs/main/johto/ruta-helada.mp3", image: "images/ruta-helada.png", group: "main", region: "Johto" },
  { title: "Villa Raíz",  file: "songs/main/hoenn/villa-raiz.mp3",     image: "images/villa-raiz.png",   group: "main",  region: "Hoenn" },
  { title: "Pueblo Escaso",  file: "songs/main/hoenn/pueblo-escaso.mp3",     image: "images/pueblo-escaso.png",   group: "main",  region: "Hoenn" },
  { title: "Ciudad Férrica",  file: "songs/main/hoenn/ciudad-ferrica.mp3",     image: "images/ciudad-ferrica.png",   group: "main",  region: "Hoenn" },
  { title: "Pueblo Azuliza",  file: "songs/main/hoenn/pueblo-azuliza.mp3",     image: "images/pueblo-azuliza.png",   group: "main",  region: "Hoenn" },
  { title: "Ciudad Portual",  file: "songs/main/hoenn/ciudad-portual.mp3",     image: "images/ciudad-portual.png",   group: "main",  region: "Hoenn" },
  { title: "Pueblo Verdegal",  file: "songs/main/hoenn/pueblo-verdegal.mp3",     image: "images/pueblo-verdegal.png",   group: "main",  region: "Hoenn" },
  { title: "Pueblo Pardal",  file: "songs/main/hoenn/pueblo-pardal.mp3",     image: "images/pueblo-pardal.png",   group: "main",  region: "Hoenn" },
  { title: "Ciudad Arborada",  file: "songs/main/hoenn/ciudad-arborada.mp3",     image: "images/ciudad-arborada.png",   group: "main",  region: "Hoenn" },
  { title: "Ciudad Calagua",  file: "songs/main/hoenn/ciudad-calagua.mp3",     image: "images/ciudad-calagua.png",   group: "main",  region: "Hoenn" },
  { title: "Arrecípolis",  file: "songs/main/hoenn/arrecipolis.mp3",     image: "images/arrecipolis.png",   group: "main",  region: "Hoenn" },
  { title: "Ciudad Colosalia",  file: "songs/main/hoenn/ciudad-colosalia.mp3",     image: "images/ciudad-colosalia.png",   group: "main",  region: "Hoenn" },
  { title: "Ciudad Petalia",  file: "songs/main/hoenn/ciudad-petalia.mp3",     image: "images/ciudad-petalia.png",   group: "main",  region: "Hoenn" },
  { title: "Museo Oceánico",  file: "songs/main/hoenn/museo-oceanico.mp3",     image: "images/museo-oceanico.png",   group: "main",  region: "Hoenn" },
  { title: "Monte Pírico",  file: "songs/main/hoenn/monte-pirico.mp3",     image: "images/monte-pirico.png",   group: "main",  region: "Hoenn" },
  { title: "Frente de Batalla",  file: "songs/main/hoenn/frente-de-batalla.mp3",     image: "images/frente-de-batalla.png",   group: "main",  region: "Hoenn" },
  { title: "Barco del Sr. Arenque", file: "songs/main/hoenn/barco-sr-arenque.mp3", image: "images/barco-sr-arenque.png", group: "main", region: "Hoenn" },
  { title: "Buceo", file: "songs/main/hoenn/buceo-hoenn.mp3", image: "images/buceo-hoenn.png", group: "main", region: "Hoenn" },
  { title: "Cámara Sellada", file: "songs/main/hoenn/camara-sellada.mp3", image: "images/camara-sellada.png", group: "main", region: "Hoenn" },
  { title: "Cascada Meteoro", file: "songs/main/hoenn/cascada-meteoro.mp3", image: "images/cascada-meteoro.png", group: "main", region: "Hoenn" },
  { title: "Concurso Pokémon", file: "songs/main/hoenn/concurso-pokemon.mp3", image: "images/concurso-pokemon.png", group: "main", region: "Hoenn" },
  { title: "Desierto de Hoenn", file: "songs/main/hoenn/desierto-hoenn.mp3", image: "images/desierto-hoenn.png", group: "main", region: "Hoenn" },
  { title: "Guarida del Team Aqua/Magma", file: "songs/main/hoenn/guarida-equipo-aqua-magma.mp3", image: "images/guarida-equipo-aqua-magma.png", group: "main", region: "Hoenn" },
  { title: "Interior del Monte Pírico", file: "songs/main/hoenn/monte-pirico-interior.mp3", image: "images/monte-pirico-interior.png", group: "main", region: "Hoenn" },
  { title: "Nao Abandonada", file: "songs/main/hoenn/nao-abandonada.mp3", image: "images/nao-abandonada.png", group: "main", region: "Hoenn" },
  { title: "Pilar Celeste", file: "songs/main/hoenn/pilar-celeste.mp3", image: "images/pilar-celeste.png", group: "main", region: "Hoenn" },
  { title: "Ciudad Canal",  file: "songs/main/sinnoh/ciudad-canal.mp3",     image: "images/ciudad-canal.png",   group: "main",  region: "Sinnoh" },
  { title: "Ciudad Corazón",  file: "songs/main/sinnoh/ciudad-corazon.mp3",     image: "images/ciudad-corazon.png",   group: "main",  region: "Sinnoh" },
  { title: "Ciudad Jubileo",  file: "songs/main/sinnoh/ciudad-jubileo.mp3",     image: "images/ciudad-jubileo.png",   group: "main",  region: "Sinnoh" },
  { title: "Ciudad Marina",  file: "songs/main/sinnoh/ciudad-marina.mp3",     image: "images/ciudad-marina.png",   group: "main",  region: "Sinnoh" },
  { title: "Ciudad Pirita",  file: "songs/main/sinnoh/ciudad-pirita.mp3",     image: "images/ciudad-pirita.png",   group: "main",  region: "Sinnoh" },
  { title: "Ciudad Puntaneva",  file: "songs/main/sinnoh/ciudad-puntaneva.mp3",     image: "images/ciudad-puntaneva.png",   group: "main",  region: "Sinnoh" },
  { title: "Ciudad Rocavelo",  file: "songs/main/sinnoh/ciudad-rocavelo.mp3",     image: "images/ciudad-rocavelo.png",   group: "main",  region: "Sinnoh" },
  { title: "Ciudad Vetusta",  file: "songs/main/sinnoh/ciudad-vetusta.mp3",     image: "images/ciudad-vetusta.png",   group: "main",  region: "Sinnoh" },
  { title: "Pueblo Arena",  file: "songs/main/sinnoh/pueblo-arena.mp3",     image: "images/pueblo-arena.png",   group: "main",  region: "Sinnoh" },
  { title: "Pueblo Aromaflor",  file: "songs/main/sinnoh/pueblo-aromaflor.mp3",     image: "images/pueblo-aromaflor.png",   group: "main",  region: "Sinnoh" },
  { title: "Pueblo Hojaverde",  file: "songs/main/sinnoh/pueblo-hojaverde.mp3",     image: "images/pueblo-hojaverde.png",   group: "main",  region: "Sinnoh" },
  { title: "Liga Pokémon Sinnoh",  file: "songs/main/sinnoh/liga-sinnoh.mp3",     image: "images/liga-sinnoh.png",   group: "main",  region: "Sinnoh" },
  { title: "Lago Sinnoh",  file: "songs/main/sinnoh/lago.mp3",     image: "images/lago-sinnoh.png",   group: "main",  region: "Sinnoh" },
  { title: "Subsuelo",  file: "songs/main/sinnoh/subsuelo.mp3",     image: "images/subsuelo.png",   group: "main",  region: "Sinnoh" },
  { title: "Bosque Vetusto",  file: "songs/main/sinnoh/bosque-vetusto.mp3",     image: "images/bosque-vetusto.png",   group: "main",  region: "Sinnoh" },
  { title: "Pueblo Sosiego",  file: "songs/main/sinnoh/pueblo-sosiego.mp3",     image: "images/pueblo-sosiego.png",   group: "main",  region: "Sinnoh" },
  { title: "Sala Final de Cintia", file: "songs/main/sinnoh/cintia-sala-final.mp3", image: "images/cintia-sala-final.png", group: "main", region: "Sinnoh" },
  { title: "Orilla Valor", file: "songs/main/sinnoh/orilla-valor.mp3", image: "images/orilla-valor.png", group: "main", region: "Sinnoh" },
  { title: "Valle Eólico", file: "songs/main/sinnoh/valle-eolico.mp3", image: "images/valle-eolico.png", group: "main", region: "Sinnoh" },
  { title: "Ciudad Caolín",  file: "songs/main/teselia/ciudad-caolin.mp3",     image: "images/ciudad-caolin.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Engobe",  file: "songs/main/teselia/ciudad-engobe.mp3",     image: "images/ciudad-engobe.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Esmalte",  file: "songs/main/teselia/ciudad-esmalte.mp3",     image: "images/ciudad-esmalte.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Fayenza",  file: "songs/main/teselia/ciudad-fayenza.mp3",     image: "images/ciudad-fayenza.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Gres",  file: "songs/main/teselia/ciudad-gres.mp3",     image: "images/ciudad-gres.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Hormigón",  file: "songs/main/teselia/ciudad-hormigon.mp3",     image: "images/ciudad-hormigon.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Loza",  file: "songs/main/teselia/ciudad-loza.mp3",     image: "images/ciudad-loza.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Mayólica",  file: "songs/main/teselia/ciudad-mayolica.mp3",     image: "images/ciudad-mayolica.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Negra",  file: "songs/main/teselia/ciudad-negra.mp3",     image: "images/ciudad-negra.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Porcelana",  file: "songs/main/teselia/ciudad-porcelana.mp3",     image: "images/ciudad-porcelana.png",   group: "main",  region: "Teselia" },
  { title: "Ciudad Teja",  file: "songs/main/teselia/ciudad-teja.mp3",     image: "images/ciudad-teja.png",   group: "main",  region: "Teselia" },
  { title: "Pueblo Arcilla",  file: "songs/main/teselia/pueblo-arcilla.mp3",     image: "images/pueblo-arcilla.png",   group: "main",  region: "Teselia" },
  { title: "Pueblo Arenisca",  file: "songs/main/teselia/pueblo-arenisca.mp3",     image: "images/pueblo-arenisca.png",   group: "main",  region: "Teselia" },
  { title: "Pueblo Biscuit",  file: "songs/main/teselia/pueblo-biscuit.mp3",     image: "images/pueblo-biscuit.png",   group: "main",  region: "Teselia" },
  { title: "Pueblo Chamota",  file: "songs/main/teselia/pueblo-chamota.mp3",     image: "images/pueblo-chamota.png",   group: "main",  region: "Teselia" },
  { title: "Pueblo Ladrillo",  file: "songs/main/teselia/pueblo-ladrillo.mp3",     image: "images/pueblo-ladrillo.png",   group: "main",  region: "Teselia" },
  { title: "Pueblo Ocre",  file: "songs/main/teselia/pueblo-ocre.mp3",     image: "images/pueblo-ocre.png",   group: "main",  region: "Teselia" },
  { title: "Pueblo Terracota",  file: "songs/main/teselia/pueblo-terracota.mp3",     image: "images/pueblo-terracota.png",   group: "main",  region: "Teselia" },
  { title: "Bosque de los Perdidos", file: "songs/main/teselia/bosque-de-los-perdidos.mp3", image: "images/bosque-de-los-perdidos.png", group: "main", region: "Teselia" },
  { title: "Palacio de N", file: "songs/main/teselia/castillo-n.mp3", image: "images/castillo-n.png", group: "main", region: "Teselia" },
  { title: "Despedida de N", file: "songs/main/teselia/despedida-de-n.mp3", image: "images/despedida-de-n.png", group: "main", region: "Teselia" },
  { title: "Habitación de N", file: "songs/main/teselia/habitacion-n.mp3", image: "images/habitacion-n.png", group: "main", region: "Teselia" },
  { title: "Solar de los Sueños", file: "songs/main/teselia/solar-de-los-sueños.mp3", image: "images/solar-de-los-sueños.png", group: "main", region: "Teselia" },
  { title: "Torre Duodraco", file: "songs/main/teselia/torre-duodraco.mp3", image: "images/torre-duodraco.png", group: "main", region: "Teselia" },
  { title: "Un Corazón Inquebrantable", file: "songs/main/teselia/un-corazon-inquebrantable.mp3", image: "images/un-corazon-inquebrantable.png", group: "main", region: "Teselia" },
  { title: "Ciudad Batik",  file: "songs/main/kalos/ciudad-batik.mp3",     image: "images/ciudad-batik.png",   group: "main",  region: "Kalos" },
  { title: "Ciudad Fluxus",  file: "songs/main/kalos/ciudad-fluxus.mp3",     image: "images/ciudad-fluxus.png",   group: "main",  region: "Kalos" },
  { title: "Bosque Novarte",  file: "songs/main/kalos/bosque-novarte.mp3",     image: "images/bosque-novarte.png",   group: "main",  region: "Kalos" },
  { title: "Ciudad Fractal",  file: "songs/main/kalos/ciudad-fractal.mp3",     image: "images/ciudad-fractal.png",   group: "main",  region: "Kalos" },
  { title: "Ciudad Luminalia",  file: "songs/main/kalos/ciudad-luminalia.mp3",     image: "images/ciudad-luminalia.png",   group: "main",  region: "Kalos" },
  { title: "Ciudad Novarte",  file: "songs/main/kalos/ciudad-novarte.mp3",     image: "images/ciudad-novarte.png",   group: "main",  region: "Kalos" },
  { title: "Ciudad Relieve",  file: "songs/main/kalos/ciudad-relieve.mp3",     image: "images/ciudad-relieve.png",   group: "main",  region: "Kalos" },
  { title: "Ciudad Témpera",  file: "songs/main/kalos/ciudad-tempera.mp3",     image: "images/ciudad-tempera.png",   group: "main",  region: "Kalos" },
  { title: "Ciudad Yantra",  file: "songs/main/kalos/ciudad-yantra.mp3",     image: "images/ciudad-yantra.png",   group: "main",  region: "Kalos" },
  { title: "Pueblo Acuarela",  file: "songs/main/kalos/pueblo-acuarela.mp3",     image: "images/pueblo-acuarela.png",   group: "main",  region: "Kalos" },
  { title: "Pueblo Boceto",  file: "songs/main/kalos/pueblo-boceto.mp3",     image: "images/pueblo-boceto.png",   group: "main",  region: "Kalos" },
  { title: "Pueblo Crómlech",  file: "songs/main/kalos/pueblo-cromlech.mp3",     image: "images/pueblo-cromlech.png",   group: "main",  region: "Kalos" },
  { title: "Pueblo Fresco",  file: "songs/main/kalos/pueblo-fresco.mp3",     image: "images/pueblo-fresco.png",   group: "main",  region: "Kalos" },
  { title: "Pueblo Vánitas",  file: "songs/main/kalos/pueblo-vanitas.mp3",     image: "images/pueblo-vanitas.png",   group: "main",  region: "Kalos" },
  { title: "Palacio Cénit", file: "songs/main/kalos/palacio-cenit.mp3", image: "images/palacio-cenit.png", group: "main", region: "Kalos" },
  { title: "Cueva Brillante", file: "songs/main/kalos/cueva-brillante.mp3", image: "images/cueva-brillante.png", group: "main", region: "Kalos" },
  { title: "Fábrica de Poké Balls", file: "songs/main/kalos/fabrica-pokeballs.mp3", image: "images/fabrica-pokeballs.png", group: "main", region: "Kalos" },
  { title: "Ciudad Hauoli",  file: "songs/main/alola/ciudad-hauoli.mp3",     image: "images/ciudad-hauoli.png",   group: "main",  region: "Alola" },
  { title: "Ciudad Kantai",  file: "songs/main/alola/ciudad-kantai.mp3",     image: "images/ciudad-kantai.png",   group: "main",  region: "Alola" },
  { title: "Ciudad Konikoni",  file: "songs/main/alola/ciudad-konikoni.mp3",     image: "images/ciudad-konikoni.png",   group: "main",  region: "Alola" },
  { title: "Ciudad Malíe",  file: "songs/main/alola/ciudad-malie.mp3",     image: "images/ciudad-malie.png",   group: "main",  region: "Alola" },
  { title: "Pueblo Lilii",  file: "songs/main/alola/pueblo-lilii.mp3",     image: "images/pueblo-lilii.png",   group: "main",  region: "Alola" },
  { title: "Pueblo Ohana",  file: "songs/main/alola/pueblo-ohana.mp3",     image: "images/pueblo-ohana.png",   group: "main",  region: "Alola" },
  { title: "Pueblo Po",  file: "songs/main/alola/pueblo-po.mp3",     image: "images/pueblo-po.png",   group: "main",  region: "Alola" },
  { title: "Cañón de Poni",  file: "songs/main/alola/cañon-poni.mp3",     image: "images/cañon-poni.png",   group: "main",  region: "Alola" },
  { title: "Paraíso Aether",  file: "songs/main/alola/paraiso-aether.mp3",     image: "images/paraiso-aether.png",   group: "main",  region: "Alola" },
  { title: "Aldea Marina",  file: "songs/main/alola/aldea-marina.mp3",     image: "images/aldea-marina.png",   group: "main",  region: "Alola" },
  { title: "Escuela de Entrenadores", file: "songs/main/alola/escuela-de-entrenadores.mp3", image: "images/escuela-de-entrenadores.png", group: "main", region: "Alola" },
  { title: "Cueva Sotobosque", file: "songs/main/alola/cueva-sotobosque.mp3", image: "images/cueva-sotobosque.png", group: "main", region: "Alola" },
  { title: "Colina Dequilate", file: "songs/main/alola/colina-dequilate.mp3", image: "images/colina-dequilate.png", group: "main", region: "Alola" },
  { title: "Avenida Royale", file: "songs/main/alola/avenida-royale.mp3", image: "images/avenida-royale.png", group: "main", region: "Alola" },
  { title: "Poké Resort", file: "songs/main/alola/poke-resort.mp3", image: "images/poke-resort.png", group: "main", region: "Alola" },

  // Combate — (sustituye "NOMBRE-CANCION-X" y "Combate XXX" por el nombre y archivo reales; añade tantas líneas como necesites)
  { title: "Salvaje Kanto",        file: "songs/main/combate/salvaje-kanto.mp3", image: "images/salvaje-kanto.png", group: "combat", region: "Combate" },
  { title: "Salvaje Johto",        file: "songs/main/combate/salvaje-johto.mp3", image: "images/salvaje-johto.png", group: "combat", region: "Combate" },
  { title: "Salvaje Hoenn",        file: "songs/main/combate/salvaje-hoenn.mp3", image: "images/salvaje-hoenn.png", group: "combat", region: "Combate" },
  { title: "Salvaje Sinnoh",        file: "songs/main/combate/salvaje-sinnoh.mp3", image: "images/salvaje-sinnoh.png", group: "combat", region: "Combate" },
  { title: "Salvaje Teselia",        file: "songs/main/combate/salvaje-teselia.mp3", image: "images/salvaje-teselia.png", group: "combat", region: "Combate" },
  { title: "Salvaje Kalos",        file: "songs/main/combate/salvaje-kalos.mp3", image: "images/salvaje-kalos.png", group: "combat", region: "Combate" },
  { title: "Salvaje Alola",        file: "songs/main/combate/salvaje-alola.mp3", image: "images/salvaje-alola.png", group: "combat", region: "Combate" },
  { title: "Rival Johto", file: "songs/main/combate/rival-johto.mp3", image: "images/rival-johto.png", group: "combat", region: "Combate" },
  { title: "Rival Hoenn", file: "songs/main/combate/rival-hoenn.mp3", image: "images/rival-hoenn.png", group: "combat", region: "Combate" },
  { title: "Rival Sinnoh", file: "songs/main/combate/rival-sinnoh.mp3", image: "images/rival-sinnoh.png", group: "combat", region: "Combate" },
  { title: "Rival Teselia", file: "songs/main/combate/rival-teselia.mp3", image: "images/rival-teselia.png", group: "combat", region: "Combate" },
  { title: "Rival Alola", file: "songs/main/combate/rival-alola.mp3", image: "images/rival-alola.png", group: "combat", region: "Combate" },
  { title: "Amigos Kalos", file: "songs/main/combate/amigos-kalos.mp3", image: "images/amigos-kalos.png", group: "combat", region: "Combate" },
  { title: "Gimnasio Kanto", file: "songs/main/combate/gym-kanto.mp3", image: "images/gym-kanto.png", group: "combat", region: "Combate" },
  { title: "Gimnasio Johto", file: "songs/main/combate/gym-johto.mp3", image: "images/gym-johto.png", group: "combat", region: "Combate" },
  { title: "Gimnasio Hoenn", file: "songs/main/combate/gym-hoenn.mp3", image: "images/gym-hoenn.png", group: "combat", region: "Combate" },
  { title: "Gimnasio Sinnoh", file: "songs/main/combate/gym-sinnoh.mp3", image: "images/gym-sinnoh.png", group: "combat", region: "Combate" },
  { title: "Primeros Gimnasios Teselia", file: "songs/main/combate/gym-teselia1.mp3", image: "images/gym-teselia1.png", group: "combat", region: "Combate" },
  { title: "Últimos Gimnasios Teselia", file: "songs/main/combate/gym-teselia2.mp3", image: "images/gym-teselia2.png", group: "combat", region: "Combate" },
  { title: "Gimnasio Kalos", file: "songs/main/combate/gym-kalos.mp3", image: "images/gym-kalos.png", group: "combat", region: "Combate" },
  { title: "Kahuna", file: "songs/main/combate/kahuna.mp3", image: "images/kahuna.png", group: "combat", region: "Combate" },
  { title: "Entrenador Kanto", file: "songs/main/combate/entrenador-kanto.mp3", image: "images/entrenador-kanto.png", group: "combat", region: "Combate" },
  { title: "Entrenador Johto", file: "songs/main/combate/entrenador-johto.mp3", image: "images/entrenador-johto.png", group: "combat", region: "Combate" },
  { title: "Entrenador Hoenn", file: "songs/main/combate/entrenador-hoenn.mp3", image: "images/entrenador-hoenn.png", group: "combat", region: "Combate" },
  { title: "Entrenador Sinnoh", file: "songs/main/combate/entrenador-sinnoh.mp3", image: "images/entrenador-sinnoh.png", group: "combat", region: "Combate" },
  { title: "Entrenador Teselia", file: "songs/main/combate/entrenador-teselia.mp3", image: "images/entrenador-teselia.png", group: "combat", region: "Combate" },
  { title: "Entrenador Kalos", file: "songs/main/combate/entrenador-kalos.mp3", image: "images/entrenador-kalos.png", group: "combat", region: "Combate" },
  { title: "Entrenador Alola", file: "songs/main/combate/entrenador-alola.mp3", image: "images/entrenador-alola.png", group: "combat", region: "Combate" },
  { title: "Alto Mando Hoenn", file: "songs/main/combate/alto-mando-hoenn.mp3", image: "images/alto-mando-hoenn.png", group: "combat", region: "Combate" },
  { title: "Alto Mando Sinnoh", file: "songs/main/combate/alto-mando-sinnoh.mp3", image: "images/alto-mando-sinnoh.png", group: "combat", region: "Combate" },
  { title: "Alto Mando Teselia", file: "songs/main/combate/alto-mando-teselia.mp3", image: "images/alto-mando-teselia.png", group: "combat", region: "Combate" },
  { title: "Alto Mando Kalos", file: "songs/main/combate/alto-mando-kalos.mp3", image: "images/alto-mando-kalos.png", group: "combat", region: "Combate" },
  { title: "Alto Mando Alola", file: "songs/main/combate/alto-mando-alola.mp3", image: "images/alto-mando-alola.png", group: "combat", region: "Combate" },
  { title: "Pokémon Dominante", file: "songs/main/combate/alfa.mp3", image: "images/alfa.png", group: "combat", region: "Combate" },
  { title: "Campeón Azul", file: "songs/main/combate/azul.mp3", image: "images/azul.png", group: "combat", region: "Combate" },
  { title: "Arceus", file: "songs/main/combate/arceus.mp3", image: "images/arceus.png", group: "combat", region: "Combate" },
  { title: "Campeona Cintia", file: "songs/main/combate/cynthia.mp3", image: "images/cynthia.png", group: "combat", region: "Combate" },
  { title: "Campeona Dianta", file: "songs/main/combate/dianta.mp3", image: "images/dianta.png", group: "combat", region: "Combate" },
  { title: "Deoxys", file: "songs/main/combate/deoxys.mp3", image: "images/deoxys.png", group: "combat", region: "Combate" },
  { title: "Ghechis", file: "songs/main/combate/ghechis.mp3", image: "images/ghechis.png", group: "combat", region: "Combate" },
  { title: "Giratina", file: "songs/main/combate/giratina.mp3", image: "images/giratina.png", group: "combat", region: "Combate" },
  { title: "Guzmán", file: "songs/main/combate/guzman.mp3", image: "images/guzman.png", group: "combat", region: "Combate" },
  { title: "Campeón Kukui", file: "songs/main/combate/kukui.mp3", image: "images/kukui.png", group: "combat", region: "Combate" },
  { title: "Helio", file: "songs/main/combate/helio.mp3", image: "images/helio.png", group: "combat", region: "Combate" },
  { title: "Kyogre / Groudon", file: "songs/main/combate/kyogre-groudon.mp3", image: "images/kyogre-groudon.png", group: "combat", region: "Combate" },
  { title: "Campeón Lance", file: "songs/main/combate/lance.mp3", image: "images/lance.png", group: "combat", region: "Combate" },
  { title: "Uxie/Mesprit/Azelf", file: "songs/main/combate/lago.mp3", image: "images/lago.png", group: "combat", region: "Combate" },
  { title: "Legendario Kanto", file: "songs/main/combate/legendario-kanto.mp3", image: "images/legendario-kanto.png", group: "combat", region: "Combate" },
  { title: "Campeón Máximo", file: "songs/main/combate/maximo.mp3", image: "images/maximo.png", group: "combat", region: "Combate" },
  { title: "Lysson", file: "songs/main/combate/lysson.mp3", image: "images/lysson.png", group: "combat", region: "Combate" },
  { title: "Aquiles / Magno", file: "songs/main/combate/magno-aquiles.mp3", image: "images/magno-aquiles.png", group: "combat", region: "Combate" },
  { title: "N", file: "songs/main/combate/n.mp3", image: "images/n.png", group: "combat", region: "Combate" },
  { title: "Palkia / Dialga", file: "songs/main/combate/palkia-dialga.mp3", image: "images/palkia-dialga.png", group: "combat", region: "Combate" },
  { title: "Reshiram / Zekrom", file: "songs/main/combate/reshiram-zekrom.mp3", image: "images/reshiram-zekrom.png", group: "combat", region: "Combate" },
  { title: "Samina", file: "songs/main/combate/samina.mp3", image: "images/samina.png", group: "combat", region: "Combate" },
  { title: "Solgaleo / Lunala", file: "songs/main/combate/solgaleo-lunala.mp3", image: "images/solgaleo-lunala.png", group: "combat", region: "Combate" },
  { title: "Tapus", file: "songs/main/combate/tapus.mp3", image: "images/tapus.png", group: "combat", region: "Combate" },
  { title: "Team Rocket", file: "songs/main/combate/team-rocket.mp3", image: "images/team-rocket.png", group: "combat", region: "Combate" },
  { title: "Team Aqua / Magma", file: "songs/main/combate/team-aqua-magma.mp3", image: "images/team-aqua-magma.png", group: "combat", region: "Combate" },
  { title: "Team Galaxia", file: "songs/main/combate/team-galaxia.mp3", image: "images/team-galaxia.png", group: "combat", region: "Combate" },
  { title: "Team Plasma", file: "songs/main/combate/team-plasma.mp3", image: "images/team-plasma.png", group: "combat", region: "Combate" },
  { title: "Team Flare", file: "songs/main/combate/team-flare.mp3", image: "images/team-flare.png", group: "combat", region: "Combate" },
  { title: "Team Skull", file: "songs/main/combate/team-skull.mp3", image: "images/team-skull.png", group: "combat", region: "Combate" },
  { title: "Team Aether", file: "songs/main/combate/team-aether.mp3", image: "images/team-aether.png", group: "combat", region: "Combate" },
  { title: "Xerneas / Yveltal", file: "songs/main/combate/xerneas-yveltal.mp3", image: "images/xerneas-yveltal.png", group: "combat", region: "Combate" },
  { title: "Lugia", file: "songs/main/combate/lugia.mp3", image: "images/lugia.png", group: "combat", region: "Combate" },
  { title: "Ho-Oh", file: "songs/main/combate/ho-oh.mp3", image: "images/ho-oh.png", group: "combat", region: "Combate" },
  { title: "Entei", file: "songs/main/combate/entei.mp3", image: "images/entei.png", group: "combat", region: "Combate" },
  { title: "Raikou", file: "songs/main/combate/raikou.mp3", image: "images/raikou.png", group: "combat", region: "Combate" },
  { title: "Regis", file: "songs/main/combate/regis.mp3", image: "images/regis.png", group: "combat", region: "Combate" },
  { title: "Suicune", file: "songs/main/combate/suicune.mp3", image: "images/suicune.png", group: "combat", region: "Combate" },

  // ── Other — Minijuegos ──
  // "other" debe coincidir con la clave usada en data-other / OTHER_CATEGORIES:
  //   "centro-pokemon" → songs/other/centro-pokemon/centro-pokemon-<region>.mp3
  //   "laboratorios"   → songs/other/laboratorio/lab-<region>.mp3
  //   "bicicletas"     → songs/other/bicicleta/bici-<region>.mp3
  //   "surf"           → songs/other/surf/surf-<region>.mp3
  //   "mystery-dungeon" → songs/other/mistery-dungeon/<pista>.mp3
  //   "colosseum-xd"    → songs/other/colosseum-xd/<pista>.mp3
  //   "ranger"          → songs/other/ranger/<pista>.mp3
  //   "title-screens"   → songs/other/title/<region-en-minusculas>.mp3
  //   "openings-anime"  → tres rutas distintas según el doblaje/idioma (ver el
  //                        bloque "Openings del Anime" más abajo, con `variant`):
  //                          España (sin `variant`): songs/other/openings/españa/<archivo>.mp3
  //                          Latino (`variant: "latino"`): songs/openings/latino/<archivo>.mp3
  //                          Inglés (`variant: "english"`): songs/openings/english/<archivo>.mp3
  //                        Las tres comparten el mismo nombre de archivo y la misma
  //                        imagen (images/<archivo>.png), solo cambia la carpeta.
  // Sustituye/completa file e image con tus rutas reales; puedes añadir tantas
  // canciones por categoría como quieras (no hace falta que sea 1 por región).

  // Laboratorios
  { title: "Laboratorio Kanto",   file: "songs/other/laboratorio/lab-kanto.mp3",    image: "images/lab-kanto.png",    group: "other", other: "laboratorios" },
  { title: "Laboratorio Johto",   file: "songs/other/laboratorio/lab-johto.mp3",    image: "images/lab-johto.png",    group: "other", other: "laboratorios" },
  { title: "Laboratorio Hoenn",   file: "songs/other/laboratorio/lab-hoenn.mp3",    image: "images/lab-hoenn.png",    group: "other", other: "laboratorios" },
  { title: "Laboratorio Sinnoh",  file: "songs/other/laboratorio/lab-sinnoh.mp3",   image: "images/lab-sinnoh.png",   group: "other", other: "laboratorios" },
  { title: "Laboratorio Teselia", file: "songs/other/laboratorio/lab-teselia.mp3",  image: "images/lab-teselia.png",  group: "other", other: "laboratorios" },
  { title: "Laboratorio Kalos",   file: "songs/other/laboratorio/lab-kalos.mp3",    image: "images/lab-kalos.png",    group: "other", other: "laboratorios" },
  { title: "Laboratorio Alola",   file: "songs/other/laboratorio/lab-alola.mp3",    image: "images/lab-alola.png",    group: "other", other: "laboratorios" },

  // Bicicletas
  { title: "Bicicleta Kanto",   file: "songs/other/bicicleta/bici-kanto.mp3",    image: "images/bici-kanto.png",    group: "other", other: "bicicletas" },
  { title: "Bicicleta Johto",   file: "songs/other/bicicleta/bici-johto.mp3",    image: "images/bici-johto.png",    group: "other", other: "bicicletas" },
  { title: "Bicicleta Hoenn",   file: "songs/other/bicicleta/bici-hoenn.mp3",    image: "images/bici-hoenn.png",    group: "other", other: "bicicletas" },
  { title: "Bicicleta Sinnoh",  file: "songs/other/bicicleta/bici-sinnoh.mp3",   image: "images/bici-sinnoh.png",   group: "other", other: "bicicletas" },
  { title: "Bicicleta Teselia", file: "songs/other/bicicleta/bici-teselia.mp3",  image: "images/bici-teselia.png",  group: "other", other: "bicicletas" },
  { title: "Bicicleta Kalos",   file: "songs/other/bicicleta/bici-kalos.mp3",    image: "images/bici-kalos.png",    group: "other", other: "bicicletas" },
  { title: "Montura Alola",   file: "songs/other/bicicleta/bici-alola.mp3",    image: "images/bici-alola.png",    group: "other", other: "bicicletas" },

  // Centro Pokémon
  { title: "Centro Pokémon Kanto",   file: "songs/other/centro-pokemon/centro-pokemon-kanto.mp3",    image: "images/centro-pokemon-kanto.png",    group: "other", other: "centro-pokemon" },
  { title: "Centro Pokémon Johto",   file: "songs/other/centro-pokemon/centro-pokemon-johto.mp3",    image: "images/centro-pokemon-johto.png",    group: "other", other: "centro-pokemon" },
  { title: "Centro Pokémon Hoenn",   file: "songs/other/centro-pokemon/centro-pokemon-hoenn.mp3",    image: "images/centro-pokemon-hoenn.png",    group: "other", other: "centro-pokemon" },
  { title: "Centro Pokémon Sinnoh",  file: "songs/other/centro-pokemon/centro-pokemon-sinnoh.mp3",   image: "images/centro-pokemon-sinnoh.png",   group: "other", other: "centro-pokemon" },
  { title: "Centro Pokémon Teselia", file: "songs/other/centro-pokemon/centro-pokemon-teselia.mp3",  image: "images/centro-pokemon-teselia.png",  group: "other", other: "centro-pokemon" },
  { title: "Centro Pokémon Kalos",   file: "songs/other/centro-pokemon/centro-pokemon-kalos.mp3",    image: "images/centro-pokemon-kalos.png",    group: "other", other: "centro-pokemon" },
  { title: "Centro Pokémon Alola",   file: "songs/other/centro-pokemon/centro-pokemon-alola.mp3",    image: "images/centro-pokemon-alola.png",    group: "other", other: "centro-pokemon" },

  // Surf
  { title: "Surf Kanto",   file: "songs/other/surf/surf-kanto.mp3",    image: "images/surf-kanto.png",    group: "other", other: "surf" },
  { title: "Surf Johto",   file: "songs/other/surf/surf-johto.mp3",    image: "images/surf-johto.png",    group: "other", other: "surf" },
  { title: "Surf Hoenn",   file: "songs/other/surf/surf-hoenn.mp3",    image: "images/surf-hoenn.png",    group: "other", other: "surf" },
  { title: "Surf Sinnoh",  file: "songs/other/surf/surf-sinnoh.mp3",   image: "images/surf-sinnoh.png",   group: "other", other: "surf" },
  { title: "Surf Teselia", file: "songs/other/surf/surf-teselia.mp3",  image: "images/surf-teselia.png",  group: "other", other: "surf" },
  { title: "Surf Kalos",   file: "songs/other/surf/surf-kalos.mp3",    image: "images/surf-kalos.png",    group: "other", other: "surf" },
  { title: "Montura Acuática Alola",   file: "songs/other/surf/surf-alola.mp3",    image: "images/surf-alola.png",    group: "other", other: "surf" },

  // Pokémon Mundo Misterioso
  { title: "Arboleda Chica", file: "songs/other/mistery-dungeon/arboleda-chica.mp3", image: "images/arboleda-chica.png", group: "other", other: "mystery-dungeon" },
  { title: "Base Equipo", file: "songs/other/mistery-dungeon/base-equipo.mp3", image: "images/base-equipo.png", group: "other", other: "mystery-dungeon" },
  { title: "Bosque Helado", file: "songs/other/mistery-dungeon/bosque-helado.mp3", image: "images/bosque-helado.png", group: "other", other: "mystery-dungeon" },
  { title: "Bosque Niebla", file: "songs/other/mistery-dungeon/bosque-niebla.mp3", image: "images/bosque-niebla.png", group: "other", other: "mystery-dungeon" },
  { title: "Bosque Sombrío", file: "songs/other/mistery-dungeon/bosque-sombrio.mp3", image: "images/bosque-sombrio.png", group: "other", other: "mystery-dungeon" },
  { title: "Bosque Tétrico", file: "songs/other/mistery-dungeon/bosque-tetrico.mp3", image: "images/bosque-tetrico.png", group: "other", other: "mystery-dungeon" },
  { title: "Caverna Magma", file: "songs/other/mistery-dungeon/caverna-magma.mp3", image: "images/caverna-magma.png", group: "other", other: "mystery-dungeon" },
  { title: "Colina Oscura", file: "songs/other/mistery-dungeon/colina-oscura.mp3", image: "images/colina-oscura.png", group: "other", other: "mystery-dungeon" },
  { title: "Cueva Abismo", file: "songs/other/mistery-dungeon/cueva-abismo.mp3", image: "images/cueva-abismo.png", group: "other", other: "mystery-dungeon" },
  { title: "Cueva Bajamar", file: "songs/other/mistery-dungeon/cueva-bajamar.mp3", image: "images/cueva-bajamar.png", group: "other", other: "mystery-dungeon" },
  { title: "Cueva Cristal", file: "songs/other/mistery-dungeon/cueva-cristal.mp3", image: "images/cueva-cristal.png", group: "other", other: "mystery-dungeon" },
  { title: "Desierto Norte", file: "songs/other/mistery-dungeon/desierto-norte.mp3", image: "images/desierto-norte.png", group: "other", other: "mystery-dungeon" },
  { title: "Dialga Primario", file: "songs/other/mistery-dungeon/dialga-primario.mp3", image: "images/dialga-primario.png", group: "other", other: "mystery-dungeon" },
  { title: "Dojo Makuhita", file: "songs/other/mistery-dungeon/dojo-makuhita.mp3", image: "images/dojo-makuhita.png", group: "other", other: "mystery-dungeon" },
  { title: "Fugitivos", file: "songs/other/mistery-dungeon/fugitivos.mp3", image: "images/fugitivos.png", group: "other", other: "mystery-dungeon" },
  { title: "Gran Cañón", file: "songs/other/mistery-dungeon/gran-cañon.mp3", image: "images/gran-cañon.png", group: "other", other: "mystery-dungeon" },
  { title: "Manzanar", file: "songs/other/mistery-dungeon/manzanar.mp3", image: "images/manzanar.png", group: "other", other: "mystery-dungeon" },
  { title: "A Través del Mar del Tiempo", file: "songs/other/mistery-dungeon/mar-tiempo.mp3", image: "images/mar-tiempo.png", group: "other", other: "mystery-dungeon" },
  { title: "Mina Onda Trueno", file: "songs/other/mistery-dungeon/mina-onda-trueno.mp3", image: "images/mina-onda-trueno.png", group: "other", other: "mystery-dungeon" },
  { title: "Monte Acero", file: "songs/other/mistery-dungeon/monte-acero.mp3", image: "images/monte-acero.png", group: "other", other: "mystery-dungeon" },
  { title: "Monte Árido", file: "songs/other/mistery-dungeon/monte-arido.mp3", image: "images/monte-arido.png", group: "other", other: "mystery-dungeon" },
  { title: "Monte Escarcha", file: "songs/other/mistery-dungeon/monte-escarcha.mp3", image: "images/monte-escarcha.png", group: "other", other: "mystery-dungeon" },
  { title: "Monte Ígneo", file: "songs/other/mistery-dungeon/monte-igneo.mp3", image: "images/monte-igneo.png", group: "other", other: "mystery-dungeon" },
  { title: "Monte Trueno", file: "songs/other/mistery-dungeon/monte-trueno.mp3", image: "images/monte-trueno.png", group: "other", other: "mystery-dungeon" },
  { title: "Plaza Pokémon", file: "songs/other/mistery-dungeon/plaza-pokemon.mp3", image: "images/plaza-pokemon.png", group: "other", other: "mystery-dungeon" },
  { title: "Pokégremio", file: "songs/other/mistery-dungeon/pokegremio.mp3", image: "images/pokegremio.png", group: "other", other: "mystery-dungeon" },
  { title: "Risco Calado", file: "songs/other/mistery-dungeon/risco-calado.mp3", image: "images/risco-calado.png", group: "other", other: "mystery-dungeon" },
  { title: "Sima Silenciosa", file: "songs/other/mistery-dungeon/sima-silenciosa.mp3", image: "images/sima-silenciosa.png", group: "other", other: "mystery-dungeon" },
  { title: "Test Personalidad", file: "songs/other/mistery-dungeon/test-personalidad.mp3", image: "images/test-personalidad.png", group: "other", other: "mystery-dungeon" },
  { title: "Torre Del Cielo", file: "songs/other/mistery-dungeon/torre-del-cielo.mp3", image: "images/torre-del-cielo.png", group: "other", other: "mystery-dungeon" },
  // Pokémon Colosseum / XD
  { title: "Básix",                 file: "songs/other/colosseum-xd/basix.mp3",                 image: "images/basix.png",                 group: "other", other: "colosseum-xd" },
  { title: "Ciudad Oasis",                  file: "songs/other/colosseum-xd/ciudad-oasis.mp3",                   image: "images/ciudad-oasis.png",                   group: "other", other: "colosseum-xd" },
  { title: "Guarida Equipo Cepo",              file: "songs/other/colosseum-xd/guarida-equipo-cepo.mp3",              image: "images/guarida-equipo-cepo.png",              group: "other", other: "colosseum-xd" },
  { title: "Laboratorio Aura",               file: "songs/other/colosseum-xd/laboratorio-aura.mp3",               image: "images/laboratorio-aura.png",                group: "other", other: "colosseum-xd" },
  { title: "Laboratorio Pokémon Oscuros",                file: "songs/other/colosseum-xd/laboratorio-pokemon-oscuros.mp3",                 image: "images/laboratorio-pokemon-oscuros.png",                  group: "other", other: "colosseum-xd" },
  { title: "Monte Batalla",             file: "songs/other/colosseum-xd/monte-batalla.mp3",             image: "images/monte-batalla.png",              group: "other", other: "colosseum-xd" },
  { title: "Pilar Legendario",                   file: "songs/other/colosseum-xd/pilar-legendario.mp3",                   image: "images/pilar-legendario.png",                    group: "other", other: "colosseum-xd" },
  { title: "Pueblo Pirita",                   file: "songs/other/colosseum-xd/pueblo-pirita.mp3",                   image: "images/pueblo-pirita.png",                    group: "other", other: "colosseum-xd" },
  { title: "Puerto Ancla",                   file: "songs/other/colosseum-xd/puerto-ancla.mp3",                   image: "images/puerto-ancla.png",                    group: "other", other: "colosseum-xd" },
  { title: "Puesto de Servicio",                   file: "songs/other/colosseum-xd/puesto-de-servicio.mp3",                   image: "images/puesto-de-servicio.png",                    group: "other", other: "colosseum-xd" },
  { title: "Torre Colosal",                   file: "songs/other/colosseum-xd/torre-colosal.mp3",                   image: "images/torre-colosal.png",                    group: "other", other: "colosseum-xd" },
  { title: "Villa Ágata",                   file: "songs/other/colosseum-xd/villa-agata.mp3",                   image: "images/villa-agata.png",                    group: "other", other: "colosseum-xd" },

  // Pokémon Ranger
  { title: "Bosque Lira",              file: "songs/other/ranger/bosque-lira.mp3",                    image: "images/bosque-lira.png",               group: "other", other: "ranger" },
  { title: "Buceo",              file: "songs/other/ranger/buceo.mp3",                    image: "images/buceo.png",               group: "other", other: "ranger" },
  { title: "Escuela Ranger",              file: "songs/other/ranger/escuela-ranger.mp3",                    image: "images/escuela-ranger.png",               group: "other", other: "ranger" },
  { title: "Fábrica Turnoche",     file: "songs/other/ranger/fabrica-turnoche.mp3",                  image: "images/fabrica-turnoche.png",             group: "other", other: "ranger" },
  { title: "Otonia",             file: "songs/other/ranger/otonia.mp3",                   image: "images/otonia.png",              group: "other", other: "ranger" },
  { title: "Puerto de Otonia",               file: "songs/other/ranger/puerto-otonia.mp3",                     image: "images/puerto-otonia.png",                group: "other", other: "ranger" },
  { title: "Base Ranger",               file: "songs/other/ranger/ranger-base.mp3",                     image: "images/ranger-base.png",                group: "other", other: "ranger" },
  { title: "Red Ranger",               file: "songs/other/ranger/red-ranger.mp3",                     image: "images/red-ranger.png",                group: "other", other: "ranger" },
  { title: "Unión Ranger",               file: "songs/other/ranger/union-ranger.mp3",                     image: "images/union-ranger.png",                group: "other", other: "ranger" },
  { title: "Villavera",               file: "songs/other/ranger/villavera.mp3",                     image: "images/villavera.png",                group: "other", other: "ranger" },

  // Pantallas de Título
  { title: "Pantalla de Título Kanto",    file: "songs/other/title/kanto.mp3",    image: "images/titulo-kanto.png",    group: "other", other: "title-screens" },
  { title: "Pantalla de Título Johto",    file: "songs/other/title/johto.mp3",    image: "images/titulo-johto.png",    group: "other", other: "title-screens" },
  { title: "Pantalla de Título Hoenn",    file: "songs/other/title/hoenn.mp3",    image: "images/titulo-hoenn.png",    group: "other", other: "title-screens" },
  { title: "Pantalla de Título Sinnoh",   file: "songs/other/title/sinnoh.mp3",   image: "images/titulo-sinnoh.png",   group: "other", other: "title-screens" },
  { title: "Pantalla de Título Teselia",  file: "songs/other/title/teselia.mp3",  image: "images/titulo-teselia.png",  group: "other", other: "title-screens" },
  { title: "Pantalla de Título Kalos",    file: "songs/other/title/kalos.mp3",    image: "images/titulo-kalos.png",    group: "other", other: "title-screens" },
  { title: "Pantalla de Título Alola",    file: "songs/other/title/alola.mp3",    image: "images/titulo-alola.png",    group: "other", other: "title-screens" },

  // Openings del Anime
  // Cada opening real tiene hasta tres entradas (misma canción, distinto doblaje/
  // idioma), reconocibles porque comparten `title` (y por tanto la misma imagen,
  // images/<archivo>.png — ver la nota "Las diferentes versiones de la misma
  // canción deben estar asociadas a la misma imagen"):
  //   - Doblaje España (sin `variant`): songs/other/openings/españa/<archivo>.mp3.
  //     Es la que se usa jugando en español y eligiendo "Español de España" en la
  //     pantalla previa (screen-openings-lang-select), y también la que se usaría
  //     si algún día hay un idioma que no sea "es" ni "en" sin variante propia.
  //   - Doblaje Latino (`variant: "latino"`): songs/openings/latino/<archivo>.mp3.
  //     Solo entra en el pool si el jugador elige "Español Latino" en esa misma
  //     pantalla previa (ver session.openingsVariant y buildPool()).
  //   - Versión inglesa (`variant: "english"`): songs/openings/english/<archivo>.mp3.
  //     Es la única que se usa jugando con settings.language === "en" (sin pantalla
  //     previa: buildPool() la fuerza directamente, ver el comentario de ahí).
  { title: "Hazte con Todos",                     file: "songs/other/openings/españa/hazte-con-todos.mp3",                     image: "images/hazte-con-todos.png",                     group: "other", other: "openings-anime", sonidexId: "hazte-con-todos" },
  { title: "Aventuras en las Islas Naranja",      file: "songs/other/openings/españa/aventuras-en-las-islas-naranja.mp3",      image: "images/aventuras-en-las-islas-naranja.png",      group: "other", other: "openings-anime", sonidexId: "aventuras-en-las-islas-naranja" },
  { title: "Los Viajes de Johto",                 file: "songs/other/openings/españa/los-viajes-johto.mp3",                    image: "images/los-viajes-johto.png",                    group: "other", other: "openings-anime", sonidexId: "los-viajes-johto" },
  { title: "Los Campeones de la Liga de Johto",   file: "songs/other/openings/españa/los-campeones-de-la-liga-de-johto.mp3",   image: "images/los-campeones-de-la-liga-de-johto.png",   group: "other", other: "openings-anime", sonidexId: "los-campeones-de-la-liga-de-johto" },
  { title: "Master Quest",                        file: "songs/other/openings/españa/master-quest.mp3",                        image: "images/master-quest.png",                        group: "other", other: "openings-anime", sonidexId: "master-quest" },
  { title: "Advanced",                            file: "songs/other/openings/españa/advanced.mp3",                            image: "images/advanced.png",                            group: "other", other: "openings-anime", sonidexId: "advanced" },
  { title: "Advanced Challenge",                  file: "songs/other/openings/españa/advanced-challenge.mp3",                  image: "images/advanced-challenge.png",                  group: "other", other: "openings-anime", sonidexId: "advanced-challenge" },
  { title: "Advanced Battle",                     file: "songs/other/openings/españa/advanced-battle.mp3",                     image: "images/advanced-battle.png",                     group: "other", other: "openings-anime", sonidexId: "advanced-battle" },
  { title: "Battle Frontier",                     file: "songs/other/openings/españa/battle-frontier.mp3",                     image: "images/battle-frontier.png",                     group: "other", other: "openings-anime", sonidexId: "battle-frontier" },
  { title: "Diamante y Perla",                    file: "songs/other/openings/españa/diamante-perla.mp3",                      image: "images/diamante-perla.png",                      group: "other", other: "openings-anime", sonidexId: "diamante-perla" },
  { title: "Battle Dimension",                    file: "songs/other/openings/españa/battle-dimension.mp3",                    image: "images/battle-dimension.png",                    group: "other", other: "openings-anime", sonidexId: "battle-dimension" },
  { title: "Combates Galácticos",                 file: "songs/other/openings/españa/combates-galacticos.mp3",                 image: "images/combates-galacticos.png",                 group: "other", other: "openings-anime", sonidexId: "combates-galacticos" },
  { title: "Los Vencedores de la Liga de Sinnoh",  file: "songs/other/openings/españa/los-vencedores-de-la-liga-de-sinnoh.mp3", image: "images/los-vencedores-de-la-liga-de-sinnoh.png", group: "other", other: "openings-anime", sonidexId: "los-vencedores-de-la-liga-de-sinnoh" },
  { title: "Blanco y Negro",                      file: "songs/other/openings/españa/negro-y-blanco.mp3",                      image: "images/negro-y-blanco.png",                      group: "other", other: "openings-anime", sonidexId: "negro-y-blanco" },
  { title: "Destinos Rivales",                    file: "songs/other/openings/españa/destinos-rivales.mp3",                    image: "images/destinos-rivales.png",                    group: "other", other: "openings-anime", sonidexId: "destinos-rivales" },
  { title: "Aventuras en Teselia",                  file: "songs/other/openings/españa/aventuras-en-teselia.mp3",                image: "images/aventuras-en-teselia.png",                group: "other", other: "openings-anime", sonidexId: "aventuras-en-teselia" },
  { title: "Expediciones en Kalos",               file: "songs/other/openings/españa/expediciones-en-kalos.mp3",               image: "images/expediciones-en-kalos.png",               group: "other", other: "openings-anime", sonidexId: "expediciones-en-kalos" },

  // Openings del Anime — doblaje latinoamericano (mismas imágenes que arriba,
  // pero cada uno con el título tal y como se emitió en el doblaje latino —
  // p. ej. con el signo de exclamación de apertura "¡...!" característico de
  // esa localización; solo cambia `file`, `title` y se añade `variant: "latino"`).
  { title: "¡Atrápalos Ya!",                      file: "songs/openings/latino/hazte-con-todos.mp3",                     image: "images/hazte-con-todos.png",                     group: "other", other: "openings-anime", sonidexId: "hazte-con-todos", variant: "latino" },
  { title: "¡Liga Naranja!",                      file: "songs/openings/latino/aventuras-en-las-islas-naranja.mp3",      image: "images/aventuras-en-las-islas-naranja.png",      group: "other", other: "openings-anime", sonidexId: "aventuras-en-las-islas-naranja", variant: "latino" },
  { title: "¡Los Viajes Johto!",                  file: "songs/openings/latino/los-viajes-johto.mp3",                    image: "images/los-viajes-johto.png",                    group: "other", other: "openings-anime", sonidexId: "los-viajes-johto", variant: "latino" },
  { title: "¡Los Campeones de la Liga Johto!",    file: "songs/openings/latino/los-campeones-de-la-liga-de-johto.mp3",   image: "images/los-campeones-de-la-liga-de-johto.png",   group: "other", other: "openings-anime", sonidexId: "los-campeones-de-la-liga-de-johto", variant: "latino" },
  { title: "¡La Búsqueda del Maestro!",           file: "songs/openings/latino/master-quest.mp3",                        image: "images/master-quest.png",                        group: "other", other: "openings-anime", sonidexId: "master-quest", variant: "latino" },
  { title: "¡Fuerza Máxima!",                     file: "songs/openings/latino/advanced.mp3",                            image: "images/advanced.png",                            group: "other", other: "openings-anime", sonidexId: "advanced", variant: "latino" },
  { title: "¡Reto Máximo!",                       file: "songs/openings/latino/advanced-challenge.mp3",                  image: "images/advanced-challenge.png",                  group: "other", other: "openings-anime", sonidexId: "advanced-challenge", variant: "latino" },
  { title: "¡Batalla Avanzada!",                  file: "songs/openings/latino/advanced-battle.mp3",                     image: "images/advanced-battle.png",                     group: "other", other: "openings-anime", sonidexId: "advanced-battle", variant: "latino" },
  { title: "¡Batalla de la Frontera!",            file: "songs/openings/latino/battle-frontier.mp3",                     image: "images/battle-frontier.png",                     group: "other", other: "openings-anime", sonidexId: "battle-frontier", variant: "latino" },
  { title: "¡Diamante y Perla!",                  file: "songs/openings/latino/diamante-perla.mp3",                      image: "images/diamante-perla.png",                      group: "other", other: "openings-anime", sonidexId: "diamante-perla", variant: "latino" },
  { title: "¡Dimensión de Batalla!",              file: "songs/openings/latino/battle-dimension.mp3",                    image: "images/battle-dimension.png",                    group: "other", other: "openings-anime", sonidexId: "battle-dimension", variant: "latino" },
  { title: "¡Batallas Galácticas!",               file: "songs/openings/latino/combates-galacticos.mp3",                 image: "images/combates-galacticos.png",                 group: "other", other: "openings-anime", sonidexId: "combates-galacticos", variant: "latino" },
  { title: "¡Los Vencedores de la Liga Sinnoh!",  file: "songs/openings/latino/los-vencedores-de-la-liga-de-sinnoh.mp3", image: "images/los-vencedores-de-la-liga-de-sinnoh.png", group: "other", other: "openings-anime", sonidexId: "los-vencedores-de-la-liga-de-sinnoh", variant: "latino" },
  { title: "¡Blanco y Negro!",                    file: "songs/openings/latino/negro-y-blanco.mp3",                      image: "images/negro-y-blanco.png",                      group: "other", other: "openings-anime", sonidexId: "negro-y-blanco", variant: "latino" },
  { title: "¡Destinos Rivales!",                  file: "songs/openings/latino/destinos-rivales.mp3",                    image: "images/destinos-rivales.png",                    group: "other", other: "openings-anime", sonidexId: "destinos-rivales", variant: "latino" },
  { title: "¡Aventuras en Teselia!",                file: "songs/openings/latino/aventuras-en-teselia.mp3",                image: "images/aventuras-en-teselia.png",                group: "other", other: "openings-anime", sonidexId: "aventuras-en-teselia", variant: "latino" },
  { title: "¡XY Kalos Quest!",                    file: "songs/openings/latino/expediciones-en-kalos.mp3",               image: "images/expediciones-en-kalos.png",               group: "other", other: "openings-anime", sonidexId: "expediciones-en-kalos", variant: "latino" },

  // Openings del Anime — versión inglesa (mismas imágenes que arriba, pero
  // cada uno con el título original en inglés; solo cambia `file`, `title` y
  // se añade `variant: "english"`). Es la única variante que se usa jugando
  // con settings.language === "en" (ver buildPool()).
  { title: "Indigo League",                       file: "songs/openings/english/hazte-con-todos.mp3",                     image: "images/hazte-con-todos.png",                     group: "other", other: "openings-anime", sonidexId: "hazte-con-todos", variant: "english" },
  { title: "Adventures in the Orange Islands",    file: "songs/openings/english/aventuras-en-las-islas-naranja.mp3",      image: "images/aventuras-en-las-islas-naranja.png",      group: "other", other: "openings-anime", sonidexId: "aventuras-en-las-islas-naranja", variant: "english" },
  { title: "The Johto Journeys",                  file: "songs/openings/english/los-viajes-johto.mp3",                    image: "images/los-viajes-johto.png",                    group: "other", other: "openings-anime", sonidexId: "los-viajes-johto", variant: "english" },
  { title: "Johto League Champions",              file: "songs/openings/english/los-campeones-de-la-liga-de-johto.mp3",   image: "images/los-campeones-de-la-liga-de-johto.png",   group: "other", other: "openings-anime", sonidexId: "los-campeones-de-la-liga-de-johto", variant: "english" },
  { title: "Master Quest",                        file: "songs/openings/english/master-quest.mp3",                        image: "images/master-quest.png",                        group: "other", other: "openings-anime", sonidexId: "master-quest", variant: "english" },
  { title: "Advanced",                            file: "songs/openings/english/advanced.mp3",                            image: "images/advanced.png",                            group: "other", other: "openings-anime", sonidexId: "advanced", variant: "english" },
  { title: "Advanced Challenge",                  file: "songs/openings/english/advanced-challenge.mp3",                  image: "images/advanced-challenge.png",                  group: "other", other: "openings-anime", sonidexId: "advanced-challenge", variant: "english" },
  { title: "Advanced Battle",                     file: "songs/openings/english/advanced-battle.mp3",                     image: "images/advanced-battle.png",                     group: "other", other: "openings-anime", sonidexId: "advanced-battle", variant: "english" },
  { title: "Battle Frontier",                     file: "songs/openings/english/battle-frontier.mp3",                     image: "images/battle-frontier.png",                     group: "other", other: "openings-anime", sonidexId: "battle-frontier", variant: "english" },
  { title: "Diamond and Pearl",                   file: "songs/openings/english/diamante-perla.mp3",                      image: "images/diamante-perla.png",                      group: "other", other: "openings-anime", sonidexId: "diamante-perla", variant: "english" },
  { title: "Battle Dimension",                    file: "songs/openings/english/battle-dimension.mp3",                    image: "images/battle-dimension.png",                    group: "other", other: "openings-anime", sonidexId: "battle-dimension", variant: "english" },
  { title: "Galactic Battles",                    file: "songs/openings/english/combates-galacticos.mp3",                 image: "images/combates-galacticos.png",                 group: "other", other: "openings-anime", sonidexId: "combates-galacticos", variant: "english" },
  { title: "Sinnoh League Victors",               file: "songs/openings/english/los-vencedores-de-la-liga-de-sinnoh.mp3", image: "images/los-vencedores-de-la-liga-de-sinnoh.png", group: "other", other: "openings-anime", sonidexId: "los-vencedores-de-la-liga-de-sinnoh", variant: "english" },
  { title: "Black & White",                       file: "songs/openings/english/negro-y-blanco.mp3",                      image: "images/negro-y-blanco.png",                      group: "other", other: "openings-anime", sonidexId: "negro-y-blanco", variant: "english" },
  { title: "Rival Destinies",                     file: "songs/openings/english/destinos-rivales.mp3",                    image: "images/destinos-rivales.png",                    group: "other", other: "openings-anime", sonidexId: "destinos-rivales", variant: "english" },
  { title: "Adventures in Unova",                 file: "songs/openings/english/aventuras-en-teselia.mp3",                image: "images/aventuras-en-teselia.png",                group: "other", other: "openings-anime", sonidexId: "aventuras-en-teselia", variant: "english" },
  { title: "XY Kalos Quest",                      file: "songs/openings/english/expediciones-en-kalos.mp3",               image: "images/expediciones-en-kalos.png",               group: "other", other: "openings-anime", sonidexId: "expediciones-en-kalos", variant: "english" },
];

// Número de rondas por partida (Modo Fácil, Normal, Difícil y fases de región del Modo Historia)
const TOTAL_ROUNDS = 10;
// Número de rondas por partida en Minijuegos (por defecto). Alguna categoría
// puede tener su propia duración distinta — ver OTHER_ROUNDS_OVERRIDES.
const OTHER_ROUNDS = 5;
// Excepciones a OTHER_ROUNDS por categoría de Minijuegos (clave = valor de
// session.otherGame). Pokémon Mundo Misterioso dura 10 rondas en vez de las
// 5 del resto de categorías.
const OTHER_ROUNDS_OVERRIDES = {
  "mystery-dungeon": 10,
};

// ═══════════════════════════════════════════════
//  ⏱️ CRONÓMETRO DE RONDA + SISTEMA DE PUNTOS
// ═══════════════════════════════════════════════
// Puntos según velocidad de respuesta: cuanto antes contestes, más puntos.
// A partir de POINTS_TIME_LIMIT segundos ya sólo se garantizan los mínimos.
const POINTS_MAX = 100;        // puntos si respondes casi al instante
const POINTS_MIN = 20;         // puntos mínimos garantizados por acierto
const POINTS_TIME_LIMIT = 15;  // segundos a partir de los cuales el bonus por velocidad es mínimo

// Multiplicador por racha: racha 2 = x1.1, racha 3 = x1.2 ... hasta racha 11 = x2 (tope)
const STREAK_BONUS_STEP = 0.1;
const STREAK_BONUS_CAP_STREAK = 11; // a partir de esta racha el multiplicador ya no sube (queda en x2)
const STREAK_BONUS_MAX = 2;

let roundStartTs = 0;

/** Marca el instante de inicio de la ronda actual (se usa para calcular
 * los puntos según la velocidad de respuesta, ver computeBasePoints). */
function startRoundTimer() {
  // El cronómetro visual se ha eliminado; solo guardamos el instante de
  // inicio de ronda internamente, ya que se usa para calcular los puntos
  // según la velocidad de respuesta (ver computeBasePoints).
  roundStartTs = performance.now();
}

/** Segundos transcurridos desde que empezó la ronda actual. */
function getElapsedRoundTime() {
  return (performance.now() - roundStartTs) / 1000;
}

// Puntos base según lo rápido que se ha respondido (decae linealmente)
function computeBasePoints(elapsedSeconds) {
  const t = Math.max(0, Math.min(elapsedSeconds, POINTS_TIME_LIMIT));
  const ratio = 1 - (t / POINTS_TIME_LIMIT);
  return Math.round(POINTS_MIN + ratio * (POINTS_MAX - POINTS_MIN));
}

// Multiplicador de puntos según la racha actual (tras el acierto)
// racha 1 = x1 (sin bonus), racha 2 = x1.1, racha 3 = x1.2 ... racha 11+ = x2 (tope)
function getStreakMultiplier(streak) {
  if (streak <= 1) return 1;
  const cappedStreak = Math.min(streak, STREAK_BONUS_CAP_STREAK);
  const mult = 1 + STREAK_BONUS_STEP * (cappedStreak - 1);
  return Math.min(STREAK_BONUS_MAX, mult);
}


// ═══════════════════════════════════════════════
//  ⚙️ AJUSTES Y 👤 PERFIL DE JUGADOR
// ═══════════════════════════════════════════════
// La definición de `settings` (ajustes), `profile` (perfil: nombre, avatar,
// XP), el catálogo `AVATAR_CATALOG`/`getAvatarUrl()` y sus funciones de
// carga/guardado en localStorage (loadSettings/saveSettings,
// loadProfile/saveProfile/hasProfile, más el helper clamp01) viven ahora en
// storage.js, que se carga antes que este fichero. Aquí se siguen usando
// con total normalidad (mismo ámbito global), empezando por el cálculo del
// nivel de jugador a partir de la experiencia acumulada en `profile.xp`.

// ── Nivel de jugador: sube según los puntos totales acumulados en el juego.
// Subir del nivel 1 al 2 es fácil (pocos puntos); a partir de ahí, la
// experiencia necesaria para cada nivel crece de forma progresiva. ──
const LEVEL_XP_BASE = 150;      // puntos necesarios para pasar del nivel 1 al 2
const LEVEL_XP_EXPONENT = 1.4;  // cuánto crece la dificultad por nivel
// Puntos necesarios para subir DEL nivel "level" al siguiente
function xpNeededForLevel(level) {
  return Math.round(LEVEL_XP_BASE * Math.pow(level, LEVEL_XP_EXPONENT));
}
// A partir del total de puntos acumulados, calcula el nivel actual y el
// progreso (puntos ya conseguidos en el nivel actual / puntos que hacen falta
// para el siguiente).
function computeLevelInfo(totalXp) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  let needed = xpNeededForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = xpNeededForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: needed };
}

// ── Avatares de perfil desbloqueables por nivel o por logro ──
// Cada entrada se desbloquea de una de dos formas, igual que
// MODE_UNLOCKS/OTHER_UNLOCKS más abajo:
//   - { level: N }   → desbloqueado al alcanzar el nivel N de perfil.
//   - { achId: "…" } → desbloqueado al conseguir ese logro (ver
//     isAvatarUnlocked()). Se usa para los avatares de los Pokémon que
//     protagonizan un Evento Pokémon: se desbloquean con el logro
//     "Avistamiento: <nombre>" (`encounter_<id>_5` en ACHIEVEMENTS, pese
//     al sufijo `_5` en el id ahora requiere 10 apariciones — ver
//     ENCOUNTER_THRESHOLD_AVATAR), no con el más fácil de 5 apariciones
//     que desbloquea a ese mismo Pokémon para pasear por las colinas.
// El resto del catálogo (los que no aparecen en este objeto: Umbreon,
// Espeon, los legendarios/pseudolegendarios y el resto de avatares
// añadidos en tandas anteriores) se considera desbloqueado desde el
// nivel 1 (ver isAvatarUnlocked()).
const AVATAR_UNLOCKS = {
  charizard:  { achId: "encounter_charizard_5"  },
  venusaur:   { achId: "encounter_venusaur_5"   },
  blastoise:  { achId: "encounter_blastoise_5"  },
  pikachu:    { achId: "encounter_pikachu_5"    },
  ditto:      { achId: "encounter_ditto_5"      },
  inkay:      { achId: "encounter_inkay_5"      },
  rapidash:   { achId: "encounter_rapidash_5"   },
  slowpoke:   { achId: "encounter_slowpoke_5"   },
  hypno:      { achId: "encounter_hypno_5"      },
  chansey:    { achId: "encounter_chansey_5"    },
  porygon:    { achId: "encounter_porygon_5"    },
  gengar:     { achId: "encounter_gengar_5"     },
  electrode:  { achId: "encounter_electrode_5"  },
  snorlax:    { achId: "encounter_snorlax_5"    },
  jigglypuff: { achId: "encounter_jigglypuff_5" },
  caterpie:   { achId: "encounter_shiny_5"      },
  mewtwo:     { achId: "encounter_mewtwo_5"     },
  mew:        { achId: "encounter_mew_5"        },
  espeon:     { achId: "perfect_colosseum_xd"   },
  umbreon:    { achId: "perfect_colosseum_xd"   },
  dusknoir:   { achId: "perfect_mystery_dungeon" },
  grovyle:    { achId: "perfect_mystery_dungeon" },
  wigglytuff: { achId: "perfect_mystery_dungeon" },
  lucario:    { achId: "perfect_combat"          },
  dragapult:  { achId: "correct_250"              },
  eternatus:  { achId: "correct_500"              },
  necrozma:   { achId: "streak_30"                },
  meltan:     { achId: "streak_20"                },
  melmetal:   { achId: "streak_50"                },
  tornadus:   { achId: "perfect_hard"             },
  thundurus:  { achId: "perfect_hard"             },
  landorus:   { achId: "perfect_hard"             },
  magearna:   { achId: "perfect_regions_normal_5" },
  terrakion:  { achId: "story_teselia"            },
  virizion:   { achId: "story_teselia"            },
  cobalion:   { achId: "story_teselia"            },
  volcanion:  { achId: "story_kalos"              },
  zacian:     { achId: "story_complete_100"       },
  zamazenta:  { achId: "story_complete_100"       },
  calyrex:    { achId: "sonidex_200"              },
  spectrier:  { achId: "sonidex_100"              },
  glastrier:  { achId: "sonidex_100"              },
  regieleki:  { achId: "sonidex_50"               },
  regidrago:  { achId: "sonidex_50"               },
  urshifu:    { achId: "sonidex_20"               },
  zeraora:    { achId: "sonidex_10"               },
  sunkern:     { level: 2  },
  magikarp:    { level: 2  },
  ralts:       { level: 2  },
  rattata:     { level: 2  },
  shedinja:    { level: 2  },
  feebas:      { level: 3  },
  togepi:      { level: 3  },
  bidoof:      { level: 3  },
  riolu:       { level: 3  },
  hoothoot:    { level: 3  },
  wooper:      { level: 4  },
  smeargle:    { level: 4  },
  mareep:      { level: 4  },
  vulpix:      { level: 4  },
  unown:       { level: 4  },
  marill:      { level: 5  },
  trapinch:    { level: 5  },
  meowth:      { level: 5  },
  growlithe:   { level: 5  },
  dratini:     { level: 5  },
  chikorita:   { level: 6  },
  cyndaquil:   { level: 6  },
  totodile:    { level: 6  },
  geodude:     { level: 6  },
  snubbull:    { level: 6  },
  beldum:      { level: 7  },
  bagon:       { level: 7  },
  larvitar:    { level: 7  },
  psyduck:     { level: 7  },
  skitty:      { level: 7  },
  cacnea:      { level: 8  },
  spoink:      { level: 8  },
  swablu:      { level: 8  },
  cubone:      { level: 8  },
  staryu:      { level: 8  },
  teddiursa:   { level: 9  },
  pachirisu:   { level: 9  },
  sableye:     { level: 9  },
  onix:        { level: 9  },
  ledian:      { level: 9  },
  chatot:      { level: 10 },
  kricketune:  { level: 10 },
  corsola:     { level: 10 },
  dunsparce:   { level: 10 },
  gible:       { level: 10 },
  spinda:      { level: 11 },
  sunflora:    { level: 11 },
  medicham:    { level: 11 },
  whiscash:    { level: 11 },
  jynx:        { level: 11 },
  treecko:     { level: 12 },
  torchic:     { level: 12 },
  mudkip:      { level: 12 },
  kecleon:     { level: 12 },
  loudred:     { level: 13 },
  rotom:       { level: 13 },
  lunatone:    { level: 13 },
  mantine:     { level: 13 },
  wobbuffet:   { level: 14 },
  solrock:     { level: 14 },
  absol:       { level: 14 },
  torkoal:     { level: 14 },
  lopunny:     { level: 15 },
  staraptor:   { level: 15 },
  electabuzz:  { level: 15 },
  magmar:      { level: 15 },
  scrafty:     { level: 16 },
  kangaskhan:  { level: 16 },
  lapras:      { level: 16 },
  heracross:   { level: 16 },
  xatu:        { level: 17 },
  miltank:     { level: 17 },
  abomasnow:   { level: 17 },
  excadrill:   { level: 17 },
  turtwig:     { level: 18 },
  chimchar:    { level: 18 },
  piplup:      { level: 18 },
  cosmog:      { level: 18 },
  scyther:     { level: 19 },
  ninetales:   { level: 19 },
  alakazam:    { level: 19 },
  gliscor:     { level: 19 },
  scizor:      { level: 20 },
  gardevoir:   { level: 20 },
  weavile:     { level: 20 },
  tauros:      { level: 20 },
  shuckle:     { level: 21 },
  sneasler:    { level: 21 },
  zoroark:     { level: 21 },
  chandelure:  { level: 21 },
  aerodactyl:  { level: 22 },
  flygon:      { level: 22 },
  luxray:      { level: 22 },
  flareon:     { level: 22 },
  jolteon:     { level: 23 },
  vaporeon:    { level: 23 },
  sylveon:     { level: 23 },
  snivy:       { level: 24 },
  tepig:       { level: 24 },
  oshawott:    { level: 24 },
  sharpedo:    { level: 24 },
  aggron:      { level: 25 },
  gyarados:    { level: 25 },
  arcanine:    { level: 25 },
  milotic:     { level: 26 },
  volcarona:   { level: 26 },
  "kommo-o":   { level: 26 },
  dragonite:   { level: 27 },
  metagross:   { level: 27 },
  tyranitar:   { level: 27 },
  salamence:   { level: 28 },
  hydreigon:   { level: 28 },
  garchomp:    { level: 28 },
  "tapu-koko": { level: 29 },
  "tapu-lele": { level: 29 },
  "tapu-bulu": { level: 29 },
  chespin:     { level: 30 },
  fennekin:    { level: 30 },
  froakie:     { level: 30 },
  "tapu-fini": { level: 30 },
  articuno:    { level: 31 },
  zapdos:      { level: 31 },
  moltres:     { level: 31 },
  raikou:      { level: 32 },
  entei:       { level: 32 },
  suicune:     { level: 32 },
  regirock:    { level: 33 },
  regice:      { level: 33 },
  registeel:   { level: 33 },
  uxie:        { level: 34 },
  mesprit:     { level: 34 },
  azelf:       { level: 34 },
  keldeo:      { level: 35 },
  heatran:     { level: 35 },
  cresselia:   { level: 35 },
  rowlet:      { level: 36 },
  litten:      { level: 36 },
  popplio:     { level: 36 },
  latios:      { level: 37 },
  latias:      { level: 37 },
  celebi:      { level: 38 },
  jirachi:     { level: 38 },
  darkrai:     { level: 38 },
  deoxys:      { level: 39 },
  manaphy:     { level: 39 },
  shaymin:     { level: 39 },
  meloetta:    { level: 40 },
  diancie:     { level: 40 },
  hoopa:       { level: 40 },
  lugia:       { level: 41 },
  "ho-oh":     { level: 41 },
  kyogre:      { level: 42 },
  groudon:     { level: 42 },
  regigigas:   { level: 43 },
  rayquaza:    { level: 43 },
  dialga:      { level: 44 },
  palkia:      { level: 44 },
  giratina:    { level: 45 },
  kyurem:      { level: 45 },
  reshiram:    { level: 46 },
  zekrom:      { level: 46 },
  xerneas:     { level: 47 },
  yveltal:     { level: 47 },
  solgaleo:    { level: 48 },
  lunala:      { level: 48 },
  zygarde:     { level: 49 },
  marshadow:   { level: 49 },
  arceus:      { level: 50 },
};

/** Indica si un avatar del catálogo (AVATAR_CATALOG) está desbloqueado para
 * el jugador actual: por nivel de perfil o por logro (según cómo esté
 * configurado en AVATAR_UNLOCKS), o desbloqueado desde el principio si no
 * aparece ahí. Mismo criterio que isModeUnlocked()/isOtherUnlocked(). */
function isAvatarUnlocked(avatarId) {
  const cfg = AVATAR_UNLOCKS[avatarId];
  if (!cfg) return true;
  if (typeof cfg.level === "number") return computeLevelInfo(profile.xp).level >= cfg.level;
  return !!achievementsData.unlocked[cfg.achId];
}

/** Texto legible con el requisito para desbloquear un avatar bloqueado
 * (nivel de perfil o logro necesario), usado tanto en el título del botón
 * como en el aviso al pulsar un avatar todavía bloqueado. Traducido según
 * el idioma activo (ver i18n.js: claves "avatar.lockReqLevel"/
 * "avatar.lockReqAchievement" y "achv.<id>.title" para el nombre del
 * logro), igual que hace lockReqText() en ui.js para Modos/Minijuegos. */
function avatarLockRequirementText(avatarId) {
  const cfg = AVATAR_UNLOCKS[avatarId];
  if (!cfg) return "";
  if (typeof cfg.level === "number") return t("avatar.lockReqLevel", { level: cfg.level });
  const ach = ACHIEVEMENTS.find(a => a.id === cfg.achId);
  return ach ? t("avatar.lockReqAchievement", { title: tData(`achv.${ach.id}.title`, ach.title) }) : t("avatar.lockReqUnknown");
}

// Añade puntos ganados en una ronda a la experiencia total del jugador y
// comprueba si eso implica subir de nivel, mostrando un aviso si es así.
function addProfileXp(points) {
  if (!points || points <= 0) return;
  const before = computeLevelInfo(profile.xp).level;
  profile.xp += points;
  saveProfile();
  const after = computeLevelInfo(profile.xp);
  renderProfileBar();
  if (after.level > before) {
    const toasts = [{ icon: "⬆️", label: t("toast.levelUpLabel"), title: t("toast.levelUpTitle", { n: after.level }) }];
    // Comprobar si el nuevo nivel desbloquea algún modo de juego
    Object.keys(MODE_UNLOCKS).forEach(key => {
      const cfg = MODE_UNLOCKS[key];
      if (typeof cfg.level === "number" && cfg.level > before && cfg.level <= after.level) {
        toasts.push({ icon: "🔓", label: t("toast.modeUnlockedLabel"), title: t("toast.unlockedTitle", { name: tData(`modeUnlock.${key}.name`, cfg.name) }) });
      }
    });
    // Comprobar si el nuevo nivel desbloquea alguna categoría de Minijuegos
    Object.keys(OTHER_UNLOCKS).forEach(key => {
      const cfg = OTHER_UNLOCKS[key];
      if (typeof cfg.level === "number" && cfg.level > before && cfg.level <= after.level) {
        toasts.push({ icon: "🔓", label: t("toast.minigameUnlockedLabel"), title: t("toast.unlockedTitle", { name: tData(`otherUnlock.${key}.name`, cfg.name) }) });
      }
    });
    // Comprobar si el nuevo nivel desbloquea algún avatar de perfil nuevo
    Object.keys(AVATAR_UNLOCKS).forEach(id => {
      const cfg = AVATAR_UNLOCKS[id];
      if (cfg.level > before && cfg.level <= after.level) {
        const av = AVATAR_CATALOG.find(a => a.id === id);
        toasts.push({ icon: "🖼️", image: av ? av.url : null, label: t("toast.avatarUnlockedLabel"), title: t("toast.newAvatarTitle", { name: av ? av.name : id }) });
      }
    });
    queueAchievementToasts(toasts);
    playSFX(SFX.newmode);
    updateModeLocksUI();
    updateOtherLocksUI();
    // La clasificación global de nivel de jugador se actualiza cada vez
    // que se sube de nivel (no en cada punto de xp ganado): ver leaderboard.js.
    Leaderboard.submitScore("level", profile.username, profile.avatarId, after.level, ensurePlayerId());
  }
  if (profileOverlay && profileOverlay.classList.contains("show")) renderProfileStats();
}



// ═══════════════════════════════════════════════
//  🎮 ESTADO DEL JUEGO / MODO
// ═══════════════════════════════════════════════
const GameMode = {
  EASY: "easy",
  NORMAL: "normal",
  HARD: "hard",
  OTHER: "other",
  INFINITE: "infinite",
  STORY: "story",
};

// Modo Historia: nº de rondas de la partida de combate contra el "enemigo poderoso"
const STORY_COMBAT_ROUNDS = 3;

// Estado (activado/desactivado) del interruptor ♾️ pequeño de cada botón
// de modo en el menú de Jugar (Fácil/Normal/Difícil/Combate — el propio
// Desafío Infinito no lleva interruptor, ya es infinito por sí mismo).
// Se lee en cada click de "empezar partida" de esos cuatro botones (ver
// sección "🧩 MENÚS: handlers" más abajo) para decidir si esa partida
// concreta arranca con `session.endless = true`. No vive en `session`
// porque debe sobrevivir a cambios de pantalla previos a arrancar la
// partida (p. ej. Normal pasa primero por la selección de región).
let endlessToggle = { easy: false, normal: false, hard: false, combat: false };

// Mismo interruptor ♾️, pero para cada categoría de Minijuegos (Modo
// OTHER — ver `data-other` en index.html). Claves = los mismos valores
// que `data-other`/`session.otherGame`. Igual que `endlessToggle`, no
// vive en `session` por la misma razón (sobrevive a la pantalla previa
// de Openings del Anime, que pregunta España/Latino antes de arrancar).
let otherEndlessToggle = {
  "centro-pokemon": false, "laboratorios": false, "bicicletas": false,
  "surf": false, "title-screens": false, "openings-anime": false,
  "mystery-dungeon": false, "colosseum-xd": false, "ranger": false,
};

/** Indica si la partida actual (ya en curso, `session.mode` fijado) tiene
 * rondas sin límite y termina con el primer fallo: o bien porque el modo
 * en sí es el Desafío Infinito, o bien porque se activó el interruptor
 * ♾️ de Fácil/Normal/Difícil/Combate al arrancarla (`session.endless`). */
function isEndlessSession() {
  return session.mode === GameMode.INFINITE || session.endless;
}

let session = {
  mode: null,            // GameMode
  normalRegion: null,    // "Kanto"...
  otherGame: null,       // "mystery-dungeon" | "colosseum-xd" | "ranger" | "title-screens" | "openings-anime"
  openingsVariant: null, // null (España) | "latino" — solo aplica cuando otherGame === "openings-anime"
                          // Y ADEMÁS settings.language === "es" (con "en" se ignora, ver buildPool()).
                          // Se pregunta con la pantalla previa "screen-openings-lang-select" (solo si
                          // settings.language === "es") justo antes de startGame(GameMode.OTHER, "openings-anime").
                          // Junto con settings.language, fija qué canciones de esa categoría entran en
                          // el pool (España / Latino / Inglés — ver buildPool()).
  pool: [],              // canciones filtradas para la sesión
  questionType: "title", // "title" | "region"
  roundsTarget: 10,      // nº de rondas de la partida actual (se recalcula en startGame)

  // Interruptor ♾️ activado (desde el botón de modo) para ESTA partida:
  // rondas sin límite y un fallo termina la partida, aplicado sobre las
  // reglas propias del modo en curso (región de Fácil/Normal, temporizador
  // de Difícil, música de Combate...). No confundir con
  // `mode === GameMode.INFINITE`, que es el Desafío Infinito en sí (su
  // propio modo, con sus propias reglas de pool/opciones — ver
  // `isEndlessSession()` más abajo, que cubre ambos casos a la vez).
  endless: false,

  // ── Modo Historia ──
  storyRegionIndex: 0,     // índice de REGIONS por el que va el recorrido
  storyPhase: "region",    // "region" (10 rondas normales) | "combat" (3 rondas de combate)
  storyTotalScore: 0,      // puntuación acumulada de todo el recorrido
  storyTotalCorrect: 0,    // aciertos acumulados de todo el recorrido
  storyLives: 3,           // vidas restantes en la región actual (se recargan a 3 al avanzar de región)
  storyStreak: 0,          // racha de aciertos acumulada de todo el recorrido (persiste entre fases/regiones)

  // ── Desafío Infinito ──
  // Por defecto el Desafío Infinito NO tiene vidas (cualquier fallo termina
  // la partida). Solo empieza a tener vidas si el evento Venusaur concede
  // alguna durante la partida (máx. 3); Electrode puede quitarlas de nuevo.
  infiniteLives: 0,
};

let state = {
  score: 0,    // puntos acumulados (velocidad + bonus de racha)
  correct: 0,  // número de rondas acertadas (para % de resultados y logros)
  round: 1,
  streak: 0,
  currentSong: null,
  answered: false,
  chanseyUsed: false, // true si ya se ha gastado la segunda oportunidad del evento Chansey en esta ronda
  hintUsed: false, // true si el jugador ha pedido la pista visual en esta ronda (Fácil/Normal/Historia; -50% puntos)
  history: [], // files ya usadas en esta partida
};

// ═══════════════════════════════════════════════
//  🏅 SISTEMA DE LOGROS
// ═══════════════════════════════════════════════
const ACHIEVEMENTS = [
  { id: "first_correct",          icon: "🎯", title: "Primer acierto",         desc: "Consigue tu primer acierto.", section: "progress" },
  { id: "streak_3",               icon: "✨", title: "Buena racha",            desc: "Alcanza una racha de 3 respuestas correctas consecutivas.", section: "progress" },
  { id: "streak_5",               icon: "🔥", title: "En racha",               desc: "Alcanza una racha de 5 respuestas correctas consecutivas.", section: "progress" },
  { id: "streak_20",              icon: "👑", title: "Leyenda viviente",       desc: "Alcanza una racha de 20 respuestas correctas consecutivas.", section: "progress" },
  { id: "streak_30",              icon: "🌠", title: "Racha imparable",        desc: "Alcanza una racha de 30 respuestas correctas consecutivas.", section: "progress" },
  { id: "streak_50",              icon: "💫", title: "Racha legendaria",       desc: "Alcanza una racha de 50 respuestas correctas consecutivas.", section: "progress" },
  { id: "perfect_normal_region",  icon: "🏆", title: "Región perfecta",        desc: "Completa una partida perfecta en cualquier región del modo Normal.", section: "mastery" },
  { id: "perfect_easy",           icon: "🌱", title: "Fácil perfecto",         desc: "Completa una partida perfecta en el modo Fácil.", section: "mastery" },
  { id: "hard_correct_8",         icon: "💪", title: "Reto superado",          desc: "Consigue 8 o más respuestas correctas en una partida del modo Difícil.", section: "mastery" },
  { id: "perfect_hard",           icon: "💀", title: "Genio musical",          desc: "Completa una partida perfecta en el modo Difícil.", section: "mastery" },
  { id: "perfect_regions_normal_5", icon: "🗾", title: "Especialista regional", desc: "Completa 5 regiones en el modo Normal con un 100 % de aciertos.", section: "mastery" },
  { id: "correct_10",             icon: "🎵", title: "Buen oído",              desc: "Responde correctamente a 10 preguntas.", section: "progress" },
  { id: "correct_20",             icon: "🎶", title: "Oído entrenado",         desc: "Responde correctamente a 20 preguntas.", section: "progress" },
  { id: "correct_50",             icon: "🎤", title: "Conocedor musical",      desc: "Responde correctamente a 50 preguntas.", section: "progress" },
  { id: "correct_100",            icon: "🎧", title: "Melómano",               desc: "Responde correctamente a 100 preguntas.", section: "progress" },
  { id: "correct_250",            icon: "📻", title: "Fanático de la música",  desc: "Responde correctamente a 250 preguntas.", section: "progress" },
  { id: "correct_500",            icon: "📚", title: "Enciclopedia musical",   desc: "Responde correctamente a 500 preguntas.", section: "progress" },
  { id: "games_10",               icon: "🎮", title: "Aficionado",             desc: "Juega 10 partidas.", section: "progress" },
  { id: "games_20",               icon: "🕹️", title: "Jugador habitual",       desc: "Juega 20 partidas.", section: "progress" },
  { id: "games_30",               icon: "🎲", title: "Entrenador dedicado",    desc: "Juega 30 partidas.", section: "progress" },
  { id: "games_50",               icon: "🎖️", title: "Veterano",               desc: "Juega 50 partidas.", section: "progress" },
  { id: "all_modes",              icon: "🗺️", title: "Explorador",             desc: "Completa al menos una partida en los modos Fácil, Normal y Difícil.", section: "mastery" },
  { id: "all_regions",            icon: "🌍", title: "Viajero regional",       desc: "Completa al menos una partida en todas las regiones disponibles.", section: "mastery" },
  { id: "perfect_combat",         icon: "⚔️", title: "As del combate",         desc: "Completa una partida perfecta en el modo Combate.", section: "mastery" },
  { id: "perfect_colosseum_xd",   icon: "🌑", title: "Sombra perfecta",        desc: "Completa una partida perfecta en el minijuego de Pokémon Colosseum / XD.", section: "mastery" },
  { id: "perfect_mystery_dungeon", icon: "🏰", title: "Mazmorra perfecta",     desc: "Completa una partida perfecta en el minijuego de Pokémon Mundo Misterioso.", section: "mastery" },
  { id: "sonidex_1",              icon: "🎵", title: "Primera ficha",          desc: "Desbloquea tu primera ficha de la Sonidex.", section: "sonidex" },
  { id: "sonidex_5",              icon: "🎼", title: "Primeras notas",         desc: "Desbloquea 5 fichas de la Sonidex.", section: "sonidex" },
  { id: "sonidex_10",             icon: "📀", title: "Coleccionista de sonidos", desc: "Desbloquea 10 fichas de la Sonidex.", section: "sonidex" },
  { id: "sonidex_20",             icon: "🎷", title: "Oído fino",              desc: "Desbloquea 20 fichas de la Sonidex.", section: "sonidex" },
  { id: "sonidex_50",             icon: "🎹", title: "Melómano experto",       desc: "Desbloquea 50 fichas de la Sonidex.", section: "sonidex" },
  { id: "sonidex_100",            icon: "📖", title: "Archivo sonoro",         desc: "Desbloquea 100 fichas de la Sonidex.", section: "sonidex" },
  { id: "sonidex_200",            icon: "🗃️", title: "Biblioteca sonora",      desc: "Desbloquea 200 fichas de la Sonidex.", section: "sonidex" },
  { id: "sonidex_kanto",          icon: "🍃", title: "Sonidex de Kanto",       desc: "Desbloquea todas las fichas de Kanto.", section: "sonidex" },
  { id: "sonidex_johto",          icon: "🍂", title: "Sonidex de Johto",       desc: "Desbloquea todas las fichas de Johto.", section: "sonidex" },
  { id: "sonidex_hoenn",          icon: "🌺", title: "Sonidex de Hoenn",       desc: "Desbloquea todas las fichas de Hoenn.", section: "sonidex" },
  { id: "sonidex_sinnoh",         icon: "❄️", title: "Sonidex de Sinnoh",      desc: "Desbloquea todas las fichas de Sinnoh.", section: "sonidex" },
  { id: "sonidex_teselia",        icon: "🌉", title: "Sonidex de Teselia",     desc: "Desbloquea todas las fichas de Teselia.", section: "sonidex" },
  { id: "sonidex_kalos",          icon: "🥐", title: "Sonidex de Kalos",       desc: "Desbloquea todas las fichas de Kalos.", section: "sonidex" },
  { id: "sonidex_alola",          icon: "🌴", title: "Sonidex de Alola",       desc: "Desbloquea todas las fichas de Alola.", section: "sonidex" },
  { id: "story_kanto",            icon: "📜", title: "Historia: Kanto",        desc: "Completa Kanto en el modo Historia.", section: "story" },
  { id: "story_johto",            icon: "📜", title: "Historia: Johto",        desc: "Completa Johto en el modo Historia.", section: "story" },
  { id: "story_hoenn",            icon: "📜", title: "Historia: Hoenn",        desc: "Completa Hoenn en el modo Historia.", section: "story" },
  { id: "story_sinnoh",           icon: "📜", title: "Historia: Sinnoh",       desc: "Completa Sinnoh en el modo Historia.", section: "story" },
  { id: "story_teselia",          icon: "📜", title: "Historia: Teselia",      desc: "Completa Teselia en el modo Historia.", section: "story" },
  { id: "story_kalos",            icon: "📜", title: "Historia: Kalos",        desc: "Completa Kalos en el modo Historia.", section: "story" },
  { id: "story_complete",         icon: "🏅", title: "Maestro de la Historia", desc: "Completa el modo Historia.", section: "story" },
  { id: "story_complete_100",     icon: "👑", title: "Historia perfecta",      desc: "Completa el modo Historia con un 100 % de aciertos.", section: "story" },
  { id: "encounter_charizard",    icon: "🔥", title: "Cazador de llamas",      desc: "Haz que Charizard aparezca 5 veces.", section: "encounters" },
  { id: "encounter_charizard_5",   icon: "🔥", title: "Avistamiento: Charizard",  desc: "Haz que Charizard aparezca 10 veces.", section: "encounters" },
  { id: "encounter_slowpoke",     icon: "🐌", title: "Paciencia Slowpoke",     desc: "Haz que Slowpoke aparezca 5 veces.", section: "encounters" },
  { id: "encounter_slowpoke_5",    icon: "🐌", title: "Avistamiento: Slowpoke",   desc: "Haz que Slowpoke aparezca 10 veces.", section: "encounters" },
  { id: "encounter_rapidash",     icon: "🐎", title: "Velocidad Rapidash",     desc: "Haz que Rapidash aparezca 5 veces.", section: "encounters" },
  { id: "encounter_rapidash_5",    icon: "🐎", title: "Avistamiento: Rapidash",   desc: "Haz que Rapidash aparezca 10 veces.", section: "encounters" },
  { id: "encounter_ditto",        icon: "🟣", title: "Imitador Ditto",         desc: "Haz que Ditto aparezca 5 veces.", section: "encounters" },
  { id: "encounter_ditto_5",       icon: "🟣", title: "Avistamiento: Ditto",      desc: "Haz que Ditto aparezca 10 veces.", section: "encounters" },
  { id: "encounter_inkay",        icon: "🔄", title: "Giro Inkay",             desc: "Haz que Inkay aparezca 5 veces.", section: "encounters" },
  { id: "encounter_inkay_5",       icon: "🔄", title: "Avistamiento: Inkay",      desc: "Haz que Inkay aparezca 10 veces.", section: "encounters" },
  { id: "encounter_hypno",        icon: "🌙", title: "Hypnosis de Hypno",      desc: "Haz que Hypno aparezca 5 veces.", section: "encounters" },
  { id: "encounter_hypno_5",       icon: "🌙", title: "Avistamiento: Hypno",      desc: "Haz que Hypno aparezca 10 veces.", section: "encounters" },
  { id: "encounter_chansey",      icon: "🥚", title: "Segunda oportunidad",    desc: "Haz que Chansey aparezca 5 veces.", section: "encounters" },
  { id: "encounter_chansey_5",     icon: "🥚", title: "Avistamiento: Chansey",    desc: "Haz que Chansey aparezca 10 veces.", section: "encounters" },
  { id: "encounter_gengar",       icon: "👻", title: "Sombra de Gengar",       desc: "Haz que Gengar aparezca 5 veces.", section: "encounters" },
  { id: "encounter_gengar_5",      icon: "👻", title: "Avistamiento: Gengar",     desc: "Haz que Gengar aparezca 10 veces.", section: "encounters" },
  { id: "encounter_pikachu",      icon: "⚡", title: "Chispa de Pikachu",      desc: "Haz que Pikachu aparezca 5 veces.", section: "encounters" },
  { id: "encounter_pikachu_5",     icon: "⚡", title: "Avistamiento: Pikachu",    desc: "Haz que Pikachu aparezca 10 veces.", section: "encounters" },
  { id: "encounter_blastoise",    icon: "💧", title: "Danza lluvia",           desc: "Haz que Blastoise aparezca 5 veces.", section: "encounters" },
  { id: "encounter_blastoise_5",   icon: "💧", title: "Avistamiento: Blastoise",  desc: "Haz que Blastoise aparezca 10 veces.", section: "encounters" },
  { id: "encounter_venusaur",     icon: "🌿", title: "Aroma de Venusaur",      desc: "Haz que Venusaur aparezca 5 veces.", section: "encounters" },
  { id: "encounter_venusaur_5",    icon: "🌿", title: "Avistamiento: Venusaur",   desc: "Haz que Venusaur aparezca 10 veces.", section: "encounters" },
  { id: "encounter_electrode",    icon: "💥", title: "Cuenta atrás",           desc: "Haz que Electrode aparezca 5 veces.", section: "encounters" },
  { id: "encounter_electrode_5",   icon: "💥", title: "Avistamiento: Electrode",  desc: "Haz que Electrode aparezca 10 veces.", section: "encounters" },
  { id: "encounter_porygon",      icon: "🖥️", title: "Fallo digital",          desc: "Haz que Porygon aparezca 5 veces.", section: "encounters" },
  { id: "encounter_porygon_5",     icon: "🖥️", title: "Avistamiento: Porygon",    desc: "Haz que Porygon aparezca 10 veces.", section: "encounters" },
  { id: "encounter_snorlax",      icon: "😴", title: "Siesta de Snorlax",      desc: "Haz que Snorlax aparezca 5 veces.", section: "encounters" },
  { id: "encounter_snorlax_5",     icon: "😴", title: "Avistamiento: Snorlax",    desc: "Haz que Snorlax aparezca 10 veces.", section: "encounters" },
  { id: "encounter_jigglypuff",   icon: "🎤", title: "Canción de cuna",        desc: "Haz que Jigglypuff aparezca 5 veces.", section: "encounters" },
  { id: "encounter_jigglypuff_5",  icon: "🎤", title: "Avistamiento: Jigglypuff", desc: "Haz que Jigglypuff aparezca 10 veces.", section: "encounters" },
  { id: "encounter_shiny",        icon: "✨", title: "Cazabrillos",            desc: "Encuentra 5 veces un Pokémon shiny.", section: "encounters" },
  { id: "encounter_shiny_5",       icon: "✨", title: "Avistamiento brillante",  desc: "Encuentra 10 veces un Pokémon shiny.", section: "encounters" },
  { id: "encounter_mewtwo",       icon: "🧬", title: "Clon psíquico",          desc: "Haz que Mewtwo aparezca 5 veces.", section: "encounters" },
  { id: "encounter_mewtwo_5",      icon: "🧬", title: "Avistamiento: Mewtwo",     desc: "Haz que Mewtwo aparezca 10 veces.", section: "encounters" },
  { id: "encounter_mew",          icon: "🎭", title: "Transformista",          desc: "Haz que Mew aparezca 5 veces.", section: "encounters" },
  { id: "encounter_mew_5",         icon: "🎭", title: "Avistamiento: Mew",        desc: "Haz que Mew aparezca 10 veces.", section: "encounters" },
  { id: "poke_flute",             icon: "🪈", title: "Poké Flauta",            desc: "Despierta a un Pokémon dormido de las colinas tocándolo.", section: "encounters" },
];

// Secciones en las que se agrupan los logros en la pantalla de Logros (ver
// `renderAchievementsScreen()` en ui.js), en el orden en que deben mostrarse.
// Cada logro de ACHIEVEMENTS declara a qué sección pertenece con su campo
// `section`; añadir un logro nuevo a una sección existente no requiere tocar
// nada aquí. Solo hace falta editar esto si se crea una sección nueva.
const ACHIEVEMENT_SECTIONS = [
  { id: "progress",   icon: "🎯", title: "Progreso y rachas" },
  { id: "mastery",    icon: "🏆", title: "Maestría y partidas perfectas" },
  { id: "sonidex",    icon: "🎧", title: "Sonidex" },
  { id: "story",      icon: "📖", title: "Modo Historia" },
  { id: "encounters", icon: "👻", title: "Eventos Pokémon" },
];

// Genera la condición «desbloquea todas las fichas de la Sonidex de <region>»
// a partir del catálogo principal de canciones (group "main") de esa región.
function sonidexRegionCondition(region) {
  return s => {
    const list = songs.filter(so => so.group === "main" && so.region === region);
    return list.length > 0 && sonidexUnlockedCountForList(s, list) >= list.length;
  };
}

const ACHIEVEMENT_CONDITIONS = {
  first_correct:            s => s.totalCorrect >= 1,
  streak_3:                 s => s.bestStreak >= 3,
  streak_5:                 s => s.bestStreak >= 5,
  streak_20:                s => s.bestStreak >= 20,
  streak_30:                s => s.bestStreak >= 30,
  streak_50:                s => s.bestStreak >= 50,
  perfect_normal_region:    s => (s.perfectRegionsNormal || []).length >= 1,
  perfect_easy:             s => s.perfectEasyGame === true,
  hard_correct_8:           s => (s.bestHardCorrectInGame || 0) >= 8,
  perfect_hard:             s => s.perfectHardGame === true,
  perfect_regions_normal_5: s => (s.perfectRegionsNormal || []).length >= 5,
  correct_10:               s => s.totalCorrect >= 10,
  correct_20:               s => s.totalCorrect >= 20,
  correct_50:                s => s.totalCorrect >= 50,
  correct_100:               s => s.totalCorrect >= 100,
  correct_250:               s => s.totalCorrect >= 250,
  correct_500:               s => s.totalCorrect >= 500,
  games_10:                  s => s.gamesPlayed >= 10,
  games_20:                  s => s.gamesPlayed >= 20,
  games_30:                  s => s.gamesPlayed >= 30,
  games_50:                  s => s.gamesPlayed >= 50,
  all_modes:                 s => ["easy","normal","hard"].every(m => s.modesPlayed.includes(m)),
  all_regions:               s => REGIONS.every(r => s.regionsPlayed.includes(r)),
  perfect_combat:            s => s.perfectCombatGame === true,
  perfect_colosseum_xd:      s => s.perfectColosseumGame === true,
  perfect_mystery_dungeon:   s => s.perfectMysteryDungeonGame === true,
  sonidex_1:                 s => sonidexUnlockedCountForList(s, songs) >= 1,
  sonidex_5:                 s => sonidexUnlockedCountForList(s, songs) >= 5,
  sonidex_10:                s => sonidexUnlockedCountForList(s, songs) >= 10,
  sonidex_20:                s => sonidexUnlockedCountForList(s, songs) >= 20,
  sonidex_50:                s => sonidexUnlockedCountForList(s, songs) >= 50,
  sonidex_100:               s => sonidexUnlockedCountForList(s, songs) >= 100,
  sonidex_200:               s => sonidexUnlockedCountForList(s, songs) >= 200,
  sonidex_kanto:             sonidexRegionCondition("Kanto"),
  sonidex_johto:             sonidexRegionCondition("Johto"),
  sonidex_hoenn:             sonidexRegionCondition("Hoenn"),
  sonidex_sinnoh:            sonidexRegionCondition("Sinnoh"),
  sonidex_teselia:           sonidexRegionCondition("Teselia"),
  sonidex_kalos:             sonidexRegionCondition("Kalos"),
  sonidex_alola:             sonidexRegionCondition("Alola"),
  story_kanto:               s => (s.storyRegionsCompleted || []).includes("Kanto"),
  story_johto:               s => (s.storyRegionsCompleted || []).includes("Johto"),
  story_hoenn:               s => (s.storyRegionsCompleted || []).includes("Hoenn"),
  story_sinnoh:              s => (s.storyRegionsCompleted || []).includes("Sinnoh"),
  story_teselia:             s => (s.storyRegionsCompleted || []).includes("Teselia"),
  story_kalos:               s => (s.storyRegionsCompleted || []).includes("Kalos"),
  story_complete:            s => s.storyModeCompleted === true,
  story_complete_100:        s => s.storyModeCompletedPerfect === true,
  poke_flute:                s => (s.pokeWoken || 0) >= 1,
};

// Las condiciones encounter_* comparten todas la misma forma (¿ha
// aparecido este Pokémon/evento N veces o más?), así que en vez de repetir
// la misma expresión una y otra vez cambiando solo la clave, se generan
// aquí en bucle a partir de la lista de ids. Hay dos escalones por cada
// Pokémon/evento: uno que desbloquea el avatar de perfil de ese Pokémon
// (id `encounter_<id>_5`, ver AVATAR_UNLOCKS) y otro que lo desbloquea
// para pasear por las colinas del fondo (id `encounter_<id>`, el
// histórico — ver el bloque de hillToasts más abajo). Si en el futuro
// cambia alguno de los dos umbrales, solo hay que tocarlo aquí.
const ENCOUNTER_THRESHOLD_AVATAR = 10;
const ENCOUNTER_THRESHOLD_HILL = 5;
const ENCOUNTER_CONDITION_IDS = [
  "charizard", "slowpoke", "rapidash", "ditto", "inkay", "hypno", "chansey",
  "gengar", "pikachu", "blastoise", "venusaur", "electrode",
  "porygon", "snorlax", "jigglypuff", "shiny", "mewtwo", "mew",
];
ENCOUNTER_CONDITION_IDS.forEach(id => {
  ACHIEVEMENT_CONDITIONS[`encounter_${id}_5`] = s => ((s.encounterCounts && s.encounterCounts[id]) || 0) >= ENCOUNTER_THRESHOLD_AVATAR;
  ACHIEVEMENT_CONDITIONS[`encounter_${id}`] = s => ((s.encounterCounts && s.encounterCounts[id]) || 0) >= ENCOUNTER_THRESHOLD_HILL;
});


// Cuenta cuántas canciones de una lista están desbloqueadas en la Sonidex
// para unas estadísticas de logros dadas (usado por los condicionales de arriba).
// Deduplica por ficha (ver sonidexGroupSongs()) antes de contar, para que una
// canción con varias variantes de idioma (p. ej. un opening) cuente como una
// sola ficha aquí también, igual que en la pantalla Sonidex.
function sonidexUnlockedCountForList(s, list) {
  return sonidexGroupSongs(list).filter(song => ((s.songCorrectCounts && s.songCorrectCounts[sonidexKey(song)]) || 0) >= SONIDEX_UNLOCK_COUNT).length;
}

// ── Modos desbloqueables mediante nivel de perfil o logros ──
const MODE_UNLOCKS = {
  hard:     { level: 8, btnId: "mode-hard",     name: "Modo Difícil",          reqTitle: "Nivel 8 de perfil" },
  combat:   { level: 10, btnId: "mode-combat",   name: "Modo Combate",          reqTitle: "Nivel 10 de perfil" },
  infinite: { achId: "all_regions", btnId: "mode-infinite", name: "Modo Desafío Infinito", reqTitle: "Viajero regional" },
};

/** Indica si un modo de juego (definido en MODE_UNLOCKS) está
 * desbloqueado: por nivel de perfil (cfg.level) o por logro
 * (cfg.achId), según cómo esté configurado ese modo. */
function isModeUnlocked(key) {
  const cfg = MODE_UNLOCKS[key];
  if (!cfg) return true;
  if (typeof cfg.level === "number") return computeLevelInfo(profile.xp).level >= cfg.level;
  return !!achievementsData.unlocked[cfg.achId];
}



// ── Categorías de Minijuegos desbloqueables mediante nivel de perfil o logros ──
const OTHER_UNLOCKS = {
  "centro-pokemon":  { level: 3,               name: "Centro Pokémon",           reqTitle: "Nivel 3 de perfil" },
  "laboratorios":    { level: 4,               name: "Laboratorios",             reqTitle: "Nivel 4 de perfil" },
  "bicicletas":      { level: 5,               name: "Bicicletas",               reqTitle: "Nivel 5 de perfil" },
  "surf":            { level: 6,               name: "Surf",                     reqTitle: "Nivel 6 de perfil" },
  "mystery-dungeon": { achId: "story_hoenn",   name: "Pokémon Mundo Misterioso", reqTitle: "Historia: Hoenn" },
  "colosseum-xd":    { achId: "correct_100",   name: "Pokémon Colosseum / XD",   reqTitle: "Melómano" },
  "ranger":          { achId: "games_10",      name: "Pokémon Ranger",           reqTitle: "Aficionado" },
  "title-screens":   { level: 7,               name: "Pantallas de Título",      reqTitle: "Nivel 7 de perfil" },
  "openings-anime":  { level: 9,               name: "Openings del Anime",       reqTitle: "Nivel 9 de perfil" },
};

/** Indica si una categoría de Minijuegos (definida en OTHER_UNLOCKS)
 * está desbloqueada: por nivel de perfil (cfg.level) o por logro
 * (cfg.achId), según cómo esté configurada esa categoría. */
function isOtherUnlocked(key) {
  const cfg = OTHER_UNLOCKS[key];
  if (!cfg) return true;
  if (typeof cfg.level === "number") return computeLevelInfo(profile.xp).level >= cfg.level;
  return !!achievementsData.unlocked[cfg.achId];
}



// Devuelve, para un id de logro dado, la lista de funciones (modos de juego
// y/o categorías de Minijuegos) que ese logro desbloquea. Se usa tanto para
// los toasts de desbloqueo como para la marca de estrella en la pantalla de
// Logros.
function getFeatureUnlocksForAchievement(achId) {
  const feats = [];
  Object.keys(MODE_UNLOCKS).forEach(key => {
    const cfg = MODE_UNLOCKS[key];
    if (cfg.achId === achId) feats.push({ icon: "🎮", name: tData(`modeUnlock.${key}.name`, cfg.name), type: t("feature.gameMode") });
  });
  Object.keys(OTHER_UNLOCKS).forEach(key => {
    const cfg = OTHER_UNLOCKS[key];
    if (cfg.achId === achId) feats.push({ icon: "🕹️", name: tData(`otherUnlock.${key}.name`, cfg.name), type: t("feature.minigameCategory") });
  });
  if (achId === "story_complete") {
    feats.push({ icon: "🎉", name: t("feature.pokeEventsInInfinite"), type: t("feature.pokeEventsInInfiniteType") });
  }
  if (achId.startsWith("encounter_")) {
    const eventId = achId.replace("encounter_", "");
    const ev = typeof PokeEvents !== "undefined" ? PokeEvents.list().find(e => e.id === eventId) : null;
    if (ev) feats.push({ icon: "🌄", name: t("feature.hillPokemonName", { name: tData(`pokeEvent.${ev.id}.name`, ev.name) }), type: t("feature.hillPokemon") });
  }
  if (typeof EXTRA_HILL_POKEMON !== "undefined") {
    EXTRA_HILL_POKEMON.filter(ev => ev.achId === achId).forEach(ev => {
      feats.push({ icon: "🌄", name: t("feature.hillPokemonName", { name: tData(`pokeEvent.${ev.id}.name`, ev.name) }), type: t("feature.hillPokemon") });
    });
  }
  Object.keys(AVATAR_UNLOCKS).forEach(id => {
    const cfg = AVATAR_UNLOCKS[id];
    if (cfg.achId === achId) {
      const av = AVATAR_CATALOG.find(a => a.id === id);
      feats.push({ icon: "🖼️", name: av ? t("feature.avatarName", { name: av.name }) : t("feature.avatarGeneric"), type: t("feature.avatarType") });
    }
  });
  return feats;
}

// La forma de los datos de logros (defaultAchStats(), la variable
// `achievementsData` y sus funciones loadAchievements()/saveAchievements())
// vive ahora en storage.js, cargado antes que este fichero. Todo lo de
// aquí en adelante (comprobar condiciones, desbloquear, actualizar
// estadísticas...) sigue operando sobre `achievementsData` con total
// normalidad, por compartir el mismo ámbito global.

/** Registra que se ha jugado a un modo (y, si aplica, a una región o
 * categoría de Minijuego concreta) y comprueba si eso desbloquea
 * algún logro nuevo. */
function trackModePlayed(mode, extra) {
  const s = achievementsData.stats;
  if (!s.modesPlayed.includes(mode)) s.modesPlayed.push(mode);
  if ((mode === GameMode.NORMAL || mode === GameMode.STORY) && extra && extra !== "Combate" && !s.regionsPlayed.includes(extra)) s.regionsPlayed.push(extra);
  if (mode === GameMode.OTHER && extra && !s.otherPlayed.includes(extra)) s.otherPlayed.push(extra);
  saveAchievements();
  checkAchievements();
}

/** Actualiza las estadísticas de acierto: total de respuestas correctas
 * y mejores rachas (global y por modo/región), tras acertar una ronda. */
function trackCorrectAnswer() {
  const s = achievementsData.stats;
  s.totalCorrect = (s.totalCorrect || 0) + 1;
  if (state.streak > (s.bestStreak || 0)) s.bestStreak = state.streak;

  // Rachas máximas diferenciadas por modo
  if (session.mode === GameMode.EASY) {
    if (state.streak > (s.bestStreakEasy || 0)) s.bestStreakEasy = state.streak;
  } else if (session.mode === GameMode.HARD) {
    if (state.streak > (s.bestStreakHard || 0)) s.bestStreakHard = state.streak;
  } else if (session.mode === GameMode.NORMAL && session.normalRegion) {
    if (!s.bestStreakByRegion) s.bestStreakByRegion = {};
    const region = session.normalRegion;
    if (state.streak > (s.bestStreakByRegion[region] || 0)) s.bestStreakByRegion[region] = state.streak;
  } else if (session.mode === GameMode.INFINITE) {
    if (state.streak > (s.bestStreakInfinite || 0)) s.bestStreakInfinite = state.streak;
  }

  saveAchievements();
  checkAchievements();
}

// ── Sonidex: nº de aciertos necesarios para desbloquear una canción ──
const SONIDEX_UNLOCK_COUNT = 10;

/** Clave que identifica una FICHA de la Sonidex para una canción: por
 * defecto es el propio archivo de audio (`song.file`) — una canción, un
 * archivo, una ficha —, salvo que la canción tenga `sonidexId`: eso marca
 * que hay VARIAS canciones del catálogo (mismo `title`, distinto `file`)
 * que en realidad son la MISMA canción en idiomas/doblajes distintos (p.
 * ej. las tres `variant` de un mismo opening de Openings del Anime —
 * España/Latino/Inglés, ver el catálogo `songs` más arriba). Esas
 * comparten un único `sonidexId` (el mismo en las tres) y por tanto una
 * única ficha: acertar cualquiera de sus versiones suma al mismo contador
 * de `songCorrectCounts`, y solo aparece una vez en la pantalla Sonidex.
 * @param {Object} song
 * @returns {string}
 */
function sonidexKey(song) {
  return song.sonidexId || song.file;
}

/** A partir de una lista de canciones (normalmente `songs` filtrado por
 * una categoría de la Sonidex), la reduce a como mucho UNA canción por
 * ficha (ver sonidexKey()): las que comparten `sonidexId` se colapsan en
 * una sola, usada como "representante" de esa ficha para pintar su
 * carátula/reproducirla — se prefiere la versión del idioma actual del
 * juego (settings.language) si existe entre las variantes, y si no la
 * primera que se encuentre. Las canciones sin `sonidexId` (la inmensa
 * mayoría del catálogo) pasan tal cual, una a una. */
function sonidexGroupSongs(list) {
  const seen = new Map();
  list.forEach(song => {
    const key = sonidexKey(song);
    const existing = seen.get(key);
    if (!existing) { seen.set(key, song); return; }
    const wantedVariant = settings.language === "en" ? "english" : null;
    if ((existing.variant || null) !== wantedVariant && (song.variant || null) === wantedVariant) {
      seen.set(key, song);
    }
  });
  return [...seen.values()];
}

// Orden fijo en el que se ofrecen las variantes de idioma/doblaje de una
// ficha de la Sonidex con más de una versión (p. ej. los openings del
// anime, ver el botón de cambiar idioma en sonidexSongCard() de ui.js):
// España (sin `variant`) primero, luego Latino, luego Inglés.
const SONIDEX_VARIANT_ORDER = [null, "latino", "english"];

/** Devuelve, en el orden de SONIDEX_VARIANT_ORDER, todas las canciones del
 * catálogo que son la MISMA ficha de la Sonidex que `song` (comparten
 * `sonidexId`) — es decir, todas sus variantes de idioma/doblaje
 * disponibles para escuchar desde esa ficha. Si `song` no tiene
 * `sonidexId` (la inmensa mayoría del catálogo), devuelve solo `[song]`:
 * no hay variantes entre las que elegir, así que el botón de cambiar
 * idioma de la ficha no debe mostrarse. */
function sonidexVariantsFor(song) {
  if (!song.sonidexId) return [song];
  const siblings = songs.filter(s => s.sonidexId === song.sonidexId);
  return SONIDEX_VARIANT_ORDER.map(v => siblings.find(s => (s.variant || null) === v)).filter(Boolean);
}

/** Una canción aparece "desbloqueada" en la Sonidex cuando se ha
 * acertado un número mínimo de veces (SONIDEX_UNLOCK_COUNT). */
function isSongUnlocked(song) {
  const s = achievementsData.stats;
  const count = (s.songCorrectCounts && s.songCorrectCounts[sonidexKey(song)]) || 0;
  return count >= SONIDEX_UNLOCK_COUNT;
}

/** Incrementa el contador de aciertos de una canción concreta (para la
 * Sonidex) y comprueba si con este acierto pasa a desbloquearse. Cuenta
 * por ficha (ver sonidexKey()): acertar cualquiera de las variantes de
 * idioma de un mismo opening suma siempre al mismo contador. */
function trackSongCorrect(song) {
  // No cuenta en Modo Fácil (ahí se adivina la región, no la canción)
  if (session.mode === GameMode.EASY) return;

  const s = achievementsData.stats;
  if (!s.songCorrectCounts) s.songCorrectCounts = {};
  const key = sonidexKey(song);

  const wasUnlocked = isSongUnlocked(song);
  s.songCorrectCounts[key] = (s.songCorrectCounts[key] || 0) + 1;
  saveAchievements();

  const nowUnlocked = isSongUnlocked(song);
  if (!wasUnlocked && nowUnlocked) {
    queueAchievementToasts([{ icon: "🎼", label: t("toast.soundexUnlockedLabel"), title: t("toast.soundexUnlockedTitle", { title: songDisplayName(song) }) }]);
    updateHomeSonidexSummary();
    if (screens.sonidex.classList.contains("show")) renderSonidexScreen();
  }
}

// Cuenta cuántas veces ha aparecido cada evento Pokémon (para los logros
// «Haz que aparezca X 5 veces»). Se llama desde PokeEvents en cuanto se
// decide activar un evento, sin importar si el jugador acierta o falla.
function trackEncounter(id) {
  const s = achievementsData.stats;
  if (!s.encounterCounts) s.encounterCounts = {};
  s.encounterCounts[id] = (s.encounterCounts[id] || 0) + 1;
  saveAchievements();
  checkAchievements();
}

// Cuenta cuántas veces el jugador ha despertado a un Pokémon dormido de
// las colinas tocándolo (para el logro «Poké Flauta»). Se llama desde
// `wrap._bgPokeWakeNow()` en pokemon.js, solo cuando el despertar lo ha
// provocado el jugador (no cuando el Pokémon despierta por su cuenta al
// terminar la siesta).
function trackPokeWoken() {
  const s = achievementsData.stats;
  s.pokeWoken = (s.pokeWoken || 0) + 1;
  saveAchievements();
  checkAchievements();
}

/** Registra el resultado de una partida terminada: partidas jugadas,
 * partida perfecta (100%), y récords de puntuación del Desafío
 * Infinito / Modo Historia si procede. */
function trackGameFinished(pct, opts) {
  opts = opts || {}; // { mode, region, correctCount }
  const s = achievementsData.stats;
  s.gamesPlayed = (s.gamesPlayed || 0) + 1;
  if (pct === 100) {
    s.perfectGame = true;
    s.perfectGamesCount = (s.perfectGamesCount || 0) + 1;
    if (opts.mode === GameMode.EASY) {
      s.perfectEasyGame = true;
    } else if (opts.mode === GameMode.HARD) {
      s.perfectHardGame = true;
    } else if (opts.mode === GameMode.NORMAL) {
      if (opts.region === "Combate") {
        s.perfectCombatGame = true;
      } else if (opts.region) {
        if (!s.perfectRegionsNormal) s.perfectRegionsNormal = [];
        if (!s.perfectRegionsNormal.includes(opts.region)) s.perfectRegionsNormal.push(opts.region);
      }
    } else if (opts.mode === GameMode.OTHER) {
      if (opts.otherGame === "colosseum-xd") {
        s.perfectColosseumGame = true;
      } else if (opts.otherGame === "mystery-dungeon") {
        s.perfectMysteryDungeonGame = true;
      }
    }
  }
  if (opts.mode === GameMode.HARD && typeof opts.correctCount === "number") {
    if (opts.correctCount > (s.bestHardCorrectInGame || 0)) s.bestHardCorrectInGame = opts.correctCount;
  }
  saveAchievements();
  checkAchievements();
}

/**
 * Revisa todos los logros aún no desbloqueados y comprueba su condición
 * contra las estadísticas actuales (`achievementsData.stats`). Por cada
 * logro nuevo:
 *  - lo marca como desbloqueado (con marca de tiempo),
 *  - comprueba si desbloquea algún modo de juego / categoría de
 *    Minijuegos / Pokémon de las colinas, generando los avisos (toasts)
 *    correspondientes,
 *  - refresca la UI afectada (botones bloqueados, resumen de Inicio,
 *    pantalla de Logros si está abierta).
 */
function checkAchievements() {
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach(a => {
    if (achievementsData.unlocked[a.id]) return;
    const cond = ACHIEVEMENT_CONDITIONS[a.id];
    if (cond && cond(achievementsData.stats)) {
      achievementsData.unlocked[a.id] = Date.now();
      newlyUnlocked.push(a);
    }
  });
  if (newlyUnlocked.length) {
    saveAchievements();

    // Comprobar si algún logro recién obtenido desbloquea un modo de juego
    // o una categoría de Minijuegos
    const newlyUnlockedIds = newlyUnlocked.map(a => a.id);
    const modeToasts = [];
    Object.keys(MODE_UNLOCKS).forEach(key => {
      const cfg = MODE_UNLOCKS[key];
      if (newlyUnlockedIds.includes(cfg.achId)) {
        modeToasts.push({ icon: "🔓", label: t("toast.modeUnlockedLabel"), title: t("toast.unlockedTitle", { name: tData(`modeUnlock.${key}.name`, cfg.name) }) });
      }
    });
    Object.keys(OTHER_UNLOCKS).forEach(key => {
      const cfg = OTHER_UNLOCKS[key];
      if (newlyUnlockedIds.includes(cfg.achId)) {
        modeToasts.push({ icon: "🔓", label: t("toast.minigameUnlockedLabel"), title: t("toast.unlockedTitle", { name: tData(`otherUnlock.${key}.name`, cfg.name) }) });
      }
    });

    // Al completar el Modo Historia (logro «story_complete»), los Eventos
    // Pokémon pasan a poder activarse también en el Desafío Infinito.
    // Avisamos al jugador con un toast propio.
    const eventToasts = [];
    if (newlyUnlockedIds.includes("story_complete")) {
      eventToasts.push({ icon: "🎉", label: t("toast.featureUnlockedLabel"), title: t("toast.pokeEventsUnlockedTitle") });
    }

    // Los logros «encounter_<id>» desbloquean, uno por uno, a los Pokémon
    // que pasean por las colinas del fondo. Avisamos y los añadimos al
    // fondo sin tocar a los que ya estaban paseando. Además de los que
    // tienen un Evento Pokémon propio, EXTRA_HILL_POKEMON (pokemon.js)
    // puede atar un Pokémon de las colinas puramente decorativo al mismo
    // logro que uno de esos eventos (p. ej. el Caterpie normal que
    // aparece junto al Caterpie Shiny al conseguir «Cazabrillos»).
    const hillToasts = [];
    const newHillPokemon = [];
    newlyUnlockedIds.forEach(id => {
      if (!id.startsWith("encounter_") || id.endsWith("_5")) return;
      const eventId = id.replace("encounter_", "");
      const ev = PokeEvents.list().find(e => e.id === eventId);
      if (ev) {
        hillToasts.push({ icon: "🌄", label: t("toast.newHillEncounterLabel"), title: t("toast.newHillEncounterTitle", { name: tData(`pokeEvent.${ev.id}.name`, ev.name) }) });
        newHillPokemon.push(ev);
      }
    });
    if (typeof EXTRA_HILL_POKEMON !== "undefined") {
      EXTRA_HILL_POKEMON.forEach(ev => {
        if (!newlyUnlockedIds.includes(ev.achId)) return;
        hillToasts.push({ icon: "🌄", label: t("toast.newHillEncounterLabel"), title: t("toast.newHillEncounterTitle", { name: tData(`pokeEvent.${ev.id}.name`, ev.name) }) });
        newHillPokemon.push(ev);
      });
    }

    // Los logros «encounter_<id>_5» que aparecen en AVATAR_UNLOCKS también
    // desbloquean el avatar de perfil de ese Pokémon. Un mismo logro puede
    // desbloquear a la vez el avatar y el paseo por las colinas (ver
    // hillToasts arriba): son avisos independientes, ambos se muestran.
    const avatarToasts = [];
    Object.keys(AVATAR_UNLOCKS).forEach(id => {
      const cfg = AVATAR_UNLOCKS[id];
      if (cfg.achId && newlyUnlockedIds.includes(cfg.achId)) {
        const av = AVATAR_CATALOG.find(a => a.id === id);
        avatarToasts.push({ icon: "🖼️", image: av ? av.url : null, label: t("toast.avatarUnlockedLabel"), title: t("toast.newAvatarTitle", { name: av ? av.name : id }) });
      }
    });

    if (modeToasts.length || eventToasts.length || hillToasts.length || avatarToasts.length) playSFX(SFX.newmode);

    // Los logros en sí (newlyUnlocked) sí son "Logro desbloqueado"; todo lo
    // demás (modo, minijuego, evento, colina, avatar) es una consecuencia
    // del logro, no el logro en sí, así que llevan su propia etiqueta (ver
    // arriba) en vez de reutilizar la de logro.
    const achievementToasts = newlyUnlocked.map(a => ({ icon: a.icon, label: t("toast.achievementUnlockedLabel"), title: tData(`achv.${a.id}.title`, a.title) }));
    queueAchievementToasts(achievementToasts.concat(modeToasts).concat(eventToasts).concat(hillToasts).concat(avatarToasts));
    updateModeLocksUI();
    updateOtherLocksUI();
    newHillPokemon.forEach(addBgPokemon);
    if (screens.achievements.classList.contains("show")) renderAchievementsScreen();
    updateHomeAchievementSummary();
  }
}


// ═══════════════════════════════════════════════
//  🎯 LÓGICA DEL QUIZ
// ═══════════════════════════════════════════════
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


/** Construye `session.pool`: la lista de canciones candidatas para la
 * partida actual, según el modo (fácil, región normal, combate,
 * minijuego, historia...) y fija `session.questionType` (si se
 * pregunta por región o por canción). */
function buildPool() {
  if (session.mode === GameMode.EASY) {
    // Fácil: solo juegos principales (regiones)
    session.pool = songs.filter(s => s.group === "main" && EASY_REGIONS.includes(s.region));
    session.questionType = "region";
  } else if (session.mode === GameMode.NORMAL || session.mode === GameMode.STORY) {
    // Región normal (y Modo Historia, que reutiliza esta misma lógica): solo "main".
    // Combate: solo el grupo "combat" (canciones de songs/main/combate).
    if (session.normalRegion === "Combate") {
      session.pool = songs.filter(s => s.group === "combat");
    } else {
      session.pool = songs.filter(s => s.group === "main" && s.region === session.normalRegion);
    }
    session.questionType = "title";
  } else if (session.mode === GameMode.HARD) {
    // Difícil: todas las canciones principales, EXCEPTO las de Combate y las de Minijuegos
    session.pool = songs.filter(s => s.group === "main");
    session.questionType = "title";
  } else if (session.mode === GameMode.OTHER) {
    // Openings del Anime tiene tres variantes de doblaje/idioma (España/Latino/
    // Inglés — ver el campo `variant` de cada canción en el catálogo de arriba).
    // Cuál se usa depende del idioma actual del juego y, si es español, de la
    // elección del jugador en la pantalla previa (session.openingsVariant):
    //   - settings.language === "en": siempre la versión inglesa (`variant:
    //     "english"`), sin pasar por la pantalla previa (ver el listener de
    //     [data-other] más abajo, que se la salta directamente en ese caso).
    //   - settings.language === "es": la versión que haya elegido el jugador en
    //     esa pantalla — España (session.openingsVariant === null, sin `variant`
    //     en el catálogo) o Latino (session.openingsVariant === "latino").
    // El resto de categorías de Minijuegos no usan `variant` en absoluto (todas
    // sus canciones tienen `variant === undefined`), así que wantedVariant es
    // siempre `null` para ellas y este filtro no les afecta.
    let wantedVariant = null;
    if (session.otherGame === "openings-anime") {
      wantedVariant = settings.language === "en" ? "english" : session.openingsVariant;
    }
    session.pool = songs.filter(s => s.group === "other" && s.other === session.otherGame && (s.variant || null) === wantedVariant);
    session.questionType = "title";
  } else if (session.mode === GameMode.INFINITE) {
    // Desafío Infinito: todas las canciones principales, sin límite de rondas, EXCEPTO las de Combate y las de Minijuegos
    session.pool = songs.filter(s => s.group === "main");
    session.questionType = "title";
  }
}

/** Elige una canción al azar de `session.pool` que no se haya repetido
 * recientemente (usa `state.history`); si ya se han usado todas,
 * reinicia el historial para poder volver a elegir. */
function getRandomSongFromPool() {
  const available = session.pool.filter(s => !state.history.includes(s.file));
  if (available.length === 0) { state.history = []; return getRandomSongFromPool(); }
  const pick = available[Math.floor(Math.random() * available.length)];
  state.history.push(pick.file);
  return pick;
}

/** Genera las opciones de respuesta (4 o 6) para la canción correcta
 * actual: regiones distintas en Modo Fácil, o canciones "señuelo" del
 * mismo pool en el resto de modos. */
function generateOptionsForCurrent(correctSong) {
  // EASY: opciones = regiones
  if (session.questionType === "region") {
    const correct = correctSong.region;
    const wrongRegions = EASY_REGIONS.filter(r => r !== correct);
    const wrongs = shuffle(wrongRegions).slice(0, 3);
    return shuffle([correct, ...wrongs]).map(x => ({ label: regionDisplayName(x), isCorrect: x === correct }));
  }

  // TITLE: opciones = títulos del pool
  const wrongSongs = session.pool.filter(s => s.title !== correctSong.title);
  const isCombat = (session.mode === GameMode.NORMAL && session.normalRegion === "Combate");
  const totalOptions = (session.mode === GameMode.HARD || session.mode === GameMode.INFINITE || isCombat) ? 6 : 4;
  const wrongCount = totalOptions - 1;

  const wrongs = shuffle(wrongSongs).slice(0, wrongCount);
  const opts = shuffle([correctSong, ...wrongs]).map(s => ({ label: songDisplayName(s), isCorrect: s.title === correctSong.title }));
  return opts;
}


// ═══════════════════════════════════════════════
//  💗 MODO HISTORIA: sistema de vidas (corazones)
// ═══════════════════════════════════════════════

// Refleja session.storyLives en los corazones y muestra/oculta el bloque
// según si estamos en Modo Historia. No decrementa nada, solo pinta el estado.
// El Modo Historia siempre tiene vidas; el Desafío Infinito solo las tiene
// si el evento Venusaur ya ha concedido alguna en esta partida (por defecto
// no tiene, y cualquier fallo termina la partida como siempre).
function hasActiveLivesSystem() {
  return session.mode === GameMode.STORY ||
    (session.mode === GameMode.INFINITE && session.infiniteLives > 0);
}
/** Vidas restantes del sistema activo (Modo Historia o Desafío
 * Infinito); 0 si el modo actual no usa vidas. */
function getCurrentLives() {
  if (session.mode === GameMode.STORY) return session.storyLives;
  if (session.mode === GameMode.INFINITE) return session.infiniteLives;
  return 0;
}


// Evento Pokémon Venusaur: restaura una vida usando síntesis (máx. 3).
// En Modo Historia cura un corazón perdido. En el Desafío Infinito, que por
// defecto no tiene vidas, esto concede la primera vida extra de la partida
// (y las siguientes, hasta el máximo de 3).
function healLife() {
  const isStory = session.mode === GameMode.STORY;
  const isInfinite = session.mode === GameMode.INFINITE;
  if (!isStory && !isInfinite) return;

  const current = isStory ? session.storyLives : session.infiniteLives;
  if (current >= 3) return;

  if (isStory) session.storyLives = current + 1;
  else session.infiniteLives = current + 1;

  renderLives();
  const el = heartEls[current]; // corazón que se enciende ahora (índice 0-based)
  if (el) {
    el.classList.add('healed');
    setTimeout(() => el.classList.remove('healed'), 600);
  }
}

// Quita una vida: anima el corazón afectado y, si se agotan, acaba la partida.
function loseLife() {
  if (session.mode !== GameMode.STORY) return;
  if (session.storyLives <= 0) return;

  const idx = session.storyLives - 1; // corazón que se apaga ahora
  session.storyLives--;

  const el = heartEls[idx];
  if (el) {
    el.classList.add('losing');
    setTimeout(() => {
      el.classList.remove('losing');
      el.classList.add('lost');
      updateNervousState();
    }, 600);
  }
  updateNervousState();

  if (session.storyLives <= 0) {
    setTimeout(() => storyGameOver(), 700);
  }
}

// Quita una vida del Desafío Infinito. Solo tiene sentido llamarla cuando
// session.infiniteLives > 0, es decir, cuando el evento Venusaur ya ha
// concedido alguna vida extra esta partida (por defecto el Desafío
// Infinito no tiene vidas y cualquier fallo termina la partida
// directamente, sin pasar por aquí — ver handleAnswer()/electrodeExplode()).
// A diferencia de loseLife() (Modo Historia), agotar estas vidas NUNCA
// termina la partida por sí solo: sirven solo para "amortiguar" un fallo
// puntual, la partida sigue con normalidad tanto si quedan vidas Venusaur
// como si no.
function loseInfiniteLife() {
  if (session.infiniteLives <= 0) return;

  const idx = session.infiniteLives - 1; // corazón que se apaga ahora
  session.infiniteLives--;

  const el = heartEls[idx];
  if (el) {
    el.classList.add('losing');
    setTimeout(() => {
      el.classList.remove('losing');
      el.classList.add('lost');
      updateNervousState();
    }, 600);
  }
  updateNervousState();
}

// Fin de la partida por quedarse sin vidas: pantalla de Game Over y vuelta
// a la primera región (el propio startStoryMode ya reinicia storyRegionIndex).
function storyGameOver() {
  stopAudioHard();
  if (state.score > (achievementsData.stats.bestStoryScore || 0)) {
    achievementsData.stats.bestStoryScore = state.score;
    saveAchievements();
    // Igual que en Desafío Infinito, solo se envía al backend de
    // clasificaciones al superar el récord personal (ver leaderboard.js).
    Leaderboard.submitScore("story", profile.username, profile.avatarId, state.score, ensurePlayerId());
  }
  showScreen("home", false);
  storyCompleteTitle.textContent = t("story.gameOverTitle");
  storyCompleteSubtitle.textContent = t("story.gameOverDesc");
  storyCompleteBall.src = STORY_BROKEN_HEART;
  storyCompleteOverlay.classList.add('gameover');
  storyCompleteOverlay.classList.add('show');
  playSFX(SFX.wrong);
  setTimeout(() => {
    storyCompleteOverlay.classList.remove('show');
    setTimeout(() => {
      storyCompleteOverlay.classList.remove('gameover');
      storyCompleteSubtitle.textContent = "";
      session.storyRegionIndex = 0;
      session.storyLives = 3;
      session.mode = null;
      renderLives();
      showScreen("home", false);
      ensureMenuMusicPlaying();
    }, 550);
  }, 2000);
}




// Electrode explota: si el jugador aún no ha respondido esta ronda, cuenta
// como fallo (rompe la racha y revela la respuesta correcta) y le quita una
// vida. En Modo Historia usa el sistema de vidas habitual (puede acabar la
// partida). En el Desafío Infinito solo puede quitar una vida si Venusaur ya
// había concedido alguna; si no tiene ninguna, termina la partida como
// cualquier otro fallo en ese modo.
function electrodeExplode() {
  if (state.answered) { stopElectrodeTimer(); return; } // ya respondió justo antes de que saltara
  stopElectrodeTimer(true); // true = ha explotado de verdad: pinta el destello final del sprite
  state.answered = true;

  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
  state.streak = 0;
  playSFX(SFX.explosion); // ¡Electrode ha explotado!
  updateStatsUI();

  setTimeout(() => {
    // Se compara dataset.correct (no el texto del botón) porque en
    // idioma inglés el texto mostrado puede estar traducido (p. ej.
    // "Unova") y ya no coincidiría con la clave interna de la región.
    document.querySelectorAll('.answer-btn').forEach(b => {
      if (b.dataset.correct === "1") {
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
      loseInfiniteLife();
      setTimeout(() => document.getElementById('next-btn').classList.add('visible'), 750);
    } else {
      setTimeout(() => showResult(), 900);
    }
    return;
  }

  // Electrode solo se activa con los Eventos Pokémon desbloqueados (Modo
  // Historia o Desafío Infinito), así que no debería llegar aquí; por
  // seguridad, se deja continuar la ronda con normalidad.
  setTimeout(() => document.getElementById('next-btn').classList.add('visible'), 750);
}

/**
 * Punto de entrada para arrancar cualquier modo de juego (excepto el
 * Modo Historia, que usa startStoryMode).
 * @param {string} mode   uno de los valores de GameMode
 * @param {string|null} extra  región (Normal/Historia), categoría de
 *        Minijuego (Other) u otro dato específico del modo
 * @param {{endless?: boolean}} [opts]  `endless: true` activa, para esta
 *        partida, el interruptor ♾️ de Fácil/Normal/Difícil/Combate o de
 *        una categoría de Minijuegos (rondas sin límite, un fallo
 *        termina la partida) sin cambiar las demás reglas propias del
 *        modo. No se usa (ni hace falta) para GameMode.INFINITE, que ya
 *        es infinito por sí mismo — ver `isEndlessSession()`.
 * Prepara el objeto `session` para la partida, reinicia el estado de
 * ronda/puntuación y lanza la primera ronda.
 */
function startGame(mode, extra=null, opts={}) {
  // preparar sesión
  session.mode = mode;
  session.normalRegion = null;
  session.otherGame = null;
  session.endless = !!opts.endless;

  if (mode === GameMode.NORMAL) session.normalRegion = extra; // region
  if (mode === GameMode.OTHER) session.otherGame = extra;     // other key
  if (mode === GameMode.STORY) session.normalRegion = extra;  // region name, o "Combate" en la fase de combate
  if (mode === GameMode.INFINITE) session.infiniteLives = 0;  // el Desafío Infinito siempre arranca sin vidas

  buildPool();

  if (!session.pool || session.pool.length < 4) {
    alert("⚠️ Necesitas al menos 4 canciones en este modo para jugar.");
    return;
  }

  trackModePlayed(mode, extra);

  // reset estado partida
  // En Modo Historia la puntuación y la racha de aciertos se conservan a lo
  // largo de todo el recorrido (entre regiones y fases de combate), así que
  // arrancamos desde los totales acumulados hasta ahora en vez de desde 0.
  const initialScore = (mode === GameMode.STORY) ? session.storyTotalScore : 0;
  const initialStreak = (mode === GameMode.STORY) ? session.storyStreak : 0;
  state = { score: initialScore, correct: 0, round: 1, streak: initialStreak, currentSong: null, answered: false, chanseyUsed: false, hintUsed: false, history: [] };
  document.getElementById('result-overlay').classList.remove('show');

  // nº de rondas de esta partida: en Modo Historia, la fase de combate dura menos rondas;
  // en Minijuegos (Modo OTHER) la partida dura OTHER_ROUNDS rondas, salvo que
  // la categoría tenga su propia excepción en OTHER_ROUNDS_OVERRIDES.
  session.roundsTarget = (mode === GameMode.STORY && session.storyPhase === "combat")
    ? STORY_COMBAT_ROUNDS
    : (mode === GameMode.OTHER)
      ? (OTHER_ROUNDS_OVERRIDES[extra] ?? OTHER_ROUNDS)
      : TOTAL_ROUNDS;

  setModeLabel();
  renderLives();
  stopMenuMusic();
  showScreen("quiz");
  startRound();
}

/**
 * Prepara y muestra una nueva ronda de pregunta: comprueba/activa
 * Eventos Pokémon, elige la canción y las opciones de respuesta,
 * actualiza la UI (imagen, botones, vidas, cronómetro del Modo Difícil)
 * y arranca la reproducción de la canción.
 */
function startRound() {
  stopHardRoundTimer();

  // Desbloquea goToNextRound(): la ronda ha arrancado de verdad, así que
  // una futura pulsación de "Siguiente Ronda"/barra espaciadora ya puede
  // volver a llamar a nextRound() con normalidad (ver goToNextRound()).
  nextRoundInFlight = false;

  // Comprobación de seguridad del sistema de Eventos Pokémon: si esta ronda
  // no viene de un PokeEvents.tryTrigger() recién resuelto, se asegura de
  // que no quede ningún evento activo de una ronda o partida anterior.
  PokeEvents.beginRound();

  state.answered = false;
  state.chanseyUsed = false;
  state.hintUsed = false;
  state.currentSong = getRandomSongFromPool();
  updateStatsUI();
  startRoundTimer();
  resetHintButton();

  // Modo Difícil: 10s por ronda para responder (antes la canción se pausaba
  // a los 3s; ahora suena sin cortes durante los 10s del temporizador).
  if (session.mode === GameMode.HARD) startHardRoundTimer();

  // Texto de pregunta
  const q = document.getElementById('song-question');
  if (session.questionType === "region") q.textContent = t("quiz.questionRegion");
  else q.textContent = t("quiz.questionSong");

  document.getElementById('audio-status').textContent = t("quiz.playing");

  // Ocultar el nombre de la ciudad hasta que el jugador responda (modo fácil)
  const cityReveal = document.getElementById('song-city-reveal');
  cityReveal.style.display = 'none';
  cityReveal.textContent = '';

  // Imagen oculta hasta responder
  const currentImage = document.getElementById('song-image');
  if (currentImage) {
    currentImage.outerHTML = `<div class="song-image-placeholder" id="song-image">🎵</div>`;
  }

  // opciones
  const options = generateOptionsForCurrent(state.currentSong);
  renderAnswerButtons(options);

  // Evento Pokémon: primero se resetea cualquier efecto visual de la ronda
  // anterior (sin tocar PokeEvents.active: ya lo gestiona beginRound() más
  // arriba) y luego se aplica el del evento activo de esta ronda (si lo hay).
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
  PokeEvents.applyToAnswers(document.getElementById('answers-grid'));

  // ocultar next
  document.getElementById('next-btn').classList.remove('visible');

  // audio
  audio.oncanplaythrough = null;
  audio.onerror = null;
  audio.pause();
  audio.currentTime = 0;
  audio.loop = true;
  audio.src = state.currentSong.file;
  audio.load();
  audio.volume = settings.musicVol;
  audio.playbackRate = 1; // reset del efecto del evento anterior (p.ej. Slowpoke)
  PokeEvents.applyToAudio(audio);

  audio.oncanplaythrough = () => {
    // si el jugador ya salió del quiz antes de que la canción cargara, no la reproducimos
    if (!screens.quiz.classList.contains('show')) return;

    // 'canplaythrough' puede dispararse más de una vez durante la misma
    // ronda (rebuffering, etc.). Nos desuscribimos nada más entrar para
    // que el punto de inicio aleatorio se calcule una sola vez por ronda
    // y no salte de sitio cada vez que el navegador vuelve a bufferear.
    audio.oncanplaythrough = null;

    // Modo Difícil e Infinito: la canción no siempre empieza desde el
    // principio, sino en un punto aleatorio, para dificultar el
    // reconocimiento. Nunca se arranca más allá del segundo 50 (y, si la
    // canción dura menos de eso, se limita a su propia duración, dejando
    // un pequeño margen al final para no arrancar prácticamente en el
    // último instante).
    if (session.mode === GameMode.HARD || session.mode === GameMode.INFINITE) {
      const maxStart = (isFinite(audio.duration) && audio.duration > 1)
        ? Math.min(50, Math.max(0, audio.duration - 0.5))
        : 50;
      audio.currentTime = Math.random() * maxStart;
    }

    initAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audio.play().catch(() => {
      document.getElementById('audio-status').textContent = t("quiz.tapToPlay");
      document.addEventListener('touchstart', resumeAudio, { once: true });
      document.addEventListener('click', resumeAudio, { once: true });
    });
  };

  audio.onerror = () => {
    const code = audio.error ? audio.error.code : '?';
    document.getElementById('audio-status').textContent =
      '⚠ Error de audio (código ' + code + '): ' + state.currentSong.file + ' (usa un servidor local)';
    console.error('Audio error code:', code, '| src:', audio.src);
  };
}

/** Reanuda la reproducción de audio (usado tras una interacción del
 * usuario, requerida por los navegadores para permitir sonido). */
function resumeAudio() {
  if (audioCtx) audioCtx.resume();
  audio.play().catch(() => {});
}

/**
 * Pista visual (Fácil / Normal / Modo Historia): el jugador puede pedir
 * ver, antes de responder, la carátula de la canción que está sonando
 * dentro del contenedor circular (mismo sitio donde se revela al acertar
 * o fallar). A cambio, esta ronda vale un 50% menos de puntos (ver
 * handleAnswer). Solo se puede usar una vez por ronda y solo antes de
 * responder.
 */
function useVisualHint() {
  if (state.answered || state.hintUsed) return;
  if (session.mode !== GameMode.EASY && session.mode !== GameMode.NORMAL && session.mode !== GameMode.STORY) return;

  state.hintUsed = true;
  playSFX(SFX.go);
  setSongImage(state.currentSong);
  markHintButtonUsed();
}

/**
 * Procesa la respuesta del jugador a una pregunta.
 * @param {HTMLElement} btn  botón de respuesta pulsado
 * @param {boolean} isCorrect  si la opción elegida era la correcta
 * Calcula y aplica los puntos (según velocidad y racha), actualiza
 * racha/vidas, dispara los efectos visuales (partículas, combo),
 * registra estadísticas/logros y decide si se pasa a la siguiente
 * ronda o si la partida ha terminado (sin vidas / Game Over).
 * Contempla también el comportamiento especial de varios Eventos
 * Pokémon (Chansey permite reintentar el primer fallo, etc.).
 */
function handleAnswer(btn, isCorrect) {
  if (state.answered) return;

  // Evento Chansey: en el primer fallo de la ronda, no la damos por terminada.
  // Marcamos el botón fallado y dejamos el resto activos para que el jugador
  // pueda volver a intentarlo, sin perder vida ni racha.
  if (!isCorrect && PokeEvents.activeId() === "chansey" && !state.chanseyUsed) {
    state.chanseyUsed = true;
    btn.classList.add('wrong');
    btn.disabled = true;
    playSFX(SFX.wrong);
    const status = document.getElementById('audio-status');
    if (status) status.textContent = t("quiz.chanseySecondChance");
    return;
  }

  state.answered = true;

  const elapsed = getElapsedRoundTime();
  stopElectrodeTimer();
  stopHardRoundTimer();
  stopPorygonTextGlitch();

  // Mostrar imagen tras responder
  setSongImage(state.currentSong);

  // Modo fácil: mostrar el nombre de la ciudad de la canción que está sonando
  if (session.mode === GameMode.EASY) {
    const cityReveal = document.getElementById('song-city-reveal');
    cityReveal.textContent = `🏙️ ${songDisplayName(state.currentSong)}`;
    cityReveal.style.display = 'block';
  }

  // desactivar botones
  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

  if (isCorrect) {
    btn.classList.add('correct');
    state.correct++;
    state.streak++;

    const basePoints = computeBasePoints(elapsed);
    // Evento Shiny: multiplica por x5 los puntos obtenidos en la ronda.
    // Evento Pikachu: multiplica por x3 los puntos obtenidos en la ronda.
    const activeEventId = PokeEvents.activeId();
    const eventPointsMultiplier = activeEventId === "shiny" ? 5 : activeEventId === "pikachu" ? 3 : 1;
    // Pista visual: si el jugador la ha usado esta ronda, se queda con la
    // mitad de los puntos que le correspondería (ver useVisualHint()).
    const hintPointsMultiplier = state.hintUsed ? 0.5 : 1;
    const multiplier = getStreakMultiplier(state.streak) * eventPointsMultiplier * hintPointsMultiplier;
    const roundPoints = Math.round(basePoints * multiplier);
    state.score += roundPoints;
    // addProfileXp/trackCorrectAnswer/trackSongCorrect son las únicas llamadas
    // de este bloque que pueden disparar avisos (subida de nivel, logro,
    // ficha de Sonidex...) y, con ello, tocar cosas más "delicadas" como la
    // clasificación global (Leaderboard.submitScore). Van en su propio
    // try/catch para que, si algo ahí falla de forma inesperada, no corte el
    // resto de handleAnswer: sin esto, una excepción a mitad de esta cadena
    // hacía que la función terminara ahí mismo y el botón "Siguiente Ronda"
    // (que se muestra al final) se quedara sin aparecer nunca.
    try { addProfileXp(roundPoints); } catch (e) { console.error("[handleAnswer] Error en addProfileXp:", e); }
    showPointsPopup(btn, roundPoints, multiplier);

    playSFX(SFX.correct);
    spawnParticles(btn);
    try { trackCorrectAnswer(); } catch (e) { console.error("[handleAnswer] Error en trackCorrectAnswer:", e); }
    try { trackSongCorrect(state.currentSong); } catch (e) { console.error("[handleAnswer] Error en trackSongCorrect:", e); }

    // Evento Venusaur: solo restaura una vida si el jugador acierta esta ronda.
    if (activeEventId === "venusaur") healLife();

    if (state.streak >= 3) showCombo();

  } else {
    btn.classList.add('wrong');
    state.streak = 0;
    playSFX(SFX.wrong);

    if (session.mode === GameMode.STORY) loseLife();

    setTimeout(() => {
      document.querySelectorAll('.answer-btn').forEach(b => {
        // dataset.correct en vez del texto del botón: en EASY el texto
        // puede estar traducido (p. ej. "Unova" en vez de "Teselia") y
        // dejaría de coincidir con la clave interna de la región.
        if (b.dataset.correct === "1") {
          b.classList.add('reveal');
        }
      });
    }, 550);
  }

  updateStatsUI();

  // Partida con rondas sin límite (Desafío Infinito, o cualquier otro modo
  // con el interruptor ♾️ activado): un fallo termina la partida, salvo
  // que el evento Venusaur ya haya concedido alguna vida extra esta
  // partida (session.infiniteLives > 0 — ver healLife()), en cuyo caso el
  // fallo solo consume una de esas vidas (loseInfiniteLife()) y la
  // partida continúa con normalidad, igual que ya hacía electrodeExplode()
  // para el caso de que Electrode explote sin que el jugador haya
  // respondido. En la práctica solo GameMode.INFINITE llega a tener
  // infiniteLives > 0 (los Eventos Pokémon, únicos que las conceden, solo
  // aparecen en Modo Historia y en el propio Desafío Infinito — ver
  // pokemon.js), así que en el resto de modos con ♾️ activado el fallo
  // termina la partida siempre, sin excepción.
  if (isEndlessSession() && !isCorrect) {
    if (session.infiniteLives > 0) {
      loseInfiniteLife();
    } else {
      setTimeout(() => showResult(), 900);
      return;
    }
  }

  // Modo Historia: si esta respuesta ha agotado las 3 vidas, storyGameOver()
  // ya se encarga de cortar la partida (ver loseLife()); no mostramos "Siguiente".
  if (session.mode === GameMode.STORY && session.storyLives <= 0) {
    return;
  }

  setTimeout(() => document.getElementById('next-btn').classList.add('visible'), 750);
}


// true mientras hay una petición de "pasar de ronda" en curso que todavía
// no ha llegado a una nueva startRound() (p. ej. porque de por medio se
// está mostrando la notificación de un Evento Pokémon). Se usa desde
// goToNextRound() para ignorar pulsaciones repetidas del botón "Siguiente
// Ronda"/barra espaciadora mientras tanto; sin esto, cada pulsación de
// más disparaba su propia llamada a nextRound() y hacía que una ronda se
// saltara entera sin llegar a mostrarse. Se desbloquea en startRound(),
// que es quien de verdad marca que la ronda siguiente ha arrancado.
let nextRoundInFlight = false;

/** Punto único de entrada para pasar a la siguiente ronda: lo usan tanto
 * el click del botón "Siguiente Ronda" como el atajo de la barra
 * espaciadora (ver más abajo). Ignora la llamada si ya hay una en curso
 * (ver nextRoundInFlight), de forma que ningún click/pulsación cuente
 * como válido hasta que la ronda siguiente arranca de verdad. */
function goToNextRound() {
  if (nextRoundInFlight) return;
  nextRoundInFlight = true;
  nextRound();
}

/** Corta el audio de la ronda anterior y decide qué toca a continuación:
 * si quedan rondas, arranca la siguiente (startRound); si no, muestra
 * el resultado final o, en Modo Historia, avanza de fase/región. */
function nextRound() {
  // no cortamos la canción en hard (querían que siguiera sonando), pero sí al cambiar de ronda
  stopAudioHard();

  const roundsTarget = session.roundsTarget;

  if (!isEndlessSession() && state.round >= roundsTarget) {
    if (session.mode === GameMode.STORY) { handleStoryStageComplete(); return; }
    showResult();
    return;
  }
  state.round++;
  // Tras terminar la canción, el sistema de Eventos Pokémon decide si activa
  // un evento (solo Modo Historia); en cualquier caso, continúa con startRound.
  PokeEvents.tryTrigger(startRound);
}

/** Construye y muestra la pantalla de resultado final de una partida
 * (emoji, título y resumen según puntuación/aciertos), adaptando el
 * mensaje al modo jugado (Desafío Infinito, Historia, resto de modos). */
function showResult() {
  stopAudioHard();
  const overlay = document.getElementById('result-overlay');

  if (isEndlessSession()) {
    let emoji = '😅', title = t("result.attempt");
    if (state.correct >= 30) { emoji = '🏆'; title = t("result.master"); }
    else if (state.correct >= 15) { emoji = '⭐'; title = t("result.great"); }
    else if (state.correct >= 5) { emoji = '🎵'; title = t("result.good"); }
    document.getElementById('result-emoji').textContent = emoji;
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-score-num').textContent = t("result.infiniteScore", { n: state.correct, score: state.score });
    overlay.classList.add('show');
    if (state.correct >= 10) playSFX(SFX.victory);
    trackGameFinished(Math.round(Math.min(state.correct / 20, 1) * 100));

    // El récord personal y el envío a la clasificación global "infinite"
    // solo aplican al propio Desafío Infinito (GameMode.INFINITE): el
    // interruptor ♾️ de los demás modos cambia sus reglas (menos/otras
    // opciones, región fija, sin Eventos Pokémon...), así que esa
    // puntuación no es comparable a la del Desafío Infinito y no debe
    // mezclarse con su clasificación ni con su récord guardado.
    if (session.mode === GameMode.INFINITE) {
      if (state.score > (achievementsData.stats.bestInfiniteScore || 0)) {
        achievementsData.stats.bestInfiniteScore = state.score;
        saveAchievements();
        // Solo se envía al backend de clasificaciones cuando se supera el
        // récord personal (no en cada partida): ver leaderboard.js.
        Leaderboard.submitScore("infinite", profile.username, profile.avatarId, state.score, ensurePlayerId());
      }
      return;
    }
    // Normal/Difícil/Combate jugados con el interruptor ♾️ activado: su
    // récord y su envío a la clasificación global correspondiente
    // (hard/combat/region_<Región>, según el caso) se gestionan igual
    // que en una partida normal, así que seguimos con el resto de la
    // función en vez de salir aquí.
  } else {
    const pct = Math.round(state.correct / session.roundsTarget * 100);
    let emoji = '😅', title = t("result.attempt");
    if (pct >= 90) { emoji = '🏆'; title = t("result.master"); }
    else if (pct >= 70) { emoji = '⭐'; title = t("result.great"); }
    else if (pct >= 50) { emoji = '🎵'; title = t("result.good"); }
    document.getElementById('result-emoji').textContent = emoji;
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-score-num').textContent = t("result.roundsScore", { n: state.correct, total: session.roundsTarget, score: state.score });
    overlay.classList.add('show');
    if (state.correct >= 10) playSFX(SFX.victory);
    trackGameFinished(pct, { mode: session.mode, region: session.normalRegion, otherGame: session.otherGame, correctCount: state.correct });
  }

  if (session.mode === GameMode.HARD && state.score > (achievementsData.stats.bestHardScore || 0)) {
    achievementsData.stats.bestHardScore = state.score;
    saveAchievements();
    // Solo se envía al backend de clasificaciones cuando se supera el
    // récord personal (no en cada partida): ver leaderboard.js.
    Leaderboard.submitScore("hard", profile.username, profile.avatarId, state.score, ensurePlayerId());
  }

  // Modo Normal: dos clasificaciones distintas según session.normalRegion
  // (mismo criterio que isCombat en generateOptionsForCurrent) — Modo
  // Combate ("Combate") tiene su propio récord/clasificación global
  // ("combat"), y cada región de verdad tiene la suya, independiente de
  // las demás ("region_<Región>" — ver LEADERBOARD_CATEGORIES en
  // leaderboard.js), para que jugar Kanto no compita con jugar Alola.
  if (session.mode === GameMode.NORMAL && session.normalRegion === "Combate") {
    if (state.score > (achievementsData.stats.bestCombatScore || 0)) {
      achievementsData.stats.bestCombatScore = state.score;
      saveAchievements();
      Leaderboard.submitScore("combat", profile.username, profile.avatarId, state.score, ensurePlayerId());
    }
  } else if (session.mode === GameMode.NORMAL && session.normalRegion) {
    const region = session.normalRegion;
    if (!achievementsData.stats.bestRegionScore) achievementsData.stats.bestRegionScore = {};
    if (state.score > (achievementsData.stats.bestRegionScore[region] || 0)) {
      achievementsData.stats.bestRegionScore[region] = state.score;
      saveAchievements();
      Leaderboard.submitScore("region_" + region, profile.username, profile.avatarId, state.score, ensurePlayerId());
    }
  }
}

/** Cierra la pantalla de resultado y vuelve a arrancar una partida con
 * la misma configuración (modo, región o minijuego) que la anterior. */
function restartGame() {
  document.getElementById('result-overlay').classList.remove('show');
  // Si esta partida se jugó con el interruptor ♾️ activado, la siguiente
  // (misma configuración) se reinicia también con él activado.
  const wasEndless = session.endless;
  // reiniciar mismo modo
  if (session.mode === GameMode.NORMAL) startGame(GameMode.NORMAL, session.normalRegion, { endless: wasEndless });
  else if (session.mode === GameMode.OTHER) startGame(GameMode.OTHER, session.otherGame, { endless: wasEndless });
  else if (session.mode === GameMode.INFINITE) startGame(GameMode.INFINITE);
  else if (session.mode === GameMode.STORY) startStoryMode();
  else startGame(session.mode, null, { endless: wasEndless });
}

/** Sale de la partida actual hacia la pantalla de Inicio, parando el
 * audio de la ronda y reanudando la música de menú. */
function exitGame() {
  document.getElementById('result-overlay').classList.remove('show');
  stopAudioHard();
  showScreen("home", false);
  ensureMenuMusicPlaying();
}

// ═══════════════════════════════════════════════
//  🧩 MENÚS: handlers
// ═══════════════════════════════════════════════
document.getElementById("go-main").addEventListener("click", () => { playSFX(SFX.go); showScreen("mainModes"); });
document.getElementById("go-other").addEventListener("click", () => { playSFX(SFX.go); showScreen("otherGames"); });
document.getElementById("go-options").addEventListener("click", () => { playSFX(SFX.go); showScreen("options"); });
document.getElementById("go-achievements").addEventListener("click", () => { playSFX(SFX.go); renderAchievementsScreen(); showScreen("achievements"); });
document.getElementById("go-sonidex").addEventListener("click", () => { playSFX(SFX.go); renderSonidexScreen(); showScreen("sonidex"); });
document.getElementById("go-leaderboard").addEventListener("click", () => { playSFX(SFX.go); renderLeaderboardScreen(); showScreen("leaderboard"); });
document.getElementById("go-guide").addEventListener("click", () => { playSFX(SFX.go); showScreen("guide"); });

document.getElementById("mode-easy").addEventListener("click", () => { playSFX(SFX.go); startGame(GameMode.EASY, null, { endless: endlessToggle.easy }); });
document.getElementById("mode-normal").addEventListener("click", () => { playSFX(SFX.go); showScreen("regionSelect"); });
document.getElementById("mode-hard").addEventListener("click", () => {
  playSFX(SFX.go);
  if (!isModeUnlocked("hard")) { showLockedModeMessage("hard"); return; }
  startGame(GameMode.HARD, null, { endless: endlessToggle.hard });
});
document.getElementById("mode-combat").addEventListener("click", () => {
  playSFX(SFX.go);
  if (!isModeUnlocked("combat")) { showLockedModeMessage("combat"); return; }
  startGame(GameMode.NORMAL, "Combate", { endless: endlessToggle.combat });
});
document.getElementById("mode-infinite").addEventListener("click", () => {
  playSFX(SFX.go);
  if (!isModeUnlocked("infinite")) { showLockedModeMessage("infinite"); return; }
  startGame(GameMode.INFINITE);
});

/** Engancha el pequeño interruptor ♾️ de un botón de modo (Fácil/Normal/
 * Difícil/Combate) o de una categoría de Minijuegos (Modo OTHER):
 * alterna `toggleState[key]` (uno de `endlessToggle`/`otherEndlessToggle`)
 * y refresca su aspecto (ver `renderEndlessTogglesUI()` en ui.js), sin
 * dejar que el click/tecla "cuele" hacia el botón grande que lo contiene
 * y arranque la partida de golpe (stopPropagation/preventDefault).
 * Responde tanto a click como a Enter/Espacio, ya que es un
 * <span role="button"> (no un <button> real, porque no puede anidarse
 * dentro de otro <button>). Cada vez que el interruptor pasa a quedar
 * ACTIVADO (no al desactivarlo) se muestra además el aviso de "modo
 * infinito activado" (`showEndlessInfoModal()` en ui.js), que ya se
 * encarga de no mostrarse si el jugador marcó "No volver a mostrar" en
 * una partida anterior.
 * @param {Object} toggleState  `endlessToggle` u `otherEndlessToggle`
 * @param {string} key  clave dentro de `toggleState`
 * @param {string} elId  id del elemento del interruptor en index.html
 */
function setupEndlessToggle(toggleState, key, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const flip = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleState[key] = !toggleState[key];
    playSFX(SFX.back);
    renderEndlessTogglesUI();
    // Solo al ACTIVAR el interruptor (no al desactivarlo) avisamos de
    // las reglas del modo infinito (ver showEndlessInfoModal() en ui.js),
    // que además respeta settings.hideEndlessInfo si el jugador ya pidió
    // no volver a verlo.
    if (toggleState[key]) showEndlessInfoModal();
  };
  el.addEventListener("click", flip);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") flip(e);
  });
}
setupEndlessToggle(endlessToggle, "easy", "mode-easy-endless");
setupEndlessToggle(endlessToggle, "normal", "mode-normal-endless");
setupEndlessToggle(endlessToggle, "hard", "mode-hard-endless");
setupEndlessToggle(endlessToggle, "combat", "mode-combat-endless");
Object.keys(otherEndlessToggle).forEach(key => {
  setupEndlessToggle(otherEndlessToggle, key, `other-${key}-endless`);
});

document.querySelectorAll("[data-other]").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-other");
    if (!isOtherUnlocked(key)) { showLockedOtherMessage(key); return; }
    playSFX(SFX.go);
    // Se reinicia aquí (y no dentro de startGame) para que quede a null tanto si esta
    // categoría no es Openings del Anime como si el jugador entra en Openings del Anime
    // jugando en inglés (sin pantalla previa: buildPool() fuerza la versión inglesa
    // directamente a partir de settings.language, ignorando este valor).
    session.openingsVariant = null;
    if (key === "openings-anime" && settings.language === "es") {
      // Jugando en español: antes de arrancar, preguntar España/Latino (ver botones
      // #openings-lang-spain / #openings-lang-latino más abajo).
      showScreen("openingsLangSelect");
      return;
    }
    startGame(GameMode.OTHER, key, { endless: otherEndlessToggle[key] });
  });
});

// Openings del Anime: pantalla previa de selección de doblaje (solo se llega aquí
// jugando en español, ver el listener de [data-other] de arriba).
document.getElementById("openings-lang-spain").addEventListener("click", () => {
  playSFX(SFX.go);
  session.openingsVariant = null;
  startGame(GameMode.OTHER, "openings-anime", { endless: otherEndlessToggle["openings-anime"] });
});
document.getElementById("openings-lang-latino").addEventListener("click", () => {
  playSFX(SFX.go);
  session.openingsVariant = "latino";
  startGame(GameMode.OTHER, "openings-anime", { endless: otherEndlessToggle["openings-anime"] });
});

// Normal: tarjetas de región
const REGION_META = {
  "Kanto":   { icon: "🍃", color: "#ef4444", gen: 1 },
  "Johto":   { icon: "🌸", color: "#eab308", gen: 2 },
  "Hoenn":   { icon: "🌊", color: "#06b6d4", gen: 3 },
  "Sinnoh":  { icon: "❄️", color: "#3b82f6", gen: 4 },
  "Teselia": { icon: "🏙️", color: "#64748b", gen: 5 },
  "Kalos":   { icon: "🗼", color: "#ec4899", gen: 6 },
  "Alola":   { icon: "🌴", color: "#f97316", gen: 7 },
};

const pillsWrap = document.getElementById("region-pills");
REGIONS.forEach(r => {
  const meta = REGION_META[r] || { icon: "🎮", color: "var(--blue)", gen: "?" };

  const b = document.createElement("button");
  b.className = "region-card";
  b.style.setProperty("--region-color", meta.color);
  b.innerHTML = `
    <span class="region-card-gen">GEN ${meta.gen}</span>
    <span class="region-card-icon">${meta.icon}</span>
    <span class="region-card-name">${regionDisplayName(r)}</span>
  `;
  b.onclick = () => { playSFX(SFX.go); startGame(GameMode.NORMAL, r, { endless: endlessToggle.normal }); };
  pillsWrap.appendChild(b);
});

// Quiz: next
document.getElementById("next-btn").addEventListener("click", goToNextRound);
document.getElementById("hint-btn").addEventListener("click", useVisualHint);
document.getElementById("restart-btn").addEventListener("click", () => { playSFX(SFX.go); restartGame(); });
document.getElementById("exit-btn").addEventListener("click", () => { playSFX(SFX.go); exitGame(); });

// Atajo de teclado: al pulsar la barra espaciadora mientras el botón
// "Siguiente Ronda" está visible (tras responder), avanza a la siguiente
// ronda igual que si se hubiera pulsado el botón. Se usa preventDefault()
// para evitar el scroll de página y, si el botón tuviera el foco, para que
// el navegador no dispare además su propio evento "click" y se llame a
// goToNextRound() dos veces.
//
// Comprobar solo la clase "visible" no basta, porque esa clase se quita
// dentro de startRound(), que puede tardar en llegar (Eventos Pokémon,
// timeouts...): si el jugador pulsa la barra espaciadora (o toca el botón)
// varias veces seguidas mientras el botón todavía no ha perdido esa clase,
// cada pulsación de más podría disparar su propia llamada a nextRound() y
// saltarse una ronda entera. goToNextRound() ya ignora esas pulsaciones de
// más mientras haya una en curso (ver nextRoundInFlight), así que aquí
// basta con llamarla igual que hace el click del botón.
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.key !== " ") return;
  const nextBtn = document.getElementById("next-btn");
  if (!nextBtn || !nextBtn.classList.contains("visible")) return;
  e.preventDefault();
  goToNextRound();
});


// ═══════════════════════════════════════════════
//  📖 MODO HISTORIA
// ═══════════════════════════════════════════════
// Recorrido por todas las regiones (REGIONS, en orden: Kanto → ... → Alola).
// Por cada región: 10 rondas normales de esa región + pantalla de "enemigo
// poderoso" + 3 rondas de combate + animación de región completada, y se
// pasa automáticamente a la pantalla previa de la siguiente región.

/** Arranca una partida nueva del Modo Historia desde el principio:
 * reinicia el progreso (región inicial, fase, puntuación y vidas de
 * la historia) y muestra la primera pantalla previa de región. */
function startStoryMode() {
  session.storyRegionIndex = 0;
  session.storyPhase = "region";
  session.storyTotalScore = 0;
  session.storyTotalCorrect = 0;
  session.storyLives = 3;
  session.storyStreak = 0;
  document.getElementById('result-overlay').classList.remove('show');
  stopAudioHard();
  stopMenuMusic();
  storyShowRegionSplash();
}



// Se llama cuando se completan las rondas de la fase actual (región o combate).
function handleStoryStageComplete() {
  stopAudioHard();
  // state.score ya arrancó desde session.storyTotalScore (ver startGame),
  // así que aquí simplemente sincronizamos el total con el valor actual
  // en vez de sumarlo de nuevo (evita duplicar puntos). Lo mismo con la
  // racha de aciertos, para que no se resetee al cambiar de fase/región.
  session.storyTotalScore = state.score;
  session.storyTotalCorrect += state.correct;
  session.storyStreak = state.streak;

  if (session.storyPhase === "region") {
    // 10 rondas de región superadas → aparece el enemigo poderoso
    showScreen("home", false);
    storyShowEnemyScreen();
  } else {
    // 3 rondas de combate superadas → región completada
    const regionName = REGIONS[session.storyRegionIndex];
    const sStats = achievementsData.stats;
    if (!sStats.storyRegionsCompleted) sStats.storyRegionsCompleted = [];
    if (!sStats.storyRegionsCompleted.includes(regionName)) {
      sStats.storyRegionsCompleted.push(regionName);
      saveAchievements();
      checkAchievements();
    }
    showScreen("home", false);
    storyShowRegionComplete(regionName, () => {
      session.storyRegionIndex++;
      if (session.storyRegionIndex >= REGIONS.length) {
        storyFinish();
      } else {
        // Nueva región: las vidas se recargan a 3
        session.storyLives = 3;
        renderLives();
        storyShowRegionSplash();
      }
    });
  }
}

// Todas las regiones completadas: animación final y vuelta al menú.
function storyFinish() {
  const totalRounds = REGIONS.length * (TOTAL_ROUNDS + STORY_COMBAT_ROUNDS);
  const pct = totalRounds > 0 ? Math.round(session.storyTotalCorrect / totalRounds * 100) : 0;
  achievementsData.stats.storyModeCompleted = true;
  if (pct === 100) achievementsData.stats.storyModeCompletedPerfect = true;
  if (session.storyTotalScore > (achievementsData.stats.bestStoryScore || 0)) {
    achievementsData.stats.bestStoryScore = session.storyTotalScore;
    // Igual que en Desafío Infinito, solo se envía al backend de
    // clasificaciones al superar el récord personal (ver leaderboard.js).
    Leaderboard.submitScore("story", profile.username, profile.avatarId, session.storyTotalScore, ensurePlayerId());
  }
  saveAchievements();
  trackGameFinished(pct, { mode: session.mode });

  // El Modo Historia ha terminado (con éxito, a diferencia de
  // storyGameOver()): se sale de él ya aquí, antes de mostrar la
  // animación de victoria, para que el indicador de vidas (corazones) y,
  // sobre todo, el aviso de "nervios" (pulso rojo en toda la pantalla
  // cuando solo queda 1 vida — ver #nervous-overlay, que es un overlay
  // fijo que se ve por encima de cualquier pantalla) se apaguen de
  // inmediato en vez de quedarse "colgados" sobre la pantalla de
  // victoria y, después, sobre el menú principal. session.storyLives se
  // resetea a 3 por la misma razón que en storyGameOver(): que no quede
  // un valor de la partida recién terminada a la espera de la próxima
  // (aunque startStoryMode() ya lo reinicia igualmente al empezar una
  // partida nueva).
  session.storyLives = 3;
  session.mode = null;
  renderLives();

  storyCompleteTitle.textContent = t("story.completeTitle");
  storyCompleteBall.src = STORY_BALL_COMBAT;
  storyCompleteOverlay.classList.remove('gameover');
  storyCompleteOverlay.classList.add('show');
  playSFX(SFX.victory);
  setTimeout(() => {
    storyCompleteOverlay.classList.remove('show');
    setTimeout(() => {
      showScreen("home", false);
      ensureMenuMusicPlaying();
    }, 550);
  }, 2200);
}

document.getElementById("go-story").addEventListener("click", () => { playSFX(SFX.go); startStoryMode(); });

// ═══════════════════════════════════════════════
//  🚀 INIT
// ═══════════════════════════════════════════════
// Arranque de la aplicación al cargar la página. loadSettings/loadAchievements/
// loadProfile vienen de storage.js, applyTranslations() de i18n.js,
// applyLanguageSwitchUI() de ui.js, buildBgPokemon() de pokemon.js y menuAudio
// de audio.js: si algún día se cambia el orden de los <script> en index.html,
// este bloque sería el primero en romperse.
loadSettings();
// Pinta el idioma guardado (settings.language) en todo el marcado estático
// y en los botones Español/English nada más cargar la página, antes de que
// el jugador toque nada.
applyTranslations();
applyLanguageSwitchUI();
loadAchievements();
loadProfile();
renderProfileBar();
updateHomeAchievementSummary();
updateHomeSonidexSummary();
updateModeLocksUI();
updateOtherLocksUI();
renderEndlessTogglesUI();
buildBgPokemon();
musicSlider.value = Math.round(settings.musicVol * 100);
sfxSlider.value = Math.round(settings.sfxVol * 100);
applyTheme();
applyGraphicsSettings();
applyAudioVolumes();
  menuAudio.volume=settings.musicVol;

// Fix: al cargar la página, el header (con el contenedor de puntos/ronda/racha)
// no tenía aún ningún estado aplicado por showScreen(), así que se veía
// brevemente en el menú principal hasta la primera navegación. Forzamos aquí
// el mismo estado que showScreen("home") aplicaría, sin tocar la pila de navegación.
showScreen("home", false);

// Validación mínima para mostrar advertencias más útiles
function hasModeSongs(){
  const mainCount = songs.filter(s => s.group === "main").length;
  return mainCount >= 4;
}
// NOTA: la música del menú/título ya NO arranca aquí. Arranca al tocar
// la pantalla previa (ver dismissSplash / unlockMenuMusic más arriba).

if (!hasModeSongs()) {
  alert("⚠️ Necesitas al menos 4 canciones en 'songs[]' con group:'main' para jugar (Juegos Principales).");
}
