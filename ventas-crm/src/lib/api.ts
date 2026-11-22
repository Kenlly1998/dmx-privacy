export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

export function badRequest(message: string) {
  return json({ error: message }, 400);
}

export function notFound(message = "No encontrado") {
  return json({ error: message }, 404);
}
