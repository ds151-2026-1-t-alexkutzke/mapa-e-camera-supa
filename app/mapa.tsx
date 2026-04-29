import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

// Define o formato que o segredo terá
interface Segredo {
  id: string;
  texto: string;
  fotoUri: string | null;
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = "@geovault:segredos";
export default function MapaScreen() {
  const [segredoSelecionado, setSegredoSelecionado] = useState<Segredo | null>(
    null,
  );
  const [segredos, setSegredos] = useState<Segredo[]>([]);
  const [regiao, setRegiao] = useState<any>(null);
  const pegarLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("Permissão negada");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});

    setRegiao({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };
  const carregarSegredos = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const lista: Segredo[] = json ? JSON.parse(json) : [];
      console.log("SEGREDOS CARREGADOS:", lista);
      setSegredos(lista);
    } catch (error) {
      console.log("Erro ao carregar segredos");
    }
  };

  useEffect(() => {
    pegarLocalizacao();
  }, []);
  useFocusEffect(
    useCallback(() => {
      carregarSegredos();
    }, []),
  );

  if (!regiao) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando mapa...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Modal
        visible={segredoSelecionado !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSegredoSelecionado(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSegredoSelecionado(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <Text style={styles.modalTexto}>
                  {segredoSelecionado?.texto}
                </Text>

                {segredoSelecionado?.fotoUri ? (
                  <Image
                    source={{ uri: segredoSelecionado.fotoUri }}
                    style={styles.modalFoto}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={{ color: "#666" }}>📷 Sem foto</Text>
                )}

                <TouchableOpacity
                  onPress={() => setSegredoSelecionado(null)}
                  style={styles.modalBtnFechar}
                >
                  <Text style={{ color: "#007bff" }}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <MapView style={styles.map} initialRegion={regiao} showsUserLocation>
        {segredos.map((segredo) => {
          if (!segredo.latitude || !segredo.longitude) return null;

          return (
            <Marker
              key={segredo.id}
              coordinate={{
                latitude: segredo.latitude,
                longitude: segredo.longitude,
              }}
            >
              <Callout onPress={() => setSegredoSelecionado(segredo)}>
                <Text>Ver segredo</Text>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {segredos.length === 0 && (
        <View style={styles.avisoContainer}>
          <Text style={styles.avisoText}>
            Nenhum segredo salvo ainda. Vá na outra aba!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  calloutContainer: {
    width: 160,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  calloutTexto: { fontWeight: "bold", marginBottom: 5, textAlign: "center" },
  fotoMiniatura: { width: 140, height: 100, borderRadius: 8 },
  semFoto: {
    width: 140,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: 280,
    alignItems: "center",
  },
  modalTexto: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: "#000",
  },
  modalFoto: {
    width: 250,
    height: 180,
    borderRadius: 8,
  },
  modalBtnFechar: {
    marginTop: 12,
    padding: 8,
  },
  avisoContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 20,
  },

  avisoText: { color: "#fff" },
});
