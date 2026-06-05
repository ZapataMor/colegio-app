import { useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getApiUrl } from '@/lib/api';
import { ScreenShell } from '@/components/screen-shell';
import { getUserSession, setUserSession } from '@/lib/session';

export { getUserSession, setUserSession } from '@/lib/session';

type LoginState = 'idle' | 'loading' | 'success' | 'error';

export default function LoginScreen() {
  const router = useRouter();
  const apiUrl = useMemo(() => getApiUrl(), []);
  const [correo, setCorreo] = useState('admin@colegio.com');
  const [contrasena, setContrasena] = useState('Admin123*');
  const [status, setStatus] = useState<LoginState>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Verificar si ya hay sesión
    const session = getUserSession();
    if (session) {
      router.replace('/(dashboard)/dashboard');
    }
  }, []);

  const iniciarSesion = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible iniciar sesion.');
      }

      setUserSession({
        ...data.user,
        token: data.token,
        welcomeMessage: data.welcomeMessage,
      });

      setStatus('success');
      setMessage(data.welcomeMessage || data.message || 'Login exitoso.');

      // Redirigir al dashboard después de 500ms
      setTimeout(() => {
        router.replace('/(dashboard)/dashboard');
      }, 500);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : `No se pudo conectar a ${apiUrl}.`
      );
    }
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
          <View style={styles.shell}>
            <View style={styles.heroPanel}>
              <View style={styles.glowA} />
              <View style={styles.glowB} />
              <View style={styles.brandRow}>
                <View style={styles.brandMark} />
                <ThemedText style={styles.brandText}>Colegio App</ThemedText>
              </View>
              <View style={styles.heroCopy}>
                <ThemedText type="small" style={styles.kicker}>
                  Acceso seguro
                </ThemedText>
                <ThemedText type="title" style={styles.heroTitle}>
                  Gestiona el colegio con una vista limpia y rapida.
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  Entra al panel segun tu rol, con una experiencia pensada para
                  lectura rapida, contraste fuerte y menos friccion.
                </ThemedText>
              </View>
              
            </View>

            <ThemedView type="backgroundElement" style={styles.formPanel}>
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  Iniciar sesion
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Usa tus credenciales para entrar al panel segun tu rol.
                </ThemedText>
              </View>

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
                  placeholderTextColor="#8C8C93"
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
                  placeholderTextColor="#8C8C93"
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
                  <ActivityIndicator color="#101010" />
                ) : (
                  <ThemedText style={styles.buttonText}>Entrar al panel</ThemedText>
                )}
              </Pressable>

              <ThemedText type="small" style={styles.apiText}>
                API: {apiUrl}
              </ThemedText>
            </ThemedView>
          </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shellContent: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  shell: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  heroPanel: {
    overflow: 'hidden',
    borderRadius: Spacing.three,
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#232936',
    minHeight: 240,
  },
  glowA: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.18,
  },
  glowB: {
    position: 'absolute',
    right: -30,
    bottom: -40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.08,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    zIndex: 1,
  },
  brandMark: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F5B342',
  },
  brandText: {
    color: '#F5F4F0',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroCopy: {
    gap: Spacing.two,
    zIndex: 1,
  },
  kicker: {
    color: '#F5B342',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#F5F4F0',
  },
  heroSubtitle: {
    color: 'rgba(245, 244, 240, 0.72)',
    lineHeight: 22,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    zIndex: 1,
  },
  statItem: {
    flexGrow: 1,
    minWidth: 92,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statValue: {
    color: '#F5F4F0',
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(245, 244, 240, 0.6)',
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
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
    borderColor: '#D8DADF',
    borderRadius: Spacing.two,
    borderWidth: 1,
    color: '#111827',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#F5B342',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#101010',
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
});
