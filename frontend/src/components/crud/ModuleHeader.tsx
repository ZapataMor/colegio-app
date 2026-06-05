import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ModuleHeaderProps = {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
};

export function ModuleHeader({ title, onAdd, addLabel = 'Nuevo' }: ModuleHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.replace('/(dashboard)/dashboard')} style={styles.iconButton}>
        <ArrowLeftIcon width={18} height={18} color="#F5F4F0" />
      </Pressable>
      <View style={styles.center}>
        <ThemedText type="small" style={styles.kicker}>
          Mantenimiento
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      {onAdd ? (
        <Pressable onPress={onAdd} style={styles.addButton}>
          <PlusIcon width={16} height={16} color="#101010" />
          <ThemedText style={styles.addButtonText}>{addLabel}</ThemedText>
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
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#232936',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  kicker: {
    color: '#F5B342',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    color: '#F5F4F0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5B342',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  addButtonText: {
    color: '#101010',
    fontWeight: '800',
    fontSize: 12,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});
