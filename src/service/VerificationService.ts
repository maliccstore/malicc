import TwilioService from "./TwilioService";
import { randomInt } from "crypto";
import { Service } from "typedi";

@Service()
export class VerificationService {
  private verificationCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();
  private CODE_EXPIRATION_MINUTES = 15;

  constructor() {}
  async generateAndSendVerificationCode(phoneNumber: string): Promise<boolean> {
    try {
      // Six digit verification code
      const verificationCode = randomInt(100000, 999999).toString();

      // Store the code with expiration

      const expiresAt = new Date();

      expiresAt.setMinutes(
        expiresAt.getMinutes() + this.CODE_EXPIRATION_MINUTES
      );

      this.verificationCodes.set(phoneNumber, {
        code: verificationCode,
        expiresAt,
      });

      // Send the code via SMS

      await TwilioService.sendVerificationSms(phoneNumber, verificationCode);

      // return verificationCode;
      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const record = this.verificationCodes.get(phoneNumber);

    if (!record) {
      return false;
    }

    // check if code isn't expired
    const isValid = record.code === code && new Date() < record.expiresAt;

    // Delete the code either ways

    this.verificationCodes.delete(phoneNumber);

    return isValid;
  }
}
