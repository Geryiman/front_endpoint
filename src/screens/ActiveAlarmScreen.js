import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const API_URL = "https://bob-esponja-yh539.ondigitalocean.app";

const ActiveAlarmScreen = ({ route, navigation }) => {
  const [loading, setLoading] = useState(false);
  const alarm = route?.params?.alarm;
  const usuarioNSS = route?.params?.usuarioNSS;

  // Manejo de errores si los parámetros no se pasaron correctamente
  useEffect(() => {
    if (!alarm || !usuarioNSS) {
      Alert.alert("❌ Error", "No se recibieron datos de la alarma.");
      navigation.goBack(); // Vuelve atrás si no hay datos
    }
  }, [alarm, usuarioNSS]);

  const stopAlarm = async () => {
    try {
      setLoading(true);

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para apagar la alarma.");
        setLoading(false);
        return;
      }

      const photo = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (photo.assets?.length > 0) {
        const imageUri = photo.assets[0].uri;

        const formData = new FormData();
        formData.append("imagen", {
          uri: imageUri,
          name: `alarma_${alarm.id}_${Date.now()}.jpg`,
          type: "image/jpeg",
        });
        formData.append("id", alarm.id);
        formData.append("usuario_nss", usuarioNSS);

        // Enviar la imagen al backend
        const response = await axios.post(`${API_URL}/alarmas/apagar`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.status === 200) {
          Alert.alert("✔ Alarma apagada", "La foto ha sido registrada correctamente.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert("❌ Error", "No se pudo apagar la alarma. Inténtalo de nuevo.");
        }
      } else {
        Alert.alert("❌ Error", "No se pudo capturar la foto.");
      }
    } catch (error) {
      console.error("❌ Error al apagar la alarma:", error);
      Alert.alert("❌ Error", "Hubo un problema al apagar la alarma.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!alarm ? (
        <Text style={styles.errorText}>Cargando datos de la alarma...</Text>
      ) : (
        <>
          <Text style={styles.title}>¡Es hora de tomar tus medicamentos!</Text>
          <Text style={styles.alarmText}>Medicamento: {alarm.nombre_medicamento}</Text>
          <Text style={styles.alarmText}>
            Hora programada: {new Date(alarm.hora_programada).toLocaleString()}
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#5E6472" />
          ) : (
            <Button title="Tomar Foto para Apagar" onPress={stopAlarm} />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FAF3DD", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#5E6472", textAlign: "center", marginBottom: 20 },
  alarmText: { fontSize: 16, color: "#5E6472", marginBottom: 10 },
  errorText: { fontSize: 18, color: "red", textAlign: "center" },
});

export default ActiveAlarmScreen;
