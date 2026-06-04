import Constants from 'expo-constants';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type LoginState = 'idle' | 'loading' | 'success' | 'error';

type UserSession = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
};

function getApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3001`;
  }

  return 'http://localhost:3001';
}

export default function LoginScreen() {
  const apiUrl = useMemo(() => getApiUrl(), []);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [status, setStatus] = useState<LoginState>('idle');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<UserSession | null>(null);

  const iniciarSesion = async () => {
    setStatus('loading');
    setMessage('');
    setSession(null);

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible iniciar sesion.');
      }

      setSession(data.user);
      setStatus('success');
      setMessage(data.message || 'Login exitoso.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error desconocido.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Colegio App
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Inicia sesion para entrar al panel segun tu rol.
              </ThemedText>
            </View>

            <ThemedView type="backgroundElement" style={styles.formPanel}>
              <View style={styles.fieldGroup}>
                <ThemedText type="small" style={styles.label}>
                  Correo
                </ThemedText>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  onChangeText={setCorreo}
                  placeholder="admin@colegio.com"
                  placeholderTextColor="#8E8E93"
                  style={styles.input}
                  value={correo}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText type="small" style={styles.label}>
                  Contrasena
                </ThemedText>
                <TextInput
                  onChangeText={setContrasena}
                  placeholder="Admin123*"
                  placeholderTextColor="#8E8E93"
                  secureTextEntry
                  style={styles.input}
                  value={contrasena}
                />
              </View>

              {message ? (
                <ThemedText
                  type="small"
                  style={status === 'error' ? styles.errorText : styles.successText}>
                  {message}
                </ThemedText>
              ) : null}

              <Pressable
                disabled={status === 'loading'}
                onPress={iniciarSesion}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  status === 'loading' && styles.buttonDisabled,
                ]}>
                {status === 'loading' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>Iniciar sesion</ThemedText>
                )}
              </Pressable>

              <ThemedText type="small" style={styles.apiText}>
                API: {apiUrl}
              </ThemedText>
            </ThemedView>

            {session ? (
              <ThemedView type="backgroundElement" style={styles.sessionPanel}>
                <ThemedText type="subtitle">
                  Bienvenido, {session.nombre} {session.apellido}
                </ThemedText>
                <ThemedText>
                  Correo: {session.correo}
                </ThemedText>
                <ThemedText>
                  Rol: {session.rol}
                </ThemedText>
                <ThemedText type="small" style={styles.sessionHint}>
                  Aqui se puede conectar el panel de {session.rol}.
                </ThemedText>
              </ThemedView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    textAlign: 'left',
  },
  subtitle: {
    opacity: 0.78,
  },
  formPanel: {
    borderRadius: Spacing.two,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    fontWeight: '700',
    opacity: 0.78,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: Spacing.two,
    borderWidth: 1,
    color: '#111827',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  successText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  apiText: {
    opacity: 0.68,
  },
  sessionPanel: {
    borderRadius: Spacing.two,
    gap: Spacing.one,
    padding: Spacing.four,
  },
  sessionHint: {
    opacity: 0.72,
  },
});
