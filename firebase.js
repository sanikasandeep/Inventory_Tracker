// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTMVXf_tN9AvzWrfeIyapiVHKxOEReGmk",
  authDomain: "inventory-management-3df49.firebaseapp.com",
  projectId: "inventory-management-3df49",
  storageBucket: "inventory-management-3df49.appspot.com",
  messagingSenderId: "95630132330",
  appId: "1:95630132330:web:7b9626b0aed389fb9cf613",
  measurementId: "G-8M1Y6SDL65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export {firestore}