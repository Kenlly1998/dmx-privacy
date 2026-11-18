# Ventas CRM

CRM multiplataforma (web + PWA para Android / iOS / iPad) para pipeline de ventas, cotizaciones, pagos, inbox de canales y copiloto Grok.

## Qué incluye

- **Pipeline** tipo Pipedrive (Lead → … → Ganado/Perdido)
- **Contactos** y catálogo (CueMark, LED Wall, servicios)
- **Cotizaciones** versionadas con ítems y impresión/PDF
- **Pagos** (anticipo, Yape/Plin/transferencia, etc.)
- **Inbox** WhatsApp / Instagram (webhooks + demo)
- **Grok** como copiloto con aprobación humana
- **Proyectos** post-venta al ganar un deal

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Postgres vía `DATABASE_URL` en publish; **PGlite** en local
- Identidad Cursor (`cursor/identity`) para apps private/team
- Secrets: `XAI_API_KEY`, `WHATSAPP_*`, `META_PAGE_TOKEN`, `INSTAGRAM_VERIFY_TOKEN`

## Desarrollo

```bash
cd ventas-crm
npm install
env -u DATABASE_URL npm run dev
env -u DATABASE_URL npm test
env -u DATABASE_URL npm run build
```

Abre `http://localhost:3000`.

## Webhooks

- WhatsApp: `GET/POST /api/integrations/whatsapp`
- Instagram: `GET/POST /api/integrations/instagram`

Sin secretos, los endpoints aceptan payloads `{"demo":true,"org_id":"..."}` para probar la ingesta.
