import twillo from "twilio";
import dotenv from "dotenv";
import { Service } from "typedi";
dotenv.config();

@Service()
class TwilioService {
  private client: twillo.Twilio;
  private phoneNumber: string;
  //private verifyServiceSid: string;

  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials not configured");
    }

    this.client = twillo(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    //this.verifyServiceSid = process.env.VERIFY_SERVICE_SID!;

    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || "";
  }

  async sendVerificationSms(
    to: string,
    verificationCode: string
  ): Promise<{ success: Boolean }> {
    if (!to) throw new Error("Missing 'to' parameter.");
    try {
      this.client.messages
        .create({
          to: to,
          from: "+16205826350",
          body: `OTP: ${verificationCode}`,
        })
        .then((message) => {
          // Success callback
          console.log("Message sent successfully:", message.sid);
          console.log(`Sent verification: ${verificationCode}`);
        })
        .catch((error) => {
          // Failure callback
          console.error("Error sending message:", error);
        });

      return { success: true };
      // await this.client.messages.create({
      //   body: `Your verification code is: ${verificationCode}`,
      //   // from: this.phoneNumber,
      //   to,
      // });
    } catch (error) {
      console.error("Error sending verification SMS:", error);
      throw new Error("Failed to send verification SMS");
    }
  }
  async sendVerificationWithTemplate(
    to: string,
    template: string,
    replacements: Record<string, string>
  ): Promise<void> {
    try {
      await this.client.messages.create({
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

export default new TwilioService();
