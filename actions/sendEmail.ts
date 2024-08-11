"use server";

import React from "react";
import { Resend } from "resend";
import ContactFormEmail from "@/templates/contactForm";
import config from "@/lib/config";
import { z } from "zod";

const resend = new Resend(config.RESEND_API_KEY);

const formSchema = z.object({
  senderEmail: z.string().email({ message: "Invalid email address" }),
  message: z.string().max(5000, { message: "Message is too long" }),
});

export const sendEmail = async (
  formData: FormData,
  to: string,
): Promise<{ data?: any; error?: string }> => {
  const senderEmail = formData.get("senderEmail");
  const message = formData.get("message");

  const validationResult = formSchema.safeParse({ senderEmail, message });

  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  try {
    const data = await resend.emails.send({
      from: "Contact Form <contact@riki.bio>",
      to,
      subject: "Message from contact form",
      reply_to: senderEmail as string,
      react: React.createElement(ContactFormEmail, {
        message: message as string,
        senderEmail: senderEmail as string,
      }),
    });

    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
