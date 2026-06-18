import { Stack } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { DashboardNavigation } from '@/components/dashboard-navigation';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const theme = useTheme();

  return (
    <View
      style={[
        styles.layout,
        { backgroundColor: theme.background },
        isWide ? styles.layoutWide : styles.layoutNarrow,
      ]}>
      <DashboardNavigation />
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="matricula" />
          <Stack.Screen name="estudiantes" />
          <Stack.Screen name="profesores" />
          <Stack.Screen name="usuarios" />
          <Stack.Screen name="salones" />
          <Stack.Screen name="horarios" />
          <Stack.Screen name="asistencias" />
          <Stack.Screen name="comunicados" />
          <Stack.Screen name="boletines" />
          <Stack.Screen name="notas" />
          <Stack.Screen name="periodos" />
          <Stack.Screen name="asignaturas" />
          <Stack.Screen name="mis-notas" />
          <Stack.Screen name="mis-asistencias" />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  layoutWide: {
    flexDirection: 'row',
  },
  layoutNarrow: {
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
