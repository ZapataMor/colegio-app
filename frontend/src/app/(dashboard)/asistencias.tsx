import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import CheckBadgeIcon from 'react-native-heroicons/outline/CheckBadgeIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { getUserSession } from '@/lib/session';

type Attendance = {
  id: number;
  estudiante_id: number;
  curso_id: number;
  asignatura_id: number;
  profesor_id: number;
  fecha: string;
  estado_asistencia: string;
  observacion: string | null;
  curso_nombre: string;
  asignatura_nombre: string;
  profesor_nombre: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
};

type Catalog = {
  cursos: { id: number; nombre: string }[];
  estudiantes: { id: number; curso_id: number; nombre: string }[];
  profesores: { id: number; nombre: string }[];
  asignaturas: { id: number; nombre: string }[];
};

type SummaryRow = { estado_asistencia: string; total: number };

const ESTADOS = ['presente', 'ausente', 'excusa', 'tardanza'];
const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  estudianteId: '',
  cursoId: '',
  asignaturaId: '',
  profesorId: '',
  fecha: today,
  estadoAsistencia: 'presente',
  observacion: '',
};

export default function AsistenciasScreen() {
  const theme = useTheme();
  const session = getUserSession();
  const canManage = session?.rol === 'administrador' || session?.rol === 'profesor';
  const [items, setItems] = useState<Attendance[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ cursos: [], estudiantes: [], profesores: [], asignaturas: [] });
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      params.set('fecha', selectedDate);
      if (selectedCourse) params.set('cursoId', selectedCourse);
      if (session?.rol === 'profesor' && session.personaId) {
        params.set('profesorPersonaId', String(session.personaId));
      }
      const qs = `?${params.toString()}`;

      const [itemsRes, catalogRes, summaryRes] = await Promise.all([
        apiFetch<Attendance[]>(`/api/asistencias${qs}`),
        apiFetch<Catalog>('/api/asistencias/catalogo'),
        apiFetch<SummaryRow[]>(`/api/asistencias/resumen${qs}`),
      ]);

      setItems(itemsRes.data ?? []);
      setCatalog(catalogRes.data ?? { cursos: [], estudiantes: [], profesores: [], asignaturas: [] });
      setSummary(
        (summaryRes.data ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.estado_asistencia] = Number(row.total);
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las asistencias.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCourse, selectedDate, session?.personaId, session?.rol]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const courseStudents = useMemo(
    () => catalog.estudiantes.filter((item) => !form.cursoId || String(item.curso_id) === form.cursoId),
    [catalog.estudiantes, form.cursoId]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      cursoId: selectedCourse || String(catalog.cursos[0]?.id ?? ''),
      estudianteId: '',
      asignaturaId: String(catalog.asignaturas[0]?.id ?? ''),
      profesorId: String(catalog.profesores[0]?.id ?? ''),
      fecha: selectedDate,
    });
    setModalVisible(true);
  };

  const openEdit = (item: Attendance) => {
    setEditing(item);
    setForm({
      estudianteId: String(item.estudiante_id),
      cursoId: String(item.curso_id),
      asignaturaId: String(item.asignatura_id),
      profesorId: String(item.profesor_id),
      fecha: item.fecha.slice(0, 10),
      estadoAsistencia: item.estado_asistencia,
      observacion: item.observacion ?? '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.estudianteId || !form.cursoId || !form.asignaturaId || !form.profesorId || !form.fecha) {
      Alert.alert('Validacion', 'Completa estudiante, curso, asignatura, docente y fecha.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        estudianteId: Number(form.estudianteId),
        cursoId: Number(form.cursoId),
        asignaturaId: Number(form.asignaturaId),
        profesorId: Number(form.profesorId),
        fecha: form.fecha,
        estadoAsistencia: form.estadoAsistencia,
        observacion: form.observacion.trim() || null,
      };

      if (editing) {
        await apiFetch(`/api/asistencias/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/asistencias', { method: 'POST', body });
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la asistencia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.accent}20` }]}>
            <CheckBadgeIcon width={22} height={22} color={theme.accent} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.primary }]}>
              Seguimiento diario
            </ThemedText>
            <ThemedText type="title">Asistencias</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              Corte por fecha y curso para detectar ausencias, tardanzas y excusas en segundos.
            </ThemedText>
          </View>
        </View>
      </View>

      <ModuleHeader title="Registro de asistencia" onAdd={canManage ? openCreate : undefined} addLabel="+ Registrar" />

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); loadData(); }} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          contentContainerStyle={styles.page}>
          <View style={styles.filterPanel}>
            <FormField label="Fecha" value={selectedDate} onChangeText={setSelectedDate} />
            <OptionChips
              label="Curso"
              options={[
                { value: '', label: 'Todos' },
                ...catalog.cursos.map((item) => ({ value: String(item.id), label: item.nombre })),
              ]}
              value={selectedCourse}
              onChange={setSelectedCourse}
            />
          </View>

          <View style={styles.statsGrid}>
            {ESTADOS.map((estado) => (
              <ThemedView key={estado} type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {capitalize(estado)}
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: getAttendanceColor(estado, theme) }]}>
                  {summary[estado] ?? 0}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          <View style={styles.cards}>
            {items.length === 0 ? (
              <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.textSecondary }}>No hay registros para esta seleccion.</ThemedText>
              </ThemedView>
            ) : (
              items.map((item) => (
                <Pressable key={item.id} onPress={() => canManage && openEdit(item)}>
                  <ThemedView type="backgroundElement" style={[styles.attendanceCard, { borderColor: theme.border }]}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="subtitle" style={styles.cardTitle}>
                          {item.estudiante_nombres} {item.estudiante_apellidos}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {item.curso_nombre} · {item.asignatura_nombre}
                        </ThemedText>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: `${getAttendanceColor(item.estado_asistencia, theme)}20` }]}>
                        <ThemedText type="small" style={{ color: getAttendanceColor(item.estado_asistencia, theme) }}>
                          {capitalize(item.estado_asistencia)}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {item.fecha.slice(0, 10)} · {item.profesor_nombre}
                    </ThemedText>
                    {item.observacion ? <ThemedText>{item.observacion}</ThemedText> : null}
                  </ThemedView>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { borderColor: theme.border }]}>
            <ThemedText type="title" style={styles.modalTitle}>
              {editing ? 'Editar asistencia' : 'Nueva asistencia'}
            </ThemedText>
            <ScrollView contentContainerStyle={styles.form}>
              <OptionChips
                label="Curso"
                options={catalog.cursos.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.cursoId}
                onChange={(cursoId) => setForm((prev) => ({ ...prev, cursoId, estudianteId: '' }))}
              />
              <OptionChips
                label="Estudiante"
                options={courseStudents.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.estudianteId}
                onChange={(estudianteId) => setForm((prev) => ({ ...prev, estudianteId }))}
              />
              <OptionChips
                label="Asignatura"
                options={catalog.asignaturas.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.asignaturaId}
                onChange={(asignaturaId) => setForm((prev) => ({ ...prev, asignaturaId }))}
              />
              <OptionChips
                label="Docente"
                options={catalog.profesores.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.profesorId}
                onChange={(profesorId) => setForm((prev) => ({ ...prev, profesorId }))}
              />
              <FormField label="Fecha" value={form.fecha} onChangeText={(fecha) => setForm((prev) => ({ ...prev, fecha }))} />
              <OptionChips
                label="Estado"
                options={ESTADOS.map((item) => ({ value: item, label: capitalize(item) }))}
                value={form.estadoAsistencia}
                onChange={(estadoAsistencia) => setForm((prev) => ({ ...prev, estadoAsistencia }))}
              />
              <FormField
                label="Observacion"
                value={form.observacion}
                onChangeText={(observacion) => setForm((prev) => ({ ...prev, observacion }))}
                placeholder="Opcional"
                multiline
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
                <ThemedText>Cancelar</ThemedText>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
                {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function getAttendanceColor(status: string, theme: ReturnType<typeof useTheme>) {
  if (status === 'presente') return theme.accent;
  if (status === 'tardanza') return theme.warning;
  return theme.danger;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: { position: 'relative', overflow: 'hidden', borderRadius: 28, borderWidth: 1, padding: Spacing.four },
  heroGlowA: { position: 'absolute', top: -40, right: -10, width: 150, height: 150, borderRadius: 999, backgroundColor: '#3F8C6A', opacity: 0.14 },
  heroGlowB: { position: 'absolute', bottom: -50, left: -20, width: 130, height: 130, borderRadius: 999, backgroundColor: '#C9891A', opacity: 0.12 },
  heroTop: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  filterPanel: { gap: Spacing.three },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: { flex: 1, minWidth: 130, borderRadius: 20, borderWidth: 1, padding: Spacing.three },
  statValue: { fontSize: 26, fontWeight: '700', marginTop: 6 },
  cards: { gap: Spacing.two },
  attendanceCard: { borderRadius: 24, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  cardTitle: { fontSize: 24, lineHeight: 30 },
  statusPill: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 6, alignSelf: 'flex-start' },
  emptyCard: { borderRadius: 22, borderWidth: 1, padding: Spacing.four, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 20, 29, 0.45)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '90%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: Spacing.four },
  modalTitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
