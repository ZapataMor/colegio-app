import { useLocalSearchParams } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DocumentTextIcon from 'react-native-heroicons/outline/DocumentTextIcon';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type Catalog = {
  estudiantes: { id: number; nombre: string; documento: string; curso_nombre: string }[];
  periodos: { id: number; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string }[];
};

type Boletin = {
  estudiante: {
    id: number;
    nombres: string;
    apellidos: string;
    documento: string;
    curso_nombre: string;
    curso_nivel: string;
    curso_jornada: string;
  };
  periodo: { id: number; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string };
  materias: { id: number; asignatura: string; profesor: string; nota: number; desempeno: string; observacion: string | null }[];
  resumen: {
    promedioGeneral: number;
    materiasRegistradas: number;
    materiasAprobadas: number;
    materiasEnRiesgo: number;
    porcentajeAsistencia: number;
  };
  asistencia: {
    presente: number;
    ausente: number;
    excusa: number;
    tardanza: number;
    total: number;
  };
  observaciones: { asignatura: string; observacion: string }[];
};

export default function BoletinesScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const [catalog, setCatalog] = useState<Catalog>({ estudiantes: [], periodos: [] });
  const [boletin, setBoletin] = useState<Boletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedPeriodoId, setSelectedPeriodoId] = useState('');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const loadCatalog = useCallback(async () => {
    const response = await apiFetch<Catalog>('/api/boletines/catalogo');
    const data = response.data ?? { estudiantes: [], periodos: [] };
    setCatalog(data);

    if (!selectedStudentId) {
      const defaultStudentId = params.studentId || String(data.estudiantes[0]?.id ?? '');
      setSelectedStudentId(defaultStudentId);
    }

    if (!selectedPeriodoId) {
      const activePeriodo = data.periodos.find((item) => item.estado === 'activo')?.id ?? data.periodos[0]?.id;
      setSelectedPeriodoId(activePeriodo ? String(activePeriodo) : '');
    }
  }, [params.studentId, selectedPeriodoId, selectedStudentId]);

  const loadBoletin = useCallback(async () => {
    if (!selectedStudentId) return;
    const query = selectedPeriodoId ? `?periodoId=${selectedPeriodoId}` : '';
    const response = await apiFetch<Boletin>(`/api/boletines/estudiantes/${selectedStudentId}${query}`);
    setBoletin(response.data ?? null);
  }, [selectedPeriodoId, selectedStudentId]);

  const loadData = useCallback(async () => {
    try {
      setError('');
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catalogo de boletines.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadCatalog]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedStudentId) return;
    loadBoletin().catch((err) => {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el boletin.');
    });
  }, [loadBoletin, selectedStudentId]);

  const visibleStudents = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return catalog.estudiantes.slice(0, 10);
    return catalog.estudiantes
      .filter((item) =>
        `${item.nombre} ${item.documento} ${item.curso_nombre}`.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [catalog.estudiantes, deferredSearch]);

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
      return;
    }
    Alert.alert('Impresion web', 'La impresion directa esta disponible en la version web del sistema.');
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}20` }]}>
            <DocumentTextIcon width={22} height={22} color={theme.primary} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.warning }]}>
              Reporte academico
            </ThemedText>
            <ThemedText type="title">Boletines</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              Vista elegante para consulta e impresion del rendimiento por periodo.
            </ThemedText>
          </View>
        </View>
      </View>

      <ModuleHeader title="Boletin estudiantil" />

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
                if (selectedStudentId) {
                  loadBoletin().finally(() => setRefreshing(false));
                }
              }}
            />
          }
          contentContainerStyle={styles.page}>
          <View style={styles.controlPanel}>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar estudiante por nombre, documento o curso"
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>

            <OptionChips
              label="Estudiante"
              options={visibleStudents.map((item) => ({
                value: String(item.id),
                label: `${item.nombre} · ${item.curso_nombre}`,
              }))}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
            />

            <OptionChips
              label="Periodo"
              options={catalog.periodos.map((item) => ({
                value: String(item.id),
                label: item.nombre,
              }))}
              value={selectedPeriodoId}
              onChange={setSelectedPeriodoId}
            />
          </View>

          {boletin ? (
            <View style={styles.reportWrap}>
              <View style={styles.summaryGrid}>
                <MetricCard label="Promedio" value={boletin.resumen.promedioGeneral.toFixed(2)} />
                <MetricCard label="Materias" value={String(boletin.resumen.materiasRegistradas)} />
                <MetricCard label="Aprobadas" value={String(boletin.resumen.materiasAprobadas)} />
                <MetricCard label="Asistencia" value={`${boletin.resumen.porcentajeAsistencia}%`} />
              </View>

              <ThemedView type="backgroundElement" style={[styles.reportCard, { borderColor: theme.border }]}>
                <View style={styles.reportHeader}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="small" style={[styles.reportLabel, { color: theme.primary }]}>
                      Institucion educativa
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.reportTitle}>
                      Boletin academico
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>
                      {boletin.periodo.nombre} · {boletin.periodo.fecha_inicio} al {boletin.periodo.fecha_fin}
                    </ThemedText>
                  </View>
                  <Pressable onPress={handlePrint} style={[styles.printButton, { backgroundColor: theme.primary }]}>
                    <ThemedText style={{ color: theme.primaryText, fontWeight: '800' }}>Imprimir</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.studentMeta}>
                  <MetaItem label="Estudiante" value={`${boletin.estudiante.nombres} ${boletin.estudiante.apellidos}`} />
                  <MetaItem label="Documento" value={boletin.estudiante.documento} />
                  <MetaItem label="Curso" value={boletin.estudiante.curso_nombre} />
                  <MetaItem label="Jornada" value={boletin.estudiante.curso_jornada} />
                </View>

                <View style={[styles.table, { borderColor: theme.border }]}>
                  <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                    <ThemedText style={styles.headMateria}>MATERIA</ThemedText>
                    <ThemedText style={styles.headCell}>DOCENTE</ThemedText>
                    <ThemedText style={styles.headCell}>NOTA</ThemedText>
                    <ThemedText style={styles.headCell}>DESEMPENO</ThemedText>
                  </View>
                  {boletin.materias.length === 0 ? (
                    <ThemedText style={styles.emptyText}>Aun no hay notas registradas para este periodo.</ThemedText>
                  ) : (
                    boletin.materias.map((item) => (
                      <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                        <View style={styles.materiaCell}>
                          <ThemedText style={styles.materiaTitle}>{item.asignatura}</ThemedText>
                          {item.observacion ? (
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                              {item.observacion}
                            </ThemedText>
                          ) : null}
                        </View>
                        <ThemedText style={styles.tableCell}>{item.profesor}</ThemedText>
                        <ThemedText style={[styles.tableCell, { color: item.nota >= 3 ? theme.accent : theme.danger }]}>
                          {item.nota.toFixed(2)}
                        </ThemedText>
                        <ThemedText style={styles.tableCell}>{item.desempeno}</ThemedText>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.attendanceRow}>
                  <AttendancePill label="Presente" value={boletin.asistencia.presente} tone="ok" />
                  <AttendancePill label="Ausente" value={boletin.asistencia.ausente} tone="danger" />
                  <AttendancePill label="Excusa" value={boletin.asistencia.excusa} tone="warn" />
                  <AttendancePill label="Tardanza" value={boletin.asistencia.tardanza} tone="warn" />
                </View>

                {boletin.observaciones.length > 0 ? (
                  <View style={styles.notesBlock}>
                    <ThemedText type="small" style={[styles.reportLabel, { color: theme.warning }]}>
                      Observaciones destacadas
                    </ThemedText>
                    {boletin.observaciones.map((item) => (
                      <ThemedView key={`${item.asignatura}-${item.observacion}`} type="backgroundElement" style={[styles.noteCard, { borderColor: theme.border }]}>
                        <ThemedText style={styles.noteSubject}>{item.asignatura}</ThemedText>
                        <ThemedText style={{ color: theme.textSecondary }}>{item.observacion}</ThemedText>
                      </ThemedView>
                    ))}
                  </View>
                ) : null}
              </ThemedView>
            </View>
          ) : null}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.metricCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.metricValue, { color: theme.text }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.metaCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
      <ThemedText style={styles.metaValue}>{value}</ThemedText>
    </ThemedView>
  );
}

function AttendancePill({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'danger' }) {
  const theme = useTheme();
  const color = tone === 'ok' ? theme.accent : tone === 'warn' ? theme.warning : theme.danger;
  return (
    <View style={[styles.attendancePill, { backgroundColor: `${color}20` }]}>
      <ThemedText type="small" style={{ color }}>{label}</ThemedText>
      <ThemedText style={{ color, fontWeight: '800' }}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: { position: 'relative', overflow: 'hidden', borderRadius: 28, borderWidth: 1, padding: Spacing.four },
  heroGlowA: { position: 'absolute', top: -50, right: -20, width: 170, height: 170, borderRadius: 999, backgroundColor: '#0F766E', opacity: 0.12 },
  heroGlowB: { position: 'absolute', bottom: -60, left: -20, width: 140, height: 140, borderRadius: 999, backgroundColor: '#C9891A', opacity: 0.12 },
  heroTop: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  controlPanel: { gap: Spacing.three },
  searchBox: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.two },
  reportWrap: { gap: Spacing.three },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metricCard: { flex: 1, minWidth: 130, borderRadius: 20, borderWidth: 1, padding: Spacing.three },
  metricValue: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  reportCard: { borderRadius: 28, borderWidth: 1, padding: Spacing.four, gap: Spacing.three },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, alignItems: 'flex-start' },
  reportLabel: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800' },
  reportTitle: { fontSize: 28, lineHeight: 34 },
  printButton: { minHeight: 44, paddingHorizontal: Spacing.three, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  studentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metaCard: { minWidth: 150, flex: 1, borderRadius: 18, borderWidth: 1, padding: Spacing.three },
  metaValue: { fontWeight: '700', marginTop: 4 },
  table: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', minHeight: 44, alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: Spacing.two },
  headMateria: { flex: 1.5, fontSize: 11, fontWeight: '800', opacity: 0.6 },
  headCell: { flex: 1, fontSize: 11, fontWeight: '800', opacity: 0.6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.three, gap: Spacing.two },
  materiaCell: { flex: 1.5, gap: 4 },
  materiaTitle: { fontWeight: '700' },
  tableCell: { flex: 1, fontWeight: '600' },
  attendanceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  attendancePill: { borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  notesBlock: { gap: Spacing.two },
  noteCard: { borderRadius: 18, borderWidth: 1, padding: Spacing.three, gap: 4 },
  noteSubject: { fontWeight: '800' },
  emptyText: { padding: Spacing.four, textAlign: 'center', opacity: 0.7 },
});
