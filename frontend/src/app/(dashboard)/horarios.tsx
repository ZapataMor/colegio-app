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
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';
import ChevronLeftIcon from 'react-native-heroicons/outline/ChevronLeftIcon';
import ChevronRightIcon from 'react-native-heroicons/outline/ChevronRightIcon';
import ClockIcon from 'react-native-heroicons/outline/ClockIcon';

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
  curso_nivel: string | null;
  asignatura_nombre: string;
  salon_nombre: string;
  salon_ubicacion: string | null;
  profesor_nombres: string;
  profesor_apellidos: string;
};

type CursoCatalog = { id: number; nombre: string; nivel: string | null };
type SalonCatalog = { id: number; nombre: string; ubicacion: string | null };

type Catalog = {
  cursos: CursoCatalog[];
  profesores: { id: number; nombre: string }[];
  asignaturas: { id: number; nombre: string }[];
  salones: SalonCatalog[];
};

type TimeSlot = {
  key: string;
  start: string;
  end: string;
  label: string;
};

type ScheduleRow = {
  slot: TimeSlot;
  cells: { dia: string; horario: Horario | null }[];
};

const DIAS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miercoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
];

const COL = {
  hora: 96,
  dia: 154,
};

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
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
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

  // Cursos visibles: para profesor solo aquellos donde tiene clases asignadas.
  const visibleCursos = useMemo(() => {
    const ordenar = (lista: CursoCatalog[]) =>
      [...lista].sort((a, b) => compareCurso(a.nombre, b.nombre));

    if (session?.rol !== 'profesor') return ordenar(catalog.cursos);

    const cursosConClase = new Set(horarios.map((item) => item.curso_id));
    const propios = catalog.cursos.filter((curso) => cursosConClase.has(curso.id));
    return ordenar(propios.length > 0 ? propios : catalog.cursos);
  }, [catalog.cursos, horarios, session?.rol]);

  const bloquesPorCurso = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of horarios) {
      map.set(item.curso_id, (map.get(item.curso_id) ?? 0) + 1);
    }
    return map;
  }, [horarios]);

  const selectedCurso = useMemo(
    () => visibleCursos.find((curso) => String(curso.id) === selectedCursoId) ?? null,
    [selectedCursoId, visibleCursos]
  );

  const cursoHorarios = useMemo(
    () => horarios.filter((item) => String(item.curso_id) === selectedCursoId),
    [horarios, selectedCursoId]
  );

  const stats = useMemo(() => {
    const docentes = new Set(cursoHorarios.map((item) => item.profesor_id)).size;
    const asignaturas = new Set(cursoHorarios.map((item) => item.asignatura_id)).size;
    const dias = new Set(cursoHorarios.map((item) => item.dia_semana)).size;
    return {
      bloques: cursoHorarios.length,
      asignaturas,
      docentes,
      dias,
    };
  }, [cursoHorarios]);

  const timeSlots = useMemo(() => {
    const slots = new Map<string, TimeSlot>();

    for (const item of cursoHorarios) {
      const key = `${item.hora_inicio}-${item.hora_fin}`;
      if (!slots.has(key)) {
        slots.set(key, {
          key,
          start: item.hora_inicio,
          end: item.hora_fin,
          label: `${sliceTime(item.hora_inicio)} - ${sliceTime(item.hora_fin)}`,
        });
      }
    }

    return Array.from(slots.values()).sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
    );
  }, [cursoHorarios]);

  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    const byCell = new Map<string, Horario>();

    for (const item of cursoHorarios) {
      byCell.set(`${item.dia_semana}-${item.hora_inicio}-${item.hora_fin}`, item);
    }

    return timeSlots.map((slot) => ({
      slot,
      cells: DIAS.map((dia) => ({
        dia: dia.value,
        horario: byCell.get(`${dia.value}-${slot.start}-${slot.end}`) ?? null,
      })),
    }));
  }, [cursoHorarios, timeSlots]);

  const salonIdForCurso = useCallback(
    (cursoNombre: string | undefined) => {
      if (!cursoNombre) return '';
      const salon = catalog.salones.find((item) => item.nombre === `Salon ${cursoNombre}`);
      return String(salon?.id ?? catalog.salones[0]?.id ?? '');
    },
    [catalog.salones]
  );

  const openCreate = (overrides: Partial<typeof emptyForm> = {}) => {
    setEditing(null);
    setForm({
      ...emptyForm,
      cursoId: selectedCursoId || String(visibleCursos[0]?.id ?? catalog.cursos[0]?.id ?? ''),
      profesorId: String(catalog.profesores[0]?.id ?? ''),
      asignaturaId: String(catalog.asignaturas[0]?.id ?? ''),
      salonId: salonIdForCurso(selectedCurso?.nombre),
      ...overrides,
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
      setSelectedCursoId(String(body.cursoId));
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

  const heroSubtitle = selectedCurso
    ? `Horario semanal del curso ${selectedCurso.nombre} por horas, asignaturas y docentes.`
    : 'Selecciona un curso para revisar su horario semanal de clases.';

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
              {heroSubtitle}
            </ThemedText>
          </View>
        </View>
      </View>

      {selectedCurso ? (
        <ModuleHeader
          title={`Horario - ${selectedCurso.nombre}`}
          onAdd={canManage ? () => openCreate() : undefined}
          addLabel="+ Bloque"
        />
      ) : (
        <ModuleHeader title="Cursos" />
      )}

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
          {!selectedCurso ? (
            <CursoList
              cursos={visibleCursos}
              bloquesPorCurso={bloquesPorCurso}
              onSelect={(curso) => setSelectedCursoId(String(curso.id))}
            />
          ) : (
            <>
              <Pressable
                onPress={() => setSelectedCursoId('')}
                style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
                <ChevronLeftIcon width={16} height={16} color={theme.text} />
                <ThemedText style={{ color: theme.text }}>Todos los cursos</ThemedText>
              </Pressable>

              <CursoSummary curso={selectedCurso} bloques={stats.bloques} />

              <View style={styles.statsGrid}>
                <StatCard label="Bloques" value={String(stats.bloques)} />
                <StatCard label="Asignaturas" value={String(stats.asignaturas)} />
                <StatCard label="Docentes" value={String(stats.docentes)} />
                <StatCard label="Dias" value={String(stats.dias)} />
              </View>

              <WeeklyScheduleTable
                canManage={canManage}
                rows={scheduleRows}
                onCreate={(dia, slot) =>
                  openCreate({
                    cursoId: selectedCursoId,
                    salonId: salonIdForCurso(selectedCurso.nombre),
                    diaSemana: dia,
                    horaInicio: slot.start,
                    horaFin: slot.end,
                  })
                }
                onDelete={handleDelete}
                onEdit={openEdit}
              />
            </>
          )}
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
                options={DIAS.map((dia) => ({ value: dia.value, label: dia.label }))}
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

function CursoList({
  cursos,
  bloquesPorCurso,
  onSelect,
}: {
  cursos: CursoCatalog[];
  bloquesPorCurso: Map<number, number>;
  onSelect: (curso: CursoCatalog) => void;
}) {
  const theme = useTheme();

  if (cursos.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>No hay cursos disponibles.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.cursoGrid}>
      {cursos.map((curso) => {
        const bloques = bloquesPorCurso.get(curso.id) ?? 0;
        return (
          <Pressable
            key={curso.id}
            onPress={() => onSelect(curso)}
            style={[styles.cursoCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.cursoIcon, { backgroundColor: `${theme.primary}18` }]}>
              <AcademicCapIcon width={20} height={20} color={theme.primary} />
            </View>
            <View style={styles.cursoBody}>
              <ThemedText style={[styles.cursoName, { color: theme.text }]}>{curso.nombre}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
                {curso.nivel ?? 'Curso'}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.primary }}>
                {bloques} bloque{bloques === 1 ? '' : 's'}
              </ThemedText>
            </View>
            <ChevronRightIcon width={18} height={18} color={theme.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

function CursoSummary({ curso, bloques }: { curso: CursoCatalog; bloques: number }) {
  const theme = useTheme();

  return (
    <View style={[styles.roomSummary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.roomIcon, { backgroundColor: `${theme.primary}20` }]}>
        <AcademicCapIcon width={18} height={18} color={theme.primary} />
      </View>
      <View style={styles.roomCopy}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Curso seleccionado
        </ThemedText>
        <ThemedText style={[styles.roomName, { color: theme.text }]}>{curso.nombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {curso.nivel ?? 'Sin nivel'} - {bloques} bloque{bloques === 1 ? '' : 's'}
        </ThemedText>
      </View>
    </View>
  );
}

function WeeklyScheduleTable({
  rows,
  canManage,
  onCreate,
  onDelete,
  onEdit,
}: {
  rows: ScheduleRow[];
  canManage: boolean;
  onCreate: (dia: string, slot: TimeSlot) => void;
  onDelete: (item: Horario) => void;
  onEdit: (item: Horario) => void;
}) {
  const theme = useTheme();
  const tableWidth = COL.hora + DIAS.length * COL.dia;

  if (rows.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>
          No hay bloques registrados para este curso.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.tableShell, { borderColor: theme.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: tableWidth }}>
          <View style={[styles.tableHeader, { backgroundColor: theme.surfaceMuted, borderBottomColor: theme.border }]}>
            <View style={[styles.timeHeader, { borderRightColor: theme.border }]}>
              <ClockIcon width={15} height={15} color={theme.textSecondary} />
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                Hora
              </ThemedText>
            </View>
            {DIAS.map((dia) => (
              <View key={dia.value} style={[styles.dayHeader, { borderRightColor: theme.border }]}>
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  {dia.label}
                </ThemedText>
              </View>
            ))}
          </View>

          {rows.map((row) => (
            <View key={row.slot.key} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <View style={[styles.timeCell, { borderRightColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={[styles.timeText, { color: theme.text }]}>{row.slot.label}</ThemedText>
              </View>
              {row.cells.map((cell) => (
                <ScheduleCell
                  key={`${row.slot.key}-${cell.dia}`}
                  canManage={canManage}
                  dia={cell.dia}
                  horario={cell.horario}
                  slot={row.slot}
                  onCreate={onCreate}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function ScheduleCell({
  canManage,
  dia,
  horario,
  slot,
  onCreate,
  onDelete,
  onEdit,
}: {
  canManage: boolean;
  dia: string;
  horario: Horario | null;
  slot: TimeSlot;
  onCreate: (dia: string, slot: TimeSlot) => void;
  onDelete: (item: Horario) => void;
  onEdit: (item: Horario) => void;
}) {
  const theme = useTheme();
  const disabled = !canManage;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (horario) {
          onEdit(horario);
        } else {
          onCreate(dia, slot);
        }
      }}
      onLongPress={() => horario && onDelete(horario)}
      style={[styles.dayCell, { borderRightColor: theme.border }]}>
      {horario ? (
        <View style={[styles.blockContent, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}55` }]}>
          <ThemedText style={[styles.subjectText, { color: theme.text }]} numberOfLines={2}>
            {horario.asignatura_nombre}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={2}>
            {getProfesorNombre(horario)}
          </ThemedText>
          <ThemedText type="small" style={[styles.courseText, { color: theme.primary }]} numberOfLines={1}>
            {horario.salon_nombre}
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.freeSlot, { backgroundColor: theme.surfaceMuted }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Libre
          </ThemedText>
        </View>
      )}
    </Pressable>
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

function normalizeTime(value: string) {
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
}

function sliceTime(value: string) {
  return value.slice(0, 5);
}

function getProfesorNombre(item: Horario) {
  return `${item.profesor_nombres} ${item.profesor_apellidos}`.trim();
}

// Ordena cursos del tipo "1A", "2B", "10C" por grado numerico y luego seccion.
function compareCurso(a: string, b: string) {
  const parse = (nombre: string) => {
    const match = /^(\d+)\s*([A-Za-z]*)/.exec(nombre.trim());
    return {
      grado: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
      seccion: match ? match[2].toUpperCase() : nombre.toUpperCase(),
    };
  };
  const pa = parse(a);
  const pb = parse(b);
  return pa.grado - pb.grado || pa.seccion.localeCompare(pb.seccion);
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
  cursoGrid: { gap: Spacing.two },
  cursoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cursoIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cursoBody: { flex: 1, minWidth: 0, gap: 2 },
  cursoName: { fontSize: 18, fontWeight: '800' },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: Spacing.two,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: { flex: 1, minWidth: 130, borderRadius: 20, borderWidth: 1, padding: Spacing.three },
  statValue: { fontSize: 28, fontWeight: '700', marginTop: 6 },
  roomSummary: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  roomIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roomCopy: { flex: 1, minWidth: 0 },
  roomName: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  tableShell: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { minHeight: 46, flexDirection: 'row', borderBottomWidth: 1 },
  timeHeader: {
    width: COL.hora,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRightWidth: 1,
  },
  dayHeader: {
    width: COL.dia,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  tableRow: { minHeight: 104, flexDirection: 'row', borderBottomWidth: 1 },
  timeCell: {
    width: COL.hora,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  timeText: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  dayCell: {
    width: COL.dia,
    minHeight: 104,
    padding: Spacing.two,
    borderRightWidth: 1,
  },
  blockContent: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.two,
    justifyContent: 'space-between',
    gap: 4,
  },
  subjectText: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  courseText: { fontWeight: '800' },
  freeSlot: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 74,
  },
  emptyCard: { borderRadius: 8, borderWidth: 1, padding: Spacing.four, alignItems: 'center' },
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
