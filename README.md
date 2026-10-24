# Rancho Varadero

Sitio de [Rancho Varadero](https://wa.me/50376956521), un rancho de playa en primera fila frente al mar en Playa El Amatal, La Libertad, El Salvador, administrado por Alquileres MM.

Es la demo de la charla **«Dynamic Scroll Website Generation»** en DevDay Exchange San Salvador (24 de octubre de 2026): el mismo sitio en dos versiones.

| Ruta | Qué es |
| --- | --- |
| `/antes` · `/en/antes` | La versión básica: una plantilla genérica con las fotos tal cual. |
| `/` · `/en/` | La versión con recorrido: al hacer scroll, la cámara camina por el rancho. |

## Cómo funciona el recorrido

El scroll no reproduce un video: mueve su `currentTime`. Siete fotos del rancho son las paradas, y seis clips generados con IA conectan cada parada con la siguiente. Cada clip empieza en el fotograma exacto donde termina el anterior, así que el recorrido se ve como una sola toma, hacia adelante o hacia atrás.

1. **Fotos:** 8 fotos originales; quedaron 7, en el orden del recorrido (`media/originals/`).
2. **Keyframes:** recorte o outpaint a 16:9, upscale y retoque de luz con GPT Image 2.5, con el mismo prompt para todas (`media/keyframes/07-final/`).
3. **Clips:** MiniMax H3 en 2K, 8 s, con primer y último fotograma fijos y sin audio. Prompts y script en `media/clips/h3/`.
4. **Web:** ffmpeg (GOP 6, CRF 30, BT.709, faststart) a `public/video/`, y el motor de scroll en `src/scripts/scroll-world.js`.

Los videos y las imágenes se generaron con [Higgsfield](https://higgsfield.ai). El código lo escribió un agente (Claude Code) con dos skills incluidas en `.claude/skills/`:

- [`landing-page-design`](https://github.com/elayadesign/ai-design-skills) de Elaya (MIT)
- [`scroll-world`](https://github.com/oso95/scroll-world) de cyw (MIT)

La referencia original es la landing de Arko de [midudev](https://github.com/midudev/mcp-higgsfield-landing).

## Desarrollo

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # genera dist/
pnpm preview
```

Stack: Astro, Tailwind CSS 4 y Manrope servida localmente. Sin GSAP ni Lenis.

`SITE_URL` define la URL pública (canonical, hreflang, sitemap y JSON-LD). En Vercel, si no está definida, se usa la URL de producción del proyecto.

## Contenido

Los datos del rancho viven en `src/data/rancho.ts` (versión básica) y `src/data/sitio.ts` (versión con recorrido). Solo incluyen hechos confirmados por la administración; sin precios.

Las fotos pertenecen a Rancho Varadero y se usan con su permiso. El código de las skills mantiene su licencia MIT.
