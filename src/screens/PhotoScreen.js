import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const backendUrl = "https://bob-esponja-yh539.ondigitalocean.app";

const PhotoScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [nss, setNss] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userData");
        if (storedData) {
          const userData = JSON.parse(storedData);
          setNss(userData.nss);
        } else {
          Alert.alert("Error", "No se encontró información del usuario.");
        }
      } catch (error) {
        console.error("❌ Error al obtener el NSS:", error);
      }
    };
    fetchUserData();
  }, []);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Se necesita acceso a la galería para seleccionar imágenes."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Se necesita acceso a la cámara para tomar fotos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Selecciona una imagen primero.");
      return;
    }

    if (!nss) {
      Alert.alert("Error", "No se encontró el NSS del usuario.");
      return;
    }

    setUploading(true);

    try {
      const localUri = selectedImage;
      const filename = localUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append("imagen", {
        uri: localUri,
        name: filename,
        type,
      });
      formData.append("usuario_nss", nss);

      console.log("📤 Enviando imagen al servidor...");
      const response = await axios.post(`${backendUrl}/perfil`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        Alert.alert("✅ Éxito", "Foto de perfil actualizada con éxito.");
        setSelectedImage(null);
      } else {
        Alert.alert("❌ Error", "No se pudo actualizar la foto de perfil.");
      }
    } catch (error) {
      console.error("❌ Error al subir la imagen:", error);
      Alert.alert("❌ Error", "Ocurrió un error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subir Foto</Text>

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
      )}

      <TouchableOpacity style={styles.button} onPress={handlePickImage}>
        <Text style={styles.buttonText}>Seleccionar Imagen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
        <Text style={styles.buttonText}>Tomar Foto</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, uploading && styles.disabledButton]}
        onPress={handleUploadImage}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? "Subiendo..." : "Subir Imagen"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        Solo se realizará una actualización por usuario.
      </Text>

      {uploading && <ActivityIndicator size="large" color="#5E6472" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FAF3DD",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5E6472",
    marginBottom: 20,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#AED9E0",
  },
  button: {
    backgroundColor: "#5E6472",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    width: "80%",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#5E6472",
    marginTop: 10,
    textAlign: "center",
  },
});

export default PhotoScreen;
