# CLAUDE.md — Reglas para trabajar en este proyecto

Este archivo es para cualquier IA (o persona) que vaya a modificar el
código de Radio Trigal FM. Léelo antes de tocar nada. Para entender la
arquitectura primero, ver `PROJECT.md`.

## Regla nº1: cada cosa vive en un único sitio

Antes de añadir código, pregúntate **qué tipo de código es** y ponlo en
el archivo que le corresponde. No dupliques lógica que ya existe en
otro archivo, y no la copies "por comodidad" a otro sitio.

| Si el código... | va en... |
|---|---|
| decide reglas de juego (puntos, vidas, si se ha ganado, qué logro se desbloquea, qué evento toca) | `game.js` |
| solo pinta en el DOM un estado ya decidido en otro sitio | `ui.js` |
| reproduce o para un sonido/música | `audio.js` |
| decide qué Evento Pokémon aparece y cuándo (el catálogo/motor) | `pokemon.js` |
| guarda o lee algo de `localStorage` | `storage.js` |
| habla con un backend/API externo (p. ej. la clasificación global) | `leaderboard.js` |
| es marcado HTML (estructura de una pantalla u overlay nuevo) | `index.html` |
| es una regla de estilo visual | `styles.css` |

Ejemplo real ya aplicado en el proyecto: `healLife()`/`loseLife()`
(deciden y mutan `session.storyLives`) están en `game.js`, mientras que
`renderLives()`/`updateNervousState()` (solo pintan ese estado en los
corazones) están en `ui.js`. Sigue ese mismo criterio para cualquier
función nueva.

## Regla nº2: no dupliques código

Antes de escribir una función nueva, **busca si ya existe algo
parecido** en el archivo que le correspondería (usa grep/búsqueda de
texto sobre el nombre de la función o del concepto). Si ya existe una
función que hace casi lo que necesitas:

- Reutilízala o amplíala (con un parámetro opcional, por ejemplo) en
  lugar de crear una copia con otro nombre.
- Si necesitas la misma lógica en dos sitios, extráela a una única
  función y llámala desde ambos, no la repitas.

Esto aplica especialmente a: helpers de `localStorage`
(usa las funciones de `storage.js`, no llames a `localStorage.setItem`
directamente desde otro archivo), reproducción de audio (usa `playSFX`/
las funciones de `audio.js`), y render de tarjetas/listas (usa las
funciones de `ui.js` ya existentes en vez de generar HTML "a mano" en
otro sitio).

## Regla nº3: toca solo los archivos necesarios

Cada cambio debe tocar el **mínimo número de archivos posible**, y solo
aquellos cuya responsabilidad encaja con el cambio (ver tabla de la
Regla nº1). Si una tarea parece requerir tocar muchos archivos a la
vez, es una señal de que quizá se está poniendo lógica en el sitio
equivocado; reconsidera antes de seguir.

No "aproveches" para reordenar, renombrar o reformatear código que no
tiene relación con el cambio pedido, aunque de paso "quede más
ordenado". Eso dificulta revisar el cambio real y puede romper cosas
que no se estaban tocando.

## Regla nº4: respeta el orden de carga de los `<script>`

El orden en `index.html` es:

```html
<script src="storage.js"></script>
<script src="audio.js"></script>
<script src="pokemon.js"></script>
<script src="ui.js"></script>
<script src="game.js"></script>
```

No lo cambies sin releer la sección "Orden de carga" de `PROJECT.md` y
entender exactamente por qué es así (hay dependencias que se resuelven
al cargarse el script, no solo dentro de funciones). Si añades un
archivo `.js` nuevo, decide con cuidado en qué punto de esa cadena debe
insertarse según qué usa y quién lo usa.

Al añadir código nuevo a un archivo existente, recuerda que todo vive
en el **mismo ámbito global** (scripts clásicos, sin módulos):
- Puedes usar variables/funciones definidas en archivos que se cargan
  **antes** con total normalidad, incluso fuera de funciones.
- Solo puedes referenciar identificadores definidos en archivos que se
  cargan **después** si esa referencia ocurre dentro de una función que
  se invoca más tarde (un listener, un timer...), nunca en código que
  se ejecuta inmediatamente al cargarse el script.

## Regla nº5: mantén el estilo de comentarios existente

Cada archivo tiene una cabecera `/* ═══...═══ */` explicando su
propósito, y cada sección interna usa cabeceras `// ═══...═══` con un
emoji + título. Sigue ese mismo formato al añadir secciones nuevas, y
añade un comentario `/** ... */` encima de cada función nueva no
trivial, explicando qué hace (el proyecto entero sigue ese estándar,
en español).

## Regla nº6: `storage.js` — cambios en la forma de los datos

Si añades un campo nuevo a `settings`, `profile` o
`achievementsData.stats`:

- Añádelo también a la validación de tipo dentro del `loadX()`
  correspondiente (para tolerar guardados antiguos que no lo tengan).
- Si es una estadística de logros, añádelo a `defaultAchStats()`, no
  solo al uso que le des en `game.js` — si no, `Object.assign` no lo
  rellenará al cargar guardados antiguos.
- Nunca cambies el nombre de una clave ya usada en
  `localStorage.setItem("pokequiz_...", ...)` sin plantearte la
  migración de datos ya guardados en los navegadores de los jugadores.

## Regla nº7: código de depuración

Si en el futuro se añaden bloques marcados explícitamente como
temporales/debug, no los elimines por iniciativa propia salvo que se
pida explícitamente — pero tampoco los uses como referencia de "cómo se
hacen las cosas aquí" al escribir código nuevo, ya que están marcados
para eliminarse. (El panel "Forzar Evento Pokémon" que servía de ejemplo
aquí ya se retiró — ver `CHANGELOG.md`.)

## Regla nº8: actualiza `CHANGELOG.md`

Cualquier cambio funcional (no solo refactors internos) debe añadir una
entrada en `CHANGELOG.md` siguiendo el formato ya usado en ese archivo.
