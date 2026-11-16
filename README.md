# UTL Hybrid AI Shield

Cross-platform multilingual form/questionnaire translator and cryptographic PII guard built for **#BuildHybridAI 2026**, powered by **Firebase AI Logic (Hybrid Inference SDK)**, **Ada/SPARK 2022 (Platinum / Level 4)**, and **Rust**.

**Live Web Demo:** https://web4light.online/utl-hybrid-ai-shield/

## Why Hybrid AI?

When filling out foreign-language questionnaires, forms, or registrations, users face two conflicting needs:
1. **Strict Privacy for PII:** Personal identity fields (legal name, government ID, address, medical/financial inputs) must **never** leave the user's device.
2. **High-Quality Long-Form Translation:** Complex multi-paragraph answers and technical proposals benefit from cloud-scale reasoning when local context limits are exceeded.

**UTL Hybrid AI Shield** solves both through a single hybrid architecture verified at **Ada/SPARK Level 4**:
- **Unsigned Sensitive PII** → `Route_Blocked` (mathematically prevented before inference).
- **Verified Sensitive PII / Offline Mode** → `Route_On_Device_Only` (runs exclusively locally on Chrome Gemini Nano, iOS Apple Foundation Models, or Android Gemini Nano).
- **Short Contextual Fields (`<= 4,000` chars)** → `Route_Hybrid_Prefer_Local` via Firebase AI Logic `PREFER_ON_DEVICE`.
- **Long Essays (`> 4,000` chars)** → `Route_Cloud_Fallback` via Firebase AI Logic (Gemini Flash).

## Multi-Platform Architecture

1. **Web Studio (`web/`):**
   - Uses **Firebase AI Logic** (`getAI`, `getGenerativeModel` with `mode: 'prefer_on_device'`), Chrome Built-in AI fallback, **WebCrypto ECDSA P-256** identity verification, and SHA-256 cryptographic form attestation.
2. **Chrome Extension (`extension/`):**
   - Manifest V3 content script that scans active web `<form>` elements, classifies PII fields, and highlights `On_Device_Only` vs. `Hybrid_Prefer_Local` inputs in real time.
3. **iOS & Android (`mobile/`):**
   - **iOS (`mobile/ios/UtlHybridFormAgent.swift`):** On-device inference via **Apple Foundation Models** (`LanguageModelSession` on A19 Pro) + `CryptoKit` P-256 hardware-backed identity signing.
   - **Flutter (`mobile/flutter/`):** Cross-platform client integrating `firebase_ai`, `firebase_app_check`, `firebase_remote_config`, and `cloud_firestore`.
4. **Formal Verification & Native Core (`spark/` & `rust/`):**
   - **Ada/SPARK 2022 (`spark/`):** `Utl_Shield.Hybrid_Guard` + C-ABI FFI bridge (`Utl_Shield.C_ABI`). Verified with `gnatprove --level=4`: **16/16 checks proved (9 Flow + 7 CVC5), 0 unproved, 0 `pragma Assume`**.
   - **Rust (`rust/`):** Zero-dependency core implementing SHA-256 form digests, routing parity, and `gnat_ffi` bindings.

## Quick Verification

### Ada/SPARK Level 4 (Platinum)
```sh
cd spark
gnatprove -P utl_hybrid_shield.gpr --level=4
```

### Rust Core
```sh
cd rust
cargo test
cargo check --features gnat_ffi
```

### Local Web Demo
```sh
npx serve web
```

## License
GNU General Public License v3.0 ([LICENSE](LICENSE))
