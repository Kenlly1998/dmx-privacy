"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate } from "@/lib/client";
import type { Deal } from "@/lib/types";

type Task = {
  id: string;
  title: string;
  due_at: string | null;
  status: string;
  priority: string;
  deal_id: string | null;
  notes: string;
  deal_title?: string | null;
  contact_name?: string | null;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [title, setTitle] = useState("");
  const [dealId, setDealId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [t, d] = await Promise.all([
      api<{ tasks: Task[] }>("/api/tasks?status=all"),
      api<{ deals: Deal[] }>("/api/deals"),
    ]);
    setTasks(t.tasks);
    setDeals(d.deals);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        priority,
        deal_id: dealId || null,
        due_at: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    setTitle("");
    await load();
  }

  async function complete(id: string) {
    await api(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "done" }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Tareas</h1>
        <p className="text-[var(--muted)]">
          Seguimientos como en Pipedrive/HubSpot: due dates y prioridad.
        </p>
      </header>

      <form
        onSubmit={createTask}
        className="panel grid gap-3 p-4 md:grid-cols-[1fr_180px_140px_auto]"
      >
        <div>
          <label className="label">Nueva tarea</label>
          <input
            className="input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Llamar / enviar cotización / cobrar"
          />
        </div>
        <div>
          <label className="label">Deal</label>
          <select
            className="select"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
          >
            <option value="">—</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Prioridad</label>
          <select
            className="select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" type="submit">
            Crear
          </button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="panel flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{task.title}</span>
                <span className="badge">{task.priority}</span>
                <span className="badge">{task.status}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Vence {formatDate(task.due_at)}
                {task.deal_title ? (
                  <>
                    {" · "}
                    <Link
                      href={`/deals/${task.deal_id}`}
                      className="text-[var(--accent)]"
                    >
                      {task.deal_title}
                    </Link>
                  </>
                ) : null}
                {task.contact_name ? ` · ${task.contact_name}` : ""}
              </div>
            </div>
            {task.status === "open" && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => complete(task.id)}
              >
                Completar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
