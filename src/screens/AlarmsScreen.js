import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import axios from "axios";
import moment from "moment-timezone"; // 📌 Importa moment-timezone

const API_URL = "https://bob-esponja-yh539.ondigitalocean.app";

const AlarmsScreen = ({ navigation }) => {
  const [usuarioNSS, setUsuarioNSS] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initialize = async () => {
      try {
        await configureNotifications(); // Configurar notificaciones
        await validateSession(); // Validar sesión del usuario
      } catch (error) {
        console.error("Error al inicializar la app:", error);
      }
    };
    
    initialize();
  }, []);
  
  useEffect(() => {
    let isMounted = true; // Control para evitar llamadas innecesarias
  
    // 🔹 Listener de respuesta a notificaciones
    const handleNotificationResponse = (response) => {
      if (!isMounted) return;
  
      const data = response.notification.request.content.data;
      
      if (data?.screen === "ActiveAlarmScreen" && data.alarma_id) {
        console.log("📢 Redirigiendo a ActiveAlarmScreen con alarma:", data.alarma_id);
  
        // Buscar la alarma correspondiente
        const alarmaSeleccionada = alarms?.find(a => a.id.toString() === data.alarma_id);
        
        if (alarmaSeleccionada) {
          navigation.navigate("ActiveAlarmScreen", { alarm: alarmaSeleccionada, usuarioNSS });
        } else {
          Alert.alert("⚠ Alarma no encontrada", "No se pudo encontrar la alarma correspondiente.");
        }
      }
    };
  
    // Agregar el listener
    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  
    return () => {
      isMounted = false; // Evita problemas de re-render
      subscriptionResponse.remove(); // Eliminar listener al desmontar
    };
  }, [alarms, usuarioNSS]);

  const configureNotifications = async () => {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesitan permisos para enviar notificaciones.");
        return;
      }
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  const validateSession = async () => {
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) {
        const user = JSON.parse(storedData);
        setUsuarioNSS(user.nss);
        await fetchAlarms(user.nss);
      } else {
        navigation.replace("LoginScreen"); // Redirige al usuario al login si no hay sesión
      }
    } catch (error) {
      console.error("Error al validar la sesión:", error);
      Alert.alert("Error", "Ocurrió un problema al validar tu sesión. Inicia sesión nuevamente.");
      navigation.replace("LoginScreen");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlarms = async (nss) => {
    try {
      const response = await axios.get(`${API_URL}/alarmas/${nss}`);
      if (response.status === 200) {
        const validAlarms = response.data.filter(
          (alarm) => !isNaN(new Date(alarm.hora_programada)) // Solo alarmas con fechas válidas
        );
        setAlarms(validAlarms);
        await AsyncStorage.setItem("alarms", JSON.stringify(validAlarms));
        scheduleAlarms(validAlarms);
      }
    } catch (error) {
      console.error("Error al obtener alarmas:", error);
    }
  };

  const scheduleAlarms = async (alarms) => {
    for (const alarm of alarms) {
      const triggerTimestamp = new Date(alarm.hora_programada).getTime();

      if (triggerTimestamp <= Date.now()) {
        console.log(`⚠ Alarma vencida: ${alarm.nombre_medicamento}`);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "¡Alarma vencida!",
            body: `Toma tu medicamento: ${alarm.nombre_medicamento}`,
            sound: "alarm.mp3",
          },
          trigger: { seconds: 1 }, // Dispara inmediatamente
        });
      } else {
        console.log(`⏰ Programando alarma: ${alarm.nombre_medicamento}`);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "¡Es hora de tomar tus medicamentos!",
            body: `Medicamento: ${alarm.nombre_medicamento}`,
            sound: "default",
          },
          trigger: { date: new Date(alarm.hora_programada) },
        });
      }
    }
  };

  const stopAlarm = async (alarm) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para apagar la alarma.");
        return;
      }

      const photo = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        base64: false,
      });

      if (!photo.canceled && photo.assets?.length > 0) {
        const imageUri = photo.assets[0].uri;
        const formData = new FormData();

        formData.append("imagen", {
          uri: imageUri,
          name: `alarma_${alarm.id}_${Date.now()}.jpg`,
          type: "image/jpeg",
        });
        formData.append("id", alarm.id);
        formData.append("usuario_nss", usuarioNSS);

        const response = await axios.post(`${API_URL}/alarmas/apagar`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.status === 200) {
          Alert.alert("✔ Alarma apagada", "La foto ha sido registrada correctamente.");
          const updatedAlarms = alarms.filter((a) => a.id !== alarm.id);
          setAlarms(updatedAlarms);
          await AsyncStorage.setItem("alarms", JSON.stringify(updatedAlarms));
        } else {
          Alert.alert("❌ Error", "No se pudo apagar la alarma. Inténtalo de nuevo.");
        }
      } else {
        Alert.alert("❌ Error", "No se pudo capturar la foto. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("❌ Error al apagar la alarma:", error);
      Alert.alert("❌ Error", "Hubo un problema al apagar la alarma.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alarmas</Text>
      <FlatList
        data={alarms}
        renderItem={({ item }) => {
          const horaProgramada = moment(item.hora_programada)
            .tz("America/Mexico_City") // 📌 Ajustar a la zona horaria correcta
            .format("DD/MM/YYYY, hh:mm:ss A"); // 📌 Formato legible

          return (
            <View style={styles.alarmCard}>
              <Text style={styles.alarmText}>Medicamento: {item.nombre_medicamento}</Text>
              <Text style={styles.alarmText}>Hora programada: {horaProgramada}</Text>
              <Button title="Apagar Alarma" onPress={() => stopAlarm(item)} />
            </View>
          );
        }}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FAF3DD" },
  title: { fontSize: 24, fontWeight: "bold", color: "#5E6472", textAlign: "center" },
  alarmCard: { backgroundColor: "#FFFFFF", padding: 15, borderRadius: 8, marginBottom: 10 },
  alarmText: { fontSize: 16, color: "#5E6472" },
});

export default AlarmsScreen;
