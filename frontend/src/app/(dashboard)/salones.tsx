import { useRouter } from 'expo-router';
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import BuildingOffice2Icon from 'react-native-heroicons/outline/BuildingOffice2Icon';
import SparklesIcon from 'react-native-heroicons/outline/SparklesIcon';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SalonesScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.surfaceMuted }]}
            onPress={() => router.replace('/(dashboard)/dashboard')}>
            <ArrowLeftIcon width={18} height={18} color={theme.text} />
          </Pressable>
          <View style={styles.heroText}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
              Proximamente
            </ThemedText>
            <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
              Salones
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Preparado para una gestion visual de aulas, grupos y espacios del colegio.
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <View style={[styles.cardIcon, { backgroundColor: `${theme.primary}24` }]}>
          <BuildingOffice2Icon width={22} height={22} color={theme.primary} />
        </View>
        <ThemedText type="subtitle" style={[styles.cardTitle, { color: theme.text }]}>
          Módulo en desarrollo
        </ThemedText>
        <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
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
  const theme = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <Icon width={14} height={14} color={theme.primary} />
      <ThemedText style={[styles.badgeText, { color: theme.text }]}>{label}</ThemedText>
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
    borderWidth: 1,
    gap: Spacing.two,
  },
  heroGlowA: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
    opacity: 0.12,
  },
  heroGlowB: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
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
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
  },
  heroSubtitle: {
    lineHeight: 20,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
  },
  cardDescription: {
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
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
