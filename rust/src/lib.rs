//! Kryptografické a směrovací jádro UTL Hybrid AI Shield.
//! Poskytuje 1:1 přepis formálně ověřeného Ada/SPARK modulu `Utl_Shield.Hybrid_Guard`,
//! lehký SHA-256 výpočet pro kryptografický otisk formuláře a volitelný C-ABI most `gnat_ffi`.

pub const MAX_FIELD_LENGTH: usize = 65_536;
pub const MAX_ON_DEVICE_CHARS: usize = 4_000;
pub const MIN_AUTH_TOKEN_STRENGTH: u16 = 256;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SensitivityLevel {
    Public = 0,
    Contextual = 1,
    SensitivePii = 2,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InferenceRoute {
    Blocked = 0,
    OnDeviceOnly = 1,
    HybridPreferLocal = 2,
    CloudFallback = 3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TargetPlatform {
    WebChromeNano = 0,
    IosAppleFm = 1,
    AndroidGeminiNano = 2,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GuardState {
    pub identity_verified: bool,
    pub crypto_strength: u16,
    pub active_platform: TargetPlatform,
    pub offline_mode: bool,
    pub verified_fields: u64,
}

impl GuardState {
    pub fn init(platform: TargetPlatform) -> Self {
        Self {
            identity_verified: false,
            crypto_strength: 0,
            active_platform: platform,
            offline_mode: false,
            verified_fields: 0,
        }
    }

    pub fn verify_crypto_identity(&mut self, token_bits: u16, signature_hex: &str) -> bool {
        let valid_sig = signature_hex.len() >= 64
            && signature_hex.bytes().all(|b| b.is_ascii_hexdigit());
        if token_bits >= MIN_AUTH_TOKEN_STRENGTH && valid_sig {
            self.identity_verified = true;
            self.crypto_strength = token_bits.min(4096);
            true
        } else {
            self.identity_verified = false;
            self.crypto_strength = 0;
            false
        }
    }

    pub fn decide_form_field_route(
        &mut self,
        sensitivity: SensitivityLevel,
        chars: usize,
    ) -> InferenceRoute {
        if sensitivity == SensitivityLevel::SensitivePii && !self.identity_verified {
            return InferenceRoute::Blocked;
        }
        self.verified_fields = self.verified_fields.saturating_add(1);
        if sensitivity == SensitivityLevel::SensitivePii || self.offline_mode {
            InferenceRoute::OnDeviceOnly
        } else if chars <= MAX_ON_DEVICE_CHARS {
            InferenceRoute::HybridPreferLocal
        } else {
            InferenceRoute::CloudFallback
        }
    }
}

/// Čistá `std` implementace SHA-256 pro kryptografický otisk přeloženého dotazníku.
pub fn sha256_hex(data: &[u8]) -> String {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    let mut h: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    let bit_len = (data.len() as u64) * 8;
    let mut msg = data.to_vec();
    msg.push(0x80);
    while (msg.len() % 64) != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());

    for chunk in msg.chunks_exact(64) {
        let mut w = [0u32; 64];
        for i in 0..16 {
            w[i] = u32::from_be_bytes([chunk[4 * i], chunk[4 * i + 1], chunk[4 * i + 2], chunk[4 * i + 3]]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16].wrapping_add(s0).wrapping_add(w[i - 7]).wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh] = h;
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ ((!e) & g);
            let t1 = hh.wrapping_add(s1).wrapping_add(ch).wrapping_add(K[i]).wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(t1);
            d = c;
            c = b;
            b = a;
            a = t1.wrapping_add(t2);
        }
        for (slot, val) in h.iter_mut().zip([a, b, c, d, e, f, g, hh]) {
            *slot = slot.wrapping_add(val);
        }
    }

    let mut out = String::with_capacity(64);
    for word in h {
        out.push_str(&format!("{word:08x}"));
    }
    out
}

/// C-ABI vazba na Ada/SPARK knihovnu `Utl_Shield.C_ABI`
#[cfg(feature = "gnat_ffi")]
pub mod gnat_ffi {
    use core::ffi::c_int;

    extern "C" {
        pub fn utl_init_guard(platform_code: c_int);
        pub fn utl_verify_identity(token_bits: c_int, verified: *mut c_int);
        pub fn utl_decide_route(
            sensitivity_code: c_int,
            chars: c_int,
            offline_flag: c_int,
            route_code: *mut c_int,
        );
    }
}
