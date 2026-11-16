// UTL Hybrid AI Shield — Chrome Extension Content Script (Manifest V3)
// Detekuje formuláře na stránce, označí citlivá PII pole a nabídne obousměrný překlad.

(async function initUtlFormShield() {
  const forms = Array.from(document.querySelectorAll("form"));
  if (forms.length === 0) return;

  const badge = document.createElement("div");
  badge.textContent = `🛡️ UTL Hybrid AI Shield aktivní (${forms.length} formulářů)`;
  Object.assign(badge.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: "2147483647",
    background: "#0f172a",
    color: "#38bdf8",
    border: "1px solid #38bdf8",
    borderRadius: "999px",
    padding: "8px 14px",
    fontFamily: "system-ui, sans-serif",
    fontSize: "12px",
    fontWeight: "700",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    cursor: "pointer"
  });

  badge.addEventListener("click", async () => {
    const inputs = Array.from(document.querySelectorAll("input, textarea"));
    const BATCH = 20;
    for (let i = 0; i < inputs.length; i += BATCH) {
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          inputs.slice(i, i + BATCH).forEach((el) => {
            const nameHint = `${el.name || ""} ${el.id || ""} ${el.type || ""}`.toLowerCase();
            const isPii = /pass|ssn|id|birth|card|iban|email|phone|name/.test(nameHint);
            el.style.outline = isPii ? "2px solid #22c55e" : "2px solid #38bdf8";
            el.dataset.utlRoute = isPii ? "On_Device_Only" : "Hybrid_Prefer_Local";
          });
          resolve();
        });
      });
    }
    badge.textContent = `🛡️ UTL Shield: označeno ${inputs.length} polí (Zelená = On-Device PII)`;
  });

  document.body.appendChild(badge);
})();
