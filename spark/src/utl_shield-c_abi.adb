-- ============================================================
--  Utl_Shield.C_ABI — Implementace C-ABI exportů pro Rust
-- ============================================================
pragma SPARK_Mode (On);

package body Utl_Shield.C_ABI is

   use type Interfaces.C.int;
   use Utl_Shield.Hybrid_Guard;

   procedure Utl_Init_Guard (Platform_Code : in Interfaces.C.int) is
      Target : Target_Platform := Platform_Web_Chrome_Nano;
   begin
      if Platform_Code = 1 then
         Target := Platform_iOS_Apple_FM;
      elsif Platform_Code = 2 then
         Target := Platform_Android_Gemini_Nano;
      end if;
      Init_Guard (Global_Guard, Target);
   end Utl_Init_Guard;

   procedure Utl_Verify_Identity
     (Token_Bits : in  Interfaces.C.int;
      Verified   : out Interfaces.C.int)
   is
      Bits : Auth_Strength := 0;
      Ok   : Boolean := False;
   begin
      if Token_Bits >= Interfaces.C.int (Max_Token_Strength) then
         Bits := Max_Token_Strength;
      elsif Token_Bits > 0 then
         Bits := Auth_Strength (Token_Bits);
      end if;

      Verify_Crypto_Identity (Global_Guard, Bits, Ok);
      Verified := (if Ok then 1 else 0);
   end Utl_Verify_Identity;

   procedure Utl_Decide_Route
     (Sensitivity_Code : in  Interfaces.C.int;
      Chars            : in  Interfaces.C.int;
      Offline_Flag     : in  Interfaces.C.int;
      Route_Code       : out Interfaces.C.int)
   is
      Sens      : Sensitivity_Level := Level_Public;
      Safe_Len  : Field_Length := 0;
      Res_Route : Inference_Route := Route_Blocked;
   begin
      if Sensitivity_Code = 1 then
         Sens := Level_Contextual;
      elsif Sensitivity_Code >= 2 then
         Sens := Level_Sensitive_PII;
      end if;

      if Chars >= Interfaces.C.int (Max_Field_Length) then
         Safe_Len := Max_Field_Length;
      elsif Chars > 0 then
         Safe_Len := Field_Length (Chars);
      end if;

      Global_Guard.Offline_Mode := (Offline_Flag /= 0);

      if Global_Guard.Verified_Fields = Natural'Last then
         Global_Guard.Verified_Fields := 0;
      end if;

      Decide_Form_Field_Route (Global_Guard, Sens, Safe_Len, Res_Route);

      case Res_Route is
         when Route_Blocked             => Route_Code := 0;
         when Route_On_Device_Only      => Route_Code := 1;
         when Route_Hybrid_Prefer_Local => Route_Code := 2;
         when Route_Cloud_Fallback      => Route_Code := 3;
      end case;
   end Utl_Decide_Route;

end Utl_Shield.C_ABI;
