import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from './themed-view';

type ScreenShellProps = PropsWithChildren<{
  contentStyle?: ViewStyle;
  scrollEnabled?: boolean;
}>;

export function ScreenShell({ children, contentStyle, scrollEnabled = true }: ScreenShellProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 480 ? Spacing.three : Spacing.four;
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.ambientOrb, styles.ambientOrbTop, { backgroundColor: `${theme.primary}20` }]} />
      <View style={[styles.ambientOrb, styles.ambientOrbBottom, { backgroundColor: `${theme.warning}18` }]} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientOrbTop: {
    width: 280,
    height: 280,
    top: -120,
    right: -80,
  },
  ambientOrbBottom: {
    width: 220,
    height: 220,
    bottom: -90,
    left: -70,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Spacing.three,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
});
