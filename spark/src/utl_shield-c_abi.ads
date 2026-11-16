-- ============================================================
--  Utl_Shield.C_ABI — C-ABI / Rust FFI exporty
-- ============================================================
pragma SPARK_Mode (On);

with Interfaces.C;
with Utl_Shield.Hybrid_Guard;

package Utl_Shield.C_ABI is

   use type Utl_Shield.Hybrid_Guard.Auth_Strength;

   Global_Guard : Utl_Shield.Hybrid_Guard.Guard_State;

   procedure Utl_Init_Guard (Platform_Code : in Interfaces.C.int)
     with Export, Convention => C, External_Name => "utl_init_guard",
          Global => (Output => Global_Guard);

   procedure Utl_Verify_Identity
     (Token_Bits : in  Interfaces.C.int;
      Verified   : out Interfaces.C.int)
     with Export, Convention => C, External_Name => "utl_verify_identity",
          Global => (In_Out => Global_Guard);

   procedure Utl_Decide_Route
     (Sensitivity_Code : in  Interfaces.C.int;
      Chars            : in  Interfaces.C.int;
      Offline_Flag     : in  Interfaces.C.int;
      Route_Code       : out Interfaces.C.int)
     with Export, Convention => C, External_Name => "utl_decide_route",
          Global => (In_Out => Global_Guard);

end Utl_Shield.C_ABI;
