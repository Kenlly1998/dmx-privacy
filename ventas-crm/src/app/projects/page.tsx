"use client";

import { useEffect, useMemo, useState } from "react";
import { api, formatDate } from "@/lib/client";
import type { Project } from "@/lib/types";

type Task = {
  id: string;
  project_id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  sort_order: number;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ projects: Project[]; tasks: Task[] }>("/api/projects")
      .then((data) => {
        setProjects(data.projects);
        setTasks(data.tasks);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const tasksByProject = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.project_id) ?? [];
      list.push(task);
      map.set(task.project_id, list);
    }
    return map;
  }, [tasks]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Proyectos</h1>
        <p className="text-[var(--muted)]">
          Post-venta: checklist de entrega cuando un deal se gana.
        </p>
      </header>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => {
          const list = tasksByProject.get(project.id) ?? [];
          const done = list.filter((t) => t.done).length;
          return (
            <div key={project.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-xl">{project.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {project.deal_title || "Sin deal"} · {project.location || "Sin ubicación"}
                  </div>
                </div>
                <span className="badge">{project.status}</span>
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">
                {formatDate(project.start_date)} → {formatDate(project.end_date)}
              </div>
              <div className="mt-3 text-sm">
                Avance {done}/{list.length}
              </div>
              <ul className="mt-2 space-y-2">
                {list.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg bg-[var(--bg)] px-3 py-2 text-sm"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        task.done ? "bg-[var(--ok)]" : "bg-[var(--muted)]"
                      }`}
                    />
                    <span className={task.done ? "line-through opacity-60" : ""}>
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
              {project.notes && (
                <p className="mt-3 text-sm text-[var(--muted)]">{project.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      {!projects.length && !error && (
        <div className="panel p-6 text-sm text-[var(--muted)]">
          Aún no hay proyectos. Marca un deal como Ganado para crear uno
          automático.
        </div>
      )}
    </div>
  );
}
