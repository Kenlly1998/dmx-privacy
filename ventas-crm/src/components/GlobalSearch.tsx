"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Result = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api<{ results: Result[] }>(`/api/search?q=${encodeURIComponent(q)}`)
        .then((data) => {
          setResults(data.results);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative w-full max-w-md">
      <input
        className="input"
        placeholder="Buscar contactos, deals, cotizaciones…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--stroke)] bg-[var(--bg-elevated)]">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-soft)]"
              onMouseDown={() => {
                setOpen(false);
                setQ("");
                router.push(r.href);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{r.title}</span>
                <span className="badge">{r.type}</span>
              </div>
              <div className="text-xs text-[var(--muted)]">{r.subtitle}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
