function parseMembers(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map(String));
  }
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return JSON.stringify([]);
    }
  }
  return JSON.stringify([]);
}

type DBChannelRow = {
  id?: number;
  created_at?: number;
  channel_id?: string;
  description?: string;
  members?: string;
};

function normalizeRow(row: DBChannelRow | null | undefined) {
  const safeRow = row ?? {};
  let members: string[] = [];
  try {
    const parsed = JSON.parse(safeRow.members ?? "[]");
    members = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    members = [];
  }

  return {
    id: safeRow.id,
    created_at: safeRow.created_at,
    channel_id: safeRow.channel_id,
    description: safeRow.description ?? "",
    members,
  };
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, created_at, channel_id, description, members FROM channels ORDER BY created_at ASC",
    ).all();

    const normalized = Array.isArray(results) ? results.map(normalizeRow) : [];

    return new Response(JSON.stringify(normalized), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("Failed to fetch channels", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { channel_id, description = "", members = [] } = body ?? {};

  if (!channel_id || typeof channel_id !== "string" || !channel_id.trim()) {
    return new Response("channel_id is required", { status: 400 });
  }

  const membersJson = parseMembers(members);

  try {
    const insert = env.DB.prepare(`INSERT INTO channels (channel_id, description, members) VALUES (?1, ?2, ?3)`).bind(
      channel_id.trim(),
      String(description ?? ""),
      membersJson,
    );

    const runResult = await insert.run();
    const newId = runResult?.meta?.last_row_id ?? runResult?.meta?.lastRowId;

    const select = env.DB.prepare(
      "SELECT id, created_at, channel_id, description, members FROM channels WHERE id = ?1",
    ).bind(newId ?? null);
    const { results } = await select.all();
    const created = Array.isArray(results) && results[0] ? normalizeRow(results[0]) : null;

    return new Response(JSON.stringify(created ?? { ok: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Failed to create channel", e);
    const isConstraint = (e?.message || "").includes("UNIQUE") || (e?.cause?.message || "").includes("UNIQUE");
    return new Response(isConstraint ? "channel_id already exists" : "Internal Server Error", {
      status: isConstraint ? 409 : 500,
    });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { channel_id, description, members } = body ?? {};

  if (!channel_id || typeof channel_id !== "string" || !channel_id.trim()) {
    return new Response("channel_id is required", { status: 400 });
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (typeof description === "string") {
    updates.push("description = ?");
    params.push(description);
  }

  if (members !== undefined) {
    updates.push("members = ?");
    params.push(parseMembers(members));
  }

  if (updates.length === 0) {
    return new Response("No updatable fields provided", { status: 400 });
  }

  params.push(channel_id.trim());

  try {
    const stmt = env.DB.prepare(`UPDATE channels SET ${updates.join(", ")} WHERE channel_id = ?`).bind(...params);
    const result = await stmt.run();

    if (result?.meta?.changes === 0) {
      return new Response("Channel not found", { status: 404 });
    }

    const { results } = await env.DB.prepare(
      "SELECT id, created_at, channel_id, description, members FROM channels WHERE channel_id = ?1",
    )
      .bind(channel_id.trim())
      .all();

    const updated = Array.isArray(results) && results[0] ? normalizeRow(results[0]) : null;

    return new Response(JSON.stringify(updated ?? { ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Failed to update channel", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
