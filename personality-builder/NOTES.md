# Estudio: Avolites Personality Builder

## Ejecución (actualizado)

1. Usuario aportó `Personality Builder SetupV3.4.1.msi`.
2. Instalado en Wine (`~/.wine`) con `msiexec /i … /qn`.
3. App = .NET Framework 4.7.2 (VB.NET WinForms). Wine Mono **no** basta (crash al crear `PersWiz`).
4. Con **winetricks dotnet48** la app arranca: ventana `Fixture 1 * - Personality Builder`.
5. Abrir `.d4` por CLI funciona:  
   `wine "…\Personality Builder.exe" C:\users\ubuntu\Documents\Demo_RGBWash.d4`  
   → título `DemoCo RGB Wash Demo - Personality Builder`.
6. Interacción densa (doble clic / PropertyGrid) es inestable bajo Wine; capturas principales OK.

Ruta instalada:

`C:\Program Files (x86)\Avolites\Personality Builder\Personality Builder.exe`

Plantilla de catálogo:

`Templates\Standard.d4t` (XML: 73 Attribute, 11 Mode, macros/palettes).

## UI real (3.4.1)

Menú: File, Edit, View, Tools, Help.

Árbol: Fixture → History, Manual, Physical, Attributes, Modes, Macros, Palettes.

Attribute Pane tabs: Attributes, Functions, Created Attributes, Current Functions, History, Modes, Macros, Palettes, Swatch.

Properties Pane tabs: Properties, DMX Values, Channels, Wheel Mapping, Locate Values, Cells.

Fixture properties: Display Name, Manufacturer, Name, Personality Version, Tags, UpdateVersionOnDirty, AtlaBase, RDM.

Attribute mapping: Group, Maximum Resolution, Bank, Page, Wheel (+ Attribute ID / Name).

## Réplica

`catalog.json` deriva IDs/nombres/grupos/wheels observados (interop). No se redistribuye el MSI ni `Standard.d4t` binario/plantilla completa de Avolites.

Capturas en `/opt/cursor/artifacts/screenshots/avolites-pb-*.png`.
