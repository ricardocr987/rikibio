import { Connection } from "@solana/web3.js";
import { loadStripe } from "@stripe/stripe-js";
import { Stripe } from "stripe";

const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "prod";

const STRIPE_SECRET_KEY = isProduction
  ? process.env.STRIPE_LIVE_SECRET_KEY || ""
  : process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PUBLIC_KEY = isProduction
  ? process.env.NEXT_PUBLIC_STRIPE_LIVE || ""
  : process.env.NEXT_PUBLIC_STRIPE || "";

const stripeConfig = {
  PRICE_ID: process.env.PRICE_ID || "",
  stripe: new Stripe(STRIPE_SECRET_KEY),
  stripePromise: loadStripe(STRIPE_PUBLIC_KEY),
};

const googleConfig = {
  GOOGLE_MEET: {
    calendarId: process.env.CALENDAR_ID,
    auth: {
      email: process.env.MEET_MAIL,
      key: process.env.MEET_SECRET
        ? process.env.MEET_SECRET.replace(/\\n/g, "\n")
        : "",
      subject: "contact@riki.bio",
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    },
  },
};

const notionConfig = {
  NOTION_SECRET: process.env.NOTION_SECRET || "",
  NOTION_DB: process.env.NOTION_DB || "",
  NOTION_USER: process.env.NOTION_USER || "",
  NOTION_TOKEN: process.env.NOTION_TOKEN || "",
};

const config = {
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  SOL_RPC: new Connection(
    `https://${process.env.SOL_RPC}` || "https://api.mainnet-beta.solana.com",
    {
      commitment: "confirmed",
      wsEndpoint: `wss://${process.env.SOL_RPC}`,
    },
  ),
  ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || "dev",
  APP_URL: isProduction ? "https://www.riki.bio" : "http://127.0.0.1:3000",
  ...stripeConfig,
  ...googleConfig,
  ...notionConfig,
};

export default config;
