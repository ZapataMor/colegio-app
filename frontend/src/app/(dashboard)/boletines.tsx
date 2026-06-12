import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import CheckBadgeIcon from 'react-native-heroicons/outline/CheckBadgeIcon';
import DocumentTextIcon from 'react-native-heroicons/outline/DocumentTextIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type Curso = {
  id: number;
  nombre: string;
  nivel: string;
  jornada: string;
  estudiantes_total: number | string;
};

type EstudianteCatalogo = {
  id: number;
  curso_id: number;
  nombre: string;
  documento: string;
  curso_nombre: string;
};

type Catalog = {
  cursos: Curso[];
  estudiantes: EstudianteCatalogo[];
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

type GenerateResponse = {
  cursoId: number;
  periodo: Catalog['periodos'][number];
  estudiantesGenerados: number;
  estudiantes: number[];
};

const emptyCatalog: Catalog = { cursos: [], estudiantes: [], periodos: [] };

const institution = {
  name: 'Institucion Educativa #2 Inmaculada',
  appName: 'Colegio App',
  location: 'Colombia',
};

export default function BoletinesScreen() {
  const theme = useTheme();
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState('');
  const [boletin, setBoletin] = useState<Boletin | null>(null);
  const [generatedByKey, setGeneratedByKey] = useState<Record<string, number[]>>({});
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const response = await apiFetch<Catalog>('/api/boletines/catalogo');
      const data = response.data ?? emptyCatalog;
      setCatalog(data);
      setSelectedPeriodoId((current) => {
        if (current) return current;
        const active = data.periodos.find((item) => item.estado === 'activo') ?? data.periodos[0];
        return active ? String(active.id) : '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catalogo de boletines.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedCurso = useMemo(
    () => catalog.cursos.find((curso) => curso.id === selectedCursoId) ?? null,
    [catalog.cursos, selectedCursoId]
  );

  const selectedStudents = useMemo(
    () => catalog.estudiantes.filter((estudiante) => estudiante.curso_id === selectedCursoId),
    [catalog.estudiantes, selectedCursoId]
  );

  const generationKey = selectedCursoId && selectedPeriodoId ? `${selectedCursoId}-${selectedPeriodoId}` : '';
  const generatedStudentIds = generationKey ? generatedByKey[generationKey] ?? [] : [];
  const generatedCount = selectedStudents.filter((student) => generatedStudentIds.includes(student.id)).length;

  const generateBoletines = async () => {
    if (!selectedCurso || !selectedPeriodoId) {
      Alert.alert('Faltan datos', 'Selecciona un salon y un periodo academico.');
      return;
    }

    try {
      setGenerating(true);
      const response = await apiFetch<GenerateResponse>('/api/boletines/generar', {
        method: 'POST',
        body: {
          cursoId: selectedCurso.id,
          periodoId: Number(selectedPeriodoId),
        },
      });
      const generatedIds = response.data?.estudiantes ?? selectedStudents.map((student) => student.id);
      setGeneratedByKey((current) => ({ ...current, [generationKey]: generatedIds }));
      Alert.alert('Boletines generados', `${generatedIds.length} boletin(es) disponibles para descargar.`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudieron generar los boletines.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadBoletin = async (student: EstudianteCatalogo) => {
    if (!generatedStudentIds.includes(student.id)) return;

    try {
      setDownloadingId(student.id);
      const query = selectedPeriodoId ? `?periodoId=${selectedPeriodoId}` : '';
      const response = await apiFetch<Boletin>(`/api/boletines/estudiantes/${student.id}${query}`);
      const data = response.data ?? null;
      setBoletin(data);

      if (Platform.OS === 'web' && data) {
        printBoletin(data);
      } else {
        Alert.alert('Boletin listo', 'El boletin quedo cargado en la vista para consulta.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo descargar el boletin.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}20` }]}>
          <DocumentTextIcon width={22} height={22} color={theme.primary} />
        </View>
        <View style={styles.heroCopy}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
            Reporte academico
          </ThemedText>
          <ThemedText type="title">Boletines</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {catalog.cursos.length} salones - {catalog.estudiantes.length} estudiantes
          </ThemedText>
        </View>
      </View>

      <ModuleHeader title="Boletines" />

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
          {catalog.periodos.length > 0 ? (
            <OptionChips
              label="Periodo"
              options={catalog.periodos.map((item) => ({ value: String(item.id), label: item.nombre }))}
              value={selectedPeriodoId}
              onChange={(value) => {
                setSelectedPeriodoId(value);
                setBoletin(null);
              }}
            />
          ) : null}

          {selectedCurso ? (
            <View style={styles.courseContent}>
              <Pressable
                onPress={() => {
                  setSelectedCursoId(null);
                  setBoletin(null);
                }}
                style={[styles.backButton, { borderColor: theme.border }]}>
                <ThemedText type="small" style={[styles.backText, { color: theme.text }]}>Ver salones</ThemedText>
              </Pressable>

              <View style={[styles.courseHeader, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.courseTitleBlock}>
                  <ThemedText style={[styles.courseName, { color: theme.primary }]}>{selectedCurso.nombre}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {selectedStudents.length} estudiante{selectedStudents.length !== 1 ? 's' : ''} - Jornada {selectedCurso.jornada}
                  </ThemedText>
                </View>
                <Pressable
                  disabled={generating || selectedStudents.length === 0}
                  onPress={generateBoletines}
                  style={[
                    styles.generateButton,
                    { backgroundColor: theme.primary },
                    (generating || selectedStudents.length === 0) && styles.disabledButton,
                  ]}>
                  {generating ? (
                    <ActivityIndicator color={theme.primaryText} />
                  ) : (
                    <CheckBadgeIcon width={16} height={16} color={theme.primaryText} />
                  )}
                  <ThemedText style={[styles.actionText, { color: theme.primaryText }]}>Generar boletines</ThemedText>
                </Pressable>
              </View>

              <View style={styles.studentList}>
                {selectedStudents.length === 0 ? (
                  <ThemedView type="backgroundElement" style={[styles.emptyBox, { borderColor: theme.border }]}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Este salon no tiene estudiantes registrados.
                    </ThemedText>
                  </ThemedView>
                ) : (
                  selectedStudents.map((student, index) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      index={index}
                      enabled={generatedStudentIds.includes(student.id)}
                      loading={downloadingId === student.id}
                      onDownload={() => downloadBoletin(student)}
                    />
                  ))
                )}
              </View>

              {selectedStudents.length > 0 ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Boletines habilitados: {generatedCount} de {selectedStudents.length}
                </ThemedText>
              ) : null}

              {boletin ? <ReportPreview boletin={boletin} /> : null}
            </View>
          ) : catalog.cursos.length > 0 ? (
            <View style={styles.salonGrid}>
              {catalog.cursos.map((curso) => (
                <SalonCard
                  key={curso.id}
                  curso={curso}
                  onPress={() => {
                    setSelectedCursoId(curso.id);
                    setBoletin(null);
                  }}
                />
              ))}
            </View>
          ) : (
            <ThemedView type="backgroundElement" style={[styles.emptyBox, { borderColor: theme.border }]}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                No hay salones activos para mostrar.
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function printBoletin(boletin: Boletin) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

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
    return;
  }

  doc.open();
  doc.write(buildBoletinHtml(boletin));
  doc.close();

  const printFrame = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 800);
  };

  window.setTimeout(printFrame, 250);
}

function buildBoletinHtml(boletin: Boletin) {
  const studentName = `${boletin.estudiante.nombres} ${boletin.estudiante.apellidos}`;
  const materiasRows = boletin.materias.length
    ? boletin.materias.map((item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.asignatura)}</strong>
            <span>${escapeHtml(item.desempeno)}</span>
          </td>
          <td class="score">${item.nota.toFixed(2)}</td>
          <td>${escapeHtml(item.profesor)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" class="empty">Aun no hay notas registradas para este periodo.</td></tr>';

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Boletin - ${escapeHtml(studentName)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f3f5f7;
            color: #1f2933;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 13px;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #ffffff;
            padding: 18mm;
          }
          .institution {
            border-bottom: 2px solid #d7dee8;
            padding-bottom: 14px;
            margin-bottom: 18px;
            text-align: center;
          }
          .institution h1 {
            margin: 0 0 6px;
            font-size: 22px;
            letter-spacing: 0;
            text-transform: uppercase;
          }
          .institution p,
          .meta p {
            margin: 2px 0;
            color: #56616f;
          }
          .section-title {
            margin: 18px 0 8px;
            color: #0f766e;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .student-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border: 1px solid #d7dee8;
            border-radius: 6px;
            overflow: hidden;
          }
          .field {
            min-height: 56px;
            padding: 10px;
            border-right: 1px solid #d7dee8;
            border-bottom: 1px solid #d7dee8;
          }
          .field:nth-child(3n) { border-right: 0; }
          .field:nth-last-child(-n + 3) { border-bottom: 0; }
          .label {
            display: block;
            margin-bottom: 4px;
            color: #697586;
            font-size: 11px;
            text-transform: uppercase;
          }
          .value {
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d7dee8;
          }
          th {
            background: #eef3f7;
            color: #3f4b5a;
            font-size: 11px;
            padding: 10px;
            text-align: left;
            text-transform: uppercase;
          }
          td {
            border-top: 1px solid #d7dee8;
            padding: 10px;
            vertical-align: middle;
          }
          td span {
            display: block;
            color: #697586;
            font-size: 11px;
            margin-top: 3px;
          }
          .score {
            width: 90px;
            color: #0f766e;
            font-size: 18px;
            font-weight: 800;
            text-align: center;
          }
          .teacher {
            width: 38%;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 16px;
          }
          .summary div {
            border: 1px solid #d7dee8;
            border-radius: 6px;
            padding: 10px;
          }
          .summary strong {
            display: block;
            font-size: 20px;
            margin-top: 4px;
          }
          .empty {
            color: #697586;
            text-align: center;
          }
          @media print {
            body { background: #ffffff; }
            .page {
              width: auto;
              min-height: auto;
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="institution">
            <h1>${escapeHtml(institution.name)}</h1>
            <p>${escapeHtml(institution.appName)} - ${escapeHtml(institution.location)}</p>
            <p>Boletin academico - ${escapeHtml(boletin.periodo.nombre)}</p>
          </section>

          <section>
            <h2 class="section-title">Informacion del estudiante</h2>
            <div class="student-grid">
              ${studentField('Estudiante', studentName)}
              ${studentField('Documento', boletin.estudiante.documento)}
              ${studentField('Salon', boletin.estudiante.curso_nombre)}
              ${studentField('Nivel', boletin.estudiante.curso_nivel)}
              ${studentField('Jornada', boletin.estudiante.curso_jornada)}
              ${studentField('Periodo', boletin.periodo.nombre)}
            </div>
          </section>

          <section>
            <h2 class="section-title">Informacion de notas</h2>
            <table>
              <thead>
                <tr>
                  <th>Asignatura</th>
                  <th>Nota</th>
                  <th class="teacher">Profesor</th>
                </tr>
              </thead>
              <tbody>${materiasRows}</tbody>
            </table>
          </section>

          <section class="summary">
            ${summaryField('Promedio', boletin.resumen.promedioGeneral.toFixed(2))}
            ${summaryField('Materias', String(boletin.resumen.materiasRegistradas))}
            ${summaryField('Aprobadas', String(boletin.resumen.materiasAprobadas))}
            ${summaryField('Asistencia', `${boletin.resumen.porcentajeAsistencia}%`)}
          </section>
        </main>
      </body>
    </html>`;
}

function studentField(label: string, value: string) {
  return `<div class="field"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`;
}

function summaryField(label: string, value: string) {
  return `<div><span class="label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function SalonCard({ curso, onPress }: { curso: Curso; onPress: () => void }) {
  const theme = useTheme();
  const total = Number(curso.estudiantes_total || 0);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.salonCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.salonIcon}>
        <DocumentTextIcon width={18} height={18} color={theme.primary} />
      </View>
      <View style={styles.salonText}>
        <ThemedText style={[styles.salonName, { color: theme.text }]}>{curso.nombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {curso.nivel} - {total} estudiante{total !== 1 ? 's' : ''}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function StudentRow({
  student,
  index,
  enabled,
  loading,
  onDownload,
}: {
  student: EstudianteCatalogo;
  index: number;
  enabled: boolean;
  loading: boolean;
  onDownload: () => void;
}) {
  const theme = useTheme();
  const initials = student.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.studentRow,
        {
          backgroundColor: index % 2 === 0 ? theme.backgroundElement : `${theme.backgroundElement}cc`,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
        <ThemedText style={[styles.avatarText, { color: theme.primary }]}>{initials || 'ES'}</ThemedText>
      </View>
      <View style={styles.studentInfo}>
        <ThemedText style={styles.studentName} numberOfLines={1}>{student.nombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>Documento {student.documento}</ThemedText>
      </View>
      <Pressable
        disabled={!enabled || loading}
        onPress={onDownload}
        style={[
          styles.downloadButton,
          { borderColor: enabled ? theme.primary : theme.border, backgroundColor: enabled ? theme.primary : theme.surfaceMuted },
          (!enabled || loading) && styles.disabledButton,
        ]}>
        {loading ? (
          <ActivityIndicator color={enabled ? theme.primaryText : theme.textSecondary} />
        ) : (
          <DocumentTextIcon width={15} height={15} color={enabled ? theme.primaryText : theme.textSecondary} />
        )}
        <ThemedText
          type="small"
          style={[styles.downloadText, { color: enabled ? theme.primaryText : theme.textSecondary }]}>
          Descargar boletin
        </ThemedText>
      </Pressable>
    </View>
  );
}

function ReportPreview({ boletin }: { boletin: Boletin }) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.reportPaper, { borderColor: theme.border }]}>
      <View style={[styles.institutionHeader, { borderBottomColor: theme.border }]}>
        <Image
          source={require('@/assets/images/escudo-inmaculada.jpg')}
          style={styles.institutionLogo}
        />
        <View style={styles.institutionInfo}>
          <ThemedText style={styles.institutionName}>{institution.name}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {institution.appName} - {institution.location}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Boletin academico - {boletin.periodo.nombre}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.studentSection, { borderColor: theme.border }]}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.primary }]}>
          Informacion del estudiante
        </ThemedText>
        <View style={styles.studentInfoGrid}>
          <InfoField label="Estudiante" value={`${boletin.estudiante.nombres} ${boletin.estudiante.apellidos}`} />
          <InfoField label="Documento" value={boletin.estudiante.documento} />
          <InfoField label="Salon" value={boletin.estudiante.curso_nombre} />
          <InfoField label="Nivel" value={boletin.estudiante.curso_nivel} />
          <InfoField label="Jornada" value={boletin.estudiante.curso_jornada} />
          <InfoField label="Periodo" value={boletin.periodo.nombre} />
        </View>
      </View>

      <View style={styles.academicSection}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.primary }]}>
          Informacion de notas
        </ThemedText>
        <View style={[styles.gradeTable, { borderColor: theme.border }]}>
          <View style={[styles.gradeTableHead, { backgroundColor: theme.surfaceMuted, borderBottomColor: theme.border }]}>
            <ThemedText style={styles.gradeSubjectHead}>Asignatura</ThemedText>
            <ThemedText style={styles.gradeScoreHead}>Nota</ThemedText>
            <ThemedText style={styles.gradeTeacherHead}>Profesor</ThemedText>
          </View>
          {boletin.materias.length === 0 ? (
            <ThemedText style={styles.emptyText}>Aun no hay notas registradas para este periodo.</ThemedText>
          ) : (
            boletin.materias.map((item) => (
              <View key={item.id} style={[styles.gradeRow, { borderBottomColor: theme.border }]}>
                <View style={styles.gradeSubjectCell}>
                  <ThemedText style={styles.subjectName}>{item.asignatura}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.desempeno}</ThemedText>
                </View>
                <ThemedText style={[styles.gradeScoreCell, { color: item.nota >= 3 ? theme.accent : theme.danger }]}>
                  {item.nota.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.gradeTeacherCell}>{item.profesor}</ThemedText>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="Promedio" value={boletin.resumen.promedioGeneral.toFixed(2)} />
        <Metric label="Materias" value={String(boletin.resumen.materiasRegistradas)} />
        <Metric label="Aprobadas" value={String(boletin.resumen.materiasAprobadas)} />
        <Metric label="Asistencia" value={`${boletin.resumen.porcentajeAsistencia}%`} />
      </View>
    </ThemedView>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.infoField, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.metric, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText style={[styles.metricValue, { color: theme.text }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 2 },
  kicker: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  salonGrid: { gap: Spacing.two },
  salonCard: {
    minHeight: 70,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  salonIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  salonText: { flex: 1, gap: 3 },
  salonName: { fontSize: 16, fontWeight: '700' },
  courseContent: { gap: Spacing.two },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontWeight: '700' },
  courseHeader: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  courseTitleBlock: { flex: 1, minWidth: 180, gap: 3 },
  courseName: { fontSize: 18, fontWeight: '800' },
  generateButton: {
    minHeight: 40,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  actionText: { fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  studentList: { gap: 0 },
  studentRow: {
    minHeight: 68,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800' },
  studentInfo: { flex: 1, minWidth: 120, gap: 2 },
  studentName: { fontWeight: '700' },
  downloadButton: {
    minHeight: 38,
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  downloadText: { fontWeight: '800' },
  emptyBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.four, alignItems: 'center' },
  reportPaper: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.three },
  institutionHeader: {
    minHeight: 86,
    borderBottomWidth: 1,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  institutionLogo: { width: 64, height: 64, borderRadius: 6 },
  institutionInfo: { flex: 1, gap: 3 },
  institutionName: { fontSize: 20, fontWeight: '800' },
  studentSection: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.two },
  sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  studentInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  infoField: {
    minWidth: 150,
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    gap: 2,
  },
  infoValue: { fontWeight: '700' },
  academicSection: { gap: Spacing.two },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metric: { flex: 1, minWidth: 120, borderWidth: 1, borderRadius: 8, padding: Spacing.two },
  metricValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  gradeTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  gradeTableHead: {
    minHeight: 42,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  gradeSubjectHead: { flex: 1.3, fontSize: 11, fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' },
  gradeScoreHead: { width: 76, fontSize: 11, fontWeight: '800', opacity: 0.7, textAlign: 'center', textTransform: 'uppercase' },
  gradeTeacherHead: { flex: 1, fontSize: 11, fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' },
  gradeRow: {
    minHeight: 48,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gradeSubjectCell: { flex: 1.3, gap: 2 },
  subjectName: { fontWeight: '700' },
  gradeScoreCell: { width: 76, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  gradeTeacherCell: { flex: 1, fontWeight: '600' },
  emptyText: { padding: Spacing.three, textAlign: 'center', opacity: 0.7 },
});
