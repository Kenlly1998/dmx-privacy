import { sql } from "./db";
import type { Deal, Product } from "./types";
import { money, toNumber } from "./money";

export type GrokDraftInput = {
  orgId: string;
  actionType: "followup" | "quote_draft" | "deal_summary" | "reply";
  prompt: string;
  dealId?: string | null;
  contactId?: string | null;
  channel?: string;
  inboundMessage?: string;
};

export async function createGrokProposal(input: GrokDraftInput): Promise<{
  proposal: string;
  model: string;
  demo: boolean;
}> {
  const context = await buildContext(input);
  const apiKey = process.env.XAI_API_KEY?.trim() ?? "";

  if (apiKey) {
    try {
      const proposal = await callGrok(apiKey, input, context);
      return { proposal, model: "grok-2-latest", demo: false };
    } catch {
      // fall through to demo
    }
  }

  return {
    proposal: demoProposal(input, context),
    model: "grok-demo",
    demo: true,
  };
}

async function buildContext(input: GrokDraftInput) {
  const products = await sql<Product>(
    `select * from products where org_id = $1 and active = true order by name limit 20`,
    [input.orgId],
  );

  let deal: Deal | null = null;
  if (input.dealId) {
    const rows = await sql<Deal>(
      `select d.*, c.full_name as contact_name, a.name as account_name
       from deals d
       left join contacts c on c.id = d.contact_id
       left join accounts a on a.id = d.account_id
       where d.id = $1 and d.org_id = $2`,
      [input.dealId, input.orgId],
    );
    deal = rows[0] ?? null;
  }

  let contactName = deal?.contact_name ?? "";
  if (input.contactId && !contactName) {
    const c = await sql<{ full_name: string }>(
      `select full_name from contacts where id = $1 and org_id = $2`,
      [input.contactId, input.orgId],
    );
    contactName = c[0]?.full_name ?? "";
  }

  return { products, deal, contactName };
}

async function callGrok(
  apiKey: string,
  input: GrokDraftInput,
  context: Awaited<ReturnType<typeof buildContext>>,
): Promise<string> {
  const catalog = context.products
    .map((p) => `- ${p.name}: ${money(p.unit_price)} / ${p.unit}`)
    .join("\n");

  const system = `Eres el copiloto de ventas de un CRM para eventos/AV (CueMark, LED Wall, DMX).
Responde en español, claro y profesional. No inventes precios fuera del catálogo.
Si propones cotización, usa solo productos listados. Sé concreto y accionable.`;

  const user = `Acción: ${input.actionType}
Prompt del vendedor: ${input.prompt}
Contacto: ${context.contactName || "N/D"}
Deal: ${context.deal ? `${context.deal.title} | etapa ${context.deal.stage} | ${money(context.deal.amount)}` : "N/D"}
Canal: ${input.channel || "N/D"}
Mensaje entrante: ${input.inboundMessage || "N/D"}
Catálogo:
${catalog}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Grok HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Respuesta vacía de Grok");
  return content;
}

function demoProposal(
  input: GrokDraftInput,
  context: Awaited<ReturnType<typeof buildContext>>,
): string {
  const name = context.contactName || "cliente";
  const dealTitle = context.deal?.title || "oportunidad";
  const amount = context.deal ? money(context.deal.amount) : "";

  switch (input.actionType) {
    case "reply":
      return `Hola ${name.split(" ")[0]}, gracias por escribirnos. Con gusto te ayudo con ${dealTitle || "tu proyecto"}. ¿Me confirmas fecha del evento y ciudad para armarte una propuesta exacta?`;
    case "quote_draft": {
      const top = context.products.slice(0, 3);
      const lines = top
        .map(
          (p) =>
            `• ${p.name} — ${money(p.unit_price)} / ${p.unit}`,
        )
        .join("\n");
      return `Borrador de cotización para ${name} (${dealTitle}):\n\n${lines}\n\nNotas: Anticipo 40%. Validez 15 días. Incluye soporte remoto.\n\n(Modo demo — conecta XAI_API_KEY para Grok en vivo)`;
    }
    case "deal_summary":
      return `Resumen de ${dealTitle}:\n- Contacto: ${name}\n- Monto: ${amount || "por definir"}\n- Etapa: ${context.deal?.stage ?? "N/D"}\n- Probabilidad: ${context.deal?.probability ?? 0}%\n- Siguiente paso: confirmar alcance, enviar cotización actualizada y agendar llamada de cierre.\n\n(Modo demo)`;
    case "followup":
    default:
      return `Hola ${name.split(" ")[0]}, te escribo para dar seguimiento a ${dealTitle}${amount ? ` (${amount})` : ""}. ¿Tienes 10 minutos esta semana para revisar la propuesta y fechas? Puedo ajustar el alcance si cambió algo del evento.\n\n(Modo demo — con XAI_API_KEY esto lo genera Grok con el contexto real del deal)`;
  }
}

export function quoteSuggestionFromCatalog(products: Product[], titles: string[]) {
  const picked = products.filter((p) =>
    titles.some((t) => p.name.toLowerCase().includes(t.toLowerCase())),
  );
  const items = (picked.length ? picked : products.slice(0, 2)).map((p) => ({
    product_id: p.id,
    description: p.name,
    quantity: 1,
    unit_price: toNumber(p.unit_price),
  }));
  return items;
}
