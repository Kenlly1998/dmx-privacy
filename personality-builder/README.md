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

## Flujo (como el original)

1. **New** → edita Manufacturer / Name / Display Name (Properties).
2. Nodo **Attributes** → doble clic en el catálogo para añadir Dimmer, Pan, RGB…
3. Selecciona un atributo → pestaña **DMX Values** (o Functions del catálogo).
4. Nodo **Modes** → plantilla (p.ej. 4ch) → **Created Attributes** al modo.
5. **Save .d4** → copia a `Documents\Titan\Personalities` (PC) o `D:\Personalities` (consola) y reinicia Titan.

## Muestra

`samples/Demo_RGBWash.d4` — fixture demo propio (no es librería Avolites). Usa **Open…** para cargarlo.

## Cells (cuadrícula)

En un **Mode** → pestaña **Cells**:

1. Define filas × columnas, canales por celda e inicio DMX.
2. Elige orden: filas L→R / R→L, columnas, serpentine, o **manual (clic)**.
3. **Generar** crea `Cell N` con `X`/`Y` y `ChannelOffset`.
4. Marca Master attributes (RGB/Dimmer…) para el bloque `<Master>` del `.d4`.

## Fuera de alcance (MVP)

Macros, Conditions / ColourFunc, ModeLink a modos-hijo separados, export R20/Vis, auto-macros.

Ver `NOTES.md` para el estudio y limitaciones de ejecución del programa original.
