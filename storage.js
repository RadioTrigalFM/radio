/* ══════════════════════════════════════════════════════════════════════
   RADIO TRIGAL FM — CAPA DE PERSISTENCIA (storage.js)
   ══════════════════════════════════════════════════════════════════════
   Este fichero agrupa TODO lo relacionado con guardar y leer datos del
   jugador en localStorage: los ajustes (volumen, tema, opciones
   gráficas), el perfil (nombre, avatar, experiencia) y los logros
   (desbloqueados + estadísticas acumuladas).

   Aquí solo vive la "forma de los datos" y las funciones para
   cargarlos/guardarlos (loadX / saveX), junto con el pequeño catálogo
   de avatares que necesita el perfil. La lógica de negocio que USA esos
   datos (calcular el nivel a partir de la experiencia, comprobar si se
   desbloquea un logro, pintar la rejilla de avatares en pantalla...)
   sigue viviendo en game.js, que las consume con total normalidad.

   Al ser un script clásico (sin módulos), todo lo que se declara aquí
   con `const`/`let`/`function` queda en el ámbito global de la página,
   exactamente igual que si siguiera estando dentro de game.js. Por eso
   este fichero debe cargarse ANTES que game.js (y, por seguridad, antes
   también que audio.js y pokemon.js, que en algún punto podrían llegar
   a usar `settings`/`profile`/`achievementsData`):
     <script src="storage.js"></script>
     <script src="audio.js"></script>
     <script src="pokemon.js"></script>
     <script src="game.js"></script>

   Ninguna de las funciones de aquí lanza excepciones hacia fuera: todas
   envuelven el acceso a localStorage en try/catch y, si algo falla (por
   ejemplo, en modo incógnito o con localStorage deshabilitado), se
   limitan a no guardar/cargar nada, dejando los valores por defecto.
   ══════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
//  ⚙️ AJUSTES (persisten en localStorage)
// ═══════════════════════════════════════════════

// Objeto con las preferencias del jugador. Se modifica "in place" desde el
// resto del juego (game.js) y se guarda llamando a saveSettings(). Estos son
// los valores por defecto que se usan la primera vez que se juega, antes de
// que exista nada guardado en localStorage.
const settings = {
  musicVol: 0.3,      // volumen de la música (0 a 1)
  sfxVol: 0.5,         // volumen de los efectos de sonido (0 a 1)
  darkMode: true,      // true = tema oscuro, false = tema claro
  animatedBg: true,   // Opciones gráficas: cielo/nubes/Pokémon de fondo
  particles: true,    // Opciones gráficas: chispas al acertar / logros
  language: "es",     // idioma de los menús: "es" (Español) o "en" (English) — ver i18n.js
  hideEndlessInfo: false, // true = no volver a mostrar el aviso "modo infinito activado" (ver showEndlessInfoModal() en ui.js)
};

/** Carga las opciones del jugador (volumen, modo oscuro, fondo animado,
 * partículas...) desde localStorage, sustituyendo los valores por
 * defecto de `settings` solo cuando el dato guardado es válido. */
function loadSettings() {
  try {
    // Lee el JSON guardado bajo la clave "pokequiz_settings". Si no hay
    // nada guardado todavía (primera vez que se abre el juego), no hay
    // nada que hacer y se mantienen los valores por defecto de arriba.
    const raw = localStorage.getItem("pokequiz_settings");
    if (!raw) return;
    const obj = JSON.parse(raw);
    // Se valida el tipo de cada campo antes de aplicarlo, por si el JSON
    // guardado estuviera corrupto o viniera de una versión distinta del
    // juego con una forma de datos diferente.
    if (typeof obj.musicVol === "number") settings.musicVol = clamp01(obj.musicVol);
    if (typeof obj.sfxVol === "number") settings.sfxVol = clamp01(obj.sfxVol);
    if (typeof obj.darkMode === "boolean") settings.darkMode = obj.darkMode;
    if (typeof obj.animatedBg === "boolean") settings.animatedBg = obj.animatedBg;
    if (typeof obj.particles === "boolean") settings.particles = obj.particles;
    if (obj.language === "es" || obj.language === "en") settings.language = obj.language;
    if (typeof obj.hideEndlessInfo === "boolean") settings.hideEndlessInfo = obj.hideEndlessInfo;
  } catch(e) {}
}
/** Persiste el objeto `settings` completo en localStorage. */
function saveSettings() {
  try { localStorage.setItem("pokequiz_settings", JSON.stringify(settings)); } catch(e) {}
}
/** Limita un número al rango [0, 1] (usado para volúmenes). */
function clamp01(x){ return Math.max(0, Math.min(1, x)); }

// ═══════════════════════════════════════════════
//  👤 PERFIL DE JUGADOR (nombre + avatar, persisten en localStorage)
// ═══════════════════════════════════════════════
// Catálogo de avatares: caras de Pokémon estilo Pokémon Mundo Misterioso
// (retratos de PMDCollab/SpriteCollab). Si estas URLs no cargan, se puede
// sustituir "url" por una ruta local, p.ej. "images/avatars/pikachu.png".
const AVATAR_CATALOG = [
  { id: "pikachu",    name: "Pikachu",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0025/Normal.png" },
  { id: "bulbasaur",  name: "Bulbasaur",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0001/Normal.png" },
  { id: "charmander", name: "Charmander", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0004/Normal.png" },
  { id: "squirtle",   name: "Squirtle",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0007/Normal.png" },
  { id: "eevee",      name: "Eevee",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0133/Normal.png" },
  { id: "jigglypuff", name: "Jigglypuff", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0039/Normal.png" },
  { id: "psyduck",    name: "Psyduck",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0054/Normal.png" },
  { id: "snorlax",    name: "Snorlax",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0143/Normal.png" },
  { id: "gengar",     name: "Gengar",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0094/Normal.png" },
  { id: "meowth",     name: "Meowth",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0052/Normal.png" },
  { id: "vulpix",     name: "Vulpix",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0037/Normal.png" },
  { id: "chikorita",  name: "Chikorita",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0152/Normal.png" },
  { id: "cyndaquil",  name: "Cyndaquil",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0155/Normal.png" },
  { id: "totodile",   name: "Totodile",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0158/Normal.png" },
  { id: "riolu",      name: "Riolu",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0447/Normal.png" },
  { id: "umbreon",    name: "Umbreon",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0197/Normal.png" },
  { id: "espeon",     name: "Espeon",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0196/Normal.png" },
  { id: "piplup",     name: "Piplup",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0393/Normal.png" },
  { id: "torchic",    name: "Torchic",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0255/Normal.png" },
  { id: "mudkip",     name: "Mudkip",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0258/Normal.png" },
  { id: "venusaur",   name: "Venusaur",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0003/Normal.png" },
  { id: "blastoise",  name: "Blastoise",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0009/Normal.png" },
  { id: "charizard",  name: "Charizard",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0006/Normal.png" },
  { id: "caterpie",   name: "Caterpie",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0010/Normal.png" },
  { id: "rapidash",   name: "Rapidash",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0078/Normal.png" },
  { id: "slowpoke",   name: "Slowpoke",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0079/Normal.png" },
  { id: "hypno",      name: "Hypno",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0097/Normal.png" },
  { id: "electrode",  name: "Electrode",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0101/Normal.png" },
  { id: "chansey",    name: "Chansey",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0113/Normal.png" },
  { id: "ditto",      name: "Ditto",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0132/Normal.png" },
  { id: "porygon",    name: "Porygon",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0137/Normal.png" },
  { id: "mewtwo",     name: "Mewtwo",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0150/Normal.png" },
  { id: "mew",        name: "Mew",        url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0151/Normal.png" },
  { id: "inkay",      name: "Inkay",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0686/Normal.png" },
  { id: "treecko",    name: "Treecko",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0252/Normal.png" },
  { id: "turtwig",    name: "Turtwig",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0387/Normal.png" },
  { id: "chimchar",   name: "Chimchar",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0390/Normal.png" },
  { id: "snivy",      name: "Snivy",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0495/Normal.png" },
  { id: "oshawott",   name: "Oshawott",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0501/Normal.png" },
  { id: "tepig",      name: "Tepig",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0498/Normal.png" },
  { id: "skitty",     name: "Skitty",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0300/Normal.png" },
  { id: "cubone",     name: "Cubone",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0104/Normal.png" },
  { id: "alakazam",   name: "Alakazam",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0065/Normal.png" },
  { id: "xatu",       name: "Xatu",       url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0178/Normal.png" },
  { id: "absol",      name: "Absol",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0359/Normal.png" },
  { id: "ninetales",  name: "Ninetales",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0038/Normal.png" },
  { id: "gardevoir",  name: "Gardevoir",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0282/Normal.png" },
  { id: "wigglytuff", name: "Wigglytuff", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0040/Normal.png" },
  { id: "chatot",     name: "Chatot",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0441/Normal.png" },
  { id: "grovyle",    name: "Grovyle",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0253/Normal.png" },
  { id: "dusknoir",   name: "Dusknoir",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0477/Normal.png" },
  { id: "celebi",     name: "Celebi",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0251/Normal.png" },
  { id: "kangaskhan", name: "Kangaskhan", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0115/Normal.png" },
  { id: "kecleon",    name: "Kecleon",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0352/Normal.png" },
  { id: "lucario",    name: "Lucario",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0448/Normal.png" },
  { id: "garchomp",   name: "Garchomp",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0445/Normal.png" },
  { id: "dragonite",  name: "Dragonite",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0149/Normal.png" },
  { id: "lapras",     name: "Lapras",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0131/Normal.png" },
  { id: "arcanine",   name: "Arcanine",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0059/Normal.png" },
  { id: "scizor",     name: "Scizor",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0212/Normal.png" },
  { id: "tyranitar",  name: "Tyranitar",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0248/Normal.png" },
  { id: "salamence",  name: "Salamence",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0373/Normal.png" },
  { id: "metagross",  name: "Metagross",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0376/Normal.png" },
  { id: "zoroark",    name: "Zoroark",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0571/Normal.png" },
  { id: "sylveon",    name: "Sylveon",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0700/Normal.png" },
  { id: "feebas",     name: "Feebas",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0349/Normal.png" },
  { id: "magikarp",   name: "Magikarp",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0129/Normal.png" },
  { id: "gyarados",   name: "Gyarados",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0130/Normal.png" },
  { id: "milotic",    name: "Milotic",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0350/Normal.png" },
  { id: "growlithe",  name: "Growlithe",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0058/Normal.png" },
  { id: "magnemite",  name: "Magnemite",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0081/Normal.png" },
  { id: "scyther",    name: "Scyther",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0123/Normal.png" },
  { id: "electabuzz", name: "Electabuzz", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0125/Normal.png" },
  { id: "magmar",     name: "Magmar",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0126/Normal.png" },
  { id: "jynx",       name: "Jynx",       url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0124/Normal.png" },
  { id: "tauros",     name: "Tauros",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0128/Normal.png" },
  { id: "jolteon",    name: "Jolteon",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0135/Normal.png" },
  { id: "flareon",    name: "Flareon",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0136/Normal.png" },
  { id: "vaporeon",   name: "Vaporeon",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0134/Normal.png" },
  { id: "dratini",    name: "Dratini",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0147/Normal.png" },
  { id: "hoothoot",   name: "Hoothoot",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0163/Normal.png" },
  { id: "ledian",     name: "Ledian",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0166/Normal.png" },
  { id: "togepi",     name: "Togepi",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0175/Normal.png" },
  { id: "mareep",     name: "Mareep",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0179/Normal.png" },
  { id: "marill",     name: "Marill",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0183/Normal.png" },
  { id: "sunkern",    name: "Sunkern",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0191/Normal.png" },
  { id: "sunflora",   name: "Sunflora",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0192/Normal.png" },
  { id: "wooper",     name: "Wooper",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0194/Normal.png" },
  { id: "unown",      name: "Unown",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0201/Normal.png" },
  { id: "wobbuffet",  name: "Wobbuffet",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0202/Normal.png" },
  { id: "dunsparce",  name: "Dunsparce",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0206/Normal.png" },
  { id: "snubbull",   name: "Snubbull",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0209/Normal.png" },
  { id: "shuckle",    name: "Shuckle",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0213/Normal.png" },
  { id: "heracross",  name: "Heracross",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0214/Normal.png" },
  { id: "teddiursa",  name: "Teddiursa",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0216/Normal.png" },
  { id: "corsola",    name: "Corsola",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0222/Normal.png" },
  { id: "sneasler",   name: "Sneasler",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0903/Normal.png" },
  { id: "rattata",    name: "Rattata",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0019/Normal.png" },
  { id: "geodude",    name: "Geodude",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0074/Normal.png" },
  { id: "onix",       name: "Onix",       url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0095/Normal.png" },
  { id: "staryu",     name: "Staryu",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0120/Normal.png" },
  { id: "aerodactyl", name: "Aerodactyl", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0142/Normal.png" },
  { id: "larvitar",   name: "Larvitar",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0246/Normal.png" },
  { id: "mantine",    name: "Mantine",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0226/Normal.png" },
  { id: "smeargle",   name: "Smeargle",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0235/Normal.png" },
  { id: "miltank",    name: "Miltank",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0241/Normal.png" },
  { id: "lugia",      name: "Lugia",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0249/Normal.png" },
  { id: "ho-oh",      name: "Ho-Oh",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0250/Normal.png" },
  { id: "ralts",      name: "Ralts",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0280/Normal.png" },
  { id: "shedinja",   name: "Shedinja",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0292/Normal.png" },
  { id: "loudred",    name: "Loudred",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0294/Normal.png" },
  { id: "sableye",    name: "Sableye",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0302/Normal.png" },
  { id: "aggron",     name: "Aggron",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0306/Normal.png" },
  { id: "medicham",   name: "Medicham",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0308/Normal.png" },
  { id: "sharpedo",   name: "Sharpedo",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0319/Normal.png" },
  { id: "torkoal",    name: "Torkoal",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0324/Normal.png" },
  { id: "spoink",     name: "Spoink",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0325/Normal.png" },
  { id: "spinda",     name: "Spinda",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0327/Normal.png" },
  { id: "trapinch",   name: "Trapinch",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0328/Normal.png" },
  { id: "flygon",     name: "Flygon",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0330/Normal.png" },
  { id: "cacnea",     name: "Cacnea",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0331/Normal.png" },
  { id: "swablu",     name: "Swablu",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0333/Normal.png" },
  { id: "lunatone",   name: "Lunatone",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0337/Normal.png" },
  { id: "solrock",    name: "Solrock",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0338/Normal.png" },
  { id: "whiscash",   name: "Whiscash",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0340/Normal.png" },
  { id: "bagon",      name: "Bagon",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0371/Normal.png" },
  { id: "beldum",     name: "Beldum",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0374/Normal.png" },
  { id: "latias",     name: "Latias",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0380/Normal.png" },
  { id: "latios",     name: "Latios",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0381/Normal.png" },
  { id: "jirachi",    name: "Jirachi",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0385/Normal.png" },
  { id: "gible",      name: "Gible",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0443/Normal.png" },
  { id: "chespin",    name: "Chespin",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0650/Normal.png" },
  { id: "fennekin",   name: "Fennekin",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0653/Normal.png" },
  { id: "froakie",    name: "Froakie",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0656/Normal.png" },
  { id: "volcarona",  name: "Volcarona",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0637/Normal.png" },
  { id: "articuno",   name: "Articuno",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0144/Normal.png" },
  { id: "zapdos",     name: "Zapdos",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0145/Normal.png" },
  { id: "moltres",    name: "Moltres",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0146/Normal.png" },
  { id: "raikou",     name: "Raikou",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0243/Normal.png" },
  { id: "entei",      name: "Entei",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0244/Normal.png" },
  { id: "suicune",    name: "Suicune",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0245/Normal.png" },
  { id: "regirock",   name: "Regirock",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0377/Normal.png" },
  { id: "regice",     name: "Regice",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0378/Normal.png" },
  { id: "registeel",  name: "Registeel",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0379/Normal.png" },
  { id: "kyogre",     name: "Kyogre",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0382/Normal.png" },
  { id: "groudon",    name: "Groudon",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0383/Normal.png" },
  { id: "rayquaza",   name: "Rayquaza",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0384/Normal.png" },
  { id: "deoxys",     name: "Deoxys",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0386/Normal.png" },
  { id: "staraptor",  name: "Staraptor",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0398/Normal.png" },
  { id: "bidoof",     name: "Bidoof",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0399/Normal.png" },
  { id: "kricketune", name: "Kricketune", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0402/Normal.png" },
  { id: "luxray",     name: "Luxray",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0405/Normal.png" },
  { id: "pachirisu",  name: "Pachirisu",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0417/Normal.png" },
  { id: "lopunny",    name: "Lopunny",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0428/Normal.png" },
  { id: "gliscor",    name: "Gliscor",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0472/Normal.png" },
  { id: "abomasnow",  name: "Abomasnow",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0460/Normal.png" },
  { id: "weavile",    name: "Weavile",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0461/Normal.png" },
  { id: "rotom",      name: "Rotom",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0479/Normal.png" },
  { id: "uxie",       name: "Uxie",       url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0480/Normal.png" },
  { id: "mesprit",    name: "Mesprit",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0481/Normal.png" },
  { id: "azelf",      name: "Azelf",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0482/Normal.png" },
  { id: "dialga",     name: "Dialga",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0483/Normal.png" },
  { id: "palkia",     name: "Palkia",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0484/Normal.png" },
  { id: "heatran",    name: "Heatran",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0485/Normal.png" },
  { id: "regigigas",  name: "Regigigas",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0486/Normal.png" },
  { id: "giratina",   name: "Giratina",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0487/Normal.png" },
  { id: "cresselia",  name: "Cresselia",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0488/Normal.png" },
  { id: "manaphy",    name: "Manaphy",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0490/Normal.png" },
  { id: "darkrai",    name: "Darkrai",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0491/Normal.png" },
  { id: "shaymin",    name: "Shaymin",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0492/Normal.png" },
  { id: "arceus",     name: "Arceus",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0493/Normal.png" },
  { id: "excadrill",  name: "Excadrill",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0530/Normal.png" },
  { id: "scrafty",    name: "Scrafty",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0560/Normal.png" },
  { id: "chandelure", name: "Chandelure", url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0609/Normal.png" },
  { id: "hydreigon",  name: "Hydreigon",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0635/Normal.png" },
  { id: "reshiram",   name: "Reshiram",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0643/Normal.png" },
  { id: "zekrom",     name: "Zekrom",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0644/Normal.png" },
  { id: "kyurem",     name: "Kyurem",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0646/Normal.png" },
  { id: "keldeo",     name: "Keldeo",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0647/Normal.png" },
  { id: "meloetta",   name: "Meloetta",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0648/Normal.png" },
  { id: "rowlet",     name: "Rowlet",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0722/Normal.png" },
  { id: "litten",     name: "Litten",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0725/Normal.png" },
  { id: "popplio",    name: "Popplio",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0728/Normal.png" },
  { id: "xerneas",    name: "Xerneas",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0716/Normal.png" },
  { id: "yveltal",    name: "Yveltal",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0717/Normal.png" },
  { id: "zygarde",    name: "Zygarde",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0718/Normal.png" },
  { id: "diancie",    name: "Diancie",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0719/Normal.png" },
  { id: "hoopa",      name: "Hoopa",      url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0720/Normal.png" },
  { id: "tapu-koko",  name: "Tapu Koko",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0785/Normal.png" },
  { id: "tapu-lele",  name: "Tapu Lele",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0786/Normal.png" },
  { id: "tapu-bulu",  name: "Tapu Bulu",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0787/Normal.png" },
  { id: "tapu-fini",  name: "Tapu Fini",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0788/Normal.png" },
  { id: "cosmog",     name: "Cosmog",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0789/Normal.png" },
  { id: "solgaleo",   name: "Solgaleo",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0791/Normal.png" },
  { id: "lunala",     name: "Lunala",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0792/Normal.png" },
  { id: "marshadow",  name: "Marshadow",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0802/Normal.png" },
  { id: "kommo-o",    name: "Kommo-o",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0784/Normal.png" },
  { id: "cobalion",   name: "Cobalion",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0638/Normal.png" },
  { id: "terrakion",  name: "Terrakion",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0639/Normal.png" },
  { id: "virizion",   name: "Virizion",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0640/Normal.png" },
  { id: "tornadus",   name: "Tornadus",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0641/Normal.png" },
  { id: "thundurus",  name: "Thundurus",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0642/Normal.png" },
  { id: "landorus",   name: "Landorus",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0645/Normal.png" },
  { id: "volcanion",  name: "Volcanion",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0721/Normal.png" },
  { id: "necrozma",   name: "Necrozma",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0800/Normal.png" },
  { id: "magearna",   name: "Magearna",   url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0801/Normal.png" },
  { id: "zeraora",    name: "Zeraora",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0807/Normal.png" },
  { id: "meltan",     name: "Meltan",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0808/Normal.png" },
  { id: "dragapult",  name: "Dragapult",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0887/Normal.png" },
  { id: "zacian",     name: "Zacian",     url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0888/Normal.png" },
  { id: "zamazenta",  name: "Zamazenta",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0889/Normal.png" },
  { id: "eternatus",  name: "Eternatus",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0890/Normal.png" },
  { id: "urshifu",    name: "Urshifu",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0892/Normal.png" },
  { id: "regieleki",  name: "Regieleki",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0894/Normal.png" },
  { id: "regidrago",  name: "Regidrago",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0895/Normal.png" },
  { id: "glastrier",  name: "Glastrier",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0896/Normal.png" },
  { id: "spectrier",  name: "Spectrier",  url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0897/Normal.png" },
  { id: "calyrex",    name: "Calyrex",    url: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0898/Normal.png" },
];
/** Devuelve la URL de imagen del avatar con ese id, o la del primer
 * avatar del catálogo si no se encuentra (avatar por defecto). */
function getAvatarUrl(avatarId) {
  const av = AVATAR_CATALOG.find(a => a.id === avatarId);
  return av ? av.url : AVATAR_CATALOG[0].url;
}

// Id del avatar preseleccionado para un jugador nuevo: tanto en `profile`
// (más abajo) como en la pantalla de creación de perfil (pendingSetupAvatarId
// en ui.js), que arranca mostrando este mismo avatar marcado por defecto
// antes de que el jugador elija uno explícitamente.
const DEFAULT_AVATAR_ID = "eevee";

// Objeto con los datos del jugador. Igual que `settings`, se modifica "in
// place" desde game.js (p.ej. al ganar puntos) y se persiste llamando a
// saveProfile(). Valores por defecto para un jugador nuevo: sin nombre
// (username vacío significa "todavía no se ha creado el perfil"), avatar
// inicial = DEFAULT_AVATAR_ID, y 0 puntos de experiencia.
const profile = {
  username: "",
  avatarId: DEFAULT_AVATAR_ID,
  xp: 0,  // puntos totales acumulados en todas las partidas (determina el nivel)
  playerId: "",  // identificador anónimo y aleatorio, generado por ensurePlayerId(); NO identifica
                 // a la persona (no hay login), solo evita que leaderboard.js cree una entrada
                 // nueva en la clasificación global cada vez que este jugador mejora su récord.
};
/** Carga el perfil del jugador (nombre, avatar, puntos/XP) desde
 * localStorage, validando el tipo de cada campo antes de aplicarlo. */
function loadProfile() {
  try {
    const raw = localStorage.getItem("pokequiz_profile");
    if (!raw) return;
    const obj = JSON.parse(raw);
    // El nombre se recorta a 16 caracteres por seguridad, aunque ya se
    // valida su longitud al guardarlo (defensa extra ante datos antiguos
    // o manipulados a mano en localStorage).
    if (typeof obj.username === "string") profile.username = obj.username.trim().slice(0, 16);
    // El avatarId solo se acepta si sigue existiendo en el catálogo actual
    // (por si en una versión futura se eliminara algún avatar).
    if (typeof obj.avatarId === "string" && AVATAR_CATALOG.some(a => a.id === obj.avatarId)) profile.avatarId = obj.avatarId;
    if (typeof obj.xp === "number" && obj.xp >= 0) profile.xp = obj.xp;
    if (typeof obj.playerId === "string" && obj.playerId) profile.playerId = obj.playerId;
  } catch(e) {}
}
/** Persiste el objeto `profile` completo en localStorage. */
function saveProfile() {
  try { localStorage.setItem("pokequiz_profile", JSON.stringify(profile)); } catch(e) {}
}
/** True si el jugador ya se creó un perfil (tiene nombre guardado). */
function hasProfile() { return !!profile.username; }

/** Devuelve el identificador anónimo estable de este jugador,
 * generándolo (y guardándolo) la primera vez que se necesita. Solo lo
 * usa leaderboard.js, como clave de su entrada en la clasificación
 * global (así, al mejorar su récord, actualiza su fila en vez de crear
 * una nueva cada vez). No identifica a la persona: es un valor
 * aleatorio sin relación con su nombre, avatar ni ninguna cuenta. */
function ensurePlayerId() {
  if (!profile.playerId) {
    profile.playerId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : "p" + Date.now().toString(36) + Math.random().toString(36).slice(2);
    saveProfile();
  }
  return profile.playerId;
}

// ═══════════════════════════════════════════════
//  🏅 LOGROS Y ESTADÍSTICAS (persisten en localStorage)
// ═══════════════════════════════════════════════
// Nota: el catálogo de logros en sí (qué logros existen, sus condiciones de
// desbloqueo, etc.) y toda la lógica que los comprueba/desbloquea siguen
// viviendo en game.js; aquí solo está la forma de los datos guardados y su
// carga/guardado.

/** Estructura inicial (todo a cero) de las estadísticas de logros.
 * Se usa tanto para inicializar `achievementsData.stats` como para
 * rellenar los campos que falten al cargar datos guardados antiguos. */
function defaultAchStats() {
  return {
    gamesPlayed: 0,
    totalCorrect: 0,
    bestStreak: 0,
    bestStreakEasy: 0,
    bestStreakHard: 0,
    bestStreakInfinite: 0,
    bestStreakByRegion: {},   // { "Kanto": 7, "Johto": 4, ... } (incluye "Combate")
    perfectGame: false,
    modesPlayed: [],
    regionsPlayed: [],
    otherPlayed: [],
    songCorrectCounts: {},   // { "songs/main/kanto/pallet-town.mp3": 3, ... } (Sonidex)
    perfectGamesCount: 0,    // nº de partidas terminadas con el 100% de aciertos
    storyModeCompleted: false,        // true si se ha completado el Modo Historia entero
    storyModeCompletedPerfect: false, // true si el Modo Historia se completó con el 100% de aciertos
    storyRegionsCompleted: [], // regiones cuya fase de región + combate se han superado en Modo Historia
    bestInfiniteScore: 0,    // récord de puntuación en Modo Desafío Infinito
    bestStoryScore: 0,       // récord de puntuación en Modo Historia
    bestHardScore: 0,        // récord de puntuación en Modo Difícil
    bestCombatScore: 0,      // récord de puntuación en Modo Combate
    bestRegionScore: {},     // récord de puntuación en Modo Normal, por región: { "Kanto": 640, "Johto": 480, ... }
    perfectEasyGame: false,   // true si se ha terminado alguna partida perfecta en Modo Fácil
    perfectHardGame: false,   // true si se ha terminado alguna partida perfecta en Modo Difícil
    perfectCombatGame: false, // true si se ha terminado alguna partida perfecta en Modo Combate
    perfectColosseumGame: false,     // true si se ha terminado una partida perfecta del minijuego Colosseum/XD
    perfectMysteryDungeonGame: false, // true si se ha terminado una partida perfecta del minijuego Mundo Misterioso
    perfectRegionsNormal: [], // regiones (Modo Normal) completadas alguna vez con el 100% de aciertos
    bestHardCorrectInGame: 0, // máximo de respuestas correctas en una sola partida del Modo Difícil
    encounterCounts: {},      // { "charizard": 3, "pikachu": 1, ... } nº de apariciones de cada evento Pokémon
  };
}

// Objeto con los logros desbloqueados y las estadísticas acumuladas del
// jugador. `unlocked` mapea el id de cada logro a la marca de tiempo en la
// que se desbloqueó; `stats` contiene los contadores/récords que game.js va
// actualizando partida a partida (ver defaultAchStats() para su forma).
let achievementsData = {
  unlocked: {},        // id -> timestamp
  stats: defaultAchStats(),
};

/** Carga de localStorage los logros desbloqueados y las estadísticas
 * acumuladas, fusionando con los valores por defecto para tolerar
 * versiones antiguas del guardado que no tuvieran algún campo nuevo. */
function loadAchievements() {
  try {
    const raw = localStorage.getItem("pokequiz_achievements");
    if (!raw) return;
    const obj = JSON.parse(raw);
    achievementsData.unlocked = obj.unlocked && typeof obj.unlocked === "object" ? obj.unlocked : {};
    // Object.assign sobre una base "defaultAchStats()" fresca asegura que,
    // si se añadió un campo nuevo en una versión posterior del juego, el
    // guardado antiguo (que no lo tiene) no deje ese campo en `undefined`.
    achievementsData.stats = Object.assign(defaultAchStats(), obj.stats || {});
  } catch (e) {}
}
/** Persiste `achievementsData` (logros + estadísticas) en localStorage. */
function saveAchievements() {
  try { localStorage.setItem("pokequiz_achievements", JSON.stringify(achievementsData)); } catch (e) {}
}
