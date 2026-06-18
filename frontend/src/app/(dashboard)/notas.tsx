import { useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { getUserSession } from '@/lib/session';

type CatalogItem = {
  id: number;
  nombre: string;
  curso_id?: number;
  asignatura_id?: number;
  persona_id?: number;
  estado?: string;
};

type Catalog = {
  cursos: CatalogItem[];
  asignaturas: CatalogItem[];
  profesores: CatalogItem[];
  periodos: CatalogItem[];
};

type Actividad = {
  id: number;
  titulo: string;
  fecha: string;
  descripcion: string | null;
  profesorId: number;
  profesorNombre: string;
};

type NotaActividad = {
  notaId: number;
  actividadId: number;
  nota: number;
  observacion: string | null;
};

type EstudianteMatriz = {
  estudianteId: number;
  estudianteNombre: string;
  documento: string;
  notas: NotaActividad[];
  definitiva: number | null;
};

type MatrizNotas = {
  cursoId: number;
  cursoNombre: string;
  asignaturaId: number;
  asignaturaNombre: string;
  periodoId: number;
  periodoNombre: string;
  actividades: Actividad[];
  estudiantes: EstudianteMatriz[];
};

type GradeTarget = {
  estudiante: EstudianteMatriz;
  actividad: Actividad;
  nota: NotaActividad | null;
};

type AdminNotaFila = {
  notaId: number;
  asignatura: string;
  asignaturaId: number;
  profesor: string;
  profesorId: number;
  periodo: string;
  periodoId: number;
  nota: number;
  observacion: string | null;
};

type AdminEstudiante = {
  estudianteId: number;
  estudianteNombre: string;
  documento: string;
  notas: AdminNotaFila[];
};

type AdminCursoAgrupado = {
  cursoId: number;
  cursoNombre: string;
  estudiantes: AdminEstudiante[];
};

const emptyCatalog: Catalog = { cursos: [], asignaturas: [], profesores: [], periodos: [] };
const emptyActivityForm = { titulo: '', fecha: '', profesorId: '' };
const emptyGradeForm = { nota: '', observacion: '' };

const COL = { estudiante: 190, actividad: 128, definitiva: 96 };
const ADMIN_COL = { estudiante: 170, asignatura: 130 };

const today = () => new Date().toISOString().slice(0, 10);

const gradeColor = (nota: number) => {
  if (nota >= 4.6) return '#8FBF26';
  if (nota >= 4.0) return '#4CA5DC';
  if (nota >= 3.0) return '#E8A020';
  return '#F25C5C';
};

export default function NotasScreen() {
  const session = getUserSession();

  if (session?.rol === 'administrador') {
    return <AdminNotasScreen />;
  }

  return <ProfesorNotasScreen />;
}

function ProfesorNotasScreen() {
  const theme = useTheme();
  const session = getUserSession();
  const isProfesor = session?.rol === 'profesor';
  const canManage = isProfesor;

  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [matrix, setMatrix] = useState<MatrizNotas | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [error, setError] = useState('');

  const [periodoId, setPeriodoId] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');

  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [gradeTarget, setGradeTarget] = useState<GradeTarget | null>(null);
  const [gradeForm, setGradeForm] = useState(emptyGradeForm);
  const [saving, setSaving] = useState(false);

  const asignaturasCurso = useMemo(
    () => catalog.asignaturas.filter((item) => !cursoId || String(item.curso_id) === cursoId),
    [catalog.asignaturas, cursoId]
  );

  const profesoresAsignados = useMemo(
    () => catalog.profesores.filter((item) => {
      const sameCurso = !cursoId || String(item.curso_id) === cursoId;
      const sameAsignatura = !asignaturaId || String(item.asignatura_id) === asignaturaId;
      return sameCurso && sameAsignatura;
    }),
    [catalog.profesores, cursoId, asignaturaId]
  );

  const loadCatalog = useCallback(async () => {
    try {
      setCatalogLoading(true);
      setError('');
      const res = await apiFetch<Catalog>('/api/notas/catalogo');
      setCatalog(res.data ?? emptyCatalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar catalogo de notas.');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadMatrix = useCallback(async () => {
    if (!periodoId || !cursoId || !asignaturaId) {
      setMatrix(null);
      return;
    }

    try {
      setMatrixLoading(true);
      setError('');
      const params = new URLSearchParams({ periodoId, cursoId, asignaturaId });
      const res = await apiFetch<MatrizNotas>(`/api/notas/por-curso?${params.toString()}`);
      setMatrix(res.data ?? null);
    } catch (err) {
      setMatrix(null);
      setError(err instanceof Error ? err.message : 'Error al cargar la matriz de notas.');
    } finally {
      setMatrixLoading(false);
    }
  }, [periodoId, cursoId, asignaturaId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!periodoId && catalog.periodos.length > 0) {
      const active = catalog.periodos.find((item) => item.estado === 'activo') ?? catalog.periodos[0];
      setPeriodoId(String(active.id));
    }
    if (!cursoId && catalog.cursos.length > 0) {
      setCursoId(String(catalog.cursos[0].id));
    }
  }, [catalog, periodoId, cursoId]);

  useEffect(() => {
    if (!cursoId) {
      setAsignaturaId('');
      return;
    }

    if (asignaturasCurso.length === 0) {
      setAsignaturaId('');
      return;
    }

    if (!asignaturasCurso.some((item) => String(item.id) === asignaturaId)) {
      setAsignaturaId(String(asignaturasCurso[0].id));
    }
  }, [cursoId, asignaturaId, asignaturasCurso]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const totalNotas = matrix?.estudiantes.reduce((sum, estudiante) => sum + estudiante.notas.length, 0) ?? 0;

  const openActivityModal = () => {
    if (!canManage || !cursoId || !asignaturaId || !periodoId) {
      Alert.alert('Filtros requeridos', 'Selecciona periodo, curso y asignatura.');
      return;
    }

    const defaultProfesor = isProfesor
      ? profesoresAsignados[0]
      : profesoresAsignados.find((item) => String(item.persona_id) === String(session?.personaId)) ?? profesoresAsignados[0];

    if (!defaultProfesor) {
      Alert.alert('Sin profesor asignado', 'No hay un profesor asignado a este curso y asignatura.');
      return;
    }

    setActivityForm({ titulo: '', fecha: today(), profesorId: String(defaultProfesor.id) });
    setActivityModalVisible(true);
  };

  const saveActivity = async () => {
    if (!activityForm.titulo.trim() || !activityForm.fecha || !activityForm.profesorId) {
      Alert.alert('Faltan datos', 'Nombre, fecha y profesor son obligatorios.');
      return;
    }

    try {
      setSaving(true);
      await apiFetch('/api/notas/actividades', {
        method: 'POST',
        body: {
          titulo: activityForm.titulo.trim(),
          fecha: activityForm.fecha,
          cursoId: Number(cursoId),
          asignaturaId: Number(asignaturaId),
          periodoId: Number(periodoId),
          profesorId: Number(activityForm.profesorId),
        },
      });
      setActivityModalVisible(false);
      await loadMatrix();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo crear la actividad.');
    } finally {
      setSaving(false);
    }
  };

  const openGradeModal = (target: GradeTarget) => {
    if (!canManage) return;
    setGradeTarget(target);
    setGradeForm({
      nota: target.nota ? String(Number(target.nota.nota).toFixed(1)) : '',
      observacion: target.nota?.observacion ?? '',
    });
  };

  const saveGrade = async () => {
    if (!gradeTarget) return;

    const notaNum = Number(gradeForm.nota.replace(',', '.'));
    if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
      Alert.alert('Nota invalida', 'La nota debe estar entre 1.0 y 5.0.');
      return;
    }

    try {
      setSaving(true);
      await apiFetch(`/api/notas/actividades/${gradeTarget.actividad.id}/notas`, {
        method: 'POST',
        body: {
          estudianteId: gradeTarget.estudiante.estudianteId,
          nota: notaNum,
          observacion: gradeForm.observacion.trim() || null,
        },
      });
      setGradeTarget(null);
      await loadMatrix();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la nota.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell contentStyle={styles.shell}>
      <View style={styles.contentStack}>
        <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
            <AcademicCapIcon width={20} height={20} color={theme.primary} />
          </View>
          <View style={styles.heroText}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>Registro academico</ThemedText>
            <ThemedText style={styles.title}>Notas</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {matrix?.estudiantes.length ?? 0} estudiantes - {matrix?.actividades.length ?? 0} actividades - {totalNotas} notas
            </ThemedText>
          </View>
          {canManage ? (
            <Pressable onPress={openActivityModal} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
              <PlusIcon width={16} height={16} color={theme.primaryText} />
              <ThemedText style={[styles.addBtnText, { color: theme.primaryText }]}>Agregar actividad</ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>

        <ThemedView type="backgroundElement" style={[styles.filters, { borderColor: theme.border }]}>
          <SelectField
            label="Periodo"
            value={periodoId}
            options={catalog.periodos.map((item) => ({ value: String(item.id), label: item.nombre }))}
            onSelect={setPeriodoId}
          />
          <SelectField
            label="Curso o salon"
            value={cursoId}
            options={catalog.cursos.map((item) => ({ value: String(item.id), label: item.nombre }))}
            onSelect={setCursoId}
          />
          <SelectField
            label="Asignatura"
            value={asignaturaId}
            options={asignaturasCurso.map((item) => ({ value: String(item.id), label: item.nombre }))}
            onSelect={setAsignaturaId}
          />
        </ThemedView>

        {catalogLoading || matrixLoading ? (
          <ThemedView type="backgroundElement" style={styles.center}>
            <ActivityIndicator color={theme.primary} size="large" />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando notas...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView type="backgroundElement" style={styles.center}>
            <ThemedText style={{ color: theme.danger, textAlign: 'center' }}>{error}</ThemedText>
            <Pressable onPress={loadMatrix} style={[styles.outlineBtn, { borderColor: theme.border }]}>
              <ThemedText>Reintentar</ThemedText>
            </Pressable>
          </ThemedView>
        ) : matrix ? (
          <MatrizTable matrix={matrix} canManage={canManage} onEditGrade={openGradeModal} />
        ) : (
          <ThemedView type="backgroundElement" style={[styles.center, styles.emptyBox]}>
            <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Selecciona periodo, curso y asignatura para ver la matriz.
            </ThemedText>
          </ThemedView>
        )}
      </View>

      <ActivityModal
        visible={activityModalVisible}
        form={activityForm}
        setForm={setActivityForm}
        profesores={profesoresAsignados}
        lockProfesor={isProfesor}
        saving={saving}
        onSave={saveActivity}
        onClose={() => setActivityModalVisible(false)}
      />

      <GradeModal
        target={gradeTarget}
        form={gradeForm}
        setForm={setGradeForm}
        saving={saving}
        onSave={saveGrade}
        onClose={() => setGradeTarget(null)}
      />
    </ScreenShell>
  );
}

function AdminNotasScreen() {
  const theme = useTheme();
  const [cursos, setCursos] = useState<AdminCursoAgrupado[]>([]);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterPeriodo ? `?periodoId=${filterPeriodo}` : '';
      const [cursosRes, catRes] = await Promise.all([
        apiFetch<AdminCursoAgrupado[]>(`/api/notas/por-curso${params}`),
        apiFetch<Catalog>('/api/notas/catalogo'),
      ]);
      setCursos(cursosRes.data ?? []);
      setCatalog(catRes.data ?? emptyCatalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notas.');
    } finally {
      setLoading(false);
    }
  }, [filterPeriodo]);

  useEffect(() => {
    load();
  }, [load]);

  const totalNotas = cursos.reduce(
    (sum, curso) => sum + curso.estudiantes.reduce((inner, estudiante) => inner + estudiante.notas.length, 0),
    0
  );
  const totalEstudiantes = cursos.reduce((sum, curso) => sum + curso.estudiantes.length, 0);
  const selectedCurso = cursos.find((curso) => curso.cursoId === selectedCursoId) ?? null;

  return (
    <ScreenShell contentStyle={styles.shell}>
      <View style={styles.contentStack}>
        <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
            <AcademicCapIcon width={20} height={20} color={theme.primary} />
          </View>
          <View style={styles.heroText}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>Registro academico</ThemedText>
            <ThemedText style={styles.title}>Notas</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {totalEstudiantes} estudiante{totalEstudiantes !== 1 ? 's' : ''} - {totalNotas} nota{totalNotas !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        </ThemedView>

        {catalog.periodos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
            <Pressable
              onPress={() => setFilterPeriodo('')}
              style={[styles.chip, { borderColor: theme.border }, !filterPeriodo && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              <ThemedText type="small" style={[styles.chipText, !filterPeriodo && { color: theme.primaryText }]}>
                Todos los periodos
              </ThemedText>
            </Pressable>
            {catalog.periodos.map((periodo) => (
              <Pressable
                key={periodo.id}
                onPress={() => setFilterPeriodo(String(periodo.id))}
                style={[styles.chip, { borderColor: theme.border }, filterPeriodo === String(periodo.id) && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                <ThemedText type="small" style={[styles.chipText, filterPeriodo === String(periodo.id) && { color: theme.primaryText }]}>
                  {periodo.nombre}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {loading ? (
          <ThemedView type="backgroundElement" style={styles.center}>
            <ActivityIndicator color={theme.primary} size="large" />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando notas...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView type="backgroundElement" style={styles.center}>
            <ThemedText style={{ color: theme.danger, textAlign: 'center' }}>{error}</ThemedText>
            <Pressable onPress={load} style={[styles.outlineBtn, { borderColor: theme.border }]}>
              <ThemedText>Reintentar</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <View style={styles.listContent}>
            {selectedCurso ? (
              <>
                <Pressable
                  onPress={() => setSelectedCursoId(null)}
                  style={[styles.backBtn, { borderColor: theme.border }]}>
                  <ThemedText type="small" style={[styles.backBtnText, { color: theme.text }]}>
                    Ver salones
                  </ThemedText>
                </Pressable>
                <AdminCursoSeccion curso={selectedCurso} />
              </>
            ) : cursos.length > 0 ? (
              <View style={styles.salonGrid}>
                {cursos.map((curso) => (
                  <AdminSalonCard
                    key={curso.cursoId}
                    curso={curso}
                    onPress={() => setSelectedCursoId(curso.cursoId)}
                  />
                ))}
              </View>
            ) : (
              <ThemedView type="backgroundElement" style={[styles.center, styles.emptyBox]}>
                <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  No hay cursos activos registrados.
                </ThemedText>
              </ThemedView>
            )}
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

function AdminSalonCard({ curso, onPress }: { curso: AdminCursoAgrupado; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.salonCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText style={[styles.salonName, { color: theme.primary }]}>{curso.cursoNombre}</ThemedText>
      <ThemedText type="small" style={[styles.salonCount, { color: theme.textSecondary }]}>
        {curso.estudiantes.length} estudiante{curso.estudiantes.length !== 1 ? 's' : ''}
      </ThemedText>
    </Pressable>
  );
}

function AdminCursoSeccion({ curso }: { curso: AdminCursoAgrupado }) {
  const theme = useTheme();
  const asignaturas = Array.from(
    new Map(
      curso.estudiantes
        .flatMap((estudiante) => estudiante.notas)
        .map((nota) => [nota.asignaturaId, nota])
    ).values()
  ).sort((a, b) => a.asignatura.localeCompare(b.asignatura));
  const tableWidth = ADMIN_COL.estudiante + Math.max(asignaturas.length, 1) * ADMIN_COL.asignatura;

  return (
    <View style={styles.seccion}>
      <View style={[styles.cursoHeader, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}44` }]}>
        <View style={styles.cursoHeaderText}>
          <ThemedText style={[styles.cursoTitulo, { color: theme.primary }]}>{curso.cursoNombre}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {curso.estudiantes.length} estudiante{curso.estudiantes.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </View>

      {curso.estudiantes.length === 0 ? (
        <ThemedView type="backgroundElement" style={[styles.emptyRow, { borderColor: theme.border }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Este curso no tiene estudiantes registrados.</ThemedText>
        </ThemedView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: tableWidth }}>
            <View style={[styles.tableHead, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Th width={ADMIN_COL.estudiante}>Estudiante</Th>
              {asignaturas.length > 0 ? (
                asignaturas.map((asignatura) => (
                  <Th key={asignatura.asignaturaId} width={ADMIN_COL.asignatura} align="center">
                    {asignatura.asignatura}
                  </Th>
                ))
              ) : (
                <Th width={ADMIN_COL.asignatura} align="center">Sin notas</Th>
              )}
            </View>

            {curso.estudiantes.map((estudiante, rowIndex) => (
              <AdminNotaRow
                key={estudiante.estudianteId}
                estudiante={estudiante}
                asignaturas={asignaturas}
                rowIndex={rowIndex}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function AdminNotaRow({
  estudiante,
  asignaturas,
  rowIndex,
}: {
  estudiante: AdminEstudiante;
  asignaturas: AdminNotaFila[];
  rowIndex: number;
}) {
  const theme = useTheme();
  const bg = rowIndex % 2 === 0 ? theme.backgroundElement : `${theme.backgroundElement}cc`;
  const notasPorAsignatura = estudiante.notas.reduce<Record<number, AdminNotaFila[]>>((acc, nota) => {
    acc[nota.asignaturaId] = [...(acc[nota.asignaturaId] ?? []), nota];
    return acc;
  }, {});

  return (
    <View style={[styles.tableRow, { backgroundColor: bg, borderColor: theme.border }]}>
      <Td width={ADMIN_COL.estudiante}>
        <ThemedText style={styles.cellEstudiante} numberOfLines={2}>{estudiante.estudianteNombre}</ThemedText>
      </Td>
      {asignaturas.length > 0 ? (
        asignaturas.map((asignatura) => {
          const notas = notasPorAsignatura[asignatura.asignaturaId] ?? [];
          const notaTexto = notas.map((item) => Number(item.nota).toFixed(1)).join(' / ');
          const notaColor = notas.length === 1 ? gradeColor(notas[0].nota) : theme.text;

          return (
            <Td key={asignatura.asignaturaId} width={ADMIN_COL.asignatura} align="center">
              <ThemedText style={[styles.notaCell, { color: notaTexto ? notaColor : theme.textSecondary }]}>
                {notaTexto || '-'}
              </ThemedText>
            </Td>
          );
        })
      ) : (
        <Td width={ADMIN_COL.asignatura} align="center">
          <ThemedText style={[styles.notaCell, { color: theme.textSecondary }]}>-</ThemedText>
        </Td>
      )}
    </View>
  );
}

function MatrizTable({
  matrix,
  canManage,
  onEditGrade,
}: {
  matrix: MatrizNotas;
  canManage: boolean;
  onEditGrade: (target: GradeTarget) => void;
}) {
  const theme = useTheme();
  const tableWidth = COL.estudiante + matrix.actividades.length * COL.actividad + COL.definitiva;

  return (
    <View style={styles.seccion}>
      <View style={[styles.cursoHeader, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}44` }]}>
        <View style={styles.cursoHeaderText}>
          <ThemedText style={[styles.cursoTitulo, { color: theme.primary }]}>{matrix.cursoNombre}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {matrix.asignaturaNombre} - {matrix.periodoNombre}
          </ThemedText>
        </View>
        <ThemedText type="small" style={[styles.countBadge, { color: theme.textSecondary, borderColor: theme.border }]}>
          {matrix.estudiantes.length} estudiantes
        </ThemedText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: tableWidth }}>
          <View style={[styles.tableHead, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Th width={COL.estudiante}>Estudiante</Th>
            {matrix.actividades.map((actividad) => (
              <Th key={actividad.id} width={COL.actividad} align="center">
                <ThemedText type="small" style={[styles.thText, { color: theme.textSecondary }]} numberOfLines={2}>
                  {actividad.titulo}
                </ThemedText>
                <ThemedText type="small" style={[styles.thDate, { color: theme.textSecondary }]}>
                  {actividad.fecha}
                </ThemedText>
              </Th>
            ))}
            <Th width={COL.definitiva} align="center">Definitiva</Th>
          </View>

          {matrix.estudiantes.map((estudiante, rowIndex) => (
            <NotaRow
              key={estudiante.estudianteId}
              estudiante={estudiante}
              actividades={matrix.actividades}
              rowIndex={rowIndex}
              canManage={canManage}
              onEditGrade={onEditGrade}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function NotaRow({
  estudiante,
  actividades,
  rowIndex,
  canManage,
  onEditGrade,
}: {
  estudiante: EstudianteMatriz;
  actividades: Actividad[];
  rowIndex: number;
  canManage: boolean;
  onEditGrade: (target: GradeTarget) => void;
}) {
  const theme = useTheme();
  const bg = rowIndex % 2 === 0 ? theme.backgroundElement : `${theme.backgroundElement}cc`;
  const notasByActivity = new Map(estudiante.notas.map((nota) => [nota.actividadId, nota]));

  return (
    <View style={[styles.tableRow, { backgroundColor: bg, borderColor: theme.border }]}>
      <Td width={COL.estudiante}>
        <ThemedText style={styles.studentName} numberOfLines={2}>{estudiante.estudianteNombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>{estudiante.documento}</ThemedText>
      </Td>

      {actividades.map((actividad) => {
        const nota = notasByActivity.get(actividad.id) ?? null;
        const value = nota ? Number(nota.nota).toFixed(1) : '-';

        return (
          <Td key={actividad.id} width={COL.actividad} align="center">
            <Pressable
              disabled={!canManage}
              onPress={() => onEditGrade({ estudiante, actividad, nota })}
              style={[styles.gradeCell, { borderColor: theme.border }, canManage && { backgroundColor: theme.surfaceMuted }]}>
              <ThemedText style={[styles.gradeText, { color: nota ? gradeColor(nota.nota) : theme.textSecondary }]}>
                {value}
              </ThemedText>
            </Pressable>
          </Td>
        );
      })}

      <Td width={COL.definitiva} align="center">
        <ThemedText style={[styles.finalText, { color: estudiante.definitiva ? gradeColor(estudiante.definitiva) : theme.textSecondary }]}>
          {estudiante.definitiva === null ? '-' : Number(estudiante.definitiva).toFixed(1)}
        </ThemedText>
      </Td>
    </View>
  );
}

function ActivityModal({
  visible,
  form,
  setForm,
  profesores,
  lockProfesor,
  saving,
  onSave,
  onClose,
}: {
  visible: boolean;
  form: typeof emptyActivityForm;
  setForm: Dispatch<SetStateAction<typeof emptyActivityForm>>;
  profesores: CatalogItem[];
  lockProfesor: boolean;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: theme.border }]}>
          <ThemedText style={styles.modalTitle}>Agregar actividad</ThemedText>
          <Field
            label="Nombre de la actividad *"
            value={form.titulo}
            onChangeText={(titulo) => setForm((current) => ({ ...current, titulo }))}
            placeholder="Ej. Quiz 1"
          />
          <Field
            label="Fecha *"
            value={form.fecha}
            onChangeText={(fecha) => setForm((current) => ({ ...current, fecha }))}
            placeholder="YYYY-MM-DD"
          />
          {!lockProfesor ? (
            <SelectField
              label="Profesor *"
              value={form.profesorId}
              options={profesores.map((item) => ({ value: String(item.id), label: item.nombre }))}
              onSelect={(profesorId) => setForm((current) => ({ ...current, profesorId }))}
            />
          ) : null}
          <ModalActions saving={saving} onClose={onClose} onSave={onSave} />
        </ThemedView>
      </View>
    </Modal>
  );
}

function GradeModal({
  target,
  form,
  setForm,
  saving,
  onSave,
  onClose,
}: {
  target: GradeTarget | null;
  form: typeof emptyGradeForm;
  setForm: Dispatch<SetStateAction<typeof emptyGradeForm>>;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={Boolean(target)} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: theme.border }]}>
          <ThemedText style={styles.modalTitle}>{target?.nota ? 'Editar nota' : 'Registrar nota'}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {target?.estudiante.estudianteNombre} - {target?.actividad.titulo}
          </ThemedText>
          <Field
            label="Nota * (1.0 - 5.0)"
            value={form.nota}
            onChangeText={(nota) => setForm((current) => ({ ...current, nota }))}
            placeholder="Ej. 4.5"
            keyboardType="decimal-pad"
          />
          <Field
            label="Observacion"
            value={form.observacion}
            onChangeText={(observacion) => setForm((current) => ({ ...current, observacion }))}
            placeholder="Comentario opcional"
            multiline
          />
          <ModalActions saving={saving} onClose={onClose} onSave={onSave} />
        </ThemedView>
      </View>
    </Modal>
  );
}

function ModalActions({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.modalActions}>
      <Pressable disabled={saving} onPress={onClose} style={[styles.outlineBtn, { borderColor: theme.border }]}>
        <ThemedText>Cancelar</ThemedText>
      </Pressable>
      <Pressable disabled={saving} onPress={onSave} style={[styles.outlineBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
        {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
      </Pressable>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.fieldInput, multiline && styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceMuted }]}
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
        style={[styles.fieldInput, styles.selectTrigger, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
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
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Sin opciones</ThemedText>
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

function Th({
  children,
  width,
  align = 'left',
}: {
  children: ReactNode;
  width: number;
  align?: 'left' | 'center';
}) {
  const theme = useTheme();
  return (
    <View style={[styles.th, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      {typeof children === 'string' ? (
        <ThemedText type="small" style={[styles.thText, { color: theme.textSecondary }]}>{children}</ThemedText>
      ) : children}
    </View>
  );
}

function Td({
  children,
  width,
  align = 'left',
}: {
  children: ReactNode;
  width: number;
  align?: 'left' | 'center';
}) {
  return (
    <View style={[styles.td, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { gap: Spacing.two },
  contentStack: { gap: Spacing.two },
  hero: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, minWidth: 180 },
  kicker: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0 },
  title: { fontSize: 20, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.two, paddingVertical: 9, borderRadius: 6, flexShrink: 0 },
  addBtnText: { fontWeight: '600', fontSize: 13 },
  chipScroll: { height: 38, maxHeight: 38, flexGrow: 0, flexShrink: 0 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 2 },
  chip: { height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontWeight: '500', fontSize: 12 },
  filters: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  center: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, borderRadius: 8, padding: Spacing.three },
  emptyBox: { borderWidth: 1, borderColor: 'transparent' },
  listContent: { gap: Spacing.two, paddingBottom: Spacing.five },
  salonGrid: { gap: Spacing.two },
  salonCard: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  salonName: { fontSize: 16, fontWeight: '700' },
  salonCount: { fontWeight: '600' },
  backBtn: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontWeight: '600' },
  seccion: { gap: 0, paddingBottom: Spacing.five },
  cursoHeader: {
    borderWidth: 1,
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  cursoHeaderText: { flex: 1, minWidth: 160 },
  cursoTitulo: { fontSize: 15, fontWeight: '700' },
  countBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontWeight: '600' },
  emptyRow: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: Spacing.two,
    alignItems: 'center',
  },
  tableHead: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    paddingVertical: 7,
  },
  th: { paddingHorizontal: 8, justifyContent: 'center', minHeight: 48 },
  thText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0, textAlign: 'center' },
  thDate: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  td: { paddingHorizontal: 8, justifyContent: 'center', minHeight: 46 },
  cellEstudiante: { fontWeight: '600', fontSize: 13 },
  studentName: { fontWeight: '700', fontSize: 13 },
  gradeCell: {
    minWidth: 56,
    minHeight: 32,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  gradeText: { fontSize: 15, fontWeight: '800' },
  notaCell: { fontSize: 15, fontWeight: '700' },
  finalText: { fontSize: 15, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modal: { width: '100%', maxWidth: 520, borderWidth: 1, borderRadius: 10, padding: Spacing.four, gap: Spacing.two },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  field: { gap: 4 },
  fieldLabel: { opacity: 0.68 },
  fieldInput: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, justifyContent: 'center' },
  selectTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderRadius: 6, marginTop: 2, zIndex: 99 },
  dropdownItem: { paddingHorizontal: Spacing.two, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  textarea: { minHeight: 78, textAlignVertical: 'top', paddingTop: 9 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: 4 },
  outlineBtn: { minHeight: 40, minWidth: 100, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
