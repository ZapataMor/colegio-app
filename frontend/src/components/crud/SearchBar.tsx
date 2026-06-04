import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar por nombre, correo o documento...',
}: SearchBarProps) {
  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.icon}>🔍</ThemedText>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: Spacing.three,
    minHeight: 46,
    gap: Spacing.two,
  },
  icon: { fontSize: 16, opacity: 0.5 },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    paddingVertical: Spacing.two,
  },
});
