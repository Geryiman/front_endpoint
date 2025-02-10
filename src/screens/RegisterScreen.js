import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import axios from "axios";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const backendUrl = "https://bob-esponja-yh539.ondigitalocean.app";

const RegisterScreen = ({ navigation }) => {
  const [nss, setNss] = useState("");
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("Masculino");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Función para obtener el token Expo
  const registerForPushNotificationsAsync = async () => {
    let token = null;

    if (!Device.isDevice) {
      console.warn("⚠️ Las notificaciones push solo funcionan en dispositivos físicos.");
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("⚠️ Permiso para notificaciones denegado.");
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("🔑 Token Expo obtenido:", token);

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

  // ✅ Función para registrar al usuario
  const handleRegister = async () => {
    Keyboard.dismiss();

    // 📌 Validaciones antes del envío
    if (!nss || !nombre || !edad || !sexo || !contraseña) {
      Alert.alert("⚠️ Error", "Todos los campos son obligatorios.");
      return;
    }

    if (nss.length !== 11 || isNaN(nss)) {
      Alert.alert("⚠️ Error", "El NSS debe ser un número de 11 dígitos.");
      return;
    }

    const edadNum = parseInt(edad, 10);
    if (isNaN(edadNum) || edadNum < 1 || edadNum > 120) {
      Alert.alert("⚠️ Error", "Ingresa una edad válida entre 1 y 120 años.");
      return;
    }

    if (contraseña.length < 6 || !/[A-Z]/.test(contraseña)) {
      Alert.alert("⚠️ Error", "La contraseña debe tener al menos 6 caracteres y una mayúscula.");
      return;
    }

    setLoading(true);
    try {
      console.log("ℹ️ Registrando usuario...");
      const response = await axios.post(`${backendUrl}/usuarios`, {
        nss,
        nombre,
        edad: edadNum,
        sexo,
        contraseña,
      });

      if (response.status === 201) {
        console.log("✅ Usuario registrado correctamente.");
        Alert.alert("🎉 Registro exitoso", "Usuario creado con éxito.");

        // ✅ Obtener el token Expo y enviarlo al backend
        const tokenExpo = await registerForPushNotificationsAsync();
        if (tokenExpo) {
          console.log("ℹ️ Enviando token Expo al backend...");
          await axios.post(`${backendUrl}/registrar-token`, {
            nss,
            token_expo: tokenExpo,
          });
          console.log("✅ Token Expo enviado correctamente.");
        } else {
          console.warn("⚠️ No se pudo obtener el token Expo.");
        }

        // ✅ Redirigir a la pantalla principal
        navigation.replace("HomeScreen");
      }
    } catch (error) {
      console.error("❌ Error en el registro:", error.response?.data || error.message);
      Alert.alert("❌ Error", error.response?.data?.error || "No se pudo registrar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro</Text>

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
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Edad"
        value={edad}
        onChangeText={setEdad}
        keyboardType="numeric"
        maxLength={3}
      />

      <Text style={styles.label}>Selecciona tu sexo:</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.sexoButton, sexo === "Masculino" && styles.selectedButton]}
          onPress={() => setSexo("Masculino")}
        >
          <Text style={styles.buttonText}>Masculino</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sexoButton, sexo === "Femenino" && styles.selectedButton]}
          onPress={() => setSexo("Femenino")}
        >
          <Text style={styles.buttonText}>Femenino</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 6 caracteres y una mayúscula)"
        value={contraseña}
        secureTextEntry
        onChangeText={setContraseña}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#5E6472" />
      ) : (
        <Button title="Registrar" onPress={handleRegister} />
      )}

      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión aquí</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 📌 Estilos
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#FAF3DD" },
  title: { fontSize: 24, fontWeight: "bold", color: "#5E6472", marginBottom: 20 },
  input: { width: "100%", padding: 10, borderWidth: 1, borderRadius: 8, backgroundColor: "#B8F2E6", marginBottom: 15 },
  label: { fontSize: 16, color: "#5E6472", marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  sexoButton: { flex: 1, padding: 10, marginHorizontal: 5, borderWidth: 1, borderRadius: 8, alignItems: "center", backgroundColor: "#B8F2E6" },
  selectedButton: { backgroundColor: "#5E6472" },
  buttonText: { color: "#FFFFFF", fontWeight: "bold" },
  link: { color: "#5E6472", textDecorationLine: "underline", marginTop: 15 },
});

export default RegisterScreen;
