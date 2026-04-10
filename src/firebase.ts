import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCT86aD4i92AobW_A176udLMjJBLzR0t8Y",
  authDomain: "guardrail-2ea5b.firebaseapp.com",
  projectId: "guardrail-2ea5b",
  storageBucket: "guardrail-2ea5b.firebasestorage.app",
  messagingSenderId: "601224255637",
  appId: "1:601224255637:web:2ebe9c8e8704ca2e31239c",
  measurementId: "G-CGXBCBZ5GL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
