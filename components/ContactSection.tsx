"use client";

import { MeetingForm } from "./MeetingForm";
import { MailForm } from "./MailForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Meetings } from "@/app/page";

type ContactSectionProps = {
  firstDate: string;
  meetings: Meetings;
};

export function ContactSection({ firstDate, meetings }: ContactSectionProps) {
  return (
    <Tabs className="flex flex-col items-center justify-center">
      <TabsList>
        <TabsTrigger value="meeting">Book Meeting</TabsTrigger>
        <TabsTrigger value="email">Send Email</TabsTrigger>
      </TabsList>
      <TabsContent value="meeting">
        <MeetingForm firstDate={firstDate} meetings={meetings} />
      </TabsContent>
      <TabsContent value="email">
        <MailForm />
      </TabsContent>
    </Tabs>
  );
}
