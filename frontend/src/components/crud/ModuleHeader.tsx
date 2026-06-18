import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ModuleHeaderProps = {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
};

export function ModuleHeader({ title, onAdd, addLabel = 'Nuevo' }: ModuleHeaderProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Pressable
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(dashboard)/dashboard');
        }}
        style={[styles.iconButton, { backgroundColor: theme.surfaceMuted }]}>
        <ArrowLeftIcon width={18} height={18} color={theme.text} />
      </Pressable>
      <View style={styles.center}>
        <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
          Mantenimiento
        </ThemedText>
        <ThemedText type="title" style={[styles.title, { color: theme.text }]}>
          {title}
        </ThemedText>
      </View>
      {onAdd ? (
        <Pressable onPress={onAdd} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <PlusIcon width={16} height={16} color={theme.primaryText} />
          <ThemedText style={[styles.addButtonText, { color: theme.primaryText }]}>
            {addLabel}
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  kicker: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  addButtonText: {
    fontWeight: '800',
    fontSize: 12,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});
