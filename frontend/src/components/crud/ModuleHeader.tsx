import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ModuleHeaderProps = {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
};

export function ModuleHeader({ title, onAdd, addLabel = '+ Nuevo' }: ModuleHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.replace('/(dashboard)/dashboard')}>
        <ThemedText style={styles.backButton}>← Atrás</ThemedText>
      </Pressable>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {onAdd ? (
        <Pressable onPress={onAdd} style={styles.addButton}>
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
    marginBottom: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: Spacing.two,
  },
  backButton: {
    color: '#2563EB',
    fontWeight: '600',
    minWidth: 56,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    minWidth: 72,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  placeholder: {
    minWidth: 72,
  },
});
