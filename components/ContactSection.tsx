"use client";

import { MeetingForm } from "./MeetingForm";
import { MailForm } from "./MailForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Availability } from "@/lib/availability";

type ContactSectionProps = {
  // null when availability couldn't be loaded; only email is offered then
  availability: Availability | null;
};

const triggerClass =
  "flex-1 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-paper-dim transition-colors data-[state=active]:bg-paper data-[state=active]:text-ink";

export function ContactSection({ availability }: ContactSectionProps) {
  return (
    <Tabs
      className="flex w-full flex-col md:w-[400px]"
      defaultValue={availability ? "meeting" : "email"}
    >
      <TabsList className="mb-3 flex h-auto w-full rounded-full border border-line bg-ink-raised/80 p-1">
        {availability && (
          <TabsTrigger value="meeting" className={triggerClass}>
            Book a call
          </TabsTrigger>
        )}
        <TabsTrigger value="email" className={triggerClass}>
          Send email
        </TabsTrigger>
      </TabsList>
      {availability && (
        <TabsContent value="meeting">
          <MeetingForm
            firstDate={availability.firstDate}
            meetings={availability.meetings}
          />
        </TabsContent>
      )}
      <TabsContent value="email">
        <MailForm />
      </TabsContent>
    </Tabs>
  );
}
