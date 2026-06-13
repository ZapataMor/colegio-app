import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type DimensionValue,
  useWindowDimensions,
  View,
} from 'react-native';
import BuildingOffice2Icon from 'react-native-heroicons/outline/BuildingOffice2Icon';
import ConfirmModal from '@/components/ui/ConfirmModal';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';
import MapPinIcon from 'react-native-heroicons/outline/MapPinIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import UsersIcon from 'react-native-heroicons/outline/UsersIcon';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type SalonEstado = 'activo' | 'inactivo' | 'mantenimiento';

type Salon = {
  id: number;
  nombre: string;
  ubicacion: string | null;
  capacidad: number;
  estado: SalonEstado;
};

const ESTADOS: { label: string; value: 'Todos' | SalonEstado }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
  { label: 'Mantenimiento', value: 'mantenimiento' },
];

const MANTENIMIENTO_COLOR = '#B86B00';

const estadoVisual = (estado: SalonEstado, theme: ReturnType<typeof useTheme>) => {
  if (estado === 'activo') return { color: theme.accent, label: 'Activo' };
  if (estado === 'inactivo') return { color: theme.textSecondary, label: 'Inactivo' };
  return { color: MANTENIMIENTO_COLOR, label: 'Mantenimiento' };
};

export default function SalonesScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth: DimensionValue = width < 560 ? '100%' : width < 920 ? '48%' : '31.5%';
  const [salonesData, setSalonesData] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Todos' | SalonEstado>('Todos');
  const [editing, setEditing] = useState<Salon | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    ubicacion: '',
    capacidad: '40',
    estado: 'activo' as SalonEstado,
  });
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const loadSalones = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Salon[]>('/api/salones');
      setSalonesData(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar salones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalones();
  }, []);

  const salones = useMemo(() => {
    const q = search.trim().toLowerCase();
    return salonesData.filter((salon) => {
      const matchesSearch =
        !q || `${salon.nombre} ${salon.ubicacion ?? ''}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'Todos' || salon.estado === filter;
      return matchesSearch && matchesFilter;
    });
  }, [filter, salonesData, search]);

  const stats = useMemo(() => {
    const activos = salonesData.filter((s) => s.estado === 'activo').length;
    const mantenimiento = salonesData.filter((s) => s.estado === 'mantenimiento').length;
    const capacidad = salonesData.reduce((acc, s) => acc + Number(s.capacidad || 0), 0);
    return { total: salonesData.length, activos, mantenimiento, capacidad };
  }, [salonesData]);

  const maxCapacidad = useMemo(
    () => Math.max(1, ...salonesData.map((s) => Number(s.capacidad || 0))),
    [salonesData]
  );

  const grouped = useMemo(
    () =>
      salones.reduce<Record<string, Salon[]>>((acc, salon) => {
        const key = salon.ubicacion?.split('-')[0]?.trim() || 'Sin ubicacion';
        acc[key] = [...(acc[key] ?? []), salon];
        return acc;
      }, {}),
    [salones]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', ubicacion: '', capacidad: '40', estado: 'activo' });
    setModalVisible(true);
  };

  const openEdit = (salon: Salon) => {
    setEditing(salon);
    setForm({
      nombre: salon.nombre,
      ubicacion: salon.ubicacion ?? '',
      capacidad: String(salon.capacidad),
      estado: salon.estado,
    });
    setModalVisible(true);
  };

  const saveSalon = async () => {
    const capacidad = Number(form.capacidad);
    if (!form.nombre.trim() || isNaN(capacidad) || capacidad < 0) {
      Alert.alert('Faltan datos', 'Nombre y capacidad valida son obligatorios.');
      return;
    }

    try {
      setSaving(true);
      const body = {
        nombre: form.nombre.trim(),
        ubicacion: form.ubicacion.trim() || null,
        capacidad,
        estado: form.estado,
      };
      const res = editing
        ? await apiFetch<Salon>(`/api/salones/${editing.id}`, { method: 'PUT', body })
        : await apiFetch<Salon>('/api/salones', { method: 'POST', body });

      if (res.data) {
        setSalonesData((current) =>
          editing
            ? current.map((salon) => (salon.id === editing.id ? res.data! : salon))
            : [res.data!, ...current]
        );
      } else {
        await loadSalones();
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar el salon.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSalon = (salon: Salon) => {
    setConfirmState({
      title: 'Eliminar salon',
      message: `¿Deseas eliminar ${salon.nombre}?`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/salones/${salon.id}`, { method: 'DELETE' });
          setSalonesData((current) => current.filter((item) => item.id !== salon.id));
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el salon.');
        }
      },
    });
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}20` }]}>
            <BuildingOffice2Icon width={22} height={22} color={theme.primary} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
              Gestion de espacios
            </ThemedText>
            <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
              Salones
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Administra los espacios del colegio: capacidad, ubicacion y estado.
            </ThemedText>
          </View>
          <Pressable onPress={openCreate} style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <PlusIcon width={16} height={16} color={theme.primaryText} />
            <ThemedText style={[styles.addText, { color: theme.primaryText }]}>Nuevo</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Total salones" value={stats.total} accent={theme.primary} />
        <Metric label="Activos" value={stats.activos} accent={theme.accent} />
        <Metric label="Mantenimiento" value={stats.mantenimiento} accent={MANTENIMIENTO_COLOR} />
        <Metric label="Capacidad total" value={stats.capacidad} accent={theme.text} />
      </View>

      <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
        <TextInput
          onChangeText={setSearch}
          placeholder="Buscar salon o ubicacion"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {ESTADOS.map((item) => {
          const active = filter === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setFilter(item.value)}
              style={[
                styles.filterChip,
                { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.backgroundElement },
              ]}>
              <ThemedText style={[styles.filterText, { color: active ? theme.primaryText : theme.textSecondary }]}>
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ThemedView type="backgroundElement" style={[styles.stateBox, { borderColor: theme.border }]}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando salones...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView type="backgroundElement" style={[styles.stateBox, { borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          <Pressable onPress={loadSalones} style={[styles.modalButton, { borderColor: theme.border }]}>
            <ThemedText>Reintentar</ThemedText>
          </Pressable>
        </ThemedView>
      ) : salones.length === 0 ? (
        <ThemedView type="backgroundElement" style={[styles.stateBox, { borderColor: theme.border }]}>
          <BuildingOffice2Icon width={26} height={26} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            No hay salones que coincidan con la busqueda.
          </ThemedText>
          <Pressable onPress={openCreate} style={[styles.modalButton, { borderColor: theme.primary }]}>
            <ThemedText style={{ color: theme.primary }}>Crear salon</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={styles.sections}>
          {Object.entries(grouped).map(([ubicacion, items]) => (
            <View key={ubicacion} style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPinIcon width={14} height={14} color={theme.primary} />
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
                  {ubicacion}
                </ThemedText>
                <View style={[styles.sectionCount, { backgroundColor: theme.surfaceMuted }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>{items.length}</ThemedText>
                </View>
              </View>
              <View style={styles.cardsGrid}>
                {items.map((salon) => (
                  <SalonCard
                    key={salon.id}
                    cardWidth={cardWidth}
                    maxCapacidad={maxCapacidad}
                    onDelete={() => deleteSalon(salon)}
                    onEdit={() => openEdit(salon)}
                    salon={salon}
                  />
                ))}
              </View>
            </View>
          ))}
          <Pressable
            onPress={openCreate}
            style={[styles.emptyCard, { borderColor: theme.border, width: cardWidth }]}>
            <PlusIcon width={26} height={26} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary }}>Agregar salon</ThemedText>
          </Pressable>
        </ScrollView>
      )}

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={[styles.modalCard, { borderColor: theme.border }]}>
            <ThemedText style={styles.modalTitle}>{editing ? 'Editar salon' : 'Nuevo salon'}</ThemedText>
            <View style={styles.formGrid}>
              <Field label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((f) => ({ ...f, nombre }))} />
              <Field label="Ubicacion" value={form.ubicacion} onChangeText={(ubicacion) => setForm((f) => ({ ...f, ubicacion }))} />
              <Field
                keyboardType="numeric"
                label="Capacidad"
                value={form.capacidad}
                onChangeText={(capacidad) => setForm((f) => ({ ...f, capacidad }))}
              />
            </View>
            <View style={styles.statusPicker}>
              {ESTADOS.filter((item) => item.value !== 'Todos').map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setForm((f) => ({ ...f, estado: item.value as SalonEstado }))}
                  style={[styles.statusOption, { borderColor: theme.border }, form.estado === item.value && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                  <ThemedText style={[styles.statusOptionText, form.estado === item.value && { color: theme.primaryText }]}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable disabled={saving} onPress={() => setModalVisible(false)} style={[styles.modalButton, { borderColor: theme.border }]}>
                <ThemedText>Cancelar</ThemedText>
              </Pressable>
              <Pressable disabled={saving} onPress={saveSalon} style={[styles.modalButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
      {confirmState && (
        <ConfirmModal
          visible={true}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          onConfirm={async () => {
            await confirmState.onConfirm();
            setConfirmState(null);
          }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </ScreenShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.metric, { borderColor: theme.border }]}>
      <View style={styles.metricTop}>
        <View style={[styles.metricDot, { backgroundColor: accent }]} />
        <ThemedText type="small" style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      </View>
      <ThemedText style={[styles.metricValue, { color: theme.text }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function SalonCard({
  cardWidth,
  maxCapacidad,
  onDelete,
  onEdit,
  salon,
}: {
  cardWidth: DimensionValue;
  maxCapacidad: number;
  onDelete: () => void;
  onEdit: () => void;
  salon: Salon;
}) {
  const theme = useTheme();
  const estado = estadoVisual(salon.estado, theme);
  const pct = Math.max(6, Math.round((Number(salon.capacidad || 0) / maxCapacidad) * 100));

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border, width: cardWidth }]}>
      <View style={styles.cardTop}>
        <View style={[styles.roomIcon, { backgroundColor: `${theme.primary}20` }]}>
          <BuildingOffice2Icon width={18} height={18} color={theme.primary} />
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${estado.color}1A` }]}>
          <View style={[styles.statusDot, { backgroundColor: estado.color }]} />
          <ThemedText type="small" style={[styles.statusText, { color: estado.color }]}>
            {estado.label}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.roomName, { color: theme.text }]} numberOfLines={1}>{salon.nombre}</ThemedText>
      <View style={styles.locationRow}>
        <MapPinIcon width={13} height={13} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
          {salon.ubicacion || 'Sin ubicacion'}
        </ThemedText>
      </View>

      <View style={styles.capacityBlock}>
        <View style={styles.capacityRow}>
          <View style={styles.capacityLabel}>
            <UsersIcon width={13} height={13} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Capacidad</ThemedText>
          </View>
          <ThemedText type="smallBold" style={{ color: theme.text }}>{salon.capacidad} cupos</ThemedText>
        </View>
        <View style={[styles.gaugeTrack, { backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.gaugeFill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>ID #{salon.id}</ThemedText>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={[styles.iconButton, { borderColor: theme.border }]}>
            <PencilSquareIcon width={15} height={15} color={theme.text} />
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.iconButton, { borderColor: `${theme.danger}55` }]}>
            <TrashIcon width={15} height={15} color={theme.danger} />
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

function Field({
  keyboardType,
  label,
  onChangeText,
  value,
}: {
  keyboardType?: 'default' | 'numeric';
  label: string;
  onChangeText: (text: string) => void;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={theme.textSecondary}
        style={[styles.fieldInput, { borderColor: theme.border, color: theme.text }]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.four,
  },
  heroGlowA: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    top: -50,
    right: -30,
    backgroundColor: '#0F766E',
    opacity: 0.12,
  },
  heroGlowB: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 999,
    bottom: -50,
    left: -20,
    backgroundColor: '#79D0F2',
    opacity: 0.16,
  },
  heroTop: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  heroTitle: {},
  heroSubtitle: { lineHeight: 21 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.two, paddingVertical: 9, borderRadius: 999 },
  addText: { fontWeight: '700', fontSize: 13 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metric: { flex: 1, minWidth: 130, padding: Spacing.three, borderWidth: 1, borderRadius: 18 },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricDot: { width: 8, height: 8, borderRadius: 999 },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 26, fontWeight: '800', marginTop: 8 },
  searchBox: { minHeight: 44, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three },
  searchInput: { flex: 1, paddingVertical: 8 },
  filterRow: { gap: Spacing.two, paddingVertical: 2, paddingRight: Spacing.two },
  filterChip: { minHeight: 36, borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontWeight: '600', fontSize: 13 },
  stateBox: { minHeight: 180, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  sections: { gap: Spacing.four, paddingBottom: Spacing.five },
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionCount: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, alignItems: 'center' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: { minWidth: 200, padding: Spacing.three, borderWidth: 1, borderRadius: 20, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 7, height: 7, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: 11 },
  roomName: { fontWeight: '800', fontSize: 17 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  capacityBlock: { gap: 6, marginTop: 2 },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gaugeTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  gaugeFill: { height: 6, borderRadius: 999 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: Spacing.two, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  iconButton: { width: 32, height: 32, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { minWidth: 200, minHeight: 170, borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,17,31,0.45)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modalCard: { width: '100%', maxWidth: 560, borderWidth: 1, borderRadius: 24, padding: Spacing.four, gap: Spacing.three },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  field: { flexGrow: 1, flexBasis: 160, gap: 4 },
  fieldLabel: { opacity: 0.68 },
  fieldInput: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three },
  statusPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statusOption: { minHeight: 36, borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  statusOptionText: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  modalButton: { minHeight: 44, minWidth: 110, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
