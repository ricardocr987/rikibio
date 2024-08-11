"use client";

import { Meetings } from "@/app/page";
import { MeetingForm } from "./MeetingForm";
import { MailContact } from "./MailContact";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContactSectionProps = {
  firstDate: string;
  meetings: Meetings;
};

export function ContactSection({ firstDate, meetings }: ContactSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Tabs defaultValue="meeting" className="w-full md:w-[500px]">
        <TabsList className="flex justify-center">
          <TabsTrigger value="meeting">Book Meeting</TabsTrigger>
          <TabsTrigger value="email">Send Email</TabsTrigger>
        </TabsList>
        <TabsContent value="meeting">
          <MeetingForm firstDate={firstDate} meetings={meetings} />
        </TabsContent>
        <TabsContent value="email">
          <MailContact />
        </TabsContent>
      </Tabs>
    </div>
  );
}
