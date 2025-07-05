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
    <Tabs className="flex flex-col items-center justify-center w-full" defaultValue="meeting">
      <TabsList className="bg-[#23232b] rounded-lg shadow p-1 flex space-x-2 mb-4">
        <TabsTrigger value="meeting" className="data-[state=active]:bg-[#18181b] data-[state=active]:text-blue-400 text-gray-200 px-4 py-2 rounded-md transition-colors">Book Meeting</TabsTrigger>
        <TabsTrigger value="email" className="data-[state=active]:bg-[#18181b] data-[state=active]:text-blue-400 text-gray-200 px-4 py-2 rounded-md transition-colors">Send Email</TabsTrigger>
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
