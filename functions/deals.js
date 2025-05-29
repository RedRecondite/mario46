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
      let extractedLink = "";

      // 1. Try to extract link from facets
      const facets = post.post.record.facets;
      if (Array.isArray(facets)) {
        for (const facet of facets) {
          if (facet && Array.isArray(facet.features)) {
            for (const feature of facet.features) {
              if (feature && feature.$type === "app.bsky.richtext.facet#link" && 
                  feature.uri && typeof feature.uri === 'string' && feature.uri.trim() !== '') {
                extractedLink = feature.uri.trim();
                break; // Found the first link, exit inner loop
              }
            }
          }
          if (extractedLink) break; // Exit outer loop if link is found
        }
      }

      // 2. If no link from facets, fall back to regex on text
      if (!extractedLink) {
        const urlRegex = /(?:https?:\/\/|www\.)[\w\-\.]+\.[a-zA-Z]{2,}(?:\/\S*)?|[\w-]+\.(?:com|org|net|io|dev|co|uk|us|ca|info|biz|gg|deals|shop|store|app|link|xyz|me|tv)\b(?:\/\S*)?/i;
        const urlMatch = text.match(urlRegex);
        if (urlMatch && urlMatch[0]) {
          extractedLink = urlMatch[0];
        }
      }
      
      // 3. Extract price (existing logic)
      const priceMatch = text.match(/[$€]\d+(?:\.\d+)?/);
      
      // 4. Generate name
      let dealName = text; // Start with the full text
      if (extractedLink && dealName.includes(extractedLink)) {
        // If the extracted link is found in the text, remove it
        dealName = dealName.replace(extractedLink, "");
      }
      dealName = dealName.trim(); // Trim whitespace from the name
      
      return {
        id: post.post.cid,
        name: dealName,
        price: priceMatch ? priceMatch[0] : "",
        url: extractedLink,
        timestamp: post.post.record.createdAt,
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return new Response(JSON.stringify(deals), {
    headers: { "Content-Type": "application/json" },
  });
}
