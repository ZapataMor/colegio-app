import { useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useTheme } from '@/hooks/use-theme';

export { getUserSession, setUserSession } from '@/lib/session';

type LoginState = 'idle' | 'loading' | 'success' | 'error';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
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
            <View style={[styles.heroPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.glowA} />
              <View style={styles.glowB} />
              <View style={styles.brandRow}>
                <Image
                  source={require('@/assets/images/escudo-inmaculada.jpg')}
                  style={[styles.brandMark, { borderColor: theme.primary }]}
                />
                <ThemedText style={[styles.brandText, { color: theme.text }]}>
                  Institucion Educativa #2 Inmaculada
                </ThemedText>
              </View>
              <View style={styles.heroCopy}>
                <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
                  Acceso seguro
                </ThemedText>
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
                  Gestiona el colegio con una vista limpia y rapida.
                </ThemedText>
                <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                  Entra al panel segun tu rol, con una experiencia pensada para
                  lectura rapida, contraste fuerte y menos friccion.
                </ThemedText>
              </View>
              
            </View>

            <ThemedView type="backgroundElement" style={[styles.formPanel, { borderColor: theme.border }]}>
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  Iniciar sesion
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Usa tus credenciales para entrar al panel segun tu rol.
                </ThemedText>
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Correo
                </ThemedText>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  onChangeText={setCorreo}
                  placeholder="admin@colegio.com"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={correo}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Contrasena
                </ThemedText>
                <TextInput
                  onChangeText={setContrasena}
                  placeholder="Admin123*"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={contrasena}
                />
              </View>

              {message ? (
                <ThemedText
                  type="small"
                  style={[
                    status === 'error' ? styles.errorText : styles.successText,
                    { color: status === 'error' ? theme.danger : theme.accent },
                  ]}>
                  {message}
                </ThemedText>
              ) : null}

              <Pressable
                disabled={status === 'loading'}
                onPress={iniciarSesion}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: theme.primary },
                  pressed && styles.buttonPressed,
                  status === 'loading' && styles.buttonDisabled,
                ]}>
                {status === 'loading' ? (
                  <ActivityIndicator color={theme.primaryText} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: theme.primaryText }]}>Entrar al panel</ThemedText>
                )}
              </Pressable>

              <ThemedText type="small" style={[styles.apiText, { color: theme.textSecondary }]}>
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
    borderWidth: 1,
    minHeight: 240,
  },
  glowA: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
    opacity: 0.18,
  },
  glowB: {
    position: 'absolute',
    right: -30,
    bottom: -40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
    opacity: 0.08,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    zIndex: 1,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
  },
  brandText: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroCopy: {
    gap: Spacing.two,
    zIndex: 1,
  },
  kicker: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
  },
  heroSubtitle: {
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
    borderRadius: Spacing.two,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  button: {
    alignItems: 'center',
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
    fontWeight: '700',
  },
  errorText: {
    fontWeight: '700',
  },
  successText: {
    fontWeight: '700',
  },
  apiText: {
    opacity: 0.68,
  },
});
