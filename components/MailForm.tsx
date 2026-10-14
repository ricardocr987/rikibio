"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { sendEmail } from "@/actions/sendEmail";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  senderEmail: z.string().email("Invalid email address."),
  message: z
    .string()
    .min(1, "Message is required.")
    .max(5000, "Message is too long."),
});

type FormSchema = z.infer<typeof formSchema>;

export function MailForm() {
  const { toast } = useToast();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderEmail: "",
      message: "",
    },
  });

  const handleSubmit = async (data: FormSchema) => {
    const formData = new FormData();
    formData.append("senderEmail", data.senderEmail);
    formData.append("message", data.message);

    const { error } = await sendEmail(formData, "ricardocr987@gmail.com");

    if (error) {
      toast({ title: error });
      return;
    }

    toast({ title: "Email sent successfully!" });
  };

  return (
    <section className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-full md:w-[400px] min-h-[420px] bg-ink-raised/80 backdrop-blur border border-line rounded-2xl pt-6 pb-4 px-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5 flex flex-col text-paper w-full"
          >
            <FormField
              control={form.control}
              name="senderEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your email"
                      {...field}
                      className="w-full bg-ink-sunk text-paper placeholder:text-paper-dim/60 border-line focus-visible:ring-1 focus-visible:ring-signal focus-visible:ring-offset-0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your message"
                      {...field}
                      className="w-full h-40 bg-ink-sunk text-paper placeholder:text-paper-dim/60 border-line focus-visible:ring-1 focus-visible:ring-signal focus-visible:ring-offset-0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="flex-1 bg-signal text-ink font-medium rounded-full hover:bg-signal/90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Send Message
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
