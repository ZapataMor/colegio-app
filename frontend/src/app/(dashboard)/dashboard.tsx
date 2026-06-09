import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { SkeletonList } from '@/components/crud/FeedbackStates';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getModulesForRole, getWelcomeForRole, isAdmin, isProfessor } from '@/lib/dashboard';
import { getUserSession, setUserSession, type UserSession } from '@/lib/session';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
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
        <SkeletonList count={2} />
      </ScreenShell>
    );
  }

  const welcome = getWelcomeForRole(session.rol, session.nombre);
  const admin = isAdmin(session.rol);
  const professor = isProfessor(session.rol);
  const modules = getModulesForRole(session.rol);
  const sectionTitle = professor ? 'Opciones del docente' : 'Modulos disponibles';

  return (
    <ScreenShell contentStyle={styles.shellContent}>
        <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.heroGlowA} />
          <View style={styles.heroGlowB} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
                Panel principal
              </ThemedText>
              <ThemedText type="title" style={[styles.title, { color: theme.text }]}>
                {welcome.titulo}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>{welcome.subtitulo}</ThemedText>
              {session.welcomeMessage ? (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.welcomeCard, { borderLeftColor: theme.primary }]}>
                  <ThemedText type="small" style={[styles.welcomeMessage, { color: theme.text }]}>
                    {session.welcomeMessage}
                  </ThemedText>
                </ThemedView>
              ) : null}
              <ThemedText type="small" style={[styles.rolBadge, { color: theme.textSecondary }]}>
                Rol: {session.rol}
                {session.roles && session.roles.length > 1
                  ? ` | tambien: ${session.roles.filter((r) => r !== session.rol).join(', ')}`
                  : ''}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                { backgroundColor: theme.primary },
                pressed && styles.logoutButtonPressed,
              ]}>
              <ThemedText style={[styles.logoutText, { color: theme.primaryText }]}>Cerrar sesion</ThemedText>
            </Pressable>
          </View>
        </View>

        {admin || professor ? (
          <View style={styles.modulesWrap}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {sectionTitle}
            </ThemedText>
            <FlatList
              data={modules}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleNavigateToModulo(item.ruta)}
                  style={({ pressed }) => [styles.moduloCard, pressed && styles.moduloCardPressed]}>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.moduloContent, { borderColor: theme.border }]}>
                    <View style={[styles.moduloIconWrap, { backgroundColor: `${theme.primary}24` }]}>
                      <item.icon width={22} height={22} color={theme.primary} />
                    </View>
                    <View style={styles.moduloText}>
                      <ThemedText type="subtitle" style={styles.moduloNombre}>
                        {item.nombre}
                      </ThemedText>
                      <ThemedText type="small" style={[styles.moduloDescripcion, { color: theme.textSecondary }]}>
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
    borderWidth: 1,
  },
  heroGlowA: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
    opacity: 0.15,
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: { marginBottom: 0 },
  subtitle: { opacity: 0.78 },
  welcomeCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  welcomeMessage: { lineHeight: 20, opacity: 0.9 },
  rolBadge: {
    opacity: 0.68,
    textTransform: 'capitalize',
  },
  logoutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  logoutButtonPressed: { opacity: 0.8 },
  logoutText: { fontWeight: '700', fontSize: 12 },
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
  },
  moduloIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
