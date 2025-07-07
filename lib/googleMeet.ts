"server-only";

import React from "react";
import { Resend } from "resend";
import config from "./config";
import MeetingPurchase from "@/templates/meetingPurchase";
import ky from "ky";
import { v4 as uuid } from "uuid";
import { JWT } from "google-auth-library";
import { z } from "zod";
import { db } from "./firebase";
import { MeetingSchema } from "@/components/MeetingForm";

const resend = new Resend(config.RESEND_API_KEY);

type MeetingTime = { start: string; end: string };

export async function generateMeet(data: string): Promise<void> {
  try {
    const formData = JSON.parse(data) as z.infer<typeof MeetingSchema>;
    const dob = new Date(formData.dob);
    const meetingTime = formatDateProps(dob, formData.hours);

    const participants = ["ricardocr987@gmail.com", formData.senderEmail];
    const requestId = uuid();
    const token = await getAccessToken();

    await db
      .collection(`meeting`)
      .doc(requestId)
      .set({
        ...formData,
        dob: dob.getTime(),
        timestamp: new Date().getTime(),
      });

    // Create event without attendees to avoid domain-wide delegation issue
    const response = await ky
      .post(
        `https://www.googleapis.com/calendar/v3/calendars/${config.GOOGLE_MEET.calendarId}/events`,
        {
          json: {
            summary: "Meeting with Ricardo",
            requestId,
            description: "Google Meet Link",
            start: { dateTime: meetingTime.start, timeZone: "Europe/Madrid" },
            end: { dateTime: meetingTime.end, timeZone: "Europe/Madrid" },
            conferenceData: {
              entryPoints: [
                {
                  entryPointType: "video",
                  uri: "https://meet.google.com/",
                  label: "meet.google.com",
                },
              ],
              createRequest: { requestId },
              conferenceSolution: { key: { type: "hangoutsMeet" } },
            },
            //attendees: participants.map((email) => ({ email })),
            reminders: {
              useDefault: false,
              overrides: [
                { method: "email", minutes: 24 * 60 },
                { method: "popup", minutes: 10 },
              ],
            },
          },
          searchParams: {
            sendNotifications: "false", // Set to false since we're not inviting attendees
            conferenceDataVersion: "1",
          },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .json();

    const meet = response as any;
    console.log("Meet response:", JSON.stringify(meet, null, 2));
    
    // Check if we have the required links
    if (!meet.hangoutLink || !meet.htmlLink) {
      console.error("Missing Meet links in response:", meet);
      
      // Notify participants that Meet link will be provided on the meeting day
      await notifyMeetWithoutLink(participants, meetingTime, formData.message);
      return;
    }

    await notifyMeet(participants, meetingTime, meet, formData.message);
  } catch (error: any) {
    console.error("Error creating Google Calendar event:", error);
    
    // Even if Meet creation fails, notify participants
    try {
      const formData = JSON.parse(data) as z.infer<typeof MeetingSchema>;
      const dob = new Date(formData.dob);
      const meetingTime = formatDateProps(dob, formData.hours);
      const participants = ["ricardocr987@gmail.com", formData.senderEmail];
      
      await notifyMeetWithoutLink(participants, meetingTime, formData.message);
    } catch (notifyError) {
      console.error("Failed to notify participants:", notifyError);
    }
  }
}

async function getAccessToken(): Promise<string> {
  const client = new JWT({ ...config.GOOGLE_MEET.auth });

  const credentials = await client.authorize();
  if (!credentials.access_token) {
    throw new Error("Failed to obtain access token");
  }

  return credentials.access_token;
}

async function notifyMeet(
  participants: string[],
  meetingTime: MeetingTime,
  meet: any,
  note: string | undefined,
): Promise<void> {
  const message = createMailMessage(
    meetingTime,
    meet.hangoutLink,
    meet.htmlLink,
    note,
    participants,
  );

  for (const to of participants) {
    await resend.emails.send({
      from: "Contact Form <contact@riki.bio>",
      to,
      subject: "Meeting with Ricardo",
      react: React.createElement(MeetingPurchase, { message }),
    });
  }
}

async function notifyMeetWithoutLink(
  participants: string[],
  meetingTime: MeetingTime,
  note: string | undefined,
): Promise<void> {
  const message = createMailMessageWithoutLink(
    meetingTime,
    note,
    participants,
  );

  for (const to of participants) {
    await resend.emails.send({
      from: "Contact Form <contact@riki.bio>",
      to,
      subject: "Meeting with Ricardo",
      react: React.createElement(MeetingPurchase, { message }),
    });
  }
}

function createMailMessage(
  meetingTime: MeetingTime,
  meetLink: string,
  htmlLink: string,
  note: string | undefined,
  participants: string[],
): string {
  const formattedStartTime = new Date(meetingTime.start).toLocaleString();
  const formattedEndTime = new Date(meetingTime.end).toLocaleString();
  const messageIntro = `Hello,<br><br>You have successfully purchased a meeting with me.<br><br>`;
  const meetingDetails = `
        <strong>Meeting Start Time:</strong> ${formattedStartTime}<br>
        <strong>Meeting End Time:</strong> ${formattedEndTime}<br>
        <strong>Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a><br>
        <strong>Google Calendar Event Link:</strong> <a href="${htmlLink}">${htmlLink}</a><br><br>`;
  const messageOutro = `Accept the calendar event or click the link above at the scheduled time to join the meeting.`;
  const messageNote = note ? `<br><br><strong>Note:</strong> ${note}` : "";
  const participantsMessage = participants.map((participant) => `<br><strong>Participant:</strong> ${participant}`).join("");
  return `<p style="font-size: 16px; line-height: 1.5;">${messageIntro}${meetingDetails}${messageOutro}${messageNote}${participantsMessage}</p>`;
}

function createMailMessageWithoutLink(
  meetingTime: MeetingTime,
  note: string | undefined,
  participants: string[],
): string {
  const formattedStartTime = new Date(meetingTime.start).toLocaleString();
  const formattedEndTime = new Date(meetingTime.end).toLocaleString();
  const messageIntro = `Hello,<br><br>You have successfully purchased a meeting with me.<br><br>`;
  const meetingDetails = `
        <strong>Meeting Start Time:</strong> ${formattedStartTime}<br>
        <strong>Meeting End Time:</strong> ${formattedEndTime}<br>
        <strong>Meeting Link:</strong> Will be provided on the day of the meeting<br><br>`;
  const messageOutro = `The Google Meet link will be sent to you on the day of the meeting. Please check your email for the meeting link.`;
  const messageNote = note ? `<br><br><strong>Note:</strong> ${note}` : "";
  const participantsMessage = participants.map((participant) => `<br><strong>Participant:</strong> ${participant}`).join("");
  return `<p style="font-size: 16px; line-height: 1.5;">${messageIntro}${meetingDetails}${messageOutro}${messageNote}${participantsMessage}</p>`;
}

export function formatDateProps(
  dob: Date,
  hours: string[],
): {
  start: string;
  end: string;
} {
  const dateProps = {
    year: dob.getFullYear(),
    month: dob.getMonth() + 1,
    day: dob.getDate(),
  };
  if (!dateProps.year || !dateProps.month || !hours.length) {
    throw new Error("Invalid DateProps");
  }

  const day = dateProps.day || 1;
  const formattedDate = `${dateProps.year}-${String(dateProps.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const [startHour, startMinute] = hours[0].split(":").map(Number);

  let endHour = startHour + hours.length;
  let endMinute = startMinute;

  return {
    start: `${formattedDate}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`,
    end: `${formattedDate}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`,
  };
}
