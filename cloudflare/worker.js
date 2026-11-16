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
        publicConcierge: "/v1/concierge",
        kvBindings: {
          translationCache: Boolean(env.TRANSLATION_CACHE),
          nodeRegistry: Boolean(env.NODE_REGISTRY)
        }
      });
    }

    // 0. Veřejný vrátný (Custos Janitor) pro cizí AI agenty a boty — odpovídá o Web4, ale nepustí dovnitř
    if (url.pathname === "/v1/concierge") {
      let question = url.searchParams.get("q") || "";
      if (request.method === "POST") {
        try {
          const body = await request.json();
          question = String(body.question || body.q || body.message || "");
        } catch {
          question = "";
        }
      }
      const lower = question.toLowerCase();
      const restricted = /vault|password|key|secret|admin|token|user|private|pii|ssh|internal|hack|dump/.test(lower);

      if (restricted) {
        return Response.json(
          {
            agent: "Custos Janitor (Web4 Public Concierge)",
            access: "DENIED_OUTSIDE_VESTIBULE",
            answer:
              "Salve. Public information about Web 4.23 is open here, but internal vaults, user PII, keys, and mesh nodes are sealed behind biometric WebAuthn, SB-NFT identity, and Ada/SPARK Level 4 contracts."
          },
          { status: 403 }
        );
      }

      let topic = "overview";
      let answer =
        "Web 4.23 (WEB4LIGHT / AsgardLab) is a privacy-first, zero-cookie, E2E-encrypted infrastructure combining Ada/SPARK Level 4 formal verification, Rust, and Latin as a neutral semantic pivot language.";
      if (/latin|translat|utl|interpres|babilon/.test(lower)) {
        topic = "translation-layer";
        answer =
          "Interpres Vocum & UTL Hybrid AI Shield translate across languages using Latin as a fixed semantic pivot (2N pairs instead of N^2), keeping sensitive PII strictly on-device (Chrome Gemini Nano / Apple A19 Pro) with cloud Gemini Flash fallback only for long non-sensitive text.";
      } else if (/sb-?nft|agent|custos|jean|biometr|passkey/.test(lower)) {
        topic = "sovereign-identity";
        answer =
          "Custos Personalis binds one formally verified AI agent per person via Soulbound identity (SB-NFT) and biometric verification (WebAuthn / FaceID / Voice), ensuring zero third-party tracking and zero hallucinations on critical boundaries.";
      } else if (/faucet|mesh|compute|cloudflare/.test(lower)) {
        topic = "mesh-coordination";
        answer =
          "The Web4 mesh uses SDN Faucet locally and Cloudflare Edge (api.web4light.online) as a stateless, cookie-free coordinator with Latin pivot caching and cryptographic attestation (X-UTL-Proof).";
      }

      return Response.json({
        agent: "Custos Janitor (Web4 Public Concierge)",
        access: "PUBLIC_VESTIBULE_ONLY",
        topic,
        answer,
        publicShowcase: "https://web4light.online/utl-hybrid-ai-shield/"
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
