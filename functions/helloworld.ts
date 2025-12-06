export async function onRequest(context) {
  const db = context.env.DB;

  const { results } = await db
    .prepare("SELECT * FROM messages")
    .all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}
