-- ============================================================
--  Utl_Shield.Hybrid_Guard — Implementace směrovače a zámku
-- ============================================================
pragma SPARK_Mode (On);

package body Utl_Shield.Hybrid_Guard is

   procedure Init_Guard
     (State    : out Guard_State;
      Platform : in  Target_Platform)
   is
   begin
      State :=
        (Identity_Verified => False,
         Crypto_Strength   => 0,
         Active_Platform   => Platform,
         Offline_Mode      => False,
         Verified_Fields   => 0);
   end Init_Guard;

   procedure Verify_Crypto_Identity
     (State      : in out Guard_State;
      Token_Bits : in     Auth_Strength;
      Verified   :    out Boolean)
   is
   begin
      if Token_Bits >= Min_Auth_Token_Strength then
         State.Identity_Verified := True;
         State.Crypto_Strength   := Token_Bits;
         Verified                := True;
      else
         State.Identity_Verified := False;
         State.Crypto_Strength   := 0;
         Verified                := False;
      end if;
   end Verify_Crypto_Identity;

   procedure Decide_Form_Field_Route
     (State       : in out Guard_State;
      Sensitivity : in     Sensitivity_Level;
      Chars       : in     Field_Length;
      Route       :    out Inference_Route)
   is
   begin
      if Sensitivity = Level_Sensitive_PII and then not State.Identity_Verified then
         Route := Route_Blocked;
         return;
      end if;

      State.Verified_Fields := State.Verified_Fields + 1;

      if Sensitivity = Level_Sensitive_PII then
         Route := Route_On_Device_Only;
      elsif State.Offline_Mode then
         Route := Route_On_Device_Only;
      elsif Chars <= Max_On_Device_Chars then
         Route := Route_Hybrid_Prefer_Local;
      else
         Route := Route_Cloud_Fallback;
      end if;
   end Decide_Form_Field_Route;

end Utl_Shield.Hybrid_Guard;
