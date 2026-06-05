import { useRouter } from 'expo-router';
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import BuildingOffice2Icon from 'react-native-heroicons/outline/BuildingOffice2Icon';
import SparklesIcon from 'react-native-heroicons/outline/SparklesIcon';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SalonesScreen() {
  const router = useRouter();

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={styles.hero}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(dashboard)/dashboard')}>
            <ArrowLeftIcon width={18} height={18} color="#F5F4F0" />
          </Pressable>
          <View style={styles.heroText}>
            <ThemedText type="small" style={styles.kicker}>
              Proximamente
            </ThemedText>
            <ThemedText type="title" style={styles.heroTitle}>
              Salones
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Preparado para una gestion visual de aulas, grupos y espacios del colegio.
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.cardIcon}>
          <BuildingOffice2Icon width={22} height={22} color="#F5B342" />
        </View>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Módulo en desarrollo
        </ThemedText>
        <ThemedText style={styles.cardDescription}>
          Aquí se gestionarán salones y aulas con la misma línea visual moderna del resto del
          sistema.
        </ThemedText>
        <View style={styles.badgeRow}>
          <Badge icon={SparklesIcon} label="Diseño listo" />
          <Badge icon={BuildingOffice2Icon} label="Estructura preparada" />
        </View>
      </ThemedView>
    </ScreenShell>
  );
}

function Badge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  label: string;
}) {
  return (
    <View style={styles.badge}>
      <Icon width={14} height={14} color="#F5B342" />
      <ThemedText style={styles.badgeText}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    gap: Spacing.four,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#232936',
    gap: Spacing.two,
  },
  heroGlowA: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.12,
  },
  heroGlowB: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.08,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroText: {
    flex: 1,
    gap: 4,
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
    lineHeight: 20,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#232936',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 179, 66, 0.12)',
  },
  cardTitle: {
    color: '#F5F4F0',
  },
  cardDescription: {
    color: '#A7B0C0',
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: '#2A3344',
  },
  badgeText: {
    color: '#D4D9E2',
    fontSize: 12,
    fontWeight: '700',
  },
});
