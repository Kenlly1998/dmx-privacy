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

## Fuera de alcance (MVP)

Macros, Conditions / ColourFunc, cells/subfixtures, export R20/Vis, auto-macros.

Ver `NOTES.md` para el estudio y limitaciones de ejecución del programa original.
