import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type DimensionValue,
  useWindowDimensions,
  View,
} from 'react-native';
import BuildingOffice2Icon from 'react-native-heroicons/outline/BuildingOffice2Icon';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';

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

export default function SalonesScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth: DimensionValue = width < 560 ? '100%' : width < 920 ? '48%' : '31%';
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
    const remove = async () => {
      try {
        await apiFetch(`/api/salones/${salon.id}`, { method: 'DELETE' });
        setSalonesData((current) => current.filter((item) => item.id !== salon.id));
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el salon.');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Deseas eliminar ${salon.nombre}?`);
      if (confirmed) {
        remove();
      }
      return;
    }

    Alert.alert('Eliminar salon', `Deseas eliminar ${salon.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: remove,
      },
    ]);
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
          <BuildingOffice2Icon width={20} height={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
            Gestion de espacios
          </ThemedText>
          <ThemedText style={styles.title}>Salones</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Datos sincronizados con la base local.
          </ThemedText>
        </View>
      </ThemedView>

      <View style={styles.metricsGrid}>
        <Metric label="Total salones" value={stats.total} />
        <Metric label="Activos" value={stats.activos} tone="ok" />
        <Metric label="Mantenimiento" value={stats.mantenimiento} tone="warn" />
        <Metric label="Capacidad total" value={stats.capacidad} />
      </View>

      <View style={styles.controls}>
        <View style={[styles.searchBox, { borderColor: theme.border }]}>
          <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
          <TextInput
            onChangeText={setSearch}
            placeholder="Buscar salon o ubicacion"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
          />
        </View>
        {ESTADOS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setFilter(item.value)}
            style={[styles.filterButton, filter === item.value && { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.filterText, filter === item.value && { color: theme.primaryText }]}>
              {item.label}
            </ThemedText>
          </Pressable>
        ))}
        <Pressable onPress={openCreate} style={styles.addButton}>
          <PlusIcon width={14} height={14} color="#111" />
          <ThemedText style={styles.addText}>Nuevo salon</ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <ThemedView type="backgroundElement" style={styles.stateBox}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando salones...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView type="backgroundElement" style={styles.stateBox}>
          <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          <Pressable onPress={loadSalones} style={[styles.modalButton, { borderColor: theme.border }]}>
            <ThemedText>Reintentar</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={styles.sections}>
          {Object.entries(grouped).map(([ubicacion, items]) => (
            <View key={ubicacion} style={styles.section}>
              <ThemedText type="small" style={styles.sectionTitle}>{ubicacion}</ThemedText>
              <View style={styles.cardsGrid}>
                {items.map((salon) => (
                  <SalonCard
                    key={salon.id}
                    cardWidth={cardWidth}
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
                  style={[styles.statusOption, form.estado === item.value && { backgroundColor: theme.primary }]}>
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
              <Pressable disabled={saving} onPress={saveSalon} style={[styles.modalButton, { backgroundColor: theme.primary }]}>
                {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  const theme = useTheme();
  const color = tone === 'ok' ? theme.accent : tone === 'warn' ? '#B86B00' : theme.text;
  return (
    <ThemedView type="backgroundElement" style={styles.metric}>
      <ThemedText type="small" style={styles.metricLabel}>{label}</ThemedText>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function SalonCard({
  cardWidth,
  onDelete,
  onEdit,
  salon,
}: {
  cardWidth: DimensionValue;
  onDelete: () => void;
  onEdit: () => void;
  salon: Salon;
}) {
  const theme = useTheme();
  const statusColor =
    salon.estado === 'activo' ? theme.accent : salon.estado === 'inactivo' ? theme.textSecondary : theme.danger;
  const statusLabel = salon.estado === 'activo' ? 'Activo' : salon.estado === 'inactivo' ? 'Inactivo' : 'Mantenimiento';

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border, width: cardWidth }]}>
      <View style={styles.cardTop}>
        <View style={[styles.roomIcon, { backgroundColor: `${theme.primary}24` }]}>
          <BuildingOffice2Icon width={16} height={16} color={theme.primary} />
        </View>
        <ThemedText style={[styles.status, { color: statusColor, backgroundColor: `${statusColor}18` }]}>
          {statusLabel}
        </ThemedText>
      </View>
      <ThemedText style={styles.roomName}>{salon.nombre}</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {salon.ubicacion || 'Sin ubicacion'}
      </ThemedText>
      <View style={styles.infoGrid}>
        <Info label="Capacidad" value={`${salon.capacidad} alum.`} />
        <Info label="Estado" value={statusLabel} />
      </View>
      <View style={styles.footer}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>ID #{salon.id}</ThemedText>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={styles.iconButton}>
            <PencilSquareIcon width={14} height={14} color={theme.text} />
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.deleteButton, { borderColor: `${theme.danger}66` }]}>
            <TrashIcon width={14} height={14} color={theme.danger} />
            <ThemedText type="small" style={{ color: theme.danger }}>Eliminar</ThemedText>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.info}>
      <ThemedText type="small" style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.two },
  hero: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    overflow: 'hidden',
  },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metric: { flex: 1, minWidth: 110, padding: Spacing.two, borderRadius: 6 },
  metricLabel: { fontSize: 11, opacity: 0.65 },
  metricValue: { fontSize: 22, fontWeight: '600', marginTop: 4 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  searchBox: { flex: 1, minWidth: 220, minHeight: 38, borderWidth: 1, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two },
  searchInput: { flex: 1, paddingVertical: 6 },
  filterButton: { minHeight: 38, borderWidth: 1, borderColor: '#B8BEC8', borderRadius: 5, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontWeight: '500' },
  addButton: { minHeight: 38, borderWidth: 1, borderColor: '#B8BEC8', borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.three },
  addText: { fontWeight: '500' },
  stateBox: { minHeight: 160, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  sections: { gap: Spacing.three, paddingBottom: Spacing.five },
  section: { gap: Spacing.two },
  sectionTitle: { fontWeight: '600', opacity: 0.7, textTransform: 'uppercase' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: { minWidth: 180, minHeight: 170, padding: Spacing.two, borderWidth: 1, borderRadius: 8, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  status: { fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
  roomName: { fontWeight: '600' },
  infoGrid: { flexDirection: 'row', gap: 6, marginTop: 4 },
  info: { flex: 1, padding: 6, borderRadius: 5 },
  infoLabel: { fontSize: 9, opacity: 0.6 },
  infoValue: { fontSize: 11, fontWeight: '600' },
  footer: { gap: Spacing.two, marginTop: 'auto' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 },
  iconButton: { width: 28, height: 28, borderWidth: 1, borderColor: '#C8CDD6', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { minHeight: 28, borderWidth: 1, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  emptyCard: { minWidth: 180, minHeight: 170, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modalCard: { width: '100%', maxWidth: 560, borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.two },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  field: { flexGrow: 1, flexBasis: 160, gap: 4 },
  fieldLabel: { opacity: 0.68 },
  fieldInput: { minHeight: 40, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two },
  statusPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statusOption: { minHeight: 34, borderWidth: 1, borderColor: '#B8BEC8', borderRadius: 999, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  statusOptionText: { fontSize: 12, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.two },
  modalButton: { minHeight: 40, minWidth: 110, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
