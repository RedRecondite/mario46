// Fetch latest posts from Wario64 on Bluesky and expose as JSON
export async function onRequest(context) {
  const ACTOR = "did:plc:knj5sw5al3sukl6vhkpi7637";
  const LIMIT = 50;
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(ACTOR)}&limit=${LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) {
    return new Response(`Bluesky fetch error (${res.status})`, { status: 502 });
  }
  const data = await res.json();
  // data.feed: array of posts
  const deals = data.feed
    .map((post) => {
      const text = post.post.record.text || "";
      // extract first URL in text
      const urlMatch = text.match(/https?:\/\/(\S+)/);
      const link = urlMatch ? urlMatch[0] : "";
      // extract price
      const priceMatch = text.match(/[$€]\d+(?:\.\d+)?/);
      return {
        id: post.post.cid,
        name: text.replace(/https?:\/\/(\S+)/, "").trim(),
        price: priceMatch ? priceMatch[0] : "",
        url: link,
        timestamp: post.post.record.createdAt,
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return new Response(JSON.stringify(deals), {
    headers: { "Content-Type": "application/json" },
  });
}
