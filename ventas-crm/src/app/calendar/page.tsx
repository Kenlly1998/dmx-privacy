"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import type { CalendarEvent, Deal } from "@/lib/types";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dealDates, setDealDates] = useState<
    { id: string; title: string; event_type: string; starts_at: string; contact_name?: string | null }[]
  >([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [form, setForm] = useState({
    title: "",
    event_type: "job",
    starts_at: "",
    location: "",
    deal_id: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [c, d] = await Promise.all([
      api<{
        events: CalendarEvent[];
        deal_dates: typeof dealDates;
      }>("/api/calendar"),
      api<{ deals: Deal[] }>("/api/deals"),
    ]);
    setEvents(c.events);
    setDealDates(c.deal_dates);
    setDeals(d.deals);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        deal_id: form.deal_id || null,
      }),
    });
    setForm({ title: "", event_type: "job", starts_at: "", location: "", deal_id: "", notes: "" });
    await load();
  }

  const merged = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      event_type: e.event_type,
      starts_at: e.starts_at,
      location: e.location,
      extra: e.deal_title || e.contact_name || "",
    })),
    ...dealDates.map((d) => ({
      id: d.id,
      title: d.title,
      event_type: d.event_type,
      starts_at: d.starts_at,
      location: "",
      extra: d.contact_name || "Desde deal",
    })),
  ].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Agenda</h1>
        <p className="text-[var(--muted)]">
          Trabajos, entregas y capacitaciones. Ordena lo que harás.
        </p>
      </header>

      <form onSubmit={onSubmit} className="panel grid gap-3 p-4 md:grid-cols-3">
        <div>
          <label className="label">Título</label>
          <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="select" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
            <option value="job">Trabajo / show</option>
            <option value="training">Capacitación</option>
            <option value="delivery">Entrega</option>
            <option value="meeting">Reunión</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="label">Inicio</label>
          <input className="input" type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        </div>
        <div>
          <label className="label">Lugar</label>
          <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="label">Deal</label>
          <select className="select" value={form.deal_id} onChange={(e) => setForm({ ...form, deal_id: e.target.value })}>
            <option value="">—</option>
            {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" type="submit">Agregar</button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="space-y-2">
        {merged.map((item) => (
          <div key={item.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge">{item.event_type}</span>
                <span className="font-medium">{item.title}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                {formatDate(item.starts_at)}
                {item.location ? ` · ${item.location}` : ""}
                {item.extra ? ` · ${item.extra}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
