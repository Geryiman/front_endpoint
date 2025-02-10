import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  Button,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const backendUrl = "https://bob-esponja-yh539.ondigitalocean.app";
const defaultProfilePic =
  "https://salud-magenes.sfo2.digitaloceanspaces.com/imagenes/Imagen%20de%20WhatsApp%202025-01-24%20a%20las%2012.29.23_0663b1f5.jpg";

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [profilePic, setProfilePic] = useState(defaultProfilePic);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem("userData");

      if (!storedData) {
        console.warn("ℹ️ No hay sesión activa.");
        setUserData(null); // No redirige al login, simplemente no muestra datos
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedData);
      await fetchUserDetails(user.nss);
    } catch (error) {
      console.error("❌ Error al obtener datos almacenados:", error);
      Alert.alert("Error", "Hubo un problema al obtener los datos.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserDetails = async (nss) => {
    try {
      const response = await axios.get(`${backendUrl}/usuario/${nss}`, {
        timeout: 10000,
      });

      if (response.status === 200) {
        setUserData(response.data);
        setProfilePic(response.data.fotoPerfil || defaultProfilePic);
      } else {
        throw new Error("Usuario no encontrado");
      }
    } catch (error) {
      console.error("❌ Error en la API:", error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userData");
    navigation.replace("LoginScreen");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#5E6472" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </>
      ) : userData ? (
        <>
          <View style={styles.profileContainer}>
            <Text style={styles.welcomeText}>
              Bienvenido, {userData.nombre}
            </Text>
            <Image source={{ uri: profilePic }} style={styles.profileImage} />
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>NSS: {userData.nss}</Text>
              <Text style={styles.infoText}>Edad: {userData.edad}</Text>
              <Text style={styles.infoText}>Sexo: {userData.sexo}</Text>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("PhotoScreen")}
            >
              <Text style={styles.buttonText}>Ver/Subir Fotos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("TreatmentsScreen")}
            >
              <Text style={styles.buttonText}>Tratamientos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("AlarmsScreen")}
            >
              <Text style={styles.buttonText}>Alarmas</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>No se pudo cargar la información.</Text>
      )}

      {/* 🔹 Botón de Cerrar Sesión SIEMPRE visible */}
      <View style={styles.logoutContainer}>
        <Button title="Cerrar Sesión" onPress={handleLogout} color="#5E6472" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#FAF3DD", alignItems: "center" },
  profileContainer: { alignItems: "center", marginBottom: 30 },
  welcomeText: { fontSize: 24, fontWeight: "bold", color: "#5E6472", marginBottom: 20 },
  profileImage: { width: 150, height: 150, borderRadius: 75, marginBottom: 20, borderWidth: 2, borderColor: "#AED9E0" },
  infoContainer: { alignItems: "center" },
  infoText: { fontSize: 16, color: "#5E6472", marginVertical: 5 },
  buttonsContainer: { width: "100%", alignItems: "center" },
  button: { backgroundColor: "#5E6472", padding: 15, borderRadius: 8, marginBottom: 10, alignItems: "center", width: "80%" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  loadingText: { fontSize: 16, color: "#5E6472", marginTop: 10 },
  errorText: { fontSize: 18, color: "red", marginTop: 10 },
  logoutContainer: { marginTop: 20 }, // 🔹 Espaciado para el botón de Cerrar Sesión
});

export default HomeScreen;
