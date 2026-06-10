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
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';
import ClockIcon from 'react-native-heroicons/outline/ClockIcon';
import MapPinIcon from 'react-native-heroicons/outline/MapPinIcon';

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

type Horario = {
  id: number;
  curso_id: number;
  profesor_id: number;
  asignatura_id: number;
  salon_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  curso_nombre: string;
  asignatura_nombre: string;
  salon_nombre: string;
  salon_ubicacion: string | null;
  profesor_nombres: string;
  profesor_apellidos: string;
};

type Catalog = {
  cursos: { id: number; nombre: string }[];
  profesores: { id: number; nombre: string }[];
  asignaturas: { id: number; nombre: string }[];
  salones: { id: number; nombre: string; ubicacion: string | null }[];
};

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

const emptyForm = {
  cursoId: '',
  profesorId: '',
  asignaturaId: '',
  salonId: '',
  diaSemana: 'lunes',
  horaInicio: '07:00:00',
  horaFin: '08:00:00',
  estado: 'activo',
};

export default function HorariosScreen() {
  const theme = useTheme();
  const session = getUserSession();
  const canManage = session?.rol === 'administrador' || session?.rol === 'profesor';
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ cursos: [], profesores: [], asignaturas: [], salones: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Horario | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const query =
        session?.rol === 'profesor' && session.personaId
          ? `?profesorPersonaId=${session.personaId}`
          : '';
      const [horariosRes, catalogRes] = await Promise.all([
        apiFetch<Horario[]>(`/api/horarios${query}`),
        apiFetch<Catalog>('/api/horarios/catalogo'),
      ]);
      setHorarios(horariosRes.data ?? []);
      setCatalog(catalogRes.data ?? { cursos: [], profesores: [], asignaturas: [], salones: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los horarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.personaId, session?.rol]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(
    () => horarios.filter((item) => item.dia_semana === selectedDay),
    [horarios, selectedDay]
  );

  const stats = useMemo(() => {
    const cursos = new Set(horarios.map((item) => item.curso_id)).size;
    const docentes = new Set(horarios.map((item) => item.profesor_id)).size;
    const salones = new Set(horarios.map((item) => item.salon_id)).size;
    return {
      bloques: horarios.length,
      cursos,
      docentes,
      salones,
    };
  }, [horarios]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      cursoId: String(catalog.cursos[0]?.id ?? ''),
      profesorId: String(catalog.profesores[0]?.id ?? ''),
      asignaturaId: String(catalog.asignaturas[0]?.id ?? ''),
      salonId: String(catalog.salones[0]?.id ?? ''),
    });
    setModalVisible(true);
  };

  const openEdit = (item: Horario) => {
    setEditing(item);
    setForm({
      cursoId: String(item.curso_id),
      profesorId: String(item.profesor_id),
      asignaturaId: String(item.asignatura_id),
      salonId: String(item.salon_id),
      diaSemana: item.dia_semana,
      horaInicio: item.hora_inicio,
      horaFin: item.hora_fin,
      estado: item.estado,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.cursoId || !form.profesorId || !form.asignaturaId || !form.salonId) {
      Alert.alert('Validacion', 'Completa curso, docente, asignatura y salon.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        cursoId: Number(form.cursoId),
        profesorId: Number(form.profesorId),
        asignaturaId: Number(form.asignaturaId),
        salonId: Number(form.salonId),
        diaSemana: form.diaSemana,
        horaInicio: normalizeTime(form.horaInicio),
        horaFin: normalizeTime(form.horaFin),
        estado: form.estado,
      };

      if (editing) {
        await apiFetch(`/api/horarios/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/horarios', { method: 'POST', body });
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar el horario.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Horario) => {
    Alert.alert('Eliminar bloque', `Eliminar ${item.asignatura_nombre} de ${item.curso_nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/horarios/${item.id}`, { method: 'DELETE' });
            await loadData();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
          }
        },
      },
    ]);
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}20` }]}>
            <CalendarDaysIcon width={22} height={22} color={theme.primary} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.warning }]}>
              Orquestacion academica
            </ThemedText>
            <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
              Horarios
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Visual semanal clara para cursos, docentes y espacios sin cruces invisibles.
            </ThemedText>
          </View>
        </View>
      </View>

      <ModuleHeader title="Horario semanal" onAdd={canManage ? openCreate : undefined} addLabel="+ Bloque" />

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            loadData();
          }}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
            />
          }
          contentContainerStyle={styles.page}>
          <View style={styles.statsGrid}>
            <StatCard label="Bloques" value={String(stats.bloques)} />
            <StatCard label="Cursos" value={String(stats.cursos)} />
            <StatCard label="Docentes" value={String(stats.docentes)} />
            <StatCard label="Salones" value={String(stats.salones)} />
          </View>

          <OptionChips
            label="Dia"
            options={DIAS.map((dia) => ({ value: dia, label: capitalize(dia) }))}
            value={selectedDay}
            onChange={setSelectedDay}
          />

          <View style={styles.cards}>
            {filtered.length === 0 ? (
              <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  No hay bloques registrados para {capitalize(selectedDay)}.
                </ThemedText>
              </ThemedView>
            ) : (
              filtered.map((item) => (
                <Pressable key={item.id} onPress={() => canManage && openEdit(item)} onLongPress={() => canManage && handleDelete(item)}>
                  <ThemedView type="backgroundElement" style={[styles.scheduleCard, { borderColor: theme.border }]}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardTitleBlock}>
                        <ThemedText type="subtitle" style={styles.cardTitle}>
                          {item.asignatura_nombre}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {item.curso_nombre} · {item.profesor_nombres} {item.profesor_apellidos}
                        </ThemedText>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: `${theme.primary}18` }]}>
                        <ThemedText type="small" style={{ color: theme.primary }}>
                          {item.estado}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.metaRow}>
                      <Meta icon={ClockIcon} text={`${sliceTime(item.hora_inicio)} - ${sliceTime(item.hora_fin)}`} />
                      <Meta icon={MapPinIcon} text={`${item.salon_nombre}${item.salon_ubicacion ? ` · ${item.salon_ubicacion}` : ''}`} />
                    </View>
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
            <ThemedText type="title" style={[styles.modalTitle, { color: theme.text }]}>
              {editing ? 'Editar bloque' : 'Nuevo bloque'}
            </ThemedText>
            <ScrollView contentContainerStyle={styles.form}>
              <OptionChips
                label="Curso"
                options={catalog.cursos.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.cursoId}
                onChange={(cursoId) => setForm((prev) => ({ ...prev, cursoId }))}
              />
              <OptionChips
                label="Docente"
                options={catalog.profesores.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.profesorId}
                onChange={(profesorId) => setForm((prev) => ({ ...prev, profesorId }))}
              />
              <OptionChips
                label="Asignatura"
                options={catalog.asignaturas.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.asignaturaId}
                onChange={(asignaturaId) => setForm((prev) => ({ ...prev, asignaturaId }))}
              />
              <OptionChips
                label="Salon"
                options={catalog.salones.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.salonId}
                onChange={(salonId) => setForm((prev) => ({ ...prev, salonId }))}
              />
              <OptionChips
                label="Dia"
                options={DIAS.map((dia) => ({ value: dia, label: capitalize(dia) }))}
                value={form.diaSemana}
                onChange={(diaSemana) => setForm((prev) => ({ ...prev, diaSemana }))}
              />
              <FormField label="Hora inicio" value={form.horaInicio} onChangeText={(horaInicio) => setForm((prev) => ({ ...prev, horaInicio }))} placeholder="07:00" />
              <FormField label="Hora fin" value={form.horaFin} onChangeText={(horaFin) => setForm((prev) => ({ ...prev, horaFin }))} placeholder="08:00" />
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

function StatCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof ClockIcon; text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.metaItem, { backgroundColor: theme.surfaceMuted }]}>
      <Icon width={14} height={14} color={theme.textSecondary} />
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {text}
      </ThemedText>
    </View>
  );
}

function normalizeTime(value: string) {
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
}

function sliceTime(value: string) {
  return value.slice(0, 5);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
    backgroundColor: '#C9891A',
    opacity: 0.12,
  },
  heroTop: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  heroTitle: {},
  heroSubtitle: { lineHeight: 22 },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: { flex: 1, minWidth: 130, borderRadius: 20, borderWidth: 1, padding: Spacing.three },
  statValue: { fontSize: 28, fontWeight: '700', marginTop: 6 },
  cards: { gap: Spacing.two },
  scheduleCard: { borderRadius: 24, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  cardTitleBlock: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 24, lineHeight: 30 },
  statusPill: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 6, alignSelf: 'flex-start' },
  metaRow: { gap: Spacing.two },
  metaItem: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: Spacing.two, paddingVertical: 8, borderRadius: 14 },
  emptyCard: { borderRadius: 22, borderWidth: 1, padding: Spacing.four, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 20, 29, 0.45)', justifyContent: 'flex-end' },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: Spacing.four,
  },
  modalTitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
