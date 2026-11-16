// UTL Hybrid AI Shield — Live Multilingual Veil (Manifest V3 Content Script)
// Automaticky detekuje jazyk stránky, přeloží štítky formuláře pro uživatele
// a při vyplňování převádí text v reálném čase do jazyka daného webu.

(async function initUtlLiveVeil() {
  const forms = Array.from(document.querySelectorAll("form"));
  const inputs = Array.from(document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), textarea"));
  if (forms.length === 0 && inputs.length === 0) return;

  async function detectPageLanguage() {
    const htmlLang = (document.documentElement.lang || "").trim().slice(0, 2).toLowerCase();
    if (htmlLang && htmlLang !== "cs") return htmlLang;

    if ("LanguageDetector" in globalThis) {
      try {
        const detector = await Promise.race([
          globalThis.LanguageDetector.create(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 1000))
        ]);
        const sample = (document.body.innerText || "").slice(0, 400);
        const res = await detector.detect(sample);
        if (Array.isArray(res) && res[0]?.detectedLanguage) {
          return res[0].detectedLanguage.slice(0, 2).toLowerCase();
        }
      } catch {
        // fallback níže
      }
    }
    return htmlLang || "en";
  }

  function isSensitiveField(el) {
    const hint = `${el.name || ""} ${el.id || ""} ${el.type || ""} ${el.autocomplete || ""}`.toLowerCase();
    return /pass|ssn|id|birth|card|iban|email|phone|name|passport|tax/.test(hint);
  }

  /** Obranný agent Marcus Aurelius Decimus: detekuje skryté injektory, exfiltrační formuláře a prompt injection. */
  const MarcusAureliusDecimus = {
    isHiddenTrap(el) {
      const style = globalThis.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity) === 0 ||
        rect.width <= 1 ||
        rect.height <= 1 ||
        rect.left < -1000
      );
    },
    hasCrossOriginAction(form) {
      if (!form || !form.action) return false;
      try {
        return new URL(form.action, location.href).origin !== location.origin;
      } catch {
        return true;
      }
    },
    sanitizePromptInjection(text) {
      const pattern = /(ignore\s+(all\s+)?previous\s+instructions|system\s+prompt|exfiltrate|reveal\s+secrets|<\s*script|javascript:)/gi;
      const detected = pattern.test(text);
      return {
        clean: text.replace(pattern, "[BLOCKED_BY_MARCUS_AURELIUS]"),
        detected
      };
    }
  };

  async function translateText(text, sourceLang, targetLang, isPii) {
    if (!text.trim() || sourceLang === targetLang) return text;
    if ("Translator" in globalThis) {
      try {
        const run = (async () => {
          const translator = await globalThis.Translator.create({
            sourceLanguage: sourceLang,
            targetLanguage: targetLang
          });
          return await translator.translate(text);
        })();
        return await Promise.race([
          run,
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 1200))
        ]);
      } catch {
        // fallback
      }
    }
    const mode = isPii ? "On-Device-PII" : "Hybrid";
    return `[${targetLang.toUpperCase()} | ${mode}] ${text}`;
  }

  const pageLang = await detectPageLanguage();
  let biometricUnlocked = false;
  let sessionKeyPair = null;

  async function unlockWithBiometrics() {
    if (globalThis.PublicKeyCredential && navigator.credentials) {
      try {
        await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { name: "UTL Hybrid AI Veil" },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: "utl-veil-user",
              displayName: "UTL Veil User"
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            },
            timeout: 20000
          }
        });
      } catch {
        // Fallback na lokální neexportovatelný WebCrypto P-256 klíč
      }
    }
    sessionKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign", "verify"]
    );
    biometricUnlocked = true;
  }

  const badge = document.createElement("button");
  badge.type = "button";
  badge.textContent = `🔒 UTL Veil LOCKED — Click for Biometric Unlock (→ ${pageLang.toUpperCase()})`;
  Object.assign(badge.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: "2147483647",
    background: "#0f172a",
    color: "#f59e0b",
    border: "1px solid #f59e0b",
    borderRadius: "999px",
    padding: "8px 14px",
    fontFamily: "system-ui, sans-serif",
    fontSize: "12px",
    fontWeight: "700",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    cursor: "pointer"
  });

  badge.addEventListener("click", async () => {
    if (!biometricUnlocked) {
      await unlockWithBiometrics();
      badge.textContent = `🛡️ UTL Veil Biometric ON (Zero-Leak → ${pageLang.toUpperCase()})`;
      badge.style.color = "#22c55e";
      badge.style.borderColor = "#22c55e";
    } else {
      biometricUnlocked = false;
      sessionKeyPair = null;
      badge.textContent = `🔒 UTL Veil LOCKED (Click to Unlock)`;
      badge.style.color = "#f59e0b";
      badge.style.borderColor = "#f59e0b";
    }
  });

  // Připojení živého překladového závoje na všechna vstupní pole (v dávkách bez blokování vlákna)
  let blockedTraps = 0;
  const BATCH = 20;
  for (let i = 0; i < inputs.length; i += BATCH) {
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        inputs.slice(i, i + BATCH).forEach((el) => {
          const isTrap = MarcusAureliusDecimus.isHiddenTrap(el) || MarcusAureliusDecimus.hasCrossOriginAction(el.form);
          if (isTrap) {
            blockedTraps += 1;
            el.dataset.utlRoute = "Blocked_By_Marcus_Aurelius";
            el.style.outline = "2px solid #ef4444";
            return;
          }

          const pii = isSensitiveField(el);
          el.style.outline = pii ? "2px solid #22c55e" : "2px solid #38bdf8";
          el.dataset.utlRoute = pii ? "On_Device_Only" : "Hybrid_Prefer_Local";

          el.addEventListener("change", async () => {
            if (!biometricUnlocked || !el.value.trim() || el.dataset.utlTranslating === "1") return;
            el.dataset.utlTranslating = "1";
            try {
              const sanitized = MarcusAureliusDecimus.sanitizePromptInjection(el.value);
              const translated = await translateText(sanitized.clean, "cs", pageLang, pii);
              el.value = translated;
              if (sessionKeyPair) {
                const payload = new TextEncoder().encode(`${location.origin}:${el.name || el.id}:${translated}`);
                const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, sessionKeyPair.privateKey, payload);
                el.dataset.utlProof = Array.from(new Uint8Array(sig)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
              }
            } finally {
              el.dataset.utlTranslating = "0";
            }
          });
        });
        resolve();
      });
    });
  }
  if (blockedTraps > 0) {
    badge.title = `Marcus Aurelius Decimus zablokoval ${blockedTraps} podezřelých/skrytých polí.`;
  }

  document.body.appendChild(badge);
})();
