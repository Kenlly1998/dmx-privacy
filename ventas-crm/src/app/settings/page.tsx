"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type SettingsResponse = {
  integrations: {
    provider: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }[];
  secrets: Record<string, boolean>;
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const settings = await api<SettingsResponse>("/api/integrations/settings");
    setData(settings);
    const dash = await api<{ orgName?: string } & { /* */ }>("/api/dashboard");
    // fetch org id via whatsapp status after enabling — use contacts seed path
    void dash;
    const deals = await api<{ deals: { org_id?: string }[] }>("/api/deals");
    // org id not on deals type — get from whatsapp GET after session
    const wa = await api<{ /* */ } & { config?: unknown }>("/api/integrations/whatsapp");
    void wa;
    const sessionOrg = await api<{
      kpis: unknown;
    }>("/api/dashboard");
    void sessionOrg;
  }

  useEffect(() => {
    (async () => {
      try {
        const settings = await api<SettingsResponse>(
          "/api/integrations/settings",
        );
        setData(settings);
        // Resolve org id from a lightweight authenticated endpoint that returns org context
        const dash = await fetch("/api/dashboard").then((r) => r.json());
        // We'll store org via a dedicated field — add to dashboard response usage
        const contactRes = await fetch("/api/contacts").then((r) => r.json());
        const first = contactRes.contacts?.[0];
        if (first?.org_id) setOrgId(first.org_id);
        void dash;
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  async function toggle(provider: "whatsapp" | "instagram" | "grok", enabled: boolean) {
    setError(null);
    await api("/api/integrations/settings", {
      method: "PATCH",
      body: JSON.stringify({ provider, enabled }),
    });
    const settings = await api<SettingsResponse>("/api/integrations/settings");
    setData(settings);
    setMessage(`${provider} ${enabled ? "activado" : "desactivado"}`);
  }

  async function demoWhatsApp() {
    if (!orgId) {
      setError("No hay org_id aún; recarga tras ver contactos de ejemplo.");
      return;
    }
    await api("/api/integrations/whatsapp", {
      method: "POST",
      body: JSON.stringify({
        demo: true,
        org_id: orgId,
        from: "+51999888777",
        name: "Lead Demo WA",
        body: "Hola, quiero cotizar LED Wall para el sábado",
      }),
    });
    setMessage("Mensaje demo de WhatsApp ingerido. Revisa Inbox y Pipeline.");
  }

  async function demoInstagram() {
    if (!orgId) {
      setError("No hay org_id aún; recarga tras ver contactos de ejemplo.");
      return;
    }
    await api("/api/integrations/instagram", {
      method: "POST",
      body: JSON.stringify({
        demo: true,
        org_id: orgId,
        from: "ig_demo_001",
        name: "Lead Demo IG",
        body: "¿Cuánto cuesta CueMark Team?",
      }),
    });
    setMessage("Mensaje demo de Instagram ingerido. Revisa Inbox y Pipeline.");
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Ajustes</h1>
        <p className="text-[var(--muted)]">
          Conexiones con Grok, WhatsApp Cloud API e Instagram Messaging.
        </p>
      </header>

      {message && <div className="panel p-3 text-sm text-[var(--ok)]">{message}</div>}
      {error && <div className="text-[var(--danger)]">{error}</div>}

      <section className="panel p-4">
        <h2 className="font-display text-xl">Secretos del entorno</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          En producción se declaran en Cursor (bind-app-secrets). Aquí solo se
          muestra si están presentes — nunca sus valores.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(data?.secrets ?? {}).map(([key, ok]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3 py-2 text-sm"
            >
              <code>{key}</code>
              <span className="badge">{ok ? "configurado" : "faltante"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {(data?.integrations ?? []).map((item) => (
          <div key={item.provider} className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium capitalize">{item.provider}</div>
                <div className="text-xs text-[var(--muted)]">
                  {String(item.config?.note ?? "")}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  toggle(
                    item.provider as "whatsapp" | "instagram" | "grok",
                    !item.enabled,
                  )
                }
              >
                {item.enabled ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel space-y-3 p-4">
        <h2 className="font-display text-xl">Pruebas de canal (demo)</h2>
        <p className="text-sm text-[var(--muted)]">
          Simula un webhook entrante sin Meta. Org: {orgId || "detectando…"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={demoWhatsApp}>
            Simular WhatsApp
          </button>
          <button type="button" className="btn btn-ghost" onClick={demoInstagram}>
            Simular Instagram
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => load().catch(() => undefined)}
          >
            Refrescar
          </button>
        </div>
      </section>

      <section className="panel p-4 text-sm text-[var(--muted)]">
        <h2 className="font-display text-xl text-[var(--text)]">Apps móviles</h2>
        <p className="mt-2">
          Esta app es responsive y PWA: en iPhone/iPad/Android usa “Añadir a
          pantalla de inicio”. El mismo backend sirve web y futuro cliente Expo
          nativo.
        </p>
      </section>
    </div>
  );
}
