import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const API_URL = "http://localhost:3001";

export default function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  const handleLogin = async () => {
    if (!usuario.trim() || !contrasena.trim()) {
      Alert.alert("Campos requeridos", "Ingresa usuario y contrasena.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario,
          contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo iniciar sesion.");
      }

      setSession(data.user);
    } catch (error) {
      Alert.alert("Login fallido", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUsuario("");
    setContrasena("");
    setSession(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Colegio App</Text>
          <Text style={styles.subtitle}>Ingreso por roles</Text>
        </View>

        {session ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>
              Panel {session.rol === "admin" ? "administrador" : "docente"}
            </Text>
            <Text style={styles.panelText}>Bienvenido, {session.usuario}.</Text>
            <Text style={styles.roleBadge}>{session.rol}</Text>

            <Pressable style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onChangeText={setUsuario}
              placeholder="admin o docente"
              placeholderTextColor="#7a8798"
              style={styles.input}
              value={usuario}
            />

            <Text style={styles.label}>Contrasena</Text>
            <TextInput
              editable={!loading}
              onChangeText={setContrasena}
              placeholder="Tu contrasena"
              placeholderTextColor="#7a8798"
              secureTextEntry
              style={styles.input}
              value={contrasena}
            />

            <Pressable
              disabled={loading}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.button,
                pressed && !loading ? styles.buttonPressed : null,
                loading ? styles.buttonDisabled : null,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar sesion</Text>
              )}
            </Pressable>

            <View style={styles.hintBox}>
              <Text style={styles.hintText}>admin / Admin123*</Text>
              <Text style={styles.hintText}>docente / Docente123*</Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#172033",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    marginBottom: 28,
  },
  brand: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    color: "#b9c5d8",
    fontSize: 17,
    marginTop: 8,
  },
  form: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 20,
  },
  label: {
    color: "#263349",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f3f6fa",
    borderColor: "#d7deea",
    borderRadius: 8,
    borderWidth: 1,
    color: "#172033",
    fontSize: 16,
    marginBottom: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#176b87",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    marginTop: 4,
  },
  buttonPressed: {
    backgroundColor: "#12546a",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  hintBox: {
    borderTopColor: "#e3e8f0",
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 14,
  },
  hintText: {
    color: "#59677d",
    fontSize: 13,
    lineHeight: 21,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 22,
  },
  panelTitle: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "800",
  },
  panelText: {
    color: "#59677d",
    fontSize: 16,
    marginTop: 10,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e7f6f2",
    borderRadius: 8,
    color: "#176b87",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#176b87",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 48,
  },
  secondaryButtonText: {
    color: "#176b87",
    fontSize: 15,
    fontWeight: "800",
  },
});
