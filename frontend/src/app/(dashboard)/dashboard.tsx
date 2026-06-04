import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

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
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>Cargando...</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const welcome = getWelcomeForRole(session.rol, session.nombre);
  const admin = isAdmin(session.rol);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerText}>
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
                ? ` · también: ${session.roles.filter((r) => r !== session.rol).join(', ')}`
                : ''}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}>
            <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
          </Pressable>
        </View>

        {admin ? (
          <FlatList
            data={MODULOS_ADMIN}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleNavigateToModulo(item.ruta)}
                style={({ pressed }) => [styles.moduloCard, pressed && styles.moduloCardPressed]}>
                <ThemedView type="backgroundElement" style={styles.moduloContent}>
                  <ThemedText style={styles.moduloIcono}>{item.icono}</ThemedText>
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
        ) : (
          <ThemedView type="backgroundElement" style={styles.emptyModules}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Módulos en preparación
            </ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Los módulos para tu rol ({session.rol}) estarán disponibles en una próxima
              actualización. Por ahora puedes cerrar sesión o contactar al administrador.
            </ThemedText>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: Spacing.three,
  },
  headerText: { flex: 1, gap: Spacing.two },
  title: { marginBottom: 0 },
  subtitle: { opacity: 0.75 },
  welcomeCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  welcomeMessage: { lineHeight: 20, opacity: 0.9 },
  rolBadge: { opacity: 0.55, textTransform: 'capitalize' },
  logoutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#DC2626',
    borderRadius: Spacing.two,
  },
  logoutButtonPressed: { opacity: 0.8 },
  logoutText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  modulosList: { gap: Spacing.three, paddingVertical: Spacing.three },
  moduloCard: { marginBottom: Spacing.two },
  moduloCardPressed: { opacity: 0.7 },
  moduloContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  moduloIcono: { fontSize: 28 },
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
