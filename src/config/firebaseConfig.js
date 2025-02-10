import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  projectId: "pillpal-c96fc",
  appId: "1:551749514681:android:58a85995057c7035ee7268",
  storageBucket: "pillpal-c96fc.appspot.com",
  messagingSenderId: "551749514681",
  measurementId: "", // Opcional, solo si usas Analytics
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar el servicio de mensajería de Firebase (FCM)
const messaging = getMessaging(app);

export { app, messaging };
