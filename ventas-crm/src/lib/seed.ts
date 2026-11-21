import { sql, sqlOne } from "./db";

let seededOrgs = new Set<string>();

export async function ensureSeedData(orgId: string): Promise<void> {
  if (seededOrgs.has(orgId)) {
    await ensureLeaderExtras(orgId);
    return;
  }

  const existing = await sqlOne<{ c: number }>(
    `select count(*)::int as c from products where org_id = $1`,
    [orgId],
  );
  if ((existing?.c ?? 0) > 0) {
    await ensureLeaderExtras(orgId);
    seededOrgs.add(orgId);
    return;
  }

  const products = [
    ["CM-PRO", "CueMark Pro", "Software de cues y marcadores para shows en vivo", 299, "licencia", "software"],
    ["CM-TEAM", "CueMark Team", "Licencia de equipo CueMark (5 operadores)", 799, "licencia", "software"],
    ["LW-RENT-DAY", "LED Wall — renta día", "Renta de panel LED por día (paquete base)", 450, "día", "renta"],
    ["LW-RENT-EVENT", "LED Wall — evento", "Paquete evento LED Wall + soporte técnico", 1800, "evento", "renta"],
    ["LW-INSTALL", "Instalación LED Wall", "Montaje, cableado y configuración en venue", 650, "servicio", "servicio"],
    ["DMX-CONSULT", "Consultoría DMX", "Diseño de red DMX / Art-Net y programación", 120, "hora", "servicio"],
    ["AV-TECH", "Técnico de show", "Operador técnico en sitio", 95, "hora", "servicio"],
    ["PKG-LAUNCH", "Paquete lanzamiento", "LED + operador + soporte el día del evento", 2500, "paquete", "paquete"],
  ] as const;

  for (const [sku, name, description, price, unit, category] of products) {
    await sql(
      `insert into products (org_id, sku, name, description, unit_price, unit, category)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, sku, name, description, price, unit, category],
    );
  }

  const account = await sqlOne<{ id: string }>(
    `insert into accounts (org_id, name, industry, website, notes)
     values ($1, 'Producciones Andes', 'Eventos', 'https://example.com', 'Cliente recurrente de shows corporativos')
     returning id`,
    [orgId],
  );

  const contact1 = await sqlOne<{ id: string }>(
    `insert into contacts (org_id, account_id, full_name, email, phone, source, tags, notes)
     values ($1, $2, 'María López', 'maria@produccionesandes.com', '+51 999 111 222', 'whatsapp',
             array['vip','eventos'], 'Interesada en paquete LED para gala')
     returning id`,
    [orgId, account?.id ?? null],
  );

  const contact2 = await sqlOne<{ id: string }>(
    `insert into contacts (org_id, full_name, email, phone, source, tags, notes)
     values ($1, 'Carlos Ruiz', 'carlos@clubnorte.pe', '+51 988 777 666', 'instagram',
             array['club'], 'Consultó CueMark por DM')
     returning id`,
    [orgId],
  );

  const contact3 = await sqlOne<{ id: string }>(
    `insert into contacts (org_id, full_name, email, phone, source, tags)
     values ($1, 'Ana Torres', 'ana@briela.studio', '+51 977 555 444', 'referido', array['branding'])
     returning id`,
    [orgId],
  );

  const deal1 = await sqlOne<{ id: string }>(
    `insert into deals (org_id, contact_id, account_id, title, stage, amount, probability, expected_close, event_date, source, notes)
     values ($1, $2, $3, 'Gala corporativa — LED Wall', 'quoted', 2450, 50, current_date + 14, current_date + 30, 'whatsapp',
             'Necesitan anticipo 40%')
     returning id`,
    [orgId, contact1?.id ?? null, account?.id ?? null],
  );

  const deal2 = await sqlOne<{ id: string }>(
    `insert into deals (org_id, contact_id, title, stage, amount, probability, expected_close, source, notes)
     values ($1, $2, 'Licencia CueMark Team — Club Norte', 'negotiation', 799, 70, current_date + 7, 'instagram',
             'Comparando con alternativa')
     returning id`,
    [orgId, contact2?.id ?? null],
  );

  await sql(
    `insert into deals (org_id, contact_id, title, stage, amount, probability, source)
     values ($1, $2, 'Consultoría DMX — Briela', 'qualified', 480, 30, 'referido')`,
    [orgId, contact3?.id ?? null],
  );

  await sql(
    `insert into deals (org_id, contact_id, title, stage, amount, probability, source)
     values ($1, $2, 'Lead — feria tecnología', 'lead', 0, 10, 'web')`,
    [orgId, contact2?.id ?? null],
  );

  const productRows = await sql<{ id: string; name: string; unit_price: string }>(
    `select id, name, unit_price::text from products where org_id = $1 order by name`,
    [orgId],
  );
  const byName = Object.fromEntries(productRows.map((p) => [p.name, p]));

  const quote = await sqlOne<{ id: string }>(
    `insert into quotes (org_id, deal_id, contact_id, quote_number, version, status, currency,
                         subtotal, tax_rate, tax_amount, total, valid_until, notes, terms, sent_at)
     values ($1, $2, $3, 'COT-2026-001', 1, 'sent', 'USD', 2300, 0, 0, 2300,
             current_date + 15, 'Incluye soporte el día del evento',
             'Anticipo 40%. Saldo 48h antes del evento. Validez 15 días.', now())
     returning id`,
    [orgId, deal1?.id ?? null, contact1?.id ?? null],
  );

  if (quote) {
    const items = [
      [byName["LED Wall — evento"]?.id, "LED Wall — evento", 1, 1800],
      [byName["Instalación LED Wall"]?.id, "Instalación LED Wall", 1, 650],
      [byName["Técnico de show"]?.id, "Técnico de show (5 horas)", 5, 95],
    ] as const;
    // Fix line totals for technician: 5 * 95 = 475, total would be 2925 - adjust quote
    let sort = 0;
    let subtotal = 0;
    for (const [productId, description, qty, price] of [
      [byName["LED Wall — evento"]?.id ?? null, "LED Wall — paquete evento", 1, 1800],
      [byName["Instalación LED Wall"]?.id ?? null, "Instalación y configuración", 1, 650],
    ] as const) {
      const line = qty * price;
      subtotal += line;
      await sql(
        `insert into quote_items (quote_id, product_id, description, quantity, unit_price, line_total, sort_order)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [quote.id, productId, description, qty, price, line, sort++],
      );
    }
    void items;
    await sql(
      `update quotes set subtotal = $2, tax_amount = 0, total = $2 where id = $1`,
      [quote.id, subtotal],
    );
    await sql(`update deals set amount = $2 where id = $1`, [deal1?.id, subtotal]);
  }

  await sql(
    `insert into payments (org_id, deal_id, quote_id, contact_id, amount, method, status, paid_at, reference, notes)
     values ($1, $2, $3, $4, 920, 'transfer', 'confirmed', current_date - 2, 'TRX-88421', 'Anticipo 40%')`,
    [orgId, deal1?.id ?? null, quote?.id ?? null, contact1?.id ?? null],
  );

  const convWa = await sqlOne<{ id: string }>(
    `insert into conversations (org_id, contact_id, deal_id, channel, status, last_message_at)
     values ($1, $2, $3, 'whatsapp', 'open', now() - interval '1 hour')
     returning id`,
    [orgId, contact1?.id ?? null, deal1?.id ?? null],
  );
  if (convWa) {
    await sql(
      `insert into messages (conversation_id, direction, body, sender_name, status, created_at) values
       ($1, 'inbound', 'Hola, ¿tienen LED disponible para el 20?', 'María López', 'delivered', now() - interval '2 hour'),
       ($1, 'outbound', 'Sí, tenemos paquete evento + instalación. Te armo la cotización.', 'Kenlly', 'delivered', now() - interval '90 minutes'),
       ($1, 'inbound', 'Perfecto, ¿pueden incluir técnico?', 'María López', 'delivered', now() - interval '1 hour')`,
      [convWa.id],
    );
  }

  const convIg = await sqlOne<{ id: string }>(
    `insert into conversations (org_id, contact_id, deal_id, channel, status, last_message_at)
     values ($1, $2, $3, 'instagram', 'open', now() - interval '3 hour')
     returning id`,
    [orgId, contact2?.id ?? null, deal2?.id ?? null],
  );
  if (convIg) {
    await sql(
      `insert into messages (conversation_id, direction, body, sender_name, created_at) values
       ($1, 'inbound', 'Vi CueMark en stories, ¿cuánto sale la versión team?', 'Carlos Ruiz', now() - interval '4 hour'),
       ($1, 'outbound', 'CueMark Team es $799 por 5 operadores. ¿Te mando demo?', 'Kenlly', now() - interval '3 hour')`,
      [convIg.id],
    );
  }

  const project = await sqlOne<{ id: string }>(
    `insert into projects (org_id, deal_id, name, status, start_date, end_date, location, notes)
     values ($1, $2, 'Gala corporativa — producción', 'planned', current_date + 28, current_date + 30,
             'Hotel Costa, Lima', 'Coordinar carga y generador')
     returning id`,
    [orgId, deal1?.id ?? null],
  );
  if (project) {
    const tasks = [
      "Confirmar plano de venue",
      "Reservar transporte LED",
      "Ensayo técnico",
      "Cobrar saldo",
    ];
    for (let i = 0; i < tasks.length; i++) {
      await sql(
        `insert into project_tasks (project_id, title, done, sort_order) values ($1, $2, false, $3)`,
        [project.id, tasks[i], i],
      );
    }
  }

  await sql(
    `insert into integration_settings (org_id, provider, enabled, config) values
     ($1, 'whatsapp', false, '{"mode":"cloud_api","note":"Conecta WHATSAPP_TOKEN y WHATSAPP_PHONE_ID"}'::jsonb),
     ($1, 'instagram', false, '{"mode":"messenger_api","note":"Conecta META_PAGE_TOKEN"}'::jsonb),
     ($1, 'grok', true, '{"mode":"assist","note":"Usa XAI_API_KEY; sin clave opera en modo demo"}'::jsonb)`,
    [orgId],
  );

  await sql(
    `insert into activity_log (org_id, entity_type, entity_id, action, summary, actor_sub)
     values ($1, 'system', null, 'seed', 'Datos de ejemplo cargados (CueMark, LED Wall, deals)', 'system')`,
    [orgId],
  );

  await ensureLeaderExtras(orgId);
  seededOrgs.add(orgId);
}

/** Plantillas + tareas de seguimiento (estilo HubSpot / Kommo) */
async function ensureLeaderExtras(orgId: string): Promise<void> {
  const templates = await sqlOne<{ c: number }>(
    `select count(*)::int as c from message_templates where org_id = $1`,
    [orgId],
  );
  if ((templates?.c ?? 0) === 0) {
    const rows: [string, string, string][] = [
      [
        "Saludo inicial WA",
        "whatsapp",
        "Hola {{nombre}}, gracias por escribirnos. ¿Para qué fecha y ciudad necesitas el servicio?",
      ],
      [
        "Envío de cotización",
        "whatsapp",
        "Hola {{nombre}}, te comparto la cotización {{cotizacion}}. Queda válida 15 días. ¿La revisamos juntos?",
      ],
      [
        "Seguimiento post-cotización",
        "whatsapp",
        "Hola {{nombre}}, ¿pudiste revisar la propuesta? Puedo ajustar alcance o fechas si cambió algo del evento.",
      ],
      [
        "Recordatorio de anticipo",
        "whatsapp",
        "Hola {{nombre}}, para reservar equipo/fecha necesitamos el anticipo del 40%. ¿Te paso los datos de pago?",
      ],
      [
        "Respuesta IG demo",
        "instagram",
        "¡Hola! Gracias por el DM. Te cuento opciones y precios según tu fecha. ¿Es show, corporativo o instalación?",
      ],
    ];
    for (const [name, channel, body] of rows) {
      await sql(
        `insert into message_templates (org_id, name, channel, body)
         values ($1, $2, $3, $4)`,
        [orgId, name, channel, body],
      );
    }
  }

  const openTasks = await sqlOne<{ c: number }>(
    `select count(*)::int as c from tasks where org_id = $1`,
    [orgId],
  );
  if ((openTasks?.c ?? 0) === 0) {
    const deal = await sqlOne<{ id: string; contact_id: string | null }>(
      `select id, contact_id from deals where org_id = $1 and stage not in ('won','lost')
       order by updated_at desc limit 1`,
      [orgId],
    );
    if (deal) {
      await sql(
        `insert into tasks (org_id, title, due_at, status, priority, deal_id, contact_id, notes)
         values
         ($1, 'Llamar para confirmar alcance', now() + interval '1 day', 'open', 'high', $2, $3, 'Seguimiento estilo Pipedrive'),
         ($1, 'Enviar cotización actualizada', now() + interval '2 day', 'open', 'normal', $2, $3, ''),
         ($1, 'Cobrar anticipo si acepta', now() + interval '5 day', 'open', 'normal', $2, $3, '')`,
        [orgId, deal.id, deal.contact_id],
      );
    }
  }
}
