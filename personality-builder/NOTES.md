# Estudio: Avolites Personality Builder

## Limitación de ejecución

- Descarga oficial de Personality Builder v3.4.5 desde `web3.avolites.com` redirige a **User Login**.
- Este entorno es Linux; Wine 9 quedó instalado, pero sin el `.exe` no hay nada que ejecutar.
- Internet Archive no devolvió mirrors útiles del instalador en el momento del estudio.

## Fuentes usadas (públicas)

1. [Quick Start Guide PDF](https://www.avolites.com/Portals/0/downloads/manuals/personalitybuilder/PersonalityBuilder_QuickStartGuide.pdf) — layout de 3 paneles y flujo New → Attributes → Functions → Modes → Locate → Save.
2. Muestras `.d4` extraídas del [Compact Titan Fixture Library](https://personalities.avolites.com/Downloads.asp) (p.ej. `Generic_Dimmer.D4`, `Generic_RGB, 3 DMX.d4`).
3. Parser de referencia QLC+ `avolitesd4parser.cpp` (Apache-2.0) para tags XML.
4. [AVOSUPPORT wiki](https://www.avosupport.de/wiki/personality/personality_builder) — conditions, wheels, export.

## UI observada (desde el Quick Start)

```
+------------------+-------------------------------+
| Navigation Pane  | Attribute / catalog pane      |
| (árbol Fixture)  | (tabs: Attributes, Functions, |
|                  |  Modes, …)                    |
|                  +-------------------------------+
|                  | Properties pane               |
|                  | (tabs: Properties, DMX Values,|
|                  |  Channels, Wheel Mapping,     |
|                  |  Locate Values)               |
+------------------+-------------------------------+
```

## Modelo `.d4` (resumen)

- Un archivo XML por fixture (`Fixture` + `Company` + `Name` / `ShortName`).
- `Control` → `Attribute` (ID, Group I/P/C/G/B/E/S) → `Function` (Dmx `min~max`) + `Locate`.
- `Mode` → `Include` → `Attribute` con `ChannelOffset` y `Wheel`.
- Opcional: `Palettes`, `Physical`, `History`, `Copyright`.

## Réplica

`index.html` + `app.js` + `styles.css` reproducen ese layout y el ciclo de vida mínimo (metadatos, atributos, funciones/DMX, modos/offsets, export `.d4`). Las mejoras se posponen a una fase posterior, como pediste.
