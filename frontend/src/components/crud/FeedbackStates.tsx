import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import ExclamationTriangleIcon from 'react-native-heroicons/outline/ExclamationTriangleIcon';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SkeletonListProps = {
  count?: number;
  variant?: 'compact' | 'detailed';
  style?: StyleProp<ViewStyle>;
};

export function SkeletonList({ count = 3, variant = 'detailed', style }: SkeletonListProps) {
  const theme = useTheme();

  return (
    <View style={[styles.skeletonList, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <ThemedView
          key={index}
          type="backgroundElement"
          style={[
            styles.skeletonCard,
            { borderColor: theme.border },
            variant === 'compact' && styles.skeletonCardCompact,
          ]}>
          <View style={styles.skeletonTop}>
            <View style={[styles.skeletonAvatar, { backgroundColor: `${theme.primary}33` }]} />
            <View style={styles.skeletonTextBlock}>
              <View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: `${theme.textSecondary}22` }]} />
              <View style={[styles.skeletonLine, styles.skeletonSubtitle, { backgroundColor: `${theme.textSecondary}1A` }]} />
            </View>
            <View style={[styles.skeletonPill, { backgroundColor: `${theme.accent}26` }]} />
          </View>

          {variant === 'detailed' ? (
            <>
              <View style={[styles.skeletonDetail, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]} />
              <View style={[styles.skeletonDetail, styles.skeletonDetailShort, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]} />
            </>
          ) : null}

          <View style={styles.skeletonActions}>
            <View style={[styles.skeletonButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]} />
            <View style={[styles.skeletonButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]} />
          </View>
        </ThemedView>
      ))}
    </View>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  message,
  onRetry,
  retrying = false,
  title = 'No pudimos cargar los datos',
  style,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.errorCard, { borderColor: `${theme.danger}55` }, style]}>
      <View style={[styles.errorIcon, { backgroundColor: `${theme.danger}1F` }]}>
        <ExclamationTriangleIcon width={20} height={20} color={theme.danger} />
      </View>
      <ThemedText type="subtitle" style={[styles.errorTitle, { color: theme.text }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.errorMessage, { color: theme.danger }]}>{message}</ThemedText>
      <Pressable
        onPress={onRetry}
        disabled={retrying}
        style={({ pressed }) => [
          styles.retryButton,
          { backgroundColor: theme.primary },
          pressed && styles.pressed,
          retrying && styles.retryButtonDisabled,
        ]}>
        <ThemedText style={[styles.retryText, { color: theme.primaryText }]}>
          {retrying ? 'Reintentando...' : 'Reintentar'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  skeletonList: {
    gap: Spacing.three,
  },
  skeletonCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
  },
  skeletonCardCompact: {
    gap: Spacing.two,
  },
  skeletonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  skeletonTextBlock: {
    flex: 1,
    gap: Spacing.two,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 999,
  },
  skeletonTitle: {
    width: '72%',
  },
  skeletonSubtitle: {
    width: '46%',
  },
  skeletonPill: {
    width: 64,
    height: 24,
    borderRadius: 999,
  },
  skeletonDetail: {
    height: 42,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  skeletonDetailShort: {
    width: '68%',
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  skeletonButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
  },
  errorIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: Spacing.two,
    minHeight: 42,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonDisabled: {
    opacity: 0.55,
  },
  retryText: {
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});
