-- ============================================================
--  Utl_Shield.Hybrid_Guard — SPARK 2022 Strážce soukromí
--  Matematicky ověřené směrování formulářů a kryptografický zámek
-- ============================================================
pragma SPARK_Mode (On);

package Utl_Shield.Hybrid_Guard is

   Max_Field_Length        : constant := 65_536;
   Max_On_Device_Chars     : constant := 4_000;
   Min_Auth_Token_Strength : constant := 256;
   Max_Token_Strength      : constant := 4_096;

   subtype Field_Length is Natural range 0 .. Max_Field_Length;
   subtype Auth_Strength is Natural range 0 .. Max_Token_Strength;

   type Sensitivity_Level is
     (Level_Public,
      Level_Contextual,
      Level_Sensitive_PII);

   type Inference_Route is
     (Route_Blocked,
      Route_On_Device_Only,
      Route_Hybrid_Prefer_Local,
      Route_Cloud_Fallback);

   type Target_Platform is
     (Platform_Web_Chrome_Nano,
      Platform_iOS_Apple_FM,
      Platform_Android_Gemini_Nano);

   type Guard_State is record
      Identity_Verified : Boolean         := False;
      Crypto_Strength   : Auth_Strength   := 0;
      Active_Platform   : Target_Platform := Platform_Web_Chrome_Nano;
      Offline_Mode      : Boolean         := False;
      Verified_Fields   : Natural         := 0;
   end record;

   -- Inicializace strážce pro konkrétní cílovou platformu
   procedure Init_Guard
     (State    : out Guard_State;
      Platform : in  Target_Platform)
     with Post => not State.Identity_Verified and then
                  State.Crypto_Strength = 0 and then
                  State.Active_Platform = Platform and then
                  State.Verified_Fields = 0;

   -- Ověření kryptografické síly identity (min. 256 bitů)
   procedure Verify_Crypto_Identity
     (State      : in out Guard_State;
      Token_Bits : in     Auth_Strength;
      Verified   :    out Boolean)
     with Post =>
       (if Token_Bits >= Min_Auth_Token_Strength then
           Verified and then State.Identity_Verified and then State.Crypto_Strength = Token_Bits
        else
           not Verified and then not State.Identity_Verified and then State.Crypto_Strength = 0);

   -- Rozhodnutí o povolené cestě překladu pole dotazníku
   procedure Decide_Form_Field_Route
     (State       : in out Guard_State;
      Sensitivity : in     Sensitivity_Level;
      Chars       : in     Field_Length;
      Route       :    out Inference_Route)
     with
       Pre  => State.Verified_Fields < Natural'Last,
       Post =>
         (if Sensitivity = Level_Sensitive_PII and not State.Identity_Verified then
             Route = Route_Blocked
          elsif Sensitivity = Level_Sensitive_PII and State.Identity_Verified then
             Route = Route_On_Device_Only
          elsif State.Offline_Mode then
             Route = Route_On_Device_Only
          elsif Chars <= Max_On_Device_Chars then
             Route = Route_Hybrid_Prefer_Local
          else
             Route = Route_Cloud_Fallback);

end Utl_Shield.Hybrid_Guard;
