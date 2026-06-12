import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type PeriodoEstado = 'activo' | 'inactivo' | 'cerrado';

type Periodo = {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: PeriodoEstado;
};

const ESTADOS: PeriodoEstado[] = ['activo', 'inactivo', 'cerrado'];

const estadoColor = (estado: PeriodoEstado) => {
  if (estado === 'activo') return '#8FBF26';
  if (estado === 'cerrado') return '#F25C5C';
  return '#A0A8B2';
};

const emptyForm = { nombre: '', fechaInicio: '', fechaFin: '', estado: 'activo' as PeriodoEstado };

export default function PeriodosScreen() {
  const theme = useTheme();
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Periodo | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch<Periodo[]>('/api/periodos');
      setPeriodos(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar periodos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (p: Periodo) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      fechaInicio: p.fecha_inicio.slice(0, 10),
      fechaFin: p.fecha_fin.slice(0, 10),
      estado: p.estado,
    });
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) {
      Alert.alert('Faltan datos', 'Nombre, fecha de inicio y fecha de fin son obligatorios.');
      return;
    }
    try {
      setSaving(true);
      const body = {
        nombre: form.nombre.trim(),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        estado: form.estado,
      };
      if (editing) {
        await apiFetch(`/api/periodos/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/periodos', { method: 'POST', body });
      }
      setModalVisible(false);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const deletePeriodo = (p: Periodo) => {
    const remove = async () => {
      try {
        await apiFetch(`/api/periodos/${p.id}`, { method: 'DELETE' });
        setPeriodos((prev) => prev.filter((x) => x.id !== p.id));
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Eliminar el periodo "${p.nombre}"?`)) remove();
      return;
    }
    Alert.alert('Eliminar', `Eliminar el periodo "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <ScreenShell contentStyle={styles.shell}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
          <CalendarDaysIcon width={20} height={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
            Calendario escolar
          </ThemedText>
          <ThemedText style={styles.title}>Periodos academicos</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {periodos.length} periodo{periodos.length !== 1 ? 's' : ''} registrado{periodos.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        <Pressable onPress={openCreate} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <PlusIcon width={16} height={16} color={theme.primaryText} />
          <ThemedText style={[styles.addBtnText, { color: theme.primaryText }]}>Nuevo</ThemedText>
        </Pressable>
      </ThemedView>

      {loading ? (
        <ThemedView type="backgroundElement" style={styles.center}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView type="backgroundElement" style={styles.center}>
          <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          <Pressable onPress={load} style={[styles.outlineBtn, { borderColor: theme.border }]}>
            <ThemedText>Reintentar</ThemedText>
          </Pressable>
        </ThemedView>
      ) : periodos.length === 0 ? (
        <ThemedView type="backgroundElement" style={styles.center}>
          <ThemedText style={{ color: theme.textSecondary }}>No hay periodos registrados.</ThemedText>
          <Pressable onPress={openCreate} style={[styles.outlineBtn, { borderColor: theme.primary }]}>
            <ThemedText style={{ color: theme.primary }}>Crear primer periodo</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {periodos.map((p) => (
            <ThemedView key={p.id} type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <View style={styles.cardLeft}>
                <View style={[styles.estadoBadge, { backgroundColor: `${estadoColor(p.estado)}22` }]}>
                  <ThemedText type="small" style={[styles.estadoText, { color: estadoColor(p.estado) }]}>
                    {p.estado}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cardNombre}>{p.nombre}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {p.fecha_inicio?.slice(0, 10)} → {p.fecha_fin?.slice(0, 10)}
                </ThemedText>
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={() => openEdit(p)} style={styles.iconBtn}>
                  <PencilSquareIcon width={16} height={16} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => deletePeriodo(p)} style={[styles.deleteIconBtn, { borderColor: `${theme.danger}55` }]}>
                  <TrashIcon width={16} height={16} color={theme.danger} />
                </Pressable>
              </View>
            </ThemedView>
          ))}
        </ScrollView>
      )}

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: theme.border }]}>
            <ThemedText style={styles.modalTitle}>{editing ? 'Editar periodo' : 'Nuevo periodo'}</ThemedText>

            <Field label="Nombre del periodo" value={form.nombre} onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))} placeholder="Ej. Periodo 1 - 2026" />
            <Field label="Fecha de inicio (YYYY-MM-DD)" value={form.fechaInicio} onChangeText={(v) => setForm((f) => ({ ...f, fechaInicio: v }))} placeholder="2026-01-15" />
            <Field label="Fecha de fin (YYYY-MM-DD)" value={form.fechaFin} onChangeText={(v) => setForm((f) => ({ ...f, fechaFin: v }))} placeholder="2026-03-30" />

            <View style={styles.estadoRow}>
              <ThemedText type="small" style={{ opacity: 0.7 }}>Estado</ThemedText>
              <View style={styles.estadoOptions}>
                {ESTADOS.map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setForm((f) => ({ ...f, estado: e }))}
                    style={[styles.estadoOption, form.estado === e && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                    <ThemedText type="small" style={[styles.estadoOptionText, form.estado === e && { color: theme.primaryText }]}>
                      {e}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable disabled={saving} onPress={() => setModalVisible(false)} style={[styles.outlineBtn, { borderColor: theme.border }]}>
                <ThemedText>Cancelar</ThemedText>
              </Pressable>
              <Pressable disabled={saving} onPress={save} style={[styles.outlineBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={{ opacity: 0.68 }}>{label}</ThemedText>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.fieldInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceMuted }]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { gap: Spacing.two },
  hero: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.two, paddingVertical: 8, borderRadius: 6 },
  addBtnText: { fontWeight: '600', fontSize: 13 },
  center: { minHeight: 180, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingBottom: Spacing.five },
  card: { flexGrow: 1, flexBasis: '47%', minWidth: 150, borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.two, justifyContent: 'space-between' },
  cardLeft: { gap: 4 },
  estadoBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  estadoText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardNombre: { fontWeight: '600', fontSize: 15 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  iconBtn: { width: 34, height: 34, borderWidth: 1, borderColor: '#C0C8D0', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  deleteIconBtn: { width: 34, height: 34, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modal: { width: '100%', maxWidth: 520, borderWidth: 1, borderRadius: 10, padding: Spacing.four, gap: Spacing.two },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  field: { gap: 4 },
  fieldInput: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two },
  estadoRow: { gap: 6 },
  estadoOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  estadoOption: { paddingHorizontal: Spacing.two, paddingVertical: 7, borderWidth: 1, borderColor: '#B8BEC8', borderRadius: 999 },
  estadoOptionText: { fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: 4 },
  outlineBtn: { minHeight: 40, minWidth: 100, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
