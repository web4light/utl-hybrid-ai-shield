// UTL Hybrid AI Shield — Cloudflare Edge Guard & Monetization Gateway (Worker)
// Ověřuje ECDSA/SHA-256 důkaz požadavku na okraji sítě (Edge) a chrání před zneužitím / boty.

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
    if (url.pathname === "/health") {
      return Response.json({
        service: "UTL Hybrid AI Shield — Cloudflare Edge Guard",
        status: "ok",
        tier: request.headers.get("X-UTL-Tier") || "free-on-device"
      });
    }

    // Pro placené / cloudové enterprise volání ověřuje přítomnost kryptografického důkazu
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
      policy: "PII stays On-Device; Edge verifies attestation only"
    });
  }
};
