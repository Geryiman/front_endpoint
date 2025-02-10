import React, { useEffect, useState } from "react";
import AppNavigator from "./src/navigation/AppNavigator"; // Importa la navegación
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Para manejar la sesión
import messaging from "@react-native-firebase/messaging"; // Firebase para las notificaciones

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 🔹 Función para obtener el token de Expo o Firebase
async function obtenerTokenNotificaciones() {
  let token = null;

  if (!Device.isDevice) {
    Alert.alert("🚨 Error", "Las notificaciones solo funcionan en dispositivos reales.");
    return null;
  }

  // 🔹 Obtener permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("🚨 Permiso Denegado", "No recibirás notificaciones.");
    return null;
  }

  // 🔹 Obtener el token de Firebase o Expo
  if (Platform.OS === "android") {
    // Android usa FCM (Firebase Cloud Messaging)
    token = await messaging().getToken();
    console.log("🔥 Token FCM:", token);
  } else {
    // iOS y desarrollo en Expo usan Expo Notifications
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("🔑 Token Expo:", token);
  }

  return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado para verificar sesión

  useEffect(() => {
    // 🔹 Verificar sesión activa
    verificarSesion();

    // 🔹 Obtener token de notificaciones
    obtenerTokenNotificaciones().then((token) => {
      if (token) {
        setExpoPushToken(token);
        enviarTokenAlBackend(token); // Envía el token al backend
      }
    });

    // 🔹 Manejo de notificaciones en primer plano
    const subscriptionReceived = Notifications.addNotificationReceivedListener((notification) => {
      console.log("📢 Notificación recibida:", notification);
    });

    // 🔹 Manejo de notificaciones cuando se tocan
    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener((response) => {
      const { screen, medicamento_id } = response.notification.request.content.data;
      console.log("🔄 Notificación interactuada:", screen, medicamento_id);
      
      if (screen) {
        navigationRef.current?.navigate(screen, { medicamento_id });
      }
    });

    // 🔹 Manejo de notificaciones en segundo plano (Firebase)
    messaging().onMessage(async (remoteMessage) => {
      console.log("📬 Notificación en primer plano:", remoteMessage);
      Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("📬 Notificación en segundo plano:", remoteMessage);
    });

    return () => {
      subscriptionReceived.remove();
      subscriptionResponse.remove();
    };
  }, []);

  // 🔹 Verificar si hay sesión activa
  async function verificarSesion() {
    try {
      const nss = await AsyncStorage.getItem("nss");
      if (nss) {
        console.log("ℹ️ Sesión activa encontrada:", nss);
        setIsLoggedIn(true);
      } else {
        console.log("ℹ️ No se encontró una sesión activa.");
      }
    } catch (error) {
      console.error("❌ Error al verificar la sesión:", error);
    }
  }

  // 🔹 Enviar el token al backend
  async function enviarTokenAlBackend(token) {
    try {
      const nss = await AsyncStorage.getItem("nss");
      if (!nss) {
        console.error("⚠️ NSS no encontrado en AsyncStorage.");
        return;
      }
      const response = await fetch("https://bob-esponja-yh539.ondigitalocean.app/registrar-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nss, token_expo: token }),
      });
      if (!response.ok) {
        console.error("❌ Error al registrar el token en el backend.");
      } else {
        console.log("✅ Token registrado correctamente en el backend.");
      }
    } catch (error) {
      console.error("❌ Error en la solicitud al backend:", error);
    }
  }

  return <AppNavigator isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
}
