import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCedAIKaQMElWKOdMCI3OMN8FF47q9LiC4",
  authDomain: "sscteachers.firebaseapp.com",
  databaseURL: "https://sscteachers-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sscteachers",
  storageBucket: "sscteachers.firebasestorage.app",
  messagingSenderId: "3899739714",
  appId: "1:3899739714:web:66d4218ad5ea8c5f5ba7db",
  measurementId: "G-1PWDPWMFK2"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);

if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics, isSupported }) =>
    isSupported().then((ok) => ok && getAnalytics(app))
  );
}
