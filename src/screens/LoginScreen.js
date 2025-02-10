import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const backendUrl = "https://bob-esponja-yh539.ondigitalocean.app";

const LoginScreen = ({ navigation }) => {
  const [nss, setNss] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Verificar si ya hay una sesión activa en AsyncStorage
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (storedUser) {
          console.log("ℹ️ Sesión detectada, redirigiendo al usuario...");
          navigation.replace("HomeScreen"); // Redirigir si hay sesión guardada
        }
      } catch (error) {
        console.error("❌ Error al verificar la sesión:", error);
      }
    };

    checkSession();
  }, []);

  // ✅ Función para obtener el token de notificaciones push
  const registerForPushNotificationsAsync = async () => {
    let token = null;
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          Alert.alert("⚠️ Permiso denegado", "No podrás recibir notificaciones.");
          return null;
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("🔑 Token Expo obtenido:", token);
      } else {
        console.warn("⚠️ Las notificaciones push solo funcionan en dispositivos físicos.");
      }

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener token Expo:", error);
    }
    return token;
  };

  // ✅ Función para iniciar sesión
  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!nss || !password) {
      Alert.alert("⚠️ Error", "El NSS y la contraseña son obligatorios.");
      return;
    }

    if (nss.length !== 11 || isNaN(nss)) {
      Alert.alert("⚠️ Error", "El NSS debe ser un número de 11 dígitos.");
      return;
    }

    setLoading(true);
    try {
      console.log("ℹ️ Iniciando sesión...");
      const response = await axios.post(`${backendUrl}/login`, {
        nss,
        contraseña: password,
      });

      if (response.status === 200) {
        const userData = response.data.usuario;
        console.log("✅ Inicio de sesión exitoso:", userData);

        // Guardar datos en AsyncStorage
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        await AsyncStorage.setItem("nss", nss);

        // Obtener nuevo token de notificación
        const tokenExpo = await registerForPushNotificationsAsync();
        if (tokenExpo) {
          console.log("ℹ️ Registrando nuevo token Expo en el backend...");
          await axios.post(`${backendUrl}/registrar-token`, {
            nss,
            token_expo: tokenExpo,
          });

          console.log("✅ Token Expo actualizado correctamente.");
        } else {
          console.warn("⚠️ No se pudo obtener el token Expo.");
        }

        // Redirigir a HomeScreen
        navigation.replace("HomeScreen");
      } else {
        Alert.alert("❌ Error", "Credenciales incorrectas.");
      }
    } catch (error) {
      console.error("❌ Error al iniciar sesión:", error?.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.error || "No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://salud-magenes.sfo2.digitaloceanspaces.com/imagenes/pilli.jpg",
        }}
        style={styles.logo}
      />
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="NSS (11 dígitos)"
        value={nss}
        onChangeText={setNss}
        keyboardType="numeric"
        maxLength={11}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#5E6472" style={{ marginBottom: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate aquí</Text>
      </TouchableOpacity>
    </View>
  );
};

// 📌 Estilos
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#FAF3DD" },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#5E6472", marginBottom: 20 },
  input: { width: "100%", padding: 10, borderWidth: 1, borderRadius: 8, backgroundColor: "#B8F2E6", marginBottom: 15 },
  button: { backgroundColor: "#5E6472", padding: 15, borderRadius: 8, alignItems: "center", width: "100%" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  link: { color: "#5E6472", textDecorationLine: "underline", marginTop: 15 },
});

export default LoginScreen;
