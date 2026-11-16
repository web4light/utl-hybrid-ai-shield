# UTL Hybrid AI Shield

Multiplatformní překladač cizojazyčných dotazníků a formulářů s kryptografickým ověřením totožnosti a formálně verifikovaným strážcem PII dat pro hackathon **#BuildHybridAI 2026**.

## Architektura

1. **Firebase AI Logic (Hybrid Inference SDK):**
   - Preferuje lokální on-device inferenci (`PREFER_ON_DEVICE`) na **Webu (Chrome Gemini Nano)**, **iOS (Apple Foundation Models na A19 Pro)** i **Androidu (Gemini Nano)**.
   - Automaticky přepíná na cloudový **Gemini Flash** u dlouhých textů (`> 4 000` znaků), pokud to bezpečnostní politika povolí.
   - Připraveno pro **Firebase App Check**, **Remote Config** a **Firestore**.
2. **Ada/SPARK 2022 Formální Jádro (`spark/` — Platinum / Level 4):**
   - `Utl_Shield.Hybrid_Guard` + C-ABI most `Utl_Shield.C_ABI`.
   - Matematicky dokazuje (`gnatprove --level=4`), že:
     - Citlivé PII pole bez kryptografického ověření totožnosti (min. 256 bitů) je vždy **zablokováno** (`Route_Blocked`).
     - Citlivé PII pole po ověření smí **výhradně na zařízení** (`Route_On_Device_Only`) — nikdy neopustí zařízení do cloudu.
3. **Rust Kryptografické Jádro (`rust/`):**
   - Bez externích závislostí (`std` only), vlastní SHA-256 otisk formuláře, 1:1 implementace směrovače a FFI vazba (`--features gnat_ffi`).
4. **Web Studio & Chrome Extension (`web/`, `extension/`) + Mobilní vrstva (`mobile/`):**
   - `web/index.html` + `web/hybrid_form_engine.js`: interaktivní české/vícejazyčné studio s WebCrypto ECDSA P-256 podpisem.
   - `extension/`: Manifest V3 rozšíření pro živé označování a překlad formulářů na webu.
   - `mobile/ios/` + `mobile/flutter/`: Swift modul pro Apple Foundation Models (`CryptoKit` P-256) a multiplatformní Flutter klient.

## Rychlé spuštění

### Web demo
Otevři `web/index.html` přes libovolný lokální HTTP server (např. `npx serve web`) a vyzkoušej ověření identity + překlad PII i dlouhých polí.

### Ada/SPARK Level 4 verifikace
```sh
cd spark
gnatprove -P utl_hybrid_shield.gpr --level=4
```

### Rust jádro
```sh
cd rust
cargo check
cargo check --features gnat_ffi
```

## Licence
GNU General Public License v3.0 ([LICENSE](LICENSE))
