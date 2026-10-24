# Guía: cómo construir un sitio con scroll dinámico usando Codex y Higgsfield

Esta guía acompaña la charla **«Generación de sitios web dinámicos con Codex y Higgsfield»** (DevDay Exchange San Salvador). Explica, paso a paso, cómo se hizo este repo: el sitio de Rancho Varadero.

La idea de fondo: **Codex** (el agente de programación de OpenAI, con el modelo **Sol** o **Astra** en esfuerzo de razonamiento alto) dirige todo el flujo. Escribe el código, ejecuta los comandos y llama a **Higgsfield**, la plataforma de imagen y video con IA que genera los fotogramas y los clips.

Todos los números de esta guía son reales: salen de lo que costó y de lo que pasó en este proyecto.

---

## 0. Qué vas a construir

- **Versión dinámica:** https://rancho-varadero.vercel.app/
- **La misma web, versión aburrida:** https://rancho-varadero.vercel.app/antes

**Qué es un "scroll world":** la página no reproduce un video. La posición del scroll mueve el `currentTime` del video, la misma técnica que usa Apple en sus páginas de producto. Si bajas, la cámara avanza; si subes, retrocede.

- **Las paradas** son fotos del lugar. En cada una, la cámara se detiene y aparece un bloque de texto.
- **Los clips** conectan cada parada con la siguiente. Cada clip empieza en una foto y termina en la siguiente, así que todo el recorrido se ve como una sola toma.

En Rancho Varadero: 7 fotos (paradas) y 6 clips de 8 s generados con IA.

---

## 1. Lo que necesitas

| Qué | Para qué |
|---|---|
| **Codex** con Sol o Astra, esfuerzo alto | El agente que escribe el código y ejecuta todo |
| **Cuenta de Higgsfield** con créditos | Retocar fotos y generar los clips. Este proyecto usó el plan Plus |
| **Node.js** (22 o superior) y **pnpm** | El sitio es Astro + Tailwind |
| **ffmpeg** y **ffprobe** | Quitar audio, codificar para la web y sacar los pósters |
| **jq** y **curl** | Los usa el script que descarga los clips |
| **5 a 8 buenas fotos** de un lugar o un objeto | La materia prima. Tienen que ser reales y tuyas (o con permiso) |

---

## 2. Conecta Higgsfield con Codex

Hay dos caminos y conviene tener los dos: el **MCP** (Codex habla con Higgsfield como herramienta) y la **CLI** (Codex ejecuta comandos de Higgsfield en la terminal).

**MCP.** Es un protocolo para que un agente use herramientas externas. La URL del servidor MCP de Higgsfield es:

```text
https://mcp.higgsfield.ai/mcp
```

En la configuración de MCP de Codex, agrega un servidor con esa URL e inicia sesión con tu cuenta de Higgsfield. La página de MCP de Higgsfield también ofrece conexión para ChatGPT, Telegram, CLI y "Other".

> **Extra con ChatGPT:** entra a chatgpt.com/plugins, busca Higgsfield, toca *Add* e inicia sesión. Después menciona `@Higgsfield` en un chat. Sirve para hacer preguntas (por ejemplo, de costos) desde el celular.

**CLI.** Pídele a Codex que la instale, o hazlo tú:

```sh
npm i -g @higgsfield/cli
higgsfield auth login      # abre el navegador para iniciar sesión
```

Opcional: las skills oficiales de Higgsfield, con `npx skills add higgsfield-ai/skills`.

**Las dos skills del sitio.** Una skill es un paquete de instrucciones que el agente sigue para una tarea concreta.

- **`scroll-world`** (de cyw / oso95): el pipeline de video y el motor de scroll. Es compatible con Codex:

  ```sh
  npx skills add oso95/scroll-world -a codex
  ```

  En Codex se invoca como `$scroll-world`.

- **`landing-page-design`** (de Elaya): estrategia de conversión y un sistema visual estricto. En Codex se instala pegando su `SKILL.md` en el `AGENTS.md` del proyecto. El archivo está en https://github.com/elayadesign/ai-design-skills (carpeta `skills/landing-page-design/`).

---

## 3. Elige y ordena las fotos

**El orden de las fotos es el recorrido.** Piensa en una persona caminando: de afuera hacia adentro, de una habitación a la contigua. Si dos fotos seguidas no tienen un camino lógico entre sí, el clip va a inventar algo raro.

En este proyecto:

1. Había 8 fotos originales. Quedaron 7.
2. Se descartó una porque era un duplicado con lente ojo de pez (*fish-eye*): deforma la geometría y el modelo de video no sabe qué hacer con ella.
3. Ruta final: piscina frente a la casa → kiosko con hamacas → sala → corredor techado → piscina frente al mar → camino a la playa → vista aérea.

**La primera foto importa más que todas.** Es el hero: lo primero que se ve y el póster que carga antes que cualquier video. Aquí se eligió la piscina frente a la casa porque era la foto más llamativa.

Consejo: pide a Codex que convierta las fotos a WebP. Pesan menos, suben más rápido a los modelos y cargan más rápido en la web (en el proyecto de referencia de midudev, 8,4 MB pasaron a 1,7 MB).

---

## 4. Convierte las fotos en keyframes

Un **keyframe** aquí es la versión final de cada foto: la que se usa como primer o último fotograma de un clip. Todas deben tener el mismo formato y el mismo "look".

**4.1 Todo a 16:9.** Las fotos horizontales se recortan. Las verticales se amplían con *outpaint* (la IA continúa la escena hacia los lados). En este proyecto, 2 fotos necesitaron outpaint (`outpaint`, 2 créditos por imagen). midudev usó este prompt en su proyecto:

```text
Extend this photo to a 16:9 widescreen frame by continuing the same room to the left and right: same walls, materials, floor and warm lighting. Do not change anything inside the original image.
```

**4.2 Upscale.** Las otras 5 se ampliaron con `bytedance_image_upscale` (2 créditos por imagen; devolvió 3840×2160).

**4.3 Retoque con el MISMO prompt para todas.** Las fotos reales tenían bruma y luz pálida. Se retocaron las 7 con **GPT Image 2.5** (calidad alta, 2k, 2,75 créditos por imagen) usando un solo prompt. Usar el mismo prompt en todas da un look uniforme, y eso hace que las costuras entre clips no se noten. El prompt real (`media/keyframes/06-ia-gpt/prompt.txt`):

```text
Professional real-estate photo retouch of this exact photo. Keep the exact composition, framing, camera angle, architecture, furniture, plants and every object unchanged; do not add, remove or move anything, and preserve every background detail, including what is visible through windows and in the distance. Bright, clear, well-lit natural daylight with rich but realistic colors: not washed out, not pale or hazy, and not oversaturated. Remove haze, noise and compression artifacts, sharpen fine detail, neutral white balance with a subtle warm tropical tone, balanced exposure with detail in the sky and in the shadows. Photorealistic, no HDR look, no text.
```

**Antes de retocar las 7, se probaron 3 modelos con 2 fotos:**

| Modelo | Resultado |
|---|---|
| **GPT Image 2.5** | La mejor luz y color; quita la bruma. Redibuja detalles pequeños (lo que se ve por las ventanas, vecinos a lo lejos), pero respeta la composición y los objetos. **Ganó.** |
| Nano Banana Pro | El más fiel, pero cálido y todavía pálido en la toma aérea. |
| Seedream 5 Pro | Fiel, pero con los rojos sobresaturados. |

Un ajuste de color local y gratuito (un script en Python) unificaba el color, pero no recuperaba detalle ni quitaba la bruma, así que se descartó.

Resultado: 7 keyframes de 2560×1440 en `media/keyframes/07-final/`.

---

## 5. Pregunta el costo antes de gastar

**Regla número uno: nada se genera sin una tabla de costos primero.** El precio por clip cambia hasta 10 veces entre modelos. Pídeselo a Codex así:

```text
Quiero hacer con Higgsfield un video a partir de los keyframes de media/keyframes/07-final para un scroll world: como una persona caminando por el lugar, un clip por cada par de fotos seguidas. Dime costos y los mejores modelos que acepten primer y último fotograma. No lo hagas, solo dame info.
```

La CLI tiene una estimación gratuita (`higgsfield generate cost`) que no genera nada. Esto devolvió para un clip de 8 s, 16:9 y sin audio (agregar imagen inicial y final no cambia el precio):

| Modelo (job type) | Salida | Créditos por clip de 8 s |
|---|---|---:|
| Kling 3.0 Omni Frames (`kling_o3_flf`) | 720p | 8 |
| Seedance 2.0 Mini (`seedance_2_0_mini`) | 720p | 8 |
| Kling 3.0 (`kling3_0`, std / pro) | 720p / 1080p | 12 / 14 |
| Kling 4.0 (`kling4_0`) | 1080p | 16 |
| **MiniMax H3 (`minimax_h3`)** | **2K** | **16** |
| Wan 3.0 (`wan3_0`) | 1080p | 28 |
| Gemini Omni Flash 1.1 | 1080p | 36 |
| Wan 3.0 Prime | 1080p | 48 |
| Seedance 2.0 (std) | 1080p | 96 |
| Seedance 2.5 (480p / 720p / 1080p) | | 24 / 56 / 128 |

Como referencia, con la proporción de midudev (137 créditos ≈ 5 USD, unos 0,037 USD por crédito), 6 clips cuestan de unos 2 USD a unos 28 USD según el modelo, sin contar repeticiones.

**Solo sirven modelos con primer Y último fotograma.** Es lo que hace que cada clip termine exactamente en la siguiente foto. Veo 3.1, Happy Horse, MiniMax Hailuo y Kling 3.0 Turbo no tienen fotograma final, así que no sirven.

---

## 6. Prueba la transición más difícil en 3 o 4 modelos

Antes de generar todo, genera **un solo clip** (el más difícil) con varios modelos y compáralos. Aquí fue el 5 → 6: del camino a la playa (a la altura de los ojos) a la vista aérea (dron). Es el cambio de cámara más grande.

```text
Genera de prueba la transición 5 → 6 (camino a la playa → vista aérea) con Kling 4.0, Kling 3.0 pro, MiniMax H3 y Seedance 2.5 en borrador. Sin audio, 16:9, 8 s. Solo crea los videos y guárdalos en media/clips/prueba-5-6/; no toques el sitio.
```

| Modelo | Créditos | Qué hizo |
|---|---:|---|
| Kling 4.0 (1080p) | 16 | Atraviesa hojas de palmera (2 a 4 s tapado), llega a la toma aérea a los 4 s y se queda quieto. El movimiento menos parejo. |
| Kling 3.0 pro (1080p) | 14 | El primer fotograma más fiel. Casi no se mueve los primeros 3 s y luego sube rápido, con desenfoque. |
| **MiniMax H3 (2K)** | **16** | Arranque suave, revela la playa y el mar, gira y se asienta limpio en el final. La resolución más alta. **Ganó.** |
| Seedance 2.5 borrador (480p) | 24 | El borrador es fiel al render final (mismo movimiento). |

**Ganó MiniMax H3:** 2K, el movimiento más suave y 16 créditos por clip.

Las banderas cambian según el modelo. Las que se usaron (`media/clips/prueba-5-6/run.sh`):

| Modelo | Banderas extra |
|---|---|
| `kling4_0` | `--mode image-to-video --resolution 1080p` |
| `minimax_h3` | `--resolution 2K` |
| `kling3_0` | `--mode pro --sound off` |
| `seedance_2_5` | `--mode omni_reference --resolution 480p --draft true --generate_audio false` |

> **Ojo con la web de Higgsfield.** Desde la app web se lanzaron por accidente dos renders finales de Seedance 2.5 a partir del borrador: **256 créditos** (8 veces el precio de MiniMax). Eran los más cinematográficos, pero no hay reembolso. Genera desde Codex, con el costo ya aprobado.

---

## 7. Genera los clips

**Las reglas:**

1. **Clip k:** primer fotograma = keyframe k−1, último fotograma = keyframe k.
2. **Un solo modelo para toda la cadena.** Si mezclas modelos, las costuras "saltan" a la vista.
3. **Un clip corto por par de fotos**, nunca un video largo. Si uno sale mal, repites solo ese.
4. **Sin audio.** La página no lo usa.

**El prompt de cámara.** Esta es la plantilla que funcionó (`media/clips/h3/prompts/clip-2.txt`). Cambia solo la parte central: qué ve la cámara y hacia dónde va.

```text
16:9 widescreen, smooth first-person POV walk through a tropical beachfront rental house in El Salvador, one continuous take on a steady gimbal at eye level. The camera walks slowly past the pool deck toward the open glass doors of the house and steps inside, arriving in the bright lounge with exposed red brick walls, ceiling fans, framed beach posters and white-cushioned wicker sofas around a low table. Gentle ease-in and ease-out, settling exactly on the final frame. Constant focal length, no zoom, no cuts, no fades, no dissolves, no morphing, no people, no camera shake. Preserve the real architecture, materials and bright natural daylight exactly. Photorealistic. Silent video, no audio, no music, no sound.
```

Las negaciones van dentro del prompt ("no zoom, no cuts…"). Si el modelo acepta un campo de *negative prompt*, esta lista del playbook funciona bien:

```text
cut, scene change, fade, dissolve, crossfade, morphing, warping geometry, flicker, zoom, fisheye, shaky handheld, fast motion, people, hands, text, extra objects, lighting change, black bars, audio
```

Dale a cada clip su propia dirección de cámara ("pan left", "glide backward", "stay in place and pan right"). Si un clip no debe avanzar, agrega `walking, forward movement` a las negaciones.

**El comando.** Así genera Codex un clip con primer y último fotograma (patrón de `media/clips/h3/run.sh`):

```sh
higgsfield generate create minimax_h3 --prompt "$(cat prompts/clip-1.txt)" \
  --start-image ../../keyframes/07-final/0-piscina-casa.jpg \
  --end-image ../../keyframes/07-final/1-kiosko-hamacas.jpg \
  --aspect_ratio 16:9 --resolution 2K --duration 8 \
  --wait --wait-timeout 40m --json > raw/clip-1.json 2> raw/clip-1.err

url=$(jq -r '.[0].result_url // empty' raw/clip-1.json)
curl -fsSL "$url" -o raw/clip-1.mp4
```

**Quita el audio.** MiniMax H3 siempre agrega una pista de ambiente y no tiene opción para desactivarla. Se quita sin recodificar el video:

```sh
ffmpeg -v error -y -i raw/clip-1.mp4 -c:v copy -an master/clip-1.mp4
```

**Revisa cada clip y repite los malos.** El primer intento del clip 1 tenía un corte brusco (*jump cut*) a los 6,08 s. Se repitió con una dirección de cámara explícita en vez de "camina hacia allá":

```text
… It slowly arcs to the right around the corner of the pool deck, rising gently to standing eye level, while continuously rotating to the left, so the hammock gazebo with the wooden picnic table moves from the left edge toward the center of the frame …
```

El segundo intento salió limpio. Pídele a Codex que revise cada clip (fotogramas, detección de cambios de escena con ffmpeg) y que repita por su cuenta los que tengan cortes, fundidos o geometría que se deforma. El clip 6 no se generó de nuevo: se reutilizó el de MiniMax H3 de la prueba.

Para comprobar las costuras, compara el último fotograma del clip k con el primero del clip k+1. Aquí dieron entre 29,5 y 32,3 dB de PSNR: encajan.

---

## 8. Codifica para la web

Un clip recién generado no sirve para hacer scrub (moverlo con el scroll). Hay que recodificarlo:

```sh
ffmpeg -i master/clip-1.mp4 -an -vf "scale=1920:-2" -c:v libx264 -preset slow -crf 30 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc iec61966-2-1 -colorspace bt709 -color_range tv \
  -movflags +faststart+write_colr public/video/paseo-1.mp4
```

Qué hace cada parte y por qué importa:

- **`-g 6 -keyint_min 6 -sc_threshold 0`**: un fotograma clave cada 6 fotogramas, sin excepciones. Para saltar a un instante, el navegador decodifica desde el fotograma clave anterior. Con un GOP pequeño, cada salto es barato y el scroll se siente fluido.
- **Etiquetas BT.709 (`-color_*`, `write_colr`)**: sin ellas, el navegador pinta el video más claro que su póster y el cambio de imagen a video se nota.
- **`+faststart`**: pone los metadatos al inicio del archivo para que empiece a cargar rápido.
- **`-an`**: sin audio, otra vez, por si acaso.
- **1920 de ancho, CRF 30**: los 6 clips pesan 45 MB (de 6 a 9 MB cada uno). Con CRF 26 eran 72 MB. En el clip 6, la similitud (SSIM) fue 0,94 / 0,93 / 0,91 con CRF 28 / 30 / 32.

**Los pósters.** Cada parada muestra una imagen fija debajo del video. Esa imagen tiene que ser un fotograma real del video, no la foto original, para que coincida píxel a píxel:

- `paseo-k` = primer fotograma del clip k (paradas 1 a 6).
- `paseo-7` = último fotograma del clip 6 (la última parada).

```sh
# primer fotograma
ffmpeg -i public/video/paseo-1.mp4 -frames:v 1 \
  -vf "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" paseo-1.png

# último fotograma del último clip
ffmpeg -sseof -1 -i public/video/paseo-6.mp4 -update 1 \
  -vf "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" paseo-7.png
```

Luego pide a Codex que los pase a WebP y los guarde en `src/assets/paseo/`.

---

## 9. Arma el sitio con las skills

El orden importa: **primero la estrategia** (landing-page-design), **después el movimiento** (scroll-world). Abre Codex en la carpeta del proyecto, con Sol o Astra en esfuerzo alto.

**9.1 Intake y plan, sin código.** La skill `landing-page-design` empieza con preguntas: una oferta, una audiencia, una sola acción principal (CTA). Y para un negocio real: **solo hechos reales**, nada de reseñas, precios ni premios inventados.

```text
Usa la skill landing-page-design. Vamos a crear el sitio de Rancho Varadero, un rancho de playa real en primera fila frente al mar en Playa El Amatal, La Libertad, El Salvador. Como es un negocio real, usa solo los datos de este mensaje y de las fotos: no inventes reseñas, precios, premios, distancias ni cifras. Si falta algo, márcalo como pendiente.

Intake:
- Acción principal: cotizar por WhatsApp (https://wa.me/50376956521) con un mensaje inicial. Secundaria: llamar.
- Datos: hasta 12 personas, 4 habitaciones con aire acondicionado, piscina privada, cocina totalmente equipada, terraza amplia, parqueo en el lugar. Sin precios.
- Idiomas: español (tú) y una versión en inglés.
- Tono: cálido, claro, de vacaciones en familia.
- Fotos: los keyframes de media/keyframes/07-final, en el orden del recorrido.
- Prioridad móvil: sí.
- Layout: scroll world a pantalla completa, un bloque de texto por parada del recorrido.

Stack: Astro + Tailwind CSS 4, con pnpm.

Antes de escribir código, devuélveme lo que pide tu Output format, más qué texto va en cada una de las 7 paradas.
```

**9.2 Construye la v1.** Cuando el plan te convenza:

```text
Aprobado. Construye el sitio sección por sección en Astro + Tailwind, en español en / y en inglés en /en/. Deja el diseño listo para un video de fondo tipo scroll world (no lo generes ahora): las 7 paradas con su texto, y debajo servicios, galería, cómo reservar, preguntas frecuentes y un CTA final por WhatsApp. Solo hechos de la lista. Al terminar, corre pnpm build.
```

**9.3 Conecta scroll-world a los clips que YA existen.** Esta es la frase clave: **"no generes nada ni gastes créditos"**. Sin ella, la skill arranca su propio pipeline de video.

```text
Usa $scroll-world en este proyecto Astro, PERO los videos ya están generados. No generes nada ni gastes créditos: ni stills, ni clips, ni cadena 9:16. No llames a Higgsfield ni a ningún modelo de imagen o video. Del Step 0 solo comprueba ffmpeg/ffprobe. Sáltate los Steps 2 a 5; del Step 6 solo usa ffmpeg; haz completos los Steps 7 y 8.

Videos: public/video/paseo-1.mp4 … paseo-6.mp4 (1920×1080, GOP 6, sin audio, ya codificados: no los recodifiques). Pósters: src/assets/paseo/paseo-1…7.webp (fotogramas reales del video).

Cableado:
- sections: las 7 paradas, SIN clip. Su still es el póster de esa parada.
- connectors: los 6 clips en orden (paseo-k va de la parada k-1 a la parada k).
- crossfade 0.07, connScroll 1.4, paradas 0.9; más scroll en la primera (1.3) y la última (1.6).
- El texto de cada parada se ve con la cámara quieta en esa parada, no a mitad del tramo.
- Móvil: el 16:9 se recorta. Mira cada fotograma y define un `focus` horizontal (0–100) por parada para que el sujeto quede a la vista.
- prefers-reduced-motion y save-data: solo pósters, sin video.
- Opción de scroll guiado: un gesto, una flecha o un clic en el riel de paradas reproduce el clip hasta la siguiente parada; después de la última parada, el scroll vuelve a ser normal.
- Un solo h1 en la página; el copy y el primer póster en el HTML del servidor.

Al terminar, haz el QA del Step 8 y corre pnpm build.
```

**Qué hace el motor** (`src/scripts/scroll-world.js`, adaptado del de la skill):

- Descarga cada clip como Blob. Muchos hosts no sirven rangos de bytes; sin esto, `seekable` se queda en 0 y el video parece congelado.
- Carga primero los clips más cercanos a tu posición, máximo 2 a la vez.
- Mantiene el póster hasta que el clip pinta su primer fotograma, así no se ve la carga.
- En iOS "prepara" el video (`playsinline`, `muted`) para que los saltos sí se pinten.
- Hace un fundido corto en cada costura y recorta en móvil según el `focus` de cada parada.
- Con reduced-motion o ahorro de datos, solo muestra pósters.

Los datos de cada parada (póster, clip, `focus`) viven en `src/data/sitio.ts`, y el componente que monta el motor es `src/components/sitio/ScrollWorld.astro`.

---

## 10. Revisa y publica

**Checklist de QA** (pídele a Codex que lo haga con un navegador headless como Playwright y te deje capturas):

- [ ] **Costuras:** captura justo antes y justo después de cada una (parada → clip y clip → parada). La composición debe coincidir.
- [ ] **Seekable:** `video.seekable.end(0) > 0` en todos los clips, y `currentTime` sigue al scroll, también hacia atrás.
- [ ] **Móvil 390×844:** el sujeto de cada parada se ve; el texto no tapa lo importante.
- [ ] **Reduced motion:** cero peticiones de video, solo pósters.
- [ ] **Consola:** sin errores.
- [ ] **Build:** `pnpm build` sin errores.

**Publica en Vercel:**

1. Sube el repo a GitHub.
2. En vercel.com: *Add New → Project*, importa el repo. Vercel detecta Astro.
3. No necesitas variables de entorno. `SITE_URL` es opcional: define la URL pública (canonical, sitemap, JSON-LD). Si no está, se usa la URL de producción de Vercel.

Cada push a `main` vuelve a publicar.

---

## 11. Costos reales de este proyecto

Saldo inicial: 1.010 créditos (plan Plus). Saldo final: 536,25.

| Paso | Créditos |
|---|---:|
| Outpaint a 16:9 (2 fotos) | 4 |
| Upscale (5 fotos) | 10 |
| Prueba de retoque (2 fotos × 3 modelos) | 18,5 |
| Retoque de las 7 con GPT Image 2.5 | 19,25 |
| Prueba de modelos en el clip 5 → 6 (4 modelos) | 70 |
| Clips finales con MiniMax H3 (5 clips + 1 repetición del clip 1) | 96 |
| **Subtotal planeado** | **≈ 218** |
| Dos renders de Seedance 2.5 lanzados por accidente en la web | 256 |
| **Total gastado** | **473,75** |

**Lecciones:**

1. **Pregunta el costo primero.** "No lo hagas, solo dame info" es el prompt más barato de todo el proyecto.
2. **Prueba antes de renderizar todo.** Un clip en 4 modelos costó 70 créditos y evitó elegir mal para los 6.
3. **El audio viene aunque no lo pidas.** MiniMax H3 siempre lo agrega: quítalo con `ffmpeg -c:v copy -an` apenas descargues.
4. **Las fotos pálidas dan videos pálidos.** El retoque con un solo prompt para todas fue lo que más mejoró el resultado.
5. **El móvil recorta el 16:9.** Elige un `focus` por parada mirando cada fotograma. Aun así, en la última parada el kiosko de playa queda debajo del texto en el teléfono. La solución completa sería una cadena de clips vertical 9:16, a cerca del doble de costo.
6. **Desde la web de Higgsfield un clic cuesta caro.** Lanza todo desde Codex, donde el costo ya está aprobado.

---

## 12. Créditos

- **Referencia original:** la landing de Arko de midudev, con todos sus prompts: https://github.com/midudev/mcp-higgsfield-landing (en vivo: https://arko-sushi.midudev.workers.dev).
- **Skill `landing-page-design`:** de Elaya, licencia MIT. https://github.com/elayadesign/ai-design-skills
- **Skill `scroll-world`:** de cyw (oso95), licencia MIT. https://github.com/oso95/scroll-world
- **Higgsfield:** imágenes y videos. https://higgsfield.ai
- **Este repo:** https://github.com/saulcalderon/rancho-varadero. Las fotos pertenecen a Rancho Varadero y se usan con su permiso.
