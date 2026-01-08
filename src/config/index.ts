import { config } from "dotenv";
import path from "path";

// Load environment variables based on NODE_ENV
const envPath = path.resolve(
  __dirname,
  `../../.env.${process.env.NODE_ENV || "development"}`
);

config({ path: envPath });

interface AppConfig {
  NODE_ENV: string;
  PORT: number;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  // Twilio
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
  TWILIO_API_SID?: string;
  TWILIO_API_SECRET?: string;

  // JWT
  JWT_SECRET: string;
}

// Validate required environment variables
const isTwilioDisabled = process.env.TWILIO_DISABLED === "true";

const requiredVars = [
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
];

if (!isTwilioDisabled) {
  requiredVars.push(
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER"
  );
}

requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const appConfig: AppConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),

  DB_HOST: process.env.DB_HOST!,
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: process.env.DB_NAME!,
  DB_USER: process.env.DB_USER!,
  DB_PASSWORD: process.env.DB_PASSWORD!,

  JWT_SECRET: process.env.JWT_SECRET!,

  ...(isTwilioDisabled
    ? {}
    : {
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
        TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID!,
        TWILIO_API_SID: process.env.TWILIO_API_SID!,
        TWILIO_API_SECRET: process.env.TWILIO_API_SECRET!,
      }),
};

export default appConfig;
