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
import { getUserSession, setUserSession } from '../index';

type UserSession = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
};

type Modulo = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
};

const MODULOS: Modulo[] = [
  {
    id: 'matricula',
    nombre: 'Matrícula',
    descripcion: 'Gestión de matrículas de estudiantes',
    icono: '📋',
    ruta: '/(dashboard)/matricula',
  },
  {
    id: 'estudiantes',
    nombre: 'Estudiantes',
    descripcion: 'Lista y gestión de estudiantes',
    icono: '👨‍🎓',
    ruta: '/(dashboard)/estudiantes',
  },
  {
    id: 'profesores',
    nombre: 'Profesores',
    descripcion: 'Gestión de profesores y docentes',
    icono: '👨‍🏫',
    ruta: '/(dashboard)/profesores',
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Administración de usuarios del sistema',
    icono: '👥',
    ruta: '/(dashboard)/usuarios',
  },
  {
    id: 'salones',
    nombre: 'Salones',
    descripcion: 'Gestión de salones y aulas',
    icono: '🏫',
    ruta: '/(dashboard)/salones',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    // Cargar sesión de memoria global
    const sessionData = getUserSession();
    if (!sessionData) {
      // Si no hay sesión, redirigir al login
      router.replace('/');
    } else {
      setSession(sessionData);
    }
  }, []);

  const handleLogout = () => {
    // Limpiar sesión
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Bienvenido, {session.nombre}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Panel de {session.rol}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}>
            <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
          </Pressable>
        </View>

        {/* Módulos */}
        <FlatList
          data={MODULOS}
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
          scrollEnabled={true}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    opacity: 0.7,
  },
  logoutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#DC2626',
    borderRadius: Spacing.two,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  modulosList: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  moduloCard: {
    marginBottom: Spacing.two,
  },
  moduloCardPressed: {
    opacity: 0.7,
  },
  moduloContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  moduloIcono: {
    fontSize: 28,
  },
  moduloText: {
    flex: 1,
    gap: Spacing.one,
  },
  moduloNombre: {
    fontWeight: '600',
  },
  moduloDescripcion: {
    opacity: 0.6,
  },
  moduloArrow: {
    fontSize: 20,
    opacity: 0.5,
  },
});
