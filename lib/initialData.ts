'use server'

import { db } from "@/lib/firebase";
import { Article, getArticles } from "@/lib/notion";

type InitialData = {
    meetings: Meetings;
    firstDate: string;
    articles: Article[];
};

export type Meetings = {
    [date: string]: string[];
};
  
export async function getInitialData(): Promise<InitialData> {
    const today = new Date();
    const currentTimestamp = today.getTime();
    const snapshot = await db
      .collection("meeting")
      .where("dob", ">=", currentTimestamp)
      .get();
  
    const meetings: { [date: string]: string[] } = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const day = new Date(data.dob).toISOString();
  
      if (!meetings[day]) {
        meetings[day] = [];
      }
  
      meetings[day].push(...(data.hours || []));
    });
  
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    if (today.getDay() === 6) {
      today.setDate(today.getDate() + 2);
    } else if (today.getDay() === 0) {
      today.setDate(today.getDate() + 1);
    }
  
    const firstDate = today.toISOString();
    const articles = await getArticles();
  
    return { meetings, firstDate, articles };
  }