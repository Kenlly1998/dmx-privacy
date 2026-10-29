# Personality Builder Replica (MVP)

Réplica independiente del flujo de **Avolites Personality Builder**, basada en:

- Quick Start Guide oficial (layout de 3 paneles)
- Estructura real de archivos `.d4` (XML)
- Documentación pública (manual Titan / AVOSUPPORT)

No incluye ni redistribuye el binario de Avolites (la descarga requiere cuenta en web3.avolites.com).

## Abrir

Abre `index.html` en el navegador, o desde esta carpeta:

```bash
python3 -m http.server 8765
```

Luego visita `http://localhost:8765/`.

## UI

Tema moderno (carbón + ámbar), topbar con acciones visibles, empty states con CTAs, y modales Mode-first / Import con **vista previa en vivo** y presets (RGB, Spot, Wash).

## Flujo recomendado

1. **Crear modo** (o Importar tabla) → pega el patch del manual; la preview muestra offsets.
2. Ajusta Manufacturer / Name en el Inspector.
3. Refina **DMX Values**, **Channels**, **Cells** si hace falta.
4. **Linter** → **Guardar .d4** → copia a `Documents\Titan\Personalities` (PC) o `D:\Personalities` (consola) y reinicia Titan.

Alternativa clásica: atributos desde la biblioteca → plantilla Modes → Created Attributes.

## Abrir archivos

**Abrir** acepta:

| Formato | Resultado |
| --- | --- |
| `.d4` / `.xml` | Personality Titan nativa |
| `.gdtf` | Importa `description.xml` → attributes + DMX modes editables (luego **Guardar .d4**) |
| `.mvr` | Lista GDTF embebidos → eliges uno → mismo flujo |

No exporta GDTF/MVR (solo **Guardar .d4**). `.d4z` es archivo de show Titan, no personality.

## Muestras

- `samples/Demo_RGBWash.d4` — fixture demo propio
- `samples/DemoCo_RGB_Wash.gdtf` — GDTF mínimo DemoCo
- `samples/DemoCo_Show.mvr` — MVR con ese GDTF embebido

## Tools

- **Mode-first from channels…** — pegas `ch,Atributo[,8|16]` y crea attributes + mode con offsets.
- **Import channel table…** — CSV/TSV del manual (o pegar texto).
- **Run linter** — IDs, solapes/huecos DMX, Locate, patch duplicado, celdas.

## Cells (cuadrícula)

En un **Mode** → pestaña **Cells**:

1. Define filas × columnas, canales por celda e inicio DMX.
2. Elige orden: filas L→R / R→L, columnas, serpentine, o **manual (clic)**.
3. **Generar** crea `Cell N` con `X`/`Y` y `ChannelOffset`.
4. Marca Master attributes (RGB/Dimmer…) para el bloque `<Master>` del `.d4`.

## Fuera de alcance (MVP)

Macros, Conditions / ColourFunc, ModeLink a modos-hijo separados, export R20/Vis, auto-macros.

Ver `NOTES.md` para el estudio y limitaciones de ejecución del programa original.
