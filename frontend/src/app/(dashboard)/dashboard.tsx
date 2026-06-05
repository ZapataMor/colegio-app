import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MODULOS_ADMIN, getWelcomeForRole, isAdmin } from '@/lib/dashboard';
import { getUserSession, setUserSession, type UserSession } from '@/lib/session';

export default function DashboardScreen() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const sessionData = getUserSession();
    if (!sessionData) {
      router.replace('/');
    } else {
      setSession(sessionData);
    }
  }, []);

  const handleLogout = () => {
    setUserSession(null);
    router.replace('/');
  };

  const handleNavigateToModulo = (ruta: string) => {
    router.push(ruta as any);
  };

  if (!session) {
    return (
      <ScreenShell contentStyle={styles.shellContent}>
        <ThemedText>Cargando...</ThemedText>
      </ScreenShell>
    );
  }

  const welcome = getWelcomeForRole(session.rol, session.nombre);
  const admin = isAdmin(session.rol);

  return (
    <ScreenShell contentStyle={styles.shellContent}>
        <View style={styles.hero}>
          <View style={styles.heroGlowA} />
          <View style={styles.heroGlowB} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="small" style={styles.kicker}>
                Panel principal
              </ThemedText>
              <ThemedText type="title" style={styles.title}>
                {welcome.titulo}
              </ThemedText>
              <ThemedText style={styles.subtitle}>{welcome.subtitulo}</ThemedText>
              {session.welcomeMessage ? (
                <ThemedView type="backgroundElement" style={styles.welcomeCard}>
                  <ThemedText type="small" style={styles.welcomeMessage}>
                    {session.welcomeMessage}
                  </ThemedText>
                </ThemedView>
              ) : null}
              <ThemedText type="small" style={styles.rolBadge}>
                Rol: {session.rol}
                {session.roles && session.roles.length > 1
                  ? ` | tambien: ${session.roles.filter((r) => r !== session.rol).join(', ')}`
                  : ''}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}>
              <ThemedText style={styles.logoutText}>Cerrar sesion</ThemedText>
            </Pressable>
          </View>
        </View>

        {admin ? (
          <View style={styles.modulesWrap}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Modulos disponibles
            </ThemedText>
            <FlatList
              data={MODULOS_ADMIN}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleNavigateToModulo(item.ruta)}
                  style={({ pressed }) => [styles.moduloCard, pressed && styles.moduloCardPressed]}>
                  <ThemedView type="backgroundElement" style={styles.moduloContent}>
                    <View style={styles.moduloIconWrap}>
                      <item.icon width={22} height={22} color="#F5B342" />
                    </View>
                    <View style={styles.moduloText}>
                      <ThemedText type="subtitle" style={styles.moduloNombre}>
                        {item.nombre}
                      </ThemedText>
                      <ThemedText type="small" style={styles.moduloDescripcion}>
                        {item.descripcion}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.moduloArrow}>→</ThemedText>
                  </ThemedView>
                </Pressable>
              )}
              contentContainerStyle={styles.modulosList}
            />
          </View>
        ) : (
          <ThemedView type="backgroundElement" style={styles.emptyModules}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Modulos en preparacion
            </ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Los modulos para tu rol ({session.rol}) estaran disponibles en una proxima
              actualizacion. Por ahora puedes cerrar sesion o contactar al administrador.
            </ThemedText>
          </ThemedView>
        )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    gap: Spacing.three,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#232936',
  },
  heroGlowA: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.15,
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.08,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: { flex: 1, gap: Spacing.two },
  kicker: {
    color: '#F5B342',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: { marginBottom: 0, color: '#F5F4F0' },
  subtitle: { opacity: 0.78, color: 'rgba(245, 244, 240, 0.72)' },
  welcomeCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 3,
    borderLeftColor: '#F5B342',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  welcomeMessage: { lineHeight: 20, opacity: 0.9, color: '#F5F4F0' },
  rolBadge: {
    opacity: 0.68,
    textTransform: 'capitalize',
    color: 'rgba(245, 244, 240, 0.72)',
  },
  logoutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#F5B342',
    borderRadius: Spacing.two,
  },
  logoutButtonPressed: { opacity: 0.8 },
  logoutText: { color: '#101010', fontWeight: '700', fontSize: 12 },
  modulesWrap: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  modulosList: { gap: Spacing.three, paddingVertical: Spacing.three },
  moduloCard: { marginBottom: Spacing.two },
  moduloCardPressed: { opacity: 0.7 },
  moduloContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moduloIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 179, 66, 0.14)',
  },
  moduloIcono: { fontSize: 26 },
  moduloText: { flex: 1, gap: Spacing.one },
  moduloNombre: { fontWeight: '600' },
  moduloDescripcion: { opacity: 0.6 },
  moduloArrow: { fontSize: 20, opacity: 0.5 },
  emptyModules: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  emptyTitle: { textAlign: 'center' },
  emptyDescription: { textAlign: 'center', opacity: 0.7, lineHeight: 22 },
});
