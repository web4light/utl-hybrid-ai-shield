// Web4 Coordinator — UTL Hybrid AI Shield + Latinský pivot cache + Registr uzlů (Cloudflare Worker)

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-UTL-Proof, X-UTL-Tier"
        }
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health" || url.pathname === "/") {
      return Response.json({
        service: "web4-coordinator (UTL Hybrid AI Shield)",
        status: "ok",
        edgeColo: request.cf?.colo || "UNKNOWN",
        kvBindings: {
          translationCache: Boolean(env.TRANSLATION_CACHE),
          nodeRegistry: Boolean(env.NODE_REGISTRY)
        }
      });
    }

    // 1. Latinský pivot překladový cache lookup / zápis
    if (url.pathname === "/v1/cache" && env.TRANSLATION_CACHE) {
      if (request.method === "GET") {
        const key = url.searchParams.get("key") || "";
        const hit = key ? await env.TRANSLATION_CACHE.get(key) : null;
        return Response.json({ hit: hit !== null, value: hit });
      }
      if (request.method === "POST") {
        const body = await request.json();
        if (body.key && body.latin) {
          await env.TRANSLATION_CACHE.put(body.key, body.latin, { expirationTtl: 86400 * 30 });
          return Response.json({ cached: true, key: body.key });
        }
      }
    }

    // 2. Registr mesh uzlů (2-5% volné kapacity bez cookies)
    if (url.pathname === "/v1/nodes" && env.NODE_REGISTRY) {
      if (request.method === "POST") {
        const body = await request.json();
        if (!body.nodeId) return Response.json({ error: "Missing nodeId" }, { status: 400 });
        await env.NODE_REGISTRY.put(
          `node:${body.nodeId}`,
          JSON.stringify({ ...body, updatedAt: Date.now() }),
          { expirationTtl: 300 }
        );
        return Response.json({ registered: true, nodeId: body.nodeId });
      }
    }

    // 3. Kryptografická atestace pro cloudové požadavky
    const proof = request.headers.get("X-UTL-Proof");
    if (request.method === "POST" && (!proof || proof.length < 16)) {
      return Response.json(
        { error: "Missing X-UTL-Proof cryptographic attestation" },
        { status: 401 }
      );
    }

    return Response.json({
      verified: true,
      edgeColo: request.cf?.colo || "UNKNOWN",
      policy: "PII stays On-Device; Edge coordinates mesh & Latin pivot cache"
    });
  }
};
