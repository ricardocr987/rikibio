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
import { useTokenContext } from "@/contexts/TokenProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { TokenPicker } from "./TokenPicker";
import { WalletPicker } from "./WalletPicker";
import { toast } from "./ui/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";
import config from "@/lib/config";
import { confirmSession, createSession } from "@/actions/stripe";
import { sendTransaction, createTransaction } from "@/actions/solana";
import { ScrollArea } from "./ui/scroll-area";
import { Meetings } from "@/app/page";

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

export function MeetingForm({ firstDate, meetings }: DatePickerProps) {
  const form = useForm<z.infer<typeof MeetingSchema>>({
    resolver: zodResolver(MeetingSchema),
    defaultValues: {
      senderEmail: "",
      dob: new Date(firstDate),
      hours: [],
      message: "",
    },
  });

  const selectedDate = form.watch("dob");
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

  const [isStripeOpen, openStripe] = useState(false);
  const [stripeSession, setStripeSession] = useState("");
  const fetchClientSecret = useCallback(async () => {
    const session = await createSession(JSON.stringify(form.getValues()));
    setStripeSession(session.id);
    return session.client_secret;
  }, [form]);
  const onComplete = useCallback(async () => {
    await confirmSession(stripeSession);
  }, [stripeSession]);
  const options = {
    fetchClientSecret,
    onComplete,
  };

  const { publicKey, signTransaction } = useWallet();
  const { tokens, loadingTokens, selectedToken, setSelectedToken } =
    useTokenContext();
  async function handleSolanaPayment(data: z.infer<typeof MeetingSchema>) {
    try {
      if (!publicKey || !signTransaction || !selectedToken) {
        toast({ title: "Wallet not connected" });
        return;
      }

      const quantity = data.hours.length.toString();
      const { mint, decimals } = selectedToken!;
      const transaction = await createTransaction(
        publicKey!.toBase58(),
        quantity,
        mint,
        decimals,
      );
      if (!transaction) return;

      const deserializedTransaction = VersionedTransaction.deserialize(
        Buffer.from(transaction, "base64"),
      );
      const signedTransaction = await signTransaction!(deserializedTransaction);
      const serializedTransaction = Buffer.from(
        signedTransaction.serialize(),
      ).toString("base64");
      const formData = JSON.stringify({
        ...data,
        dob: data.dob.toISOString(),
      });
      const signature = await sendTransaction(serializedTransaction, formData);

      toast({
        title: "Payment done. Meeting booked.",
        description: (
          <a
            href={`https://solana.fm/tx/${signature}`}
            className="text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            Check Transaction
          </a>
        ),
      });
    } catch (error: any) {
      toast({ title: error.message || "Payment processing failed." });
    }
  }

  return (
    <section className="flex flex-col justify-center h-full w-full">
      <Form {...form}>
        <form className="space-y-4 mt-8 flex flex-col text-black w-full">
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
                    className="w-full"
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
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      defaultMonth={new Date(firstDate)}
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
                <FormLabel>Select hours</FormLabel>
                <FormControl>
                  {filteredHours.length > 0 ? (
                    <ToggleGroup
                      type="multiple"
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      className="flex flex-wrap gap-8"
                    >
                      {filteredHours.map((hour) => (
                        <ToggleGroupItem
                          key={hour}
                          value={hour}
                          data-state={field.value.includes(hour) ? "on" : "off"}
                          className="px-3 py-2 rounded-md transition-colors duration-200
                                    border-black data-[state=on]:bg-indigo-600 data-[state=on]:text-white
                                    data-[state=off]:bg-white data-[state=off]:text-black"
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
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center space-x-2">
            {publicKey ? (
              <TokenPicker
                tokens={tokens}
                selectedToken={selectedToken}
                setSelectedToken={setSelectedToken}
                handlePayment={form.handleSubmit(handleSolanaPayment)}
                quantity={form.watch("hours").length}
                loading={loadingTokens}
              />
            ) : (
              <>
                <WalletPicker />
                <Dialog open={isStripeOpen} onOpenChange={openStripe}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      onClick={form.handleSubmit(() => openStripe(true))}
                      className="flex-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Pay with Stripe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] p-0 overflow-hidden">
                    <ScrollArea className="h-full max-h-[calc(100vh-4rem)] scroll-smooth">
                      <EmbeddedCheckoutProvider
                        stripe={config.stripePromise}
                      options={options}
                      >
                        <EmbeddedCheckout className="h-[600px]" />                        
                      </EmbeddedCheckoutProvider>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </form>
      </Form>
    </section>
  );
}
