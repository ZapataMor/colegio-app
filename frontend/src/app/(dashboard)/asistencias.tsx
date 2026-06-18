import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import CheckBadgeIcon from 'react-native-heroicons/outline/CheckBadgeIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { OptionChips } from '@/components/crud/OptionChips';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { getUserSession } from '@/lib/session';

type AsistenciaMarca = {
  asistenciaId: number;
  asignaturaId: number;
  profesorId: number;
  profesor: string;
  fecha: string;
  estado: string;
  observacion: string | null;
};

type EstudianteAsistencia = {
  estudianteId: number;
  estudianteNombre: string;
  documento: string;
  asistencias: AsistenciaMarca[];
};

type ResumenAsignatura = {
  presente: number;
  ausente: number;
  excusa: number;
  tardanza: number;
  total: number;
};

type AsignaturaCurso = {
  asignaturaId: number;
  asignaturaNombre: string;
  fechas: string[];
  resumen: ResumenAsignatura;
};

type CursoAsistencia = {
  cursoId: number;
  cursoNombre: string;
  asignaturas: AsignaturaCurso[];
  estudiantes: EstudianteAsistencia[];
};

type Periodo = { id: number; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string };

type Catalog = {
  cursos: { id: number; nombre: string }[];
  estudiantes: { id: number; curso_id: number; nombre: string }[];
  profesores: { id: number; nombre: string }[];
  asignaturas: { id: number; nombre: string }[];
  periodos: Periodo[];
};

type HorarioClase = {
  id: number;
  curso_id: number;
  asignatura_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
};

const COL = { estudiante: 150, fecha: 54, porcentaje: 104 };

const DIA_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const emptyCatalog: Catalog = {
  cursos: [],
  estudiantes: [],
  profesores: [],
  asignaturas: [],
  periodos: [],
};

export default function AsistenciasScreen() {
  const session = getUserSession();

  if (session?.rol === 'administrador') {
    return <AdminAsistenciasScreen />;
  }

  return <ProfesorAsistenciasScreen />;
}

/* ============================================================
   VISTA ADMINISTRADOR (solo lectura)
   ============================================================ */

function AdminAsistenciasScreen() {
  const theme = useTheme();

  const [cursos, setCursos] = useState<CursoAsistencia[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [periodoId, setPeriodoId] = useState('');
  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null);
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState('');

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
        setError('');

        const qs = periodoId ? `?periodoId=${periodoId}` : '';
        const [cursosRes, catalogRes] = await Promise.all([
          apiFetch<CursoAsistencia[]>(`/api/asistencias/por-curso${qs}`),
          apiFetch<Catalog>('/api/asistencias/catalogo'),
        ]);

        setCursos(cursosRes.data ?? []);
        setPeriodos(catalogRes.data?.periodos ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las asistencias.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [periodoId]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selecciona por defecto el periodo activo (o el primero) una vez cargados.
  useEffect(() => {
    if (!periodoId && periodos.length > 0) {
      const active = periodos.find((item) => item.estado === 'activo') ?? periodos[0];
      setPeriodoId(String(active.id));
    }
  }, [periodos, periodoId]);

  const selectedPeriodo = useMemo(
    () => periodos.find((item) => String(item.id) === periodoId) ?? null,
    [periodos, periodoId]
  );
  const fechas = useMemo(
    () => (selectedPeriodo ? weekdaysBetween(selectedPeriodo.fecha_inicio, selectedPeriodo.fecha_fin) : []),
    [selectedPeriodo]
  );
  const selectedCurso = useMemo(
    () => cursos.find((curso) => curso.cursoId === selectedCursoId) ?? null,
    [cursos, selectedCursoId]
  );
  const selectedAdminAsignatura = useMemo(
    () => selectedCurso?.asignaturas.find((item) => String(item.asignaturaId) === selectedAsignaturaId) ?? null,
    [selectedCurso, selectedAsignaturaId]
  );

  const totalEstudiantes = cursos.reduce((sum, curso) => sum + curso.estudiantes.length, 0);

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.accent}20` }]}>
          <CheckBadgeIcon width={22} height={22} color={theme.accent} />
        </View>
        <View style={styles.heroCopy}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.primary }]}>
            Seguimiento diario
          </ThemedText>
          <ThemedText type="title">Asistencias</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>
            {cursos.length} curso{cursos.length !== 1 ? 's' : ''} - {totalEstudiantes} estudiante
            {totalEstudiantes !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </ThemedView>

      {periodos.length > 0 ? (
        <OptionChips
          label="Periodo"
          options={periodos.map((periodo) => ({ value: String(periodo.id), label: periodo.nombre }))}
          value={periodoId}
          onChange={(value) => {
            setPeriodoId(value);
            setSelectedCursoId(null);
            setSelectedAsignaturaId('');
          }}
        />
      ) : null}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadData()} />
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
          {!selectedCurso ? (
            <CursosGrid
              cursos={cursos}
              onSelect={(cursoId) => {
                setSelectedCursoId(cursoId);
                setSelectedAsignaturaId('');
              }}
            />
          ) : (
            <View style={styles.section}>
              <BackButton
                label="Ver cursos"
                onPress={() => {
                  setSelectedCursoId(null);
                  setSelectedAsignaturaId('');
                }}
              />
              <View
                style={[
                  styles.sectionHeader,
                  { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}44` },
                ]}>
                <View>
                  <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>
                    {selectedCurso.cursoNombre}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {selectedPeriodo?.nombre ?? ''}
                    {selectedAdminAsignatura ? ` - ${selectedAdminAsignatura.asignaturaNombre}` : ' - Todas las materias'}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {selectedCurso.estudiantes.length} estudiante{selectedCurso.estudiantes.length !== 1 ? 's' : ''}
                </ThemedText>
              </View>

              {selectedCurso.asignaturas.length > 0 ? (
                <OptionChips
                  label="Materia"
                  options={[
                    { value: '', label: 'Todas las materias' },
                    ...selectedCurso.asignaturas.map((item) => ({
                      value: String(item.asignaturaId),
                      label: item.asignaturaNombre,
                    })),
                  ]}
                  value={selectedAsignaturaId}
                  onChange={setSelectedAsignaturaId}
                />
              ) : null}

              <AdminCursoMatrix curso={selectedCurso} fechas={fechas} asignaturaId={selectedAsignaturaId} />
            </View>
          )}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function AdminCursoMatrix({
  curso,
  fechas,
  asignaturaId,
}: {
  curso: CursoAsistencia;
  fechas: string[];
  asignaturaId: string;
}) {
  const theme = useTheme();
  const tableWidth = COL.estudiante + Math.max(fechas.length, 1) * COL.fecha + COL.porcentaje;

  if (curso.estudiantes.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>Este curso no tiene estudiantes activos.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ minWidth: tableWidth }}>
        <View style={[styles.tableHead, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Th text="Estudiante" width={COL.estudiante} />
          {fechas.length > 0 ? (
            fechas.map((fecha) => <Th key={fecha} text={formatShortDate(fecha)} width={COL.fecha} align="center" />)
          ) : (
            <Th text="Sin fechas" width={COL.fecha} align="center" />
          )}
          <Th text="% Asistencia" width={COL.porcentaje} align="center" />
        </View>

        {curso.estudiantes.map((estudiante, rowIndex) => (
          <AdminFila
            key={estudiante.estudianteId}
            estudiante={estudiante}
            fechas={fechas}
            rowIndex={rowIndex}
            asignaturaId={asignaturaId}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function AdminFila({
  estudiante,
  fechas,
  rowIndex,
  asignaturaId,
}: {
  estudiante: EstudianteAsistencia;
  fechas: string[];
  rowIndex: number;
  asignaturaId: string;
}) {
  const theme = useTheme();
  const bg = rowIndex % 2 === 0 ? theme.backgroundElement : `${theme.backgroundElement}cc`;

  // Agrupa por fecha las marcas del estudiante. Si hay una materia
  // seleccionada se filtran solo las de esa asignatura; de lo contrario
  // se agregan todas sus asignaturas.
  const estadosPorFecha = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const marca of estudiante.asistencias) {
      if (asignaturaId && String(marca.asignaturaId) !== asignaturaId) continue;
      if (!map[marca.fecha]) map[marca.fecha] = [];
      map[marca.fecha].push(marca.estado);
    }
    return map;
  }, [estudiante.asistencias, asignaturaId]);

  let registrados = 0;
  let presentes = 0;
  for (const fecha of fechas) {
    const estados = estadosPorFecha[fecha];
    if (estados && estados.length) {
      registrados += 1;
      if (estados.every((estado) => estado === 'presente')) presentes += 1;
    }
  }
  const porcentaje = registrados ? Math.round((presentes / registrados) * 100) : null;

  return (
    <View style={[styles.tableRow, { backgroundColor: bg, borderColor: theme.border }]}>
      <Td width={COL.estudiante}>
        <ThemedText style={styles.studentName} numberOfLines={2}>
          {estudiante.estudianteNombre}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
          {estudiante.documento}
        </ThemedText>
      </Td>

      {fechas.length > 0 ? (
        fechas.map((fecha) => {
          const estados = estadosPorFecha[fecha] ?? [];
          const mark = aggregateMark(estados);
          const color = mark === '✓' ? theme.accent : mark === 'X' ? theme.danger : theme.textSecondary;

          return (
            <Td key={fecha} width={COL.fecha} align="center">
              <ThemedText style={[styles.markText, { color }]}>{mark}</ThemedText>
            </Td>
          );
        })
      ) : (
        <Td width={COL.fecha} align="center">
          <ThemedText style={[styles.markText, { color: theme.textSecondary }]}>-</ThemedText>
        </Td>
      )}

      <Td width={COL.porcentaje} align="center">
        <ThemedText style={[styles.percentText, { color: percentColor(porcentaje, theme) }]}>
          {porcentaje === null ? '—' : `${porcentaje}%`}
        </ThemedText>
      </Td>
    </View>
  );
}

/* ============================================================
   VISTA PROFESOR (registro editable)
   ============================================================ */

function ProfesorAsistenciasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = getUserSession();

  const [cursos, setCursos] = useState<CursoAsistencia[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [horarios, setHorarios] = useState<HorarioClase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodoId, setPeriodoId] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (periodoId) params.set('periodoId', periodoId);
      if (session?.personaId) params.set('profesorPersonaId', String(session.personaId));
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [cursosRes, catalogRes, horariosRes] = await Promise.all([
        apiFetch<CursoAsistencia[]>(`/api/asistencias/por-curso${qs}`),
        apiFetch<Catalog>('/api/asistencias/catalogo'),
        apiFetch<HorarioClase[]>('/api/horarios/mi-horario'),
      ]);

      setCursos(cursosRes.data ?? []);
      setPeriodos(catalogRes.data?.periodos ?? []);
      setHorarios(horariosRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las asistencias.');
    } finally {
      setLoading(false);
    }
  }, [periodoId, session?.personaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Solo los cursos donde el profesor tiene asignaturas asignadas.
  const misCursos = useMemo(() => cursos.filter((curso) => curso.asignaturas.length > 0), [cursos]);
  const selectedCurso = useMemo(() => misCursos.find((curso) => String(curso.cursoId) === cursoId) ?? null, [misCursos, cursoId]);
  const asignaturasCurso = selectedCurso?.asignaturas ?? [];
  const selectedAsignatura = useMemo(
    () => asignaturasCurso.find((item) => String(item.asignaturaId) === asignaturaId) ?? null,
    [asignaturasCurso, asignaturaId]
  );

  const selectedPeriodo = useMemo(
    () => periodos.find((item) => String(item.id) === periodoId) ?? null,
    [periodos, periodoId]
  );

  const horariosAsignados = useMemo(
    () =>
      selectedCurso && selectedAsignatura
        ? horarios.filter(
            (item) =>
              item.estado === 'activo' &&
              item.curso_id === selectedCurso.cursoId &&
              item.asignatura_id === selectedAsignatura.asignaturaId
          )
        : [],
    [horarios, selectedCurso, selectedAsignatura]
  );

  const fechas = useMemo(
    () =>
      selectedPeriodo
        ? classDatesBetween(
            selectedPeriodo.fecha_inicio,
            selectedPeriodo.fecha_fin,
            horariosAsignados.map((item) => item.dia_semana)
          )
        : [],
    [selectedPeriodo, horariosAsignados]
  );

  // Defaults de los selectores.
  useEffect(() => {
    if (!periodoId && periodos.length > 0) {
      const active = periodos.find((item) => item.estado === 'activo') ?? periodos[0];
      setPeriodoId(String(active.id));
    }
  }, [periodos, periodoId]);

  useEffect(() => {
    if (misCursos.length === 0) {
      setCursoId('');
      return;
    }
    if (!misCursos.some((curso) => String(curso.cursoId) === cursoId)) {
      setCursoId(String(misCursos[0].cursoId));
    }
  }, [misCursos, cursoId]);

  useEffect(() => {
    if (asignaturasCurso.length === 0) {
      setAsignaturaId('');
      return;
    }
    if (!asignaturasCurso.some((item) => String(item.asignaturaId) === asignaturaId)) {
      setAsignaturaId(String(asignaturasCurso[0].asignaturaId));
    }
  }, [asignaturasCurso, asignaturaId]);

  // Construye el mapa editable de marcas para el curso/asignatura activos.
  useEffect(() => {
    if (!selectedCurso || !selectedAsignatura) {
      setMarks({});
      return;
    }
    const next: Record<string, string> = {};
    for (const estudiante of selectedCurso.estudiantes) {
      for (const marca of estudiante.asistencias) {
        if (marca.asignaturaId === selectedAsignatura.asignaturaId) {
          next[`${estudiante.estudianteId}|${marca.fecha}`] = marca.estado;
        }
      }
    }
    setMarks(next);
  }, [selectedCurso, selectedAsignatura]);

  const toggleMark = async (estudianteId: number, fecha: string) => {
    if (!selectedCurso || !selectedAsignatura) return;

    const key = `${estudianteId}|${fecha}`;
    const current = marks[key];
    const next = current === 'presente' ? 'ausente' : 'presente';

    setMarks((prev) => ({ ...prev, [key]: next }));
    setSavingKey(key);

    try {
      await apiFetch('/api/asistencias/marcar', {
        method: 'POST',
        body: {
          estudianteId,
          cursoId: selectedCurso.cursoId,
          asignaturaId: selectedAsignatura.asignaturaId,
          fecha,
          estadoAsistencia: next,
        },
      });

      // Mantener sincronizada la fuente de datos para no perder el cambio
      // al alternar entre asignaturas sin recargar.
      setCursos((prev) =>
        prev.map((curso) => {
          if (curso.cursoId !== selectedCurso.cursoId) return curso;
          return {
            ...curso,
            estudiantes: curso.estudiantes.map((est) => {
              if (est.estudianteId !== estudianteId) return est;
              const others = est.asistencias.filter(
                (m) => !(m.asignaturaId === selectedAsignatura.asignaturaId && m.fecha === fecha)
              );
              return {
                ...est,
                asistencias: [
                  ...others,
                  {
                    asistenciaId: 0,
                    asignaturaId: selectedAsignatura.asignaturaId,
                    profesorId: 0,
                    profesor: '',
                    fecha,
                    estado: next,
                    observacion: null,
                  },
                ],
              };
            }),
          };
        })
      );
    } catch (err) {
      // Revertir el cambio optimista ante un error.
      setMarks((prev) => {
        const reverted = { ...prev };
        if (current === undefined) delete reverted[key];
        else reverted[key] = current;
        return reverted;
      });
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la asistencia.');
    } finally {
      setSavingKey(null);
    }
  };

  const readyToShow = Boolean(periodoId && selectedCurso && selectedAsignatura);
  const hasAssignedSchedule = horariosAsignados.length > 0;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(dashboard)/dashboard');
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <Pressable onPress={goBack} style={[styles.backNavButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
          <ArrowLeftIcon width={18} height={18} color={theme.text} />
        </Pressable>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.accent}20` }]}>
          <CheckBadgeIcon width={22} height={22} color={theme.accent} />
        </View>
        <View style={styles.heroCopy}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.primary }]}>
            Registrar asistencias
          </ThemedText>
          <ThemedText type="title">Asistencias</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>
            Marca un chulito si asistio o una X si no asistio.
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView type="backgroundElement" style={[styles.filters, { borderColor: theme.border }]}>
        <SelectField
          label="Periodo"
          value={periodoId}
          options={periodos.map((periodo) => ({ value: String(periodo.id), label: periodo.nombre }))}
          onSelect={setPeriodoId}
        />
        <SelectField
          label="Curso o salon"
          value={cursoId}
          options={misCursos.map((curso) => ({ value: String(curso.cursoId), label: curso.cursoNombre }))}
          onSelect={(value) => {
            setCursoId(value);
            setAsignaturaId('');
          }}
        />
        <SelectField
          label="Asignatura"
          value={asignaturaId}
          options={asignaturasCurso.map((item) => ({ value: String(item.asignaturaId), label: item.asignaturaNombre }))}
          onSelect={setAsignaturaId}
        />
      </ThemedView>

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadData()} />
      ) : !readyToShow ? (
        <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Selecciona periodo, curso y asignatura para registrar la asistencia.
          </ThemedText>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.section}>
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}44` },
              ]}>
              <View>
                <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>
                  {selectedCurso?.cursoNombre}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {selectedAsignatura?.asignaturaNombre} - {selectedPeriodo?.nombre}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {selectedCurso?.estudiantes.length ?? 0} estudiante
                {(selectedCurso?.estudiantes.length ?? 0) !== 1 ? 's' : ''}
              </ThemedText>
            </View>

            {!hasAssignedSchedule ? (
              <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  No hay horarios asignados para esta asignatura y grupo.
                </ThemedText>
              </ThemedView>
            ) : fechas.length === 0 ? (
              <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  El horario asignado no tiene fechas dentro del periodo seleccionado.
                </ThemedText>
              </ThemedView>
            ) : (
              <ProfesorMatrix
                estudiantes={selectedCurso?.estudiantes ?? []}
                fechas={fechas}
                marks={marks}
                savingKey={savingKey}
                onToggle={toggleMark}
              />
            )}
          </View>
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function ProfesorMatrix({
  estudiantes,
  fechas,
  marks,
  savingKey,
  onToggle,
}: {
  estudiantes: EstudianteAsistencia[];
  fechas: string[];
  marks: Record<string, string>;
  savingKey: string | null;
  onToggle: (estudianteId: number, fecha: string) => void;
}) {
  const theme = useTheme();
  const tableWidth = COL.estudiante + Math.max(fechas.length, 1) * COL.fecha + COL.porcentaje;

  if (estudiantes.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>Este curso no tiene estudiantes activos.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ minWidth: tableWidth }}>
        <View style={[styles.tableHead, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Th text="Estudiante" width={COL.estudiante} />
          {fechas.length > 0 ? (
            fechas.map((fecha) => <Th key={fecha} text={formatShortDate(fecha)} width={COL.fecha} align="center" />)
          ) : (
            <Th text="Sin fechas" width={COL.fecha} align="center" />
          )}
          <Th text="% Asistencia" width={COL.porcentaje} align="center" />
        </View>

        {estudiantes.map((estudiante, rowIndex) => (
          <ProfesorFila
            key={estudiante.estudianteId}
            estudiante={estudiante}
            fechas={fechas}
            marks={marks}
            savingKey={savingKey}
            rowIndex={rowIndex}
            onToggle={onToggle}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ProfesorFila({
  estudiante,
  fechas,
  marks,
  savingKey,
  rowIndex,
  onToggle,
}: {
  estudiante: EstudianteAsistencia;
  fechas: string[];
  marks: Record<string, string>;
  savingKey: string | null;
  rowIndex: number;
  onToggle: (estudianteId: number, fecha: string) => void;
}) {
  const theme = useTheme();
  const bg = rowIndex % 2 === 0 ? theme.backgroundElement : `${theme.backgroundElement}cc`;

  let registrados = 0;
  let presentes = 0;
  for (const fecha of fechas) {
    const estado = marks[`${estudiante.estudianteId}|${fecha}`];
    if (estado) {
      registrados += 1;
      if (estado === 'presente') presentes += 1;
    }
  }
  const porcentaje = registrados ? Math.round((presentes / registrados) * 100) : null;

  return (
    <View style={[styles.tableRow, { backgroundColor: bg, borderColor: theme.border }]}>
      <Td width={COL.estudiante}>
        <ThemedText style={styles.studentName} numberOfLines={2}>
          {estudiante.estudianteNombre}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
          {estudiante.documento}
        </ThemedText>
      </Td>

      {fechas.length > 0 ? (
        fechas.map((fecha) => {
          const key = `${estudiante.estudianteId}|${fecha}`;
          const estado = marks[key];
          const value = markFromEstado(estado);
          const color = value === '✓' ? theme.accent : value === 'X' ? theme.danger : theme.textSecondary;

          return (
            <Td key={fecha} width={COL.fecha} align="center">
              <Pressable
                disabled={savingKey === key}
                onPress={() => onToggle(estudiante.estudianteId, fecha)}
                style={[styles.cellButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
                <ThemedText style={[styles.markText, { color }]}>{value}</ThemedText>
              </Pressable>
            </Td>
          );
        })
      ) : (
        <Td width={COL.fecha} align="center">
          <ThemedText style={[styles.markText, { color: theme.textSecondary }]}>-</ThemedText>
        </Td>
      )}

      <Td width={COL.porcentaje} align="center">
        <ThemedText style={[styles.percentText, { color: percentColor(porcentaje, theme) }]}>
          {porcentaje === null ? '—' : `${porcentaje}%`}
        </ThemedText>
      </Td>
    </View>
  );
}

/* ============================================================
   COMPONENTES Y HELPERS COMPARTIDOS
   ============================================================ */

function CursosGrid({ cursos, onSelect }: { cursos: CursoAsistencia[]; onSelect: (cursoId: number) => void }) {
  const theme = useTheme();

  if (cursos.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>No hay cursos activos registrados.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.cardGrid}>
      {cursos.map((curso) => (
        <Pressable
          key={curso.cursoId}
          onPress={() => onSelect(curso.cursoId)}
          style={[styles.courseCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText style={[styles.cardTitle, { color: theme.primary }]}>{curso.cursoNombre}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {curso.estudiantes.length} estudiante{curso.estudiantes.length !== 1 ? 's' : ''}
          </ThemedText>
        </Pressable>
      ))}
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
      <ThemedText type="small" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={[styles.fieldInput, styles.selectTrigger, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <ThemedText style={{ color: selected ? theme.text : theme.textSecondary, flex: 1 }} numberOfLines={1}>
          {selected?.label ?? 'Seleccionar...'}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          v
        </ThemedText>
      </Pressable>
      {open ? (
        <ThemedView type="backgroundElement" style={[styles.dropdown, { borderColor: theme.border }]}>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
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

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
      <ThemedText type="small" style={styles.backButtonText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Th({ text, width, align = 'left' }: { text: string; width: number; align?: 'left' | 'center' }) {
  const theme = useTheme();

  return (
    <View style={[styles.th, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      <ThemedText type="small" style={[styles.thText, { color: theme.textSecondary }]}>
        {text}
      </ThemedText>
    </View>
  );
}

function Td({ children, width, align = 'left' }: { children: ReactNode; width: number; align?: 'left' | 'center' }) {
  return (
    <View style={[styles.td, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>{children}</View>
  );
}

function toDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateValue(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function classDatesBetween(start: string, end: string, diasSemana: string[]): string[] {
  const classDays = new Set(diasSemana.map((dia) => DIA_INDEX[dia]).filter((dia) => dia !== undefined));
  if (!start || !end || classDays.size === 0) return [];

  const result: string[] = [];
  const cursor = parseDateValue(start);
  const last = parseDateValue(end);

  while (cursor <= last) {
    if (classDays.has(cursor.getDay())) {
      result.push(toDateValue(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

// Devuelve los dias habiles (lunes a viernes) entre dos fechas YYYY-MM-DD.
function weekdaysBetween(start: string, end: string): string[] {
  const result: string[] = [];
  if (!start || !end) return result;

  const [sy, sm, sd] = start.slice(0, 10).split('-').map(Number);
  const [ey, em, ed] = end.slice(0, 10).split('-').map(Number);
  if (!sy || !ey) return result;

  const cursor = new Date(sy, sm - 1, sd);
  const last = new Date(ey, em - 1, ed);

  while (cursor <= last) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      result.push(`${y}-${m}-${d}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

// Marca a nivel de dia para el administrador (agrega varias asignaturas).
function aggregateMark(estados: string[]): string {
  if (!estados.length) return '-';
  return estados.every((estado) => estado === 'presente') ? '✓' : 'X';
}

function markFromEstado(estado?: string): string {
  if (!estado) return '-';
  return estado === 'presente' ? '✓' : 'X';
}

function percentColor(porcentaje: number | null, theme: ReturnType<typeof useTheme>): string {
  if (porcentaje === null) return theme.textSecondary;
  if (porcentaje >= 90) return theme.accent;
  if (porcentaje >= 75) return theme.primary;
  return theme.danger;
}

function formatShortDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  backNavButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  filters: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.two },
  field: { gap: 4 },
  fieldLabel: { opacity: 0.68 },
  fieldInput: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, justifyContent: 'center' },
  selectTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderRadius: 6, marginTop: 2, zIndex: 99 },
  dropdownItem: { paddingHorizontal: Spacing.two, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  courseCard: { flexGrow: 1, flexBasis: 170, borderRadius: 8, borderWidth: 1, padding: Spacing.three, gap: 6 },
  cardTitle: { fontSize: 22, fontWeight: '800' },
  section: { gap: Spacing.three },
  sectionHeader: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  backButton: {
    minHeight: 38,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontWeight: '700' },
  tableHead: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 7,
  },
  tableRow: { flexDirection: 'row', borderWidth: 1, borderTopWidth: 0, paddingVertical: 7 },
  th: { paddingHorizontal: 8, justifyContent: 'center' },
  thText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  td: { paddingHorizontal: 8, justifyContent: 'center', minHeight: 46 },
  studentName: { fontWeight: '700', fontSize: 13 },
  markText: { fontSize: 18, fontWeight: '900' },
  percentText: { fontSize: 14, fontWeight: '800' },
  cellButton: {
    minWidth: 38,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  emptyCard: { borderRadius: 8, borderWidth: 1, padding: Spacing.four, alignItems: 'center' },
});
