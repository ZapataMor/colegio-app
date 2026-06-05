import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SalonesScreen() {
  const router = useRouter();

  return (
    <ScreenShell contentStyle={styles.shellContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(dashboard)/dashboard')}>
            <ThemedText style={styles.backButton}>← Atrás</ThemedText>
          </Pressable>
          <ThemedText type="title">Salones</ThemedText>
          <View style={{ width: 60 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="title" style={styles.cardTitle}>
              🏫 Salones
            </ThemedText>
            <ThemedText style={styles.cardDescription}>
              Módulo en desarrollo. Aquí se gestionarán los salones y aulas del colegio.
            </ThemedText>
          </ThemedView>
        </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    gap: Spacing.four,
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
  backButton: {
    color: '#2563EB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  cardTitle: {
    textAlign: 'center',
  },
  cardDescription: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
