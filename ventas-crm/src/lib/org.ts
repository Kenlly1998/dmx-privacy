import { getIdentity } from "../../cursor/identity";
import { sql, sqlOne } from "./db";
import { ensureSeedData } from "./seed";
import type { Org } from "./types";

export type Session = {
  org: Org;
  userSub: string;
  email: string;
  displayName: string;
  role: string;
};

export async function requireSession(request: Request): Promise<Session | Response> {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    // Local/dev without Cursor gate: still allow simulated or anonymous workspace
    if (!process.env.CURSOR_APP_ID && !process.env.VERCEL) {
      return bootstrapSession({
        sub: "local-dev",
        email: "kenlly@local.dev",
        name: "Kenlly",
      });
    }
    return Response.json(
      { error: "unauthorized", reason: "verified" in identity ? identity.reason : "unknown" },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }

  return bootstrapSession({
    sub: identity.sub,
    email: identity.email || "",
    name: identity.name || identity.email || "Usuario",
  });
}

async function bootstrapSession(viewer: {
  sub: string;
  email: string;
  name: string;
}): Promise<Session> {
  let membership = await sqlOne<{
    org_id: string;
    role: string;
    name: string;
    currency: string;
    timezone: string;
  }>(
    `select m.org_id, m.role, o.name, o.currency, o.timezone
     from memberships m
     join organizations o on o.id = m.org_id
     where m.user_sub = $1
     order by m.created_at asc
     limit 1`,
    [viewer.sub],
  );

  if (!membership) {
    const org = await sqlOne<Org>(
      `insert into organizations (name, currency, timezone)
       values ($1, 'USD', 'America/Lima')
       returning id, name, currency, timezone`,
      ["KLA PRO"],
    );
    if (!org) throw new Error("No se pudo crear la organización");
    await sql(
      `insert into memberships (org_id, user_sub, email, display_name, role)
       values ($1, $2, $3, $4, 'owner')`,
      [org.id, viewer.sub, viewer.email, viewer.name],
    );
    await ensureSeedData(org.id);
    membership = {
      org_id: org.id,
      role: "owner",
      name: org.name,
      currency: org.currency,
      timezone: org.timezone,
    };
  } else {
    if (membership.name === "Mi Empresa") {
      await sql(`update organizations set name = $1 where id = $2`, [
        "KLA PRO",
        membership.org_id,
      ]);
      membership = { ...membership, name: "KLA PRO" };
    }
    await ensureSeedData(membership.org_id);
  }

  return {
    org: {
      id: membership.org_id,
      name: membership.name,
      currency: membership.currency,
      timezone: membership.timezone,
    },
    userSub: viewer.sub,
    email: viewer.email,
    displayName: viewer.name,
    role: membership.role,
  };
}

export async function logActivity(
  orgId: string,
  actorSub: string,
  entityType: string,
  entityId: string | null,
  action: string,
  summary: string,
) {
  await sql(
    `insert into activity_log (org_id, entity_type, entity_id, action, summary, actor_sub)
     values ($1, $2, $3, $4, $5, $6)`,
    [orgId, entityType, entityId, action, summary, actorSub],
  );
}
