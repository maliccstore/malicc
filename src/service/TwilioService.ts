import twilio from "twilio";
import dotenv from "dotenv";
import { Service } from "typedi";
dotenv.config();

@Service()
class TwilioService {
  private client: twilio.Twilio | null = null;
  private phoneNumber: string | undefined = undefined;
  private disabled: boolean;
  //private verifyServiceSid: string;

  constructor() {
    this.disabled = process.env.TWILIO_DISABLED === "true";

    if (this.disabled) {
      console.warn("[Twilio] Disabled via environment");
      return;
    }

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
      process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio credentials not configured");
    }

    this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    this.phoneNumber = TWILIO_PHONE_NUMBER;
  }

  async sendVerificationSms(
    to: string,
    verificationCode: string
  ): Promise<{ success: boolean }> {
    if (this.disabled) {
      console.log(`[Twilio disabled] OTP for ${to}: ${verificationCode}`);
      return { success: true };
    }

    if (!this.client) {
      throw new Error("Twilio client not initialized");
    }

    await this.client.messages.create({
      to,
      from: this.phoneNumber!,
      body: `OTP: ${verificationCode}`,
    });

    return { success: true };
  }

  async sendVerificationWithTemplate(
    to: string,
    template: string,
    replacements: Record<string, string>
  ): Promise<void> {
    try {
      await this.client!.messages.create({
        body: this.replaceTemplatePlaceholders(template, replacements),
        from: this.phoneNumber,
        to,
      });
    } catch (error) {
      console.error("Error sending templated verification SMS:", error);
      throw new Error("Failed to send templated verification SMS");
    }
  }

  private replaceTemplatePlaceholders(
    template: string,
    replacements: Record<string, string>
  ): string {
    let message = template;
    for (const [key, value] of Object.entries(replacements)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }
    return message;
  }
}

export default TwilioService;
