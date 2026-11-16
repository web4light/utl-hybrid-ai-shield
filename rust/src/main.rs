use utl_hybrid_shield_core::{
    GuardState, InferenceRoute, SensitivityLevel, TargetPlatform, sha256_hex,
};

fn main() {
    let mut guard = GuardState::init(TargetPlatform::WebChromeNano);

    // 1. Nepodepsané citlivé PII pole musí být zablokováno
    assert_eq!(
        guard.decide_form_field_route(SensitivityLevel::SensitivePii, 120),
        InferenceRoute::Blocked
    );

    // 2. Kryptografické ověření 256bitovým podpisem
    let proof = sha256_hex(b"webauthn:device:a19-pro:challenge-2026");
    assert!(guard.verify_crypto_identity(256, &proof));

    // 3. Po ověření smí citlivé PII pole výhradně on-device
    assert_eq!(
        guard.decide_form_field_route(SensitivityLevel::SensitivePii, 120),
        InferenceRoute::OnDeviceOnly
    );

    // 4. Dlouhý obecný popis projektu přejde na Cloud Fallback
    assert_eq!(
        guard.decide_form_field_route(SensitivityLevel::Public, 5200),
        InferenceRoute::CloudFallback
    );

    println!("[UTL Hybrid AI Shield Core] Všechny kryptografické a směrovací kontroly prošly.");
    println!("[UTL Proof SHA-256] {proof}");
}
