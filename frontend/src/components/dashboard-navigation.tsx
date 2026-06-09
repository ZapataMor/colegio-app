import { useRouter, usePathname } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import HomeIcon from 'react-native-heroicons/outline/HomeIcon';
import ArrowRightOnRectangleIcon from 'react-native-heroicons/outline/ArrowRightOnRectangleIcon';
import Bars3Icon from 'react-native-heroicons/outline/Bars3Icon';

import { ThemedText } from '@/components/themed-text';
import { MODULOS_ADMIN } from '@/lib/dashboard';
import { getUserSession, setUserSession } from '@/lib/session';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HOME_ITEM = {
  id: 'dashboard',
  nombre: 'Panel',
  ruta: '/(dashboard)/dashboard',
  icon: HomeIcon,
};

export function DashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useMemo(() => getUserSession(), []);
  const theme = useTheme();
  const items = [HOME_ITEM, ...MODULOS_ADMIN];

  const handleLogout = () => {
    setUserSession(null);
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.nav,
        { backgroundColor: theme.navBackground, borderColor: theme.border },
        isWide ? styles.sidebar : styles.topbar,
        isWide && !menuOpen && styles.sidebarCollapsed,
        !isWide && menuOpen && styles.topbarOpen,
      ]}>
      <View style={[styles.headerRow, isWide && !menuOpen && styles.headerRowCollapsed]}>
        <Pressable
          onPress={() => setMenuOpen((open) => !open)}
          style={({ pressed }) => [
            styles.menuButton,
            { backgroundColor: theme.primary, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <Bars3Icon width={22} height={22} color={theme.primaryText} />
        </Pressable>

        {menuOpen || !isWide ? (
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/escudo-inmaculada.jpg')}
              style={[styles.brandMark, { borderColor: theme.primary }]}
            />
            <View style={styles.brandTextBlock}>
              <ThemedText style={[styles.brandName, { color: theme.text }]}>
                I.E. #2 Inmaculada
              </ThemedText>
              {isWide ? (
                <ThemedText type="small" style={[styles.brandMeta, { color: theme.textSecondary }]}>
                  {session?.rol ?? 'Panel'}
                </ThemedText>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      {menuOpen ? (
        <>
          <ScrollView
            horizontal={!isWide}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.links,
              isWide ? styles.linksVertical : styles.linksHorizontal,
            ]}>
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.ruta ||
                pathname.endsWith(`/${item.id}`) ||
                (item.id === 'dashboard' && pathname === '/');

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    router.push(item.ruta as any);
                    if (!isWide) setMenuOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.navItem,
                    isWide ? styles.navItemWide : styles.navItemTop,
                    active && styles.navItemActive,
                    active && { backgroundColor: theme.primary, borderColor: theme.primary },
                    pressed && styles.pressed,
                  ]}>
                  <Icon width={18} height={18} color={active ? theme.primaryText : theme.textSecondary} />
                  <ThemedText
                    style={[
                      styles.navItemText,
                      { color: theme.textSecondary },
                      active && { color: theme.primaryText },
                    ]}>
                    {item.nombre}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              { borderColor: `${theme.danger}55`, backgroundColor: `${theme.danger}14` },
              isWide ? styles.logoutWide : styles.logoutTop,
              pressed && styles.pressed,
            ]}>
            <ArrowRightOnRectangleIcon width={18} height={18} color={theme.danger} />
            {isWide ? (
              <ThemedText style={[styles.logoutText, { color: theme.danger }]}>Salir</ThemedText>
            ) : null}
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    zIndex: 10,
  },
  sidebar: {
    width: 248,
    minWidth: 248,
    height: '100%',
    padding: Spacing.three,
    borderRightWidth: 1,
    gap: Spacing.four,
  },
  sidebarCollapsed: {
    width: 68,
    minWidth: 68,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
  },
  topbar: {
    minHeight: 76,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  topbarOpen: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerRowCollapsed: {
    justifyContent: 'center',
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 2,
  },
  brandTextBlock: {
    gap: 2,
  },
  brandName: {
    fontWeight: '900',
    fontSize: 15,
  },
  brandMeta: {
    textTransform: 'capitalize',
  },
  links: {
    gap: Spacing.two,
  },
  linksVertical: {
    flexGrow: 1,
    flexDirection: 'column',
  },
  linksHorizontal: {
    alignItems: 'center',
    paddingRight: Spacing.two,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemWide: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  navItemTop: {
    height: 42,
    paddingHorizontal: Spacing.two,
  },
  navItemActive: {
  },
  navItemText: {
    fontWeight: '800',
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutWide: {
    minHeight: 44,
  },
  logoutTop: {
    width: 42,
    height: 42,
  },
  logoutText: {
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});
