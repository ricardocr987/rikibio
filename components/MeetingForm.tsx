"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, isSameDay, isWeekend } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "./ui/textarea";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { toast } from "./ui/use-toast";
import { useState } from "react";
import { createBooking } from "@/actions/booking";
import type { Meetings } from "@/lib/availability";
import React from "react";

export const MeetingSchema = z.object({
  senderEmail: z.string().email("Invalid email address."),
  dob: z.date({ required_error: "A date is required." }),
  hours: z.array(z.string()).nonempty("Please select at least one hour."),
  message: z.string().optional(),
});

type DatePickerProps = {
  firstDate: string;
  meetings: Meetings;
};

// Payment (Stripe checkout + Solana wallet) is on hold for now — booking is
// free, straight through actions/booking/createBooking.ts. Both payment
// paths are left intact in actions/stripe, actions/solana, contexts/, and
// components/{WalletPicker,TokenPicker}.tsx for whenever payment comes back;
// this form just doesn't wire them in.
export function MeetingForm({ firstDate, meetings }: DatePickerProps) {
  const form = useForm<z.infer<typeof MeetingSchema>>({
    resolver: zodResolver(MeetingSchema),
    defaultValues: {
      senderEmail: "",
      dob: new Date(firstDate), // Default to first available date
      hours: [],
      message: "",
    },
  });

  const selectedDate = form.watch("dob");
  const firstAvailableDate = new Date(firstDate);

  // If the selected date is before the first available date, update it
  React.useEffect(() => {
    if (selectedDate < firstAvailableDate) {
      form.setValue("dob", firstAvailableDate);
    }
  }, [selectedDate, firstAvailableDate, form]);

  const filteredHours = filterAvailableHours(selectedDate, meetings);
  function filterAvailableHours(date: Date, meetings: Meetings) {
    const baseHours = ["16:00", "17:00", "18:00", "19:00"];
    return baseHours.filter((hour) => {
      return !Object.keys(meetings).some((meetingDate) => {
        const meetingDateObj = new Date(meetingDate);
        return (
          isSameDay(meetingDateObj, date) &&
          meetings[meetingDate].includes(hour)
        );
      });
    });
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: z.infer<typeof MeetingSchema>) {
    setIsSubmitting(true);
    try {
      const result = await createBooking(
        JSON.stringify({ ...data, dob: data.dob.toISOString() }),
      );
      if (result.ok) {
        toast({ title: "Meeting booked!", description: "Check your email for the details." });
        form.reset();
      } else {
        toast({ title: result.error || "Booking failed." });
      }
    } catch (error: any) {
      toast({ title: error.message || "Booking failed." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-full md:w-[400px] min-h-[420px] bg-ink-raised/80 backdrop-blur border border-line rounded-2xl p-6">
        <Form {...form}>
          <form className="space-y-4 flex flex-col text-paper w-full">
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
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Select a date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-ink-sunk text-paper border-line hover:bg-ink-sunk hover:text-paper focus-visible:ring-1 focus-visible:ring-signal focus-visible:ring-offset-0",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-ink-raised border-line text-paper" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        defaultMonth={field.value || new Date(firstDate)}
                        fromDate={new Date(firstDate)}
                        disabled={(date) =>
                          date < new Date(firstDate) ||
                          isWeekend(date) ||
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                        numberOfMonths={1}
                        showOutsideDays={false}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select hours (CET Timezone)</FormLabel>
                  <FormControl>
                    {filteredHours.length > 0 ? (
                      <ToggleGroup
                        type="multiple"
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        className="flex w-full max-w-full justify-between gap-4"
                      >
                        {filteredHours.map((hour) => (
                          <ToggleGroupItem
                            key={hour}
                            value={hour}
                            data-state={field.value.includes(hour) ? "on" : "off"}
                            className="flex-1 min-w-0 px-4 py-2 rounded-md font-mono text-sm transition-colors duration-200 border border-line data-[state=on]:border-signal data-[state=on]:bg-signal data-[state=on]:text-ink data-[state=off]:bg-ink-sunk data-[state=off]:text-paper data-[state=off]:hover:border-paper-dim data-[state=off]:hover:bg-ink-sunk data-[state=off]:hover:text-paper focus-visible:ring-1 focus-visible:ring-signal"
                          >
                            {hour}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    ) : (
                      <p>No available hours for the selected date.</p>
                    )}
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
                      className="w-full bg-ink-sunk text-paper placeholder:text-paper-dim/60 border-line focus-visible:ring-1 focus-visible:ring-signal focus-visible:ring-offset-0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full bg-signal text-ink font-medium rounded-full hover:bg-signal/90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              {isSubmitting ? "Booking..." : "Book Meeting"}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
