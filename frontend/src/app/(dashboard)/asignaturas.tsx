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
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import BookOpenIcon from 'react-native-heroicons/outline/BookOpenIcon';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';

import ConfirmModal from '@/components/ui/ConfirmModal';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type AsignaturaEstado = 'activo' | 'inactivo';

type Asignatura = {
  id: number;
  area_id: number;
  area_nombre: string;
  nombre: string;
  descripcion: string | null;
  estado: AsignaturaEstado;
};

type Area = {
  id: number;
  nombre: string;
  estado: string;
};

const ESTADOS: { label: string; value: 'Todos' | AsignaturaEstado }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
];

const estadoVisual = (estado: AsignaturaEstado, theme: ReturnType<typeof useTheme>) =>
  estado === 'activo'
    ? { color: theme.accent, label: 'Activo' }
    : { color: theme.textSecondary, label: 'Inactivo' };

export default function AsignaturasScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth: DimensionValue = width < 560 ? '100%' : width < 920 ? '48%' : '31.5%';

  const [asignaturasData, setAsignaturasData] = useState<Asignatura[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Todos' | AsignaturaEstado>('Todos');
  const [editing, setEditing] = useState<Asignatura | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    areaId: '',
    descripcion: '',
    estado: 'activo' as AsignaturaEstado,
  });
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [asigRes, areasRes] = await Promise.all([
        apiFetch<Asignatura[]>('/api/asignaturas'),
        apiFetch<Area[]>('/api/asignaturas/areas'),
      ]);
      setAsignaturasData(asigRes.data ?? []);
      setAreas(areasRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar asignaturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const asignaturas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return asignaturasData.filter((item) => {
      const matchesSearch =
        !q || `${item.nombre} ${item.area_nombre}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'Todos' || item.estado === filter;
      return matchesSearch && matchesFilter;
    });
  }, [asignaturasData, filter, search]);

  const stats = useMemo(() => {
    const activas = asignaturasData.filter((a) => a.estado === 'activo').length;
    const areasCount = new Set(asignaturasData.map((a) => a.area_id)).size;
    return {
      total: asignaturasData.length,
      activas,
      inactivas: asignaturasData.length - activas,
      areas: areasCount,
    };
  }, [asignaturasData]);

  const grouped = useMemo(
    () =>
      asignaturas.reduce<Record<string, Asignatura[]>>((acc, item) => {
        const key = item.area_nombre || 'Sin area';
        acc[key] = [...(acc[key] ?? []), item];
        return acc;
      }, {}),
    [asignaturas]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: '',
      areaId: areas[0] ? String(areas[0].id) : '',
      descripcion: '',
      estado: 'activo',
    });
    setModalVisible(true);
  };

  const openEdit = (asignatura: Asignatura) => {
    setEditing(asignatura);
    setForm({
      nombre: asignatura.nombre,
      areaId: String(asignatura.area_id),
      descripcion: asignatura.descripcion ?? '',
      estado: asignatura.estado,
    });
    setModalVisible(true);
  };

  const saveAsignatura = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('Faltan datos', 'El nombre de la asignatura es obligatorio.');
      return;
    }
    if (!form.areaId) {
      Alert.alert('Faltan datos', 'Selecciona el area de la asignatura.');
      return;
    }

    try {
      setSaving(true);
      const body = {
        nombre: form.nombre.trim(),
        areaId: Number(form.areaId),
        descripcion: form.descripcion.trim() || null,
        estado: form.estado,
      };
      const res = editing
        ? await apiFetch<Asignatura>(`/api/asignaturas/${editing.id}`, { method: 'PUT', body })
        : await apiFetch<Asignatura>('/api/asignaturas', { method: 'POST', body });

      if (res.data) {
        setAsignaturasData((current) =>
          editing
            ? current.map((item) => (item.id === editing.id ? res.data! : item))
            : [res.data!, ...current]
        );
      } else {
        await load();
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la asignatura.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAsignatura = (asignatura: Asignatura) => {
    setConfirmState({
      title: 'Eliminar asignatura',
      message: `¿Deseas eliminar ${asignatura.nombre}?`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/asignaturas/${asignatura.id}`, { method: 'DELETE' });
          setAsignaturasData((current) => current.filter((item) => item.id !== asignatura.id));
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar la asignatura.');
        }
      },
    });
  };

  const areaOptions = areas.map((area) => ({ value: String(area.id), label: area.nombre }));

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}20` }]}>
            <BookOpenIcon width={22} height={22} color={theme.primary} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
              Gestion academica
            </ThemedText>
            <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
              Asignaturas
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Administra las materias del colegio: area, descripcion y estado.
            </ThemedText>
          </View>
          <Pressable onPress={openCreate} style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <PlusIcon width={16} height={16} color={theme.primaryText} />
            <ThemedText style={[styles.addText, { color: theme.primaryText }]}>Nueva</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Total" value={stats.total} accent={theme.primary} />
        <Metric label="Activas" value={stats.activas} accent={theme.accent} />
        <Metric label="Inactivas" value={stats.inactivas} accent={theme.textSecondary} />
        <Metric label="Areas" value={stats.areas} accent={theme.text} />
      </View>

      <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
        <TextInput
          onChangeText={setSearch}
          placeholder="Buscar asignatura o area"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando asignaturas...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView type="backgroundElement" style={[styles.stateBox, { borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          <Pressable onPress={load} style={[styles.modalButton, { borderColor: theme.border }]}>
            <ThemedText>Reintentar</ThemedText>
          </Pressable>
        </ThemedView>
      ) : asignaturas.length === 0 ? (
        <ThemedView type="backgroundElement" style={[styles.stateBox, { borderColor: theme.border }]}>
          <BookOpenIcon width={26} height={26} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            No hay asignaturas que coincidan con la busqueda.
          </ThemedText>
          <Pressable onPress={openCreate} style={[styles.modalButton, { borderColor: theme.primary }]}>
            <ThemedText style={{ color: theme.primary }}>Crear asignatura</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={styles.sections}>
          {Object.entries(grouped).map(([area, items]) => (
            <View key={area} style={styles.section}>
              <View style={styles.sectionHeader}>
                <AcademicCapIcon width={14} height={14} color={theme.primary} />
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
                  {area}
                </ThemedText>
                <View style={[styles.sectionCount, { backgroundColor: theme.surfaceMuted }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>{items.length}</ThemedText>
                </View>
              </View>
              <View style={styles.cardsGrid}>
                {items.map((asignatura) => (
                  <AsignaturaCard
                    key={asignatura.id}
                    asignatura={asignatura}
                    cardWidth={cardWidth}
                    onDelete={() => deleteAsignatura(asignatura)}
                    onEdit={() => openEdit(asignatura)}
                  />
                ))}
              </View>
            </View>
          ))}
          <Pressable onPress={openCreate} style={[styles.emptyCard, { borderColor: theme.border, width: cardWidth }]}>
            <PlusIcon width={26} height={26} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary }}>Agregar asignatura</ThemedText>
          </Pressable>
        </ScrollView>
      )}

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={[styles.modalCard, { borderColor: theme.border }]}>
            <ThemedText style={styles.modalTitle}>{editing ? 'Editar asignatura' : 'Nueva asignatura'}</ThemedText>
            <Field label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((f) => ({ ...f, nombre }))} />
            <SelectField
              label="Area"
              value={form.areaId}
              options={areaOptions}
              onSelect={(areaId) => setForm((f) => ({ ...f, areaId }))}
            />
            <Field
              label="Descripcion"
              value={form.descripcion}
              multiline
              onChangeText={(descripcion) => setForm((f) => ({ ...f, descripcion }))}
            />
            <View style={styles.statusPicker}>
              {ESTADOS.filter((item) => item.value !== 'Todos').map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setForm((f) => ({ ...f, estado: item.value as AsignaturaEstado }))}
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
              <Pressable disabled={saving} onPress={saveAsignatura} style={[styles.modalButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
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

function AsignaturaCard({
  asignatura,
  cardWidth,
  onDelete,
  onEdit,
}: {
  asignatura: Asignatura;
  cardWidth: DimensionValue;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const theme = useTheme();
  const estado = estadoVisual(asignatura.estado, theme);

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border, width: cardWidth }]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: `${theme.primary}20` }]}>
          <BookOpenIcon width={18} height={18} color={theme.primary} />
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${estado.color}1A` }]}>
          <View style={[styles.statusDot, { backgroundColor: estado.color }]} />
          <ThemedText type="small" style={[styles.statusText, { color: estado.color }]}>
            {estado.label}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.cardName, { color: theme.text }]} numberOfLines={2}>{asignatura.nombre}</ThemedText>
      <View style={styles.areaRow}>
        <AcademicCapIcon width={13} height={13} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
          {asignatura.area_nombre}
        </ThemedText>
      </View>
      <ThemedText type="small" style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
        {asignatura.descripcion || 'Sin descripcion'}
      </ThemedText>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>ID #{asignatura.id}</ThemedText>
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
  label,
  onChangeText,
  value,
  multiline = false,
}: {
  label: string;
  onChangeText: (text: string) => void;
  value: string;
  multiline?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        onChangeText={onChangeText}
        placeholderTextColor={theme.textSecondary}
        style={[styles.fieldInput, multiline && styles.textarea, { borderColor: theme.border, color: theme.text }]}
        value={value}
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={[styles.fieldInput, styles.selectTrigger, { borderColor: theme.border }]}>
        <ThemedText style={{ color: selected ? theme.text : theme.textSecondary, flex: 1 }} numberOfLines={1}>
          {selected?.label ?? 'Seleccionar...'}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>v</ThemedText>
      </Pressable>
      {open ? (
        <ThemedView type="backgroundElement" style={[styles.dropdown, { borderColor: theme.border }]}>
          <ScrollView style={{ maxHeight: 168 }} nestedScrollEnabled>
            {options.length === 0 ? (
              <View style={styles.dropdownItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Sin areas activas</ThemedText>
              </View>
            ) : options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                style={[styles.dropdownItem, option.value === value && { backgroundColor: `${theme.primary}22` }]}>
                <ThemedText type="small" style={{ color: theme.text }}>{option.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      ) : null}
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
  cardIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 7, height: 7, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: 11 },
  cardName: { fontWeight: '800', fontSize: 16 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDesc: { lineHeight: 18, minHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: Spacing.two, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  iconButton: { width: 32, height: 32, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { minWidth: 200, minHeight: 170, borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,17,31,0.45)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modalCard: { width: '100%', maxWidth: 560, borderWidth: 1, borderRadius: 24, padding: Spacing.four, gap: Spacing.three },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  field: { gap: 4 },
  fieldLabel: { opacity: 0.68 },
  fieldInput: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, justifyContent: 'center' },
  textarea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
  selectTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderRadius: 12, marginTop: 2, zIndex: 99 },
  dropdownItem: { paddingHorizontal: Spacing.three, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  statusPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statusOption: { minHeight: 36, borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  statusOptionText: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  modalButton: { minHeight: 44, minWidth: 110, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
