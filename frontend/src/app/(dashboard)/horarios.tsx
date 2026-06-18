import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';
import ClockIcon from 'react-native-heroicons/outline/ClockIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import ConfirmModal from '@/components/ui/ConfirmModal';
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
  area_nombre: string | null;
  salon_nombre: string;
  salon_ubicacion: string | null;
  profesor_persona_id: number;
  profesor_nombres: string;
  profesor_apellidos: string;
};

type CursoCatalog = { id: number; nombre: string; nivel: string | null; jornada?: string | null };
type SalonCatalog = { id: number; nombre: string; ubicacion: string | null };

type Catalog = {
  cursos: CursoCatalog[];
  profesores: { id: number; nombre: string }[];
  asignaturas: { id: number; nombre: string }[];
  salones: SalonCatalog[];
};

type ProfesorPerfil = {
  id: number;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  cargo?: string;
  institucion?: string;
  especialidad?: string | null;
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

const SUBJECT_COLORS = ['#0F766E', '#C9891A', '#2563EB', '#7C3AED', '#DC2626', '#0891B2', '#16A34A', '#EA580C'];

type HorarioDay = {
  dia: string;
  horaInicio: string;
  horaFin: string;
};

type HorarioForm = {
  cursoId: string;
  profesorId: string;
  asignaturaId: string;
  salonId: string;
  dias: HorarioDay[];
  estado: string;
};

const emptyForm: HorarioForm = {
  cursoId: '',
  profesorId: '',
  asignaturaId: '',
  salonId: '',
  dias: [{ dia: 'lunes', horaInicio: '07:00:00', horaFin: '08:00:00' }],
  estado: 'activo',
};

const institution = {
  name: 'Institucion Educativa #2 Inmaculada',
  appName: 'Colegio App',
  location: 'Colombia',
};

export default function HorariosScreen() {
  const session = getUserSession();

  if (session?.rol === 'profesor') {
    return <ProfesorMiHorarioScreen />;
  }

  return <AdminHorariosScreen />;
}

function AdminHorariosScreen() {
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
  const [form, setForm] = useState<HorarioForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [printing, setPrinting] = useState(false);
  const [selectedGrado, setSelectedGrado] = useState('');
  const [selectedProfesorId, setSelectedProfesorId] = useState('');
  const [adminVista, setAdminVista] = useState<'' | 'estudiantes' | 'profesores'>('');
  const [profesorFullId, setProfesorFullId] = useState('');
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const isProfesor = session?.rol === 'profesor';
  const isAdmin = session?.rol === 'administrador';
  const myPersonaId = session?.personaId ? Number(session.personaId) : null;

  // El administrador elige primero entre "estudiantes" y "profesores".
  // El profesor entra directo al flujo por curso (modo "estudiantes").
  const enModoProfesores = isAdmin && adminVista === 'profesores';
  const enMenuAdmin = isAdmin && adminVista === '';

  const loadData = useCallback(async () => {
    try {
      setError('');
      // Se cargan todos los bloques: el profesor tambien debe poder ver
      // "Todos los profesores" dentro de los cursos en los que dicta clase.
      const [horariosRes, catalogRes] = await Promise.all([
        apiFetch<Horario[]>('/api/horarios'),
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cursos disponibles: el administrador ve todos; el profesor solo los
  // cursos en los que imparte alguna clase.
  const availableCursos = useMemo(() => {
    const ordenar = (lista: CursoCatalog[]) =>
      [...lista].sort((a, b) => compareCurso(a.nombre, b.nombre));

    if (!isProfesor) return ordenar(catalog.cursos);

    const cursosConClase = new Set(
      horarios.filter((item) => item.profesor_persona_id === myPersonaId).map((item) => item.curso_id)
    );
    return ordenar(catalog.cursos.filter((curso) => cursosConClase.has(curso.id)));
  }, [catalog.cursos, horarios, isProfesor, myPersonaId]);

  // Grados disponibles segun los cursos visibles.
  const gradeOptions = useMemo(() => {
    const grados = new Set<number>();
    for (const curso of availableCursos) {
      grados.add(parseCursoName(curso.nombre).grado);
    }
    return Array.from(grados)
      .sort((a, b) => a - b)
      .map((grado) => ({ value: String(grado), label: `Grado ${grado}` }));
  }, [availableCursos]);

  const cursosOfGrado = useMemo(
    () =>
      availableCursos.filter(
        (curso) => !selectedGrado || String(parseCursoName(curso.nombre).grado) === selectedGrado
      ),
    [availableCursos, selectedGrado]
  );

  const cursoOptions = useMemo(
    () => cursosOfGrado.map((curso) => ({ value: String(curso.id), label: curso.nombre })),
    [cursosOfGrado]
  );

  const selectedCurso = useMemo(
    () => availableCursos.find((curso) => String(curso.id) === selectedCursoId) ?? null,
    [selectedCursoId, availableCursos]
  );

  // Profesores que dictan en el curso seleccionado (opcion "Todos" incluida).
  const profesorOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of horarios) {
      if (String(item.curso_id) !== selectedCursoId) continue;
      map.set(item.profesor_id, getProfesorNombre(item));
    }
    const lista = Array.from(map.entries())
      .map(([id, nombre]) => ({ value: String(id), label: nombre }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: '', label: 'Todos los profesores' }, ...lista];
  }, [horarios, selectedCursoId]);

  const cursoHorarios = useMemo(
    () =>
      horarios.filter(
        (item) =>
          String(item.curso_id) === selectedCursoId &&
          (!selectedProfesorId || String(item.profesor_id) === selectedProfesorId)
      ),
    [horarios, selectedCursoId, selectedProfesorId]
  );

  // Mantiene los selectores coherentes: grado por defecto y curso valido.
  useEffect(() => {
    if (!selectedGrado && gradeOptions.length > 0) {
      setSelectedGrado(gradeOptions[0].value);
    }
  }, [gradeOptions, selectedGrado]);

  useEffect(() => {
    if (cursosOfGrado.length === 0) {
      if (selectedCursoId) setSelectedCursoId('');
      return;
    }
    if (!cursosOfGrado.some((curso) => String(curso.id) === selectedCursoId)) {
      setSelectedCursoId(String(cursosOfGrado[0].id));
    }
  }, [cursosOfGrado, selectedCursoId]);

  // Si el profesor seleccionado ya no dicta en el curso actual, vuelve a "Todos".
  useEffect(() => {
    if (selectedProfesorId && !profesorOptions.some((option) => option.value === selectedProfesorId)) {
      setSelectedProfesorId('');
    }
  }, [profesorOptions, selectedProfesorId]);

  const selectedProfesorNombre = useMemo(
    () => profesorOptions.find((option) => option.value === selectedProfesorId)?.label ?? 'Todos los profesores',
    [profesorOptions, selectedProfesorId]
  );

  // Modo "Horarios de profesores": opciones y horario completo del docente.
  const profesorFullOptions = useMemo(
    () => catalog.profesores.map((item) => ({ value: String(item.id), label: item.nombre })),
    [catalog.profesores]
  );

  const selectedProfesorFull = useMemo(
    () => catalog.profesores.find((item) => String(item.id) === profesorFullId) ?? null,
    [catalog.profesores, profesorFullId]
  );

  const profesorFullHorarios = useMemo(
    () => (profesorFullId ? horarios.filter((item) => String(item.profesor_id) === profesorFullId) : []),
    [horarios, profesorFullId]
  );

  // Fuente del horario que se muestra/imprime segun el modo activo.
  const tableHorarios = enModoProfesores ? profesorFullHorarios : cursoHorarios;

  const stats = useMemo(() => {
    const docentes = new Set(tableHorarios.map((item) => item.profesor_id)).size;
    const asignaturas = new Set(tableHorarios.map((item) => item.asignatura_id)).size;
    const cursos = new Set(tableHorarios.map((item) => item.curso_id)).size;
    const dias = new Set(tableHorarios.map((item) => item.dia_semana)).size;
    return {
      bloques: tableHorarios.length,
      asignaturas,
      docentes,
      cursos,
      dias,
    };
  }, [tableHorarios]);

  const timeSlots = useMemo(() => {
    const slots = new Map<string, TimeSlot>();

    for (const item of tableHorarios) {
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
  }, [tableHorarios]);

  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    const byCell = new Map<string, Horario>();

    for (const item of tableHorarios) {
      byCell.set(`${item.dia_semana}-${item.hora_inicio}-${item.hora_fin}`, item);
    }

    return timeSlots.map((slot) => ({
      slot,
      cells: DIAS.map((dia) => ({
        dia: dia.value,
        horario: byCell.get(`${dia.value}-${slot.start}-${slot.end}`) ?? null,
      })),
    }));
  }, [tableHorarios, timeSlots]);

  const salonIdForCurso = useCallback(
    (cursoNombre: string | undefined) => {
      if (!cursoNombre) return '';
      const cursosOrdenados = [...catalog.cursos].sort((a, b) => compareCurso(a.nombre, b.nombre));
      const cursoIndex = cursosOrdenados.findIndex((item) => item.nombre === cursoNombre);
      const salon = catalog.salones.find((item) => item.nombre === `Salon ${cursoIndex + 1}`);
      return String(salon?.id ?? catalog.salones[0]?.id ?? '');
    },
    [catalog.cursos, catalog.salones]
  );

  const openCreate = (overrides: Partial<HorarioForm> = {}) => {
    setEditing(null);
    setSaveError('');
    setForm({
      ...emptyForm,
      cursoId: selectedCursoId || String(availableCursos[0]?.id ?? catalog.cursos[0]?.id ?? ''),
      profesorId: String(catalog.profesores[0]?.id ?? ''),
      asignaturaId: String(catalog.asignaturas[0]?.id ?? ''),
      salonId: salonIdForCurso(selectedCurso?.nombre),
      dias: overrides.dias ?? [{ dia: 'lunes', horaInicio: '07:00:00', horaFin: '08:00:00' }],
      ...overrides,
    });
    setModalVisible(true);
  };

  const openEdit = (item: Horario) => {
    setEditing(item);
    setSaveError('');
    setForm({
      cursoId: String(item.curso_id),
      profesorId: String(item.profesor_id),
      asignaturaId: String(item.asignatura_id),
      salonId: String(item.salon_id),
      dias: [{ dia: item.dia_semana, horaInicio: item.hora_inicio, horaFin: item.hora_fin }],
      estado: item.estado,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaveError('');

    if (!form.cursoId || !form.profesorId || !form.asignaturaId || !form.salonId) {
      const message = 'Completa curso, docente, asignatura y salon.';
      setSaveError(message);
      Alert.alert('Validacion', message);
      return;
    }

    if (form.dias.length === 0) {
      const message = 'Selecciona al menos un dia.';
      setSaveError(message);
      Alert.alert('Validacion', message);
      return;
    }

    for (const item of form.dias) {
      if (!item.horaInicio || !item.horaFin) {
        const message = 'Completa hora inicio y fin para cada día.';
        setSaveError(message);
        Alert.alert('Validacion', message);
        return;
      }
      const inicio = normalizeTime(item.horaInicio);
      const fin = normalizeTime(item.horaFin);
      if (fin <= inicio) {
        const message = `La hora final debe ser mayor que la inicial en ${item.dia}.`;
        setSaveError(message);
        Alert.alert('Validacion', message);
        return;
      }
      if (inicio < '06:00:00' || fin > '22:00:00') {
        const message = 'No se puede registrar un horario fuera del horario institucional (6:00am - 10:00pm).';
        setSaveError(message);
        Alert.alert('Validacion', message);
        return;
      }
    }

    setSaving(true);
    try {
      const bodyBase = {
        cursoId: Number(form.cursoId),
        profesorId: Number(form.profesorId),
        asignaturaId: Number(form.asignaturaId),
        salonId: Number(form.salonId),
        estado: form.estado,
      };

      if (editing) {
        const item = form.dias[0];
        await apiFetch(`/api/horarios/${editing.id}`, {
          method: 'PUT',
          body: {
            ...bodyBase,
            diaSemana: item.dia,
            horaInicio: normalizeTime(item.horaInicio),
            horaFin: normalizeTime(item.horaFin),
          },
        });
      } else {
        for (const item of form.dias.slice(0, 5)) {
          await apiFetch('/api/horarios', {
            method: 'POST',
            body: {
              ...bodyBase,
              diaSemana: item.dia,
              horaInicio: normalizeTime(item.horaInicio),
              horaFin: normalizeTime(item.horaFin),
            },
          });
        }
      }
      setSelectedCursoId(String(bodyBase.cursoId));
      setModalVisible(false);
      await loadData();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : JSON.stringify(err, null, 2);
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status?: number }).status : undefined;
      const mappedMessage = (() => {
        if (/profesor ya tiene clase/i.test(errorMessage)) {
          return 'El profesor ya tiene clase a esa hora en otro grupo.';
        }
        if (/sal[oó]n ya est[aá] ocupado/i.test(errorMessage)) {
          return 'El salón ya está ocupado a esa hora.';
        }
        if (/grupo ya tiene clase/i.test(errorMessage)) {
          return 'El grupo ya tiene clase a esa hora.';
        }
        if (/ya existe un horario exactamente igual/i.test(errorMessage)) {
          return 'Ya existe un horario exactamente igual (mismo día, hora, profesor, salón y grupo).';
        }
        if (/mismo profesor a la misma materia dos veces/i.test(errorMessage)) {
          return 'No se puede asignar el mismo profesor a la misma materia dos veces en el mismo grupo.';
        }
        if (/misma materia ya tiene horario registrado/i.test(errorMessage)) {
          return 'La misma materia ya tiene horario registrado en ese día para ese grupo.';
        }
        if (/horario fuera del horario institucional/i.test(errorMessage)) {
          return 'No se puede registrar un horario fuera del horario institucional (6:00am - 10:00pm).';
        }
        if (/conflicto/i.test(errorMessage) || status === 409) {
          return 'No se puede guardar, el horario se cruza con otra materia.';
        }
        return errorMessage || 'No se pudo guardar el horario.';
      })();
      setSaveError(mappedMessage);
      Alert.alert('Error', mappedMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Horario) => {
    setConfirmState({
      title: 'Eliminar bloque',
      message: `Eliminar ${item.asignatura_nombre} de ${item.curso_nombre}?`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/horarios/${item.id}`, { method: 'DELETE' });
          await loadData();
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
        }
      },
    });
  };

  const printHorario = () => {
    const titulo = enModoProfesores ? selectedProfesorFull?.nombre : selectedCurso?.nombre;

    if (!titulo) {
      Alert.alert(
        'Horario no disponible',
        enModoProfesores ? 'Selecciona un profesor para imprimir su horario.' : 'Selecciona un curso para imprimir su horario.'
      );
      return;
    }

    if (tableHorarios.length === 0) {
      Alert.alert('Horario vacío', 'No hay bloques registrados para esta seleccion.');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Impresión disponible en web',
        'Abre este módulo en un navegador para imprimir o exportar el horario en PDF.'
      );
      return;
    }

    setPrinting(true);
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        iframe.remove();
        Alert.alert('Error', 'No se pudo abrir el visor de impresión.');
        return;
      }

      doc.open();
      doc.write(
        enModoProfesores
          ? buildHorarioHtml(titulo, tableHorarios, 'profesor')
          : buildHorarioHtml(titulo, tableHorarios, 'curso', selectedProfesorNombre)
      );
      doc.close();

      const printFrame = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        window.setTimeout(() => iframe.remove(), 800);
      };

      window.setTimeout(printFrame, 250);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo imprimir el horario.');
    } finally {
      setPrinting(false);
    }
  };

  const heroSubtitle = enMenuAdmin
    ? 'Elige que tipo de horario quieres consultar.'
    : enModoProfesores
      ? selectedProfesorFull
        ? `Horario completo del docente ${selectedProfesorFull.nombre}.`
        : 'Selecciona un profesor para ver su horario completo.'
      : selectedCurso
        ? `Horario semanal del curso ${selectedCurso.nombre} por horas, asignaturas y docentes.`
        : 'Selecciona un curso para revisar su horario semanal de clases.';

  const moduleTitle = enMenuAdmin
    ? 'Horarios'
    : enModoProfesores
      ? 'Horarios de profesores'
      : selectedCurso
        ? `Horario - ${selectedCurso.nombre}`
        : isAdmin
          ? 'Horarios de estudiantes'
          : 'Horarios';

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

      <ModuleHeader
        title={moduleTitle}
        onAdd={canManage && !enMenuAdmin && !enModoProfesores && selectedCurso ? () => openCreate() : undefined}
        addLabel="+ Bloque"
      />

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
          {enMenuAdmin ? (
            <View style={styles.menuGrid}>
              <HorarioModeCard
                title="Horarios de estudiantes"
                description="Consulta por grado, curso y profesor el horario de cada salon."
                onPress={() => setAdminVista('estudiantes')}
              />
              <HorarioModeCard
                title="Horarios de profesores"
                description="Selecciona un docente y revisa su horario completo de la semana."
                onPress={() => setAdminVista('profesores')}
              />
            </View>
          ) : (
            <>
              {isAdmin ? (
                <Pressable
                  onPress={() => {
                    setAdminVista('');
                    setProfesorFullId('');
                  }}
                  style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
                  <ThemedText style={{ color: theme.text }}>Volver</ThemedText>
                </Pressable>
              ) : null}

              {enModoProfesores ? (
                <>
                  <ThemedView type="backgroundElement" style={[styles.filtersCard, { borderColor: theme.border }]}>
                    <SelectField
                      label="Profesor"
                      value={profesorFullId}
                      options={profesorFullOptions}
                      placeholder="Selecciona un profesor"
                      onSelect={setProfesorFullId}
                    />
                  </ThemedView>

                  {!selectedProfesorFull ? (
                    <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
                      <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                        Selecciona un profesor para ver su horario completo.
                      </ThemedText>
                    </ThemedView>
                  ) : (
                    <>
                      <ProfesorSummary nombre={selectedProfesorFull.nombre} bloques={stats.bloques} cursos={stats.cursos} />
                      <View style={styles.printRow}>
                        <Pressable
                          disabled={printing || tableHorarios.length === 0}
                          onPress={printHorario}
                          style={[
                            styles.printButton,
                            { backgroundColor: theme.primary, opacity: printing || tableHorarios.length === 0 ? 0.6 : 1 },
                          ]}>
                          {printing ? (
                            <ActivityIndicator color={theme.primaryText} />
                          ) : (
                            <ThemedText style={{ color: theme.primaryText }}>Imprimir horario</ThemedText>
                          )}
                        </Pressable>
                      </View>

                      <View style={styles.statsGrid}>
                        <StatCard label="Bloques" value={String(stats.bloques)} />
                        <StatCard label="Asignaturas" value={String(stats.asignaturas)} />
                        <StatCard label="Cursos" value={String(stats.cursos)} />
                        <StatCard label="Dias" value={String(stats.dias)} />
                      </View>

                      <WeeklyScheduleTable canManage={false} showCurso rows={scheduleRows} />
                    </>
                  )}
                </>
              ) : (
                <>
                  <ThemedView type="backgroundElement" style={[styles.filtersCard, { borderColor: theme.border }]}>
                    <SelectField
                      label="Grado"
                      value={selectedGrado}
                      options={gradeOptions}
                      placeholder="Selecciona un grado"
                      onSelect={(value) => {
                        setSelectedGrado(value);
                        setSelectedCursoId('');
                        setSelectedProfesorId('');
                      }}
                    />
                    <SelectField
                      label="Curso"
                      value={selectedCursoId}
                      options={cursoOptions}
                      placeholder="Selecciona un curso"
                      onSelect={(value) => {
                        setSelectedCursoId(value);
                        setSelectedProfesorId('');
                      }}
                    />
                    <SelectField
                      label="Profesor"
                      value={selectedProfesorId}
                      options={profesorOptions}
                      placeholder="Todos los profesores"
                      onSelect={setSelectedProfesorId}
                    />
                  </ThemedView>

                  {!selectedCurso ? (
                    <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
                      <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                        Selecciona grado y curso para ver el horario.
                      </ThemedText>
                    </ThemedView>
                  ) : (
                    <>
                      <CursoSummary curso={selectedCurso} bloques={stats.bloques} profesor={selectedProfesorNombre} />
                      <View style={styles.printRow}>
                        <Pressable
                          disabled={printing || tableHorarios.length === 0}
                          onPress={printHorario}
                          style={[
                            styles.printButton,
                            { backgroundColor: theme.primary, opacity: printing || tableHorarios.length === 0 ? 0.6 : 1 },
                          ]}>
                          {printing ? (
                            <ActivityIndicator color={theme.primaryText} />
                          ) : (
                            <ThemedText style={{ color: theme.primaryText }}>Imprimir horario</ThemedText>
                          )}
                        </Pressable>
                      </View>

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
                            dias: [{ dia, horaInicio: slot.start, horaFin: slot.end }],
                          })
                        }
                        onDelete={handleDelete}
                        onEdit={openEdit}
                      />
                    </>
                  )}
                </>
              )}
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
            {saveError ? (
              <ThemedView type="backgroundElement" style={[styles.saveErrorBox, { borderColor: theme.danger }]}> 
                <ThemedText style={[styles.saveErrorText, { color: theme.danger }]}>
                  {saveError}
                </ThemedText>
              </ThemedView>
            ) : null}
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
              <DaySelect
                label="Dias"
                options={DIAS}
                selected={form.dias.map((item) => item.dia)}
                maxSelection={editing ? 1 : 5}
                onChange={(dias) =>
                  setForm((prev) => {
                    const existing = prev.dias;
                    const nextDias = dias.map((dia) => {
                      const existingDay = existing.find((item) => item.dia === dia);
                      return (
                        existingDay ?? { dia, horaInicio: existing[0]?.horaInicio ?? '07:00:00', horaFin: existing[0]?.horaFin ?? '08:00:00' }
                      );
                    });
                    return { ...prev, dias: nextDias };
                  })
                }
              />
              {form.dias.map((item) => (
                <ThemedView key={item.dia} type="backgroundElement" style={[styles.dayTimeCard, { borderColor: theme.border }]}>
                  <ThemedText style={[styles.dayTimeLabel, { color: theme.text }]}>{item.dia.toUpperCase()}</ThemedText>
                  <FormField
                    label="Hora inicio"
                    value={item.horaInicio}
                    onChangeText={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        dias: prev.dias.map((d) => (d.dia === item.dia ? { ...d, horaInicio: value } : d)),
                      }))
                    }
                    placeholder="07:00"
                  />
                  <FormField
                    label="Hora fin"
                    value={item.horaFin}
                    onChangeText={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        dias: prev.dias.map((d) => (d.dia === item.dia ? { ...d, horaFin: value } : d)),
                      }))
                    }
                    placeholder="08:00"
                  />
                </ThemedView>
              ))}
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

function ProfesorMiHorarioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = getUserSession();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [perfil, setPerfil] = useState<ProfesorPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');

      const [horariosRes, perfilRes] = await Promise.all([
        apiFetch<Horario[]>('/api/horarios/mi-horario'),
        apiFetch<ProfesorPerfil>('/api/profesores/mi-perfil'),
      ]);

      setHorarios(horariosRes.data ?? []);
      setPerfil(perfilRes.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar tu horario asignado.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const asignaturas = new Set(horarios.map((item) => item.asignatura_id)).size;
    const cursos = new Set(horarios.map((item) => item.curso_id)).size;
    const dias = new Set(horarios.map((item) => item.dia_semana)).size;
    return { bloques: horarios.length, asignaturas, cursos, dias };
  }, [horarios]);

  const timeSlots = useMemo(() => {
    const slots = new Map<string, TimeSlot>();

    for (const item of horarios) {
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
  }, [horarios]);

  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    const byCell = new Map<string, Horario>();

    for (const item of horarios) {
      byCell.set(`${item.dia_semana}-${item.hora_inicio}-${item.hora_fin}`, item);
    }

    return timeSlots.map((slot) => ({
      slot,
      cells: DIAS.map((dia) => ({
        dia: dia.value,
        horario: byCell.get(`${dia.value}-${slot.start}-${slot.end}`) ?? null,
      })),
    }));
  }, [horarios, timeSlots]);

  const nombreCompleto =
    perfil?.nombre_completo ||
    `${perfil?.nombres ?? session?.nombre ?? ''} ${perfil?.apellidos ?? session?.apellido ?? ''}`.trim() ||
    'Profesor';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(dashboard)/dashboard');
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroTop}>
          <Pressable onPress={goBack} style={[styles.teacherBackButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
            <ArrowLeftIcon width={18} height={18} color={theme.text} />
          </Pressable>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}20` }]}>
            <CalendarDaysIcon width={22} height={22} color={theme.primary} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.warning }]}>
              Carga horaria
            </ThemedText>
            <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
              Mis horarios
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Tu horario asignado se carga automaticamente.
            </ThemedText>
          </View>
        </View>
      </View>

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
                loadData(true);
              }}
            />
          }
          contentContainerStyle={styles.page}>
          <TeacherProfileSummary
            nombre={nombreCompleto}
            cargo={perfil?.cargo ?? 'Profesor'}
            institucion={perfil?.institucion ?? institution.name}
            bloques={stats.bloques}
          />

          <View style={styles.statsGrid}>
            <StatCard label="Bloques" value={String(stats.bloques)} />
            <StatCard label="Asignaturas" value={String(stats.asignaturas)} />
            <StatCard label="Cursos" value={String(stats.cursos)} />
            <StatCard label="Dias" value={String(stats.dias)} />
          </View>

          {horarios.length === 0 ? (
            <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
              <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                No tienes horarios asignados actualmente.
              </ThemedText>
            </ThemedView>
          ) : (
            <WeeklyScheduleTable canManage={false} showCurso rows={scheduleRows} />
          )}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <ThemedText type="small" style={[styles.fieldLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={[styles.fieldInput, styles.selectTrigger, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <ThemedText style={{ color: selected ? theme.text : theme.textSecondary, flex: 1 }} numberOfLines={1}>
          {selected?.label ?? placeholder ?? 'Seleccionar...'}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          v
        </ThemedText>
      </Pressable>
      {open ? (
        <ThemedView type="backgroundElement" style={[styles.dropdown, { borderColor: theme.border }]}>
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
            {options.length === 0 ? (
              <View style={styles.dropdownItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Sin opciones
                </ThemedText>
              </View>
            ) : (
              options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                  style={[styles.dropdownItem, option.value === value && { backgroundColor: `${theme.primary}22` }]}>
                  <ThemedText type="small" style={{ color: theme.text }}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </ScrollView>
        </ThemedView>
      ) : null}
    </View>
  );
}

function CursoSummary({ curso, bloques, profesor }: { curso: CursoCatalog; bloques: number; profesor: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.roomSummary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.roomIcon, { backgroundColor: `${theme.primary}20` }]}>
        <AcademicCapIcon width={18} height={18} color={theme.primary} />
      </View>
      <View style={styles.roomCopy}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {profesor}
        </ThemedText>
        <ThemedText style={[styles.roomName, { color: theme.text }]}>{curso.nombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {curso.nivel ?? 'Sin nivel'} - {bloques} bloque{bloques === 1 ? '' : 's'}
        </ThemedText>
      </View>
    </View>
  );
}

function ProfesorSummary({ nombre, bloques, cursos }: { nombre: string; bloques: number; cursos: number }) {
  const theme = useTheme();

  return (
    <View style={[styles.roomSummary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.roomIcon, { backgroundColor: `${theme.primary}20` }]}>
        <AcademicCapIcon width={18} height={18} color={theme.primary} />
      </View>
      <View style={styles.roomCopy}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Docente seleccionado
        </ThemedText>
        <ThemedText style={[styles.roomName, { color: theme.text }]}>{nombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {bloques} bloque{bloques === 1 ? '' : 's'} - {cursos} curso{cursos === 1 ? '' : 's'}
        </ThemedText>
      </View>
    </View>
  );
}

function TeacherProfileSummary({
  nombre,
  cargo,
  institucion,
  bloques,
}: {
  nombre: string;
  cargo: string;
  institucion: string;
  bloques: number;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.roomSummary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.roomIcon, { backgroundColor: `${theme.primary}20` }]}>
        <AcademicCapIcon width={18} height={18} color={theme.primary} />
      </View>
      <View style={styles.roomCopy}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {cargo}
        </ThemedText>
        <ThemedText style={[styles.roomName, { color: theme.text }]}>{nombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {institucion} - {bloques} bloque{bloques === 1 ? '' : 's'} asignado{bloques === 1 ? '' : 's'}
        </ThemedText>
      </View>
    </View>
  );
}

function HorarioModeCard({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.modeIcon, { backgroundColor: `${theme.primary}18` }]}>
        <CalendarDaysIcon width={22} height={22} color={theme.primary} />
      </View>
      <View style={styles.modeBody}>
        <ThemedText style={[styles.modeTitle, { color: theme.text }]}>{title}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {description}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function WeeklyScheduleTable({
  rows,
  canManage,
  showCurso = false,
  onCreate,
  onDelete,
  onEdit,
}: {
  rows: ScheduleRow[];
  canManage: boolean;
  showCurso?: boolean;
  onCreate?: (dia: string, slot: TimeSlot) => void;
  onDelete?: (item: Horario) => void;
  onEdit?: (item: Horario) => void;
}) {
  const theme = useTheme();
  const tableWidth = COL.hora + DIAS.length * COL.dia;
  const subjectColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      for (const cell of row.cells) {
        const subject = cell.horario?.asignatura_nombre;
        if (subject && !map.has(subject)) {
          map.set(subject, SUBJECT_COLORS[map.size % SUBJECT_COLORS.length]);
        }
      }
    }
    return map;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>
          No hay bloques registrados para esta seleccion.
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
                  showCurso={showCurso}
                  dia={cell.dia}
                  horario={cell.horario}
                  subjectColor={cell.horario ? subjectColors.get(cell.horario.asignatura_nombre) : undefined}
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
  showCurso = false,
  dia,
  horario,
  subjectColor,
  slot,
  onCreate,
  onDelete,
  onEdit,
}: {
  canManage: boolean;
  showCurso?: boolean;
  dia: string;
  horario: Horario | null;
  subjectColor?: string;
  slot: TimeSlot;
  onCreate?: (dia: string, slot: TimeSlot) => void;
  onDelete?: (item: Horario) => void;
  onEdit?: (item: Horario) => void;
}) {
  const theme = useTheme();
  const disabled = !canManage;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (horario) {
          onEdit?.(horario);
        } else {
          onCreate?.(dia, slot);
        }
      }}
      onLongPress={() => horario && onDelete?.(horario)}
      style={[styles.dayCell, { borderRightColor: theme.border }]}>
      {horario ? (
        <View style={[styles.blockContent, { backgroundColor: `${subjectColor ?? theme.primary}24`, borderColor: `${subjectColor ?? theme.primary}88` }]}>
          <ThemedText style={[styles.subjectText, { color: theme.text }]} numberOfLines={2}>
            {horario.asignatura_nombre}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={2}>
            {showCurso ? horario.curso_nombre : (horario.area_nombre ?? 'Area academica')}
          </ThemedText>
          {showCurso ? null : (
            <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={2}>
              {getProfesorNombre(horario)}
            </ThemedText>
          )}
          <ThemedText type="small" style={[styles.courseText, { color: subjectColor ?? theme.primary }]} numberOfLines={1}>
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

function DaySelect({
  label,
  options,
  selected,
  maxSelection,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  maxSelection: number;
  onChange: (selected: string[]) => void;
}) {
  const theme = useTheme();

  const toggleDay = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((item) => item !== value));
      return;
    }

    if (selected.length >= maxSelection) {
      Alert.alert('Límite alcanzado', `Solo puedes seleccionar hasta ${maxSelection} días.`);
      return;
    }

    onChange([...selected, value]);
  };

  return (
    <View style={styles.daySelectContainer}>
      <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText type="small" style={[styles.dayHint, { color: theme.textSecondary }]}>Selecciona entre 1 y {maxSelection} días.</ThemedText>
      <View style={styles.dayRow}>
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggleDay(option.value)}
              style={[
                styles.dayChip,
                {
                  backgroundColor: active ? theme.primary : theme.surfaceMuted,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <ThemedText style={[styles.dayChipText, { color: active ? theme.primaryText : theme.textSecondary }]}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <ThemedText type="small" style={[styles.dayHint, { color: theme.textSecondary }]}>Selecciona entre 1 y {maxSelection} días.</ThemedText>
    </View>
  );
}

function sliceTime(value: string) {
  return value.slice(0, 5);
}

function getProfesorNombre(item: Horario) {
  return `${item.profesor_nombres} ${item.profesor_apellidos}`.trim();
}

function buildHorarioHtml(
  titulo: string,
  horarios: Horario[],
  mode: 'curso' | 'profesor' = 'curso',
  profesorLabel = 'Todos los profesores'
) {
  const esProfesor = mode === 'profesor';
  const totalCursos = new Set(horarios.map((item) => item.curso_id)).size;
  const days = DIAS;
  const palette = ['#dbeafe', '#fef3c7', '#fde2e3', '#dcfce7', '#ede9fe', '#ffe4d6', '#d8f5ff', '#f5f3ff'];
  const subjectColor = new Map<string, string>();
  const getSubjectColor = (subject: string) => {
    if (!subjectColor.has(subject)) {
      subjectColor.set(subject, palette[subjectColor.size % palette.length]);
    }
    return subjectColor.get(subject)!;
  };

  const times = Array.from(
    new Map(
      horarios.map((item) => [
        `${item.hora_inicio}-${item.hora_fin}`,
        {
          start: normalizeTime(item.hora_inicio),
          end: normalizeTime(item.hora_fin),
          label: `${sliceTime(item.hora_inicio)} - ${sliceTime(item.hora_fin)}`,
        },
      ])
    ).values()
  ).sort((a, b) => a.start.localeCompare(b.start));

  const scheduleRows = times
    .map((slot) => {
      const cells = days
        .map((dia) => {
          const items = horarios.filter(
            (item) =>
              item.dia_semana === dia.value &&
              normalizeTime(item.hora_inicio) < slot.end &&
              normalizeTime(item.hora_fin) > slot.start
          );
          const cellHtml = items
            .map((item) => {
              const color = getSubjectColor(item.asignatura_nombre);
              return `
                <div class="cell-block" style="background: ${color}; border-color: ${color};">
                  <strong>${escapeHtml(item.asignatura_nombre)}</strong>
                  <span>${escapeHtml(esProfesor ? item.curso_nombre : (item.area_nombre ?? ''))}</span>
                  ${esProfesor ? '' : `<span>${escapeHtml(getProfesorNombre(item))}</span>`}
                  <span>${escapeHtml(item.salon_nombre)}</span>
                </div>
              `;
            })
            .join('');
          return cellHtml ? `<td>${cellHtml}</td>` : '<td class="empty-cell"></td>';
        })
        .join('');
      return `
        <tr>
          <td>${escapeHtml(slot.label)}</td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  const uniqueSubjects = Array.from(
    new Map(
      horarios.map((item) => [
        esProfesor ? `${item.asignatura_nombre}-${item.curso_id}` : item.asignatura_nombre,
        item,
      ])
    ).values()
  );

  const detailRows = uniqueSubjects
    .map((item) => {
      const color = getSubjectColor(item.asignatura_nombre);
      const segundaColumna = esProfesor ? item.curso_nombre : (item.area_nombre ?? '');
      const terceraColumna = esProfesor ? '' : `<td>${escapeHtml(getProfesorNombre(item))}</td>`;
      return `
        <tr>
          <td><span class="subject-pill" style="background:${color};">${escapeHtml(item.asignatura_nombre)}</span></td>
          <td>${escapeHtml(segundaColumna)}</td>
          ${terceraColumna}
          <td>${escapeHtml(item.salon_nombre)}</td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Horario - ${escapeHtml(titulo)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f3f5f7;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #ffffff;
            padding: 16mm;
          }
          .institution {
            text-align: center;
            margin-bottom: 12px;
          }
          .institution h1 {
            margin: 0 0 2px;
            font-size: 18px;
            letter-spacing: 0;
            text-transform: uppercase;
          }
          .institution p {
            margin: 2px 0;
            color: #475569;
            font-size: 11px;
          }
          .section-title {
            margin: 14px 0 6px;
            color: #0f766e;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 12px;
          }
          .info-item {
            background: #f8fafc;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 8px 10px;
          }
          .info-label {
            display: block;
            color: #64748b;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .info-value {
            font-weight: 700;
            font-size: 12px;
          }
          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
          }
          .schedule-table th,
          .schedule-table td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            vertical-align: top;
          }
          .schedule-table th {
            background: #eef2ff;
            color: #334155;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            white-space: nowrap;
            padding: 10px 8px;
          }
          .schedule-table td {
            width: calc((100% - 85px) / 6);
            min-width: 80px;
            padding: 4px 6px;
            vertical-align: top;
            height: 64px;
          }
          .cell-block {
            border: 1px solid transparent;
            border-radius: 10px;
            padding: 6px 8px;
            margin-bottom: 4px;
            box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
          }
          .cell-block strong {
            display: block;
            margin-bottom: 3px;
            font-size: 11px;
          }
          .cell-block span {
            display: block;
            color: #334155;
            font-size: 10px;
            line-height: 1.3;
          }
          .empty-cell {
            min-height: 44px;
            background: #ffffff;
          }
          .detail-table {
            width: 100%;
            border-collapse: collapse;
          }
          .detail-table th,
          .detail-table td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
          }
          .detail-table th {
            background: #eef2ff;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          .subject-pill {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 999px;
            font-size: 10px;
            color: #0f172a;
          }
          @media print {
            body { background: #ffffff; }
            .page { width: auto; min-height: auto; margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="institution">
            <h1>${escapeHtml(institution.name)}</h1>
            <p>${escapeHtml(institution.appName)} - ${escapeHtml(institution.location)}</p>
            <p>${esProfesor ? 'Horario del docente' : 'Horario semanal'} - ${escapeHtml(titulo)}</p>
          </section>

          <section>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">${esProfesor ? 'Docente' : 'Curso'}</span><span class="info-value">${escapeHtml(titulo)}</span></div>
              <div class="info-item"><span class="info-label">${esProfesor ? 'Cursos' : 'Profesor'}</span><span class="info-value">${esProfesor ? totalCursos : escapeHtml(profesorLabel)}</span></div>
              <div class="info-item"><span class="info-label">Fecha</span><span class="info-value">${escapeHtml(new Date().toLocaleDateString())}</span></div>
            </div>
          </section>

          <section>
            <h2 class="section-title">Horario semanal</h2>
            <table class="schedule-table">
              <thead>
                <tr>
                  <th style="width: 85px;">Hora</th>
                  ${days.map((dia) => `<th>${escapeHtml(dia.label)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${scheduleRows || '<tr><td colspan="6" class="empty-cell">No hay bloques registrados.</td></tr>'}
              </tbody>
            </table>
          </section>

          <section>
            <h2 class="section-title">Detalle de materias</h2>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>${esProfesor ? 'Curso' : 'Area'}</th>
                  ${esProfesor ? '' : '<th>Docente</th>'}
                  <th>Salón</th>
                </tr>
              </thead>
              <tbody>${detailRows}</tbody>
            </table>
          </section>
        </main>
      </body>
    </html>`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseCursoName(nombre: string) {
  const match = /^(\d+)\s*([A-Za-z]*)/.exec(nombre.trim());
  return {
    grado: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
    seccion: match ? match[2].toUpperCase() : nombre.toUpperCase(),
  };
}

// Ordena cursos del tipo "1A", "2B", "10C" por grado numerico y luego seccion.
function compareCurso(a: string, b: string) {
  const pa = parseCursoName(a);
  const pb = parseCursoName(b);
  return pa.grado - pb.grado || pa.seccion.localeCompare(pb.seccion);
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  daySelectContainer: { gap: Spacing.two },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.one },
  dayChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  dayChipText: { fontSize: 13, fontWeight: '700' },
  dayHint: { fontSize: 12, opacity: 0.8 },
  dayTimeCard: { borderWidth: 1, borderRadius: 18, padding: Spacing.three, gap: Spacing.two },
  dayTimeLabel: { fontWeight: '700' },
  label: { fontWeight: '700', opacity: 0.85 },
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
  teacherBackButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  heroTitle: {},
  heroSubtitle: { lineHeight: 22 },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  menuGrid: { gap: Spacing.two },
  modeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  modeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modeBody: { flex: 1, minWidth: 0, gap: 4 },
  modeTitle: { fontSize: 18, fontWeight: '800' },
  filtersCard: { borderRadius: 8, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  field: { gap: 4 },
  fieldLabel: { fontWeight: '700', opacity: 0.78 },
  fieldInput: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.two, justifyContent: 'center' },
  selectTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderRadius: 8, marginTop: 2, zIndex: 99 },
  dropdownItem: { paddingHorizontal: Spacing.two, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  toolsCard: { borderRadius: 8, borderWidth: 1, padding: Spacing.three, gap: Spacing.three },
  toolsActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  toolButton: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersGrid: { gap: Spacing.two },
  validationBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.one },
  validationTitle: { fontWeight: '800' },
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
  printRow: { alignItems: 'flex-start', marginBottom: Spacing.two },
  printButton: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
  saveErrorBox: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.two },
  saveErrorText: { fontSize: 13, lineHeight: 18 },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
