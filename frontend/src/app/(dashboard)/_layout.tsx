import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
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
    </Stack>
  );
}
