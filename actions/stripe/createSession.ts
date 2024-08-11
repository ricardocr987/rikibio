"use server";

import { MeetingSchema } from "@/components/MeetingForm";
import config from "@/lib/config";
import { z } from "zod";

export const createSession = async (data: string) => {
  const formData = JSON.parse(data) as z.infer<typeof MeetingSchema>;
  const session = await config.stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: formData.senderEmail,
    customer_creation: "always",
    line_items: [
      {
        price: config.PRICE_ID,
        quantity: formData.hours.length,
      },
    ],
    metadata: {
      data,
    },
  });

  return {
    id: session.id,
    client_secret: session.client_secret || "",
  };
};
