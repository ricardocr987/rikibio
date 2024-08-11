"server-only";

import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

// check out: https://stackademic.com/blog/next-js-14-server-side-authentication-using-cookies-with-firebase-admin-sdk

export const firebaseApp =
  admin.apps.find((it) => it?.name === "[DEFAULT]") ||
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/gm, "\n"),
    }),
  });

export const db = getFirestore();
