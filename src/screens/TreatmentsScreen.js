import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment-timezone"; // 📌 Importa Moment.js con soporte para zonas horarias

const API_URL = "https://bob-esponja-yh539.ondigitalocean.app";

const TreatmentsScreen = () => {
  const [usuarioNSS, setUsuarioNSS] = useState(null);
  const [nombreTratamiento, setNombreTratamiento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [medicamentos, setMedicamentos] = useState([]);
  const [nombreMedicamento, setNombreMedicamento] = useState("");
  const [dosis, setDosis] = useState("");
  const [horaInicio, setHoraInicio] = useState(new Date());
  const [intervaloTiempo, setIntervaloTiempo] = useState("1");
  const [unidadTiempo, setUnidadTiempo] = useState("horas");
  const [tratamientos, setTratamientos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const fetchUsuarioNSS = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userData");
        if (storedData) {
          const user = JSON.parse(storedData);
          setUsuarioNSS(user.nss);
          fetchTratamientos(user.nss);
        } else {
          Alert.alert(
            "Error",
            "No se encontró información de usuario. Inicia sesión nuevamente."
          );
        }
      } catch (error) {
        console.error("Error al obtener el NSS del usuario:", error);
      }
    };
    fetchUsuarioNSS();
  }, []);

  const fetchTratamientos = async (nss) => {
    try {
      const response = await fetch(`${API_URL}/tratamientos/${nss}`);
      if (!response.ok) {
        setTratamientos([]);
        return;
      }
      const data = await response.json();
      setTratamientos(data);
    } catch (error) {
      console.error("Error al obtener tratamientos:", error);
      setTratamientos([]);
    }
  };

  const obtenerHoraDispositivo = () => {
    return moment().tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
  };

  const agregarMedicamento = () => {
    if (!nombreMedicamento || !dosis || isNaN(intervaloTiempo) || intervaloTiempo <= 0) {
      Alert.alert("Error", "Debe completar todos los campos correctamente.");
      return;
    }

    const formattedHoraInicio = obtenerHoraDispositivo();

    const intervaloEnHoras =
      unidadTiempo === "horas"
        ? parseFloat(intervaloTiempo)
        : parseFloat(intervaloTiempo) / 60;

    setMedicamentos([
      ...medicamentos,
      {
        nombre_medicamento: nombreMedicamento,
        dosis,
        hora_inicio: formattedHoraInicio,
        intervalo_horas: intervaloEnHoras,
      },
    ]);

    Alert.alert("Éxito", "Medicamento agregado correctamente.");
    setNombreMedicamento("");
    setDosis("");
    setHoraInicio(new Date());
    setIntervaloTiempo("1");
    setUnidadTiempo("horas");
  };

  const enviarTratamiento = async () => {
    if (!usuarioNSS || !nombreTratamiento || !descripcion || medicamentos.length === 0) {
      Alert.alert(
        "Error",
        "Debe completar todos los campos y agregar al menos un medicamento."
      );
      return;
    }

    try {
      const payload = {
        usuario_nss: usuarioNSS,
        nombre_tratamiento: nombreTratamiento,
        descripcion,
        medicamentos,
      };

      const response = await fetch(`${API_URL}/tratamientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        Alert.alert("Error", "No se pudo guardar el tratamiento.");
        return;
      }

      Alert.alert("Éxito", "Tratamiento guardado correctamente.");
      setNombreTratamiento("");
      setDescripcion("");
      setMedicamentos([]);
      fetchTratamientos(usuarioNSS);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al guardar el tratamiento.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tratamientos</Text>
      {tratamientos.map((tratamiento, index) => (
        <View key={index} style={styles.treatmentCard}>
          <Text style={styles.treatmentTitle}>{tratamiento.nombre_tratamiento}</Text>
          <Text>{tratamiento.descripcion}</Text>
          {tratamiento.medicamentos && tratamiento.medicamentos.length > 0 && (
            <View style={styles.medicamentosContainer}>
              <Text style={styles.subtitle}>Medicamentos:</Text>
              {tratamiento.medicamentos.map((med, medIndex) => (
                <Text key={medIndex} style={styles.medicamentoText}>
                  {med.nombre_medicamento} - {med.dosis} - {med.hora_inicio}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
      <Button title="Agregar Nuevo Tratamiento" onPress={() => setModalVisible(true)} />
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del padecimiento"
            value={nombreTratamiento}
            onChangeText={setNombreTratamiento}
          />
          <TextInput
            style={styles.input}
            placeholder="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TextInput
            style={styles.input}
            placeholder="Nombre del Medicamento"
            value={nombreMedicamento}
            onChangeText={setNombreMedicamento}
          />
          <TextInput
            style={styles.input}
            placeholder="Dosis"
            value={dosis}
            onChangeText={setDosis}
          />
          <TextInput
            style={styles.input}
            placeholder="Intervalo de Tiempo"
            value={intervaloTiempo}
            onChangeText={setIntervaloTiempo}
            keyboardType="numeric"
          />
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={unidadTiempo === "horas" ? styles.selectedToggle : styles.toggle}
              onPress={() => setUnidadTiempo("horas")}
            >
              <Text style={styles.toggleText}>Horas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={unidadTiempo === "minutos" ? styles.selectedToggle : styles.toggle}
              onPress={() => setUnidadTiempo("minutos")}
            >
              <Text style={styles.toggleText}>Minutos</Text>
            </TouchableOpacity>
          </View>
          <Button title="Agregar Medicamento" onPress={agregarMedicamento} />
          <Button title="Guardar Tratamiento" onPress={enviarTratamiento} />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#FAF3DD" },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 18, fontWeight: "bold", color: "#5E6472", marginTop: 15 },
  treatmentCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 8, marginBottom: 10 },
  treatmentTitle: { fontSize: 18, fontWeight: "bold" },
  medicamentosContainer: { marginTop: 10 },
  medicamentoText: { fontSize: 16, color: "#5E6472" },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#FAF3DD" },
  input: { padding: 10, borderWidth: 1, marginBottom: 15 },
  toggleContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  toggle: { padding: 10, borderWidth: 1, borderRadius: 5, borderColor: "#5E6472" },
  selectedToggle: { padding: 10, borderWidth: 1, borderRadius: 5, backgroundColor: "#5E6472" },
  toggleText: { color: "#FFFFFF" },
});

export default TreatmentsScreen;
