export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;

  const url = new URL(request.url);
  const channelId = url.searchParams.get("channel_id");

  const baseQuery = "SELECT * FROM messages";
  const whereClause = channelId ? " WHERE channel_id = ?1" : "";
  const orderClause = " ORDER BY created_at ASC";

  const statement = db.prepare(`${baseQuery}${whereClause}${orderClause}`);
  const prepared = channelId ? statement.bind(channelId) : statement;

  const { results } = await prepared.all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { channel_id, user_id, content } = body;

  if (!channel_id || !user_id || !content) {
    return new Response("channel_id, user_id, content are required", {
      status: 400,
    });
  }

  try {
    await env.DB.prepare(
      `
      INSERT INTO messages (channel_id, user_id, content)
      VALUES (?1, ?2, ?3)
      `
    )
      .bind(channel_id, user_id, content)
      .run();

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Failed to insert message:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
