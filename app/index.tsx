import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Lógica de salvar no armazenamento local
const STORAGE_KEY = "@geovault:segredos";
export default function NovoSegredoScreen() {
  const [texto, setTexto] = useState("");
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Lógica do botão de abrir câmera
  const handleAbrirCamera = async () => {
    if (!cameraPermission?.granted) {
      const resultado = await requestCameraPermission();

      if (!resultado.granted) {
        Alert.alert("Permissão negada", "Precisamos da câmera.");
        return;
      }
    }

    setIsCameraOpen(true);
  };

  // Lógica após tirar a foto
  const handleTirarFoto = async () => {
    if (!cameraRef.current) return;

    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });

      if (foto?.uri) {
        setFotoUri(foto.uri);
      }

      setIsCameraOpen(false);
    } catch {
      Alert.alert("Erro", "Não foi possível tirar a foto.");
      setIsCameraOpen(false);
    }
  };

  const handleSalvarSegredo = async () => {
    if (!texto.trim()) {
      Alert.alert("Erro", "Digite um segredo primeiro!");
      return;
    }

    try {
      // 📍 Permissão GPS
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permissão negada", "Precisamos da localização.");
        return;
      }

      // 📍 Pega localização
      const localizacao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!localizacao) {
        Alert.alert("Erro", "Não foi possível obter sua localização.");
        return;
      }
      // 💾 Monta objeto
      const novoSegredo = {
        id: Date.now().toString(),
        texto: texto.trim(),
        fotoUri: fotoUri || null,
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
      };
      console.log("SALVANDO:", novoSegredo);

      // 💾 Salva no AsyncStorage
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const lista = json ? JSON.parse(json) : [];

      const novaLista = [...lista, novoSegredo];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));

      Alert.alert("✅ Sucesso", "Segredo salvo!");

      setTexto("");
      setFotoUri(null);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  // --- RENDERIZAÇÃO DA CÂMERA EM TELA CHEIA ---
  if (isCameraOpen) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={() => setIsCameraOpen(false)}
          >
            <Text style={styles.btnText}>✕ Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnCapturar}
            onPress={handleTirarFoto}
          >
            <Text style={styles.btnText}>📷 Capturar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- RENDERIZAÇÃO DO FORMULÁRIO NORMAL ---
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Qual o seu segredo neste local?</Text>

      <TextInput
        style={styles.input}
        placeholder="Escreva algo marcante..."
        placeholderTextColor="#666"
        value={texto}
        onChangeText={setTexto}
        multiline
      />

      <View style={styles.fotoContainer}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.previewFoto} />
        ) : (
          <TouchableOpacity
            style={styles.btnFotoOutline}
            onPress={handleAbrirCamera}
          >
            <Text style={styles.btnFotoText}>📷 Adicionar Foto ao Segredo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvarSegredo}>
        <Text style={styles.btnSalvarText}>
          Salvar Segredo e Localização 📍
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e1e1e", padding: 20 },
  label: { color: "#fff", fontSize: 18, marginBottom: 10, fontWeight: "bold" },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 15,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: "top",
  },
  fotoContainer: { marginVertical: 20, alignItems: "center" },
  previewFoto: { width: "100%", height: 200, borderRadius: 8 },
  btnFotoOutline: {
    borderWidth: 1,
    borderColor: "#007bff",
    borderStyle: "dashed",
    padding: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  btnFotoText: { color: "#007bff", fontSize: 16 },
  btnSalvar: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnSalvarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-evenly",
    paddingBottom: 40,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  btnCapturar: { backgroundColor: "#28a745", padding: 15, borderRadius: 30 },
  btnCancelar: { backgroundColor: "#dc3545", padding: 15, borderRadius: 30 },
  btnText: { color: "#fff", fontWeight: "bold" },
});
