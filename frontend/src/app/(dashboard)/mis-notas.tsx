import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { getUserSession } from '@/lib/session';

type MeData = {
  personaId: number;
  estudianteId: number | null;
  cursoNombre: string | null;
};

type Periodo = { id: number; nombre: string; estado: string };

type Boletin = {
  estudiante: { nombres: string; apellidos: string; curso_nombre: string; curso_jornada: string };
  periodo: { nombre: string };
  materias: { asignatura: string; profesor: string; nota: number; desempeno: string; observacion: string | null }[];
  resumen: { promedioGeneral: number; materiasRegistradas: number; materiasAprobadas: number; materiasEnRiesgo: number; porcentajeAsistencia: number };
  asistencia: { presente: number; ausente: number; excusa: number; tardanza: number; total: number };
};

const desempenoColor = (d: string) => {
  if (d === 'Superior') return '#8FBF26';
  if (d === 'Alto') return '#4CA5DC';
  if (d === 'Basico') return '#E8A020';
  return '#F25C5C';
};

export default function MisNotasScreen() {
  const theme = useTheme();
  const session = getUserSession();
  const [me, setMe] = useState<MeData | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [boletin, setBoletin] = useState<Boletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [meRes, perRes] = await Promise.all([
        apiFetch<MeData>('/api/me'),
        apiFetch<Periodo[]>('/api/periodos'),
      ]);
      const meData = meRes.data ?? null;
      const periodosData = perRes.data ?? [];
      setMe(meData);
      setPeriodos(periodosData);
      const activo = periodosData.find((p) => p.estado === 'activo');
      if (activo) setSelectedPeriodo(String(activo.id));
      else if (periodosData[0]) setSelectedPeriodo(String(periodosData[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const loadBoletin = useCallback(async () => {
    if (!me?.estudianteId || !selectedPeriodo) return;
    try {
      setLoading(true);
      const res = await apiFetch<Boletin>(`/api/boletines/estudiantes/${me.estudianteId}?periodoId=${selectedPeriodo}`);
      setBoletin(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar boletin.');
    } finally {
      setLoading(false);
    }
  }, [me, selectedPeriodo]);

  useEffect(() => { loadBoletin(); }, [loadBoletin]);

  if (loading) {
    return (
      <ScreenShell contentStyle={styles.center}>
        <ActivityIndicator color={theme.primary} size="large" />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando tus notas...</ThemedText>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell contentStyle={styles.center}>
        <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
        <Pressable onPress={loadMe} style={[styles.btn, { borderColor: theme.border }]}>
          <ThemedText>Reintentar</ThemedText>
        </Pressable>
      </ScreenShell>
    );
  }

  if (!me?.estudianteId) {
    return (
      <ScreenShell contentStyle={styles.center}>
        <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
          Tu cuenta no tiene un perfil de estudiante asociado.{'\n'}Contacta al administrador.
        </ThemedText>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell contentStyle={styles.shell}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>Mis calificaciones</ThemedText>
        <ThemedText style={styles.title}>
          {session?.nombre} {session?.apellido}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>{me.cursoNombre}</ThemedText>
      </ThemedView>

      {/* Selector de período */}
      {periodos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {periodos.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelectedPeriodo(String(p.id))}
              style={[styles.chip, String(p.id) === selectedPeriodo && { backgroundColor: theme.primary }]}>
              <ThemedText type="small" style={[styles.chipText, String(p.id) === selectedPeriodo && { color: theme.primaryText }]}>
                {p.nombre}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {boletin ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Resumen */}
          <View style={styles.metricsRow}>
            <Metric label="Promedio" value={boletin.resumen.promedioGeneral.toFixed(2)} highlight />
            <Metric label="Aprobadas" value={String(boletin.resumen.materiasAprobadas)} tone="ok" />
            <Metric label="En riesgo" value={String(boletin.resumen.materiasEnRiesgo)} tone={boletin.resumen.materiasEnRiesgo > 0 ? 'warn' : undefined} />
            <Metric label="Asistencia" value={`${boletin.resumen.porcentajeAsistencia}%`} />
          </View>

          {/* Tabla de materias */}
          <ThemedText type="small" style={styles.sectionLabel}>Calificaciones por materia</ThemedText>
          {boletin.materias.length === 0 ? (
            <ThemedView type="backgroundElement" style={[styles.emptyBox, { borderColor: theme.border }]}>
              <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                No hay notas registradas para este periodo.
              </ThemedText>
            </ThemedView>
          ) : (
            boletin.materias.map((m, i) => (
              <ThemedView key={i} type="backgroundElement" style={[styles.materiaCard, { borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.materiaName}>{m.asignatura}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Prof. {m.profesor}</ThemedText>
                  {m.observacion ? (
                    <ThemedText type="small" style={{ color: theme.textSecondary, fontStyle: 'italic', marginTop: 2 }}>{m.observacion}</ThemedText>
                  ) : null}
                </View>
                <View style={styles.notaWrap}>
                  <ThemedText style={[styles.notaGrande, { color: desempenoColor(m.desempeno) }]}>
                    {Number(m.nota).toFixed(1)}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: desempenoColor(m.desempeno), fontWeight: '600' }}>
                    {m.desempeno}
                  </ThemedText>
                </View>
              </ThemedView>
            ))
          )}

          {/* Asistencias */}
          <ThemedText type="small" style={styles.sectionLabel}>Resumen de asistencia</ThemedText>
          <View style={styles.asistRow}>
            <AsistStat label="Presentes" value={boletin.asistencia.presente} color={theme.accent} />
            <AsistStat label="Ausentes" value={boletin.asistencia.ausente} color={theme.danger} />
            <AsistStat label="Excusas" value={boletin.asistencia.excusa} color="#E8A020" />
            <AsistStat label="Tardanzas" value={boletin.asistencia.tardanza} color={theme.textSecondary} />
          </View>
        </ScrollView>
      ) : (
        <ThemedView type="backgroundElement" style={[styles.emptyBox, { borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Selecciona un periodo para ver tus calificaciones.
          </ThemedText>
        </ThemedView>
      )}
    </ScreenShell>
  );
}

function Metric({ label, value, highlight, tone }: { label: string; value: string; highlight?: boolean; tone?: 'ok' | 'warn' }) {
  const theme = useTheme();
  const color = tone === 'ok' ? theme.accent : tone === 'warn' ? '#E8A020' : highlight ? theme.primary : theme.text;
  return (
    <ThemedView type="backgroundElement" style={styles.metric}>
      <ThemedText type="small" style={{ opacity: 0.65 }}>{label}</ThemedText>
      <ThemedText style={[styles.metricVal, { color }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function AsistStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.asistCard}>
      <ThemedText style={[styles.asistNum, { color }]}>{value}</ThemedText>
      <ThemedText type="small" style={{ opacity: 0.65 }}>{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  shell: { gap: Spacing.two },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  hero: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: 4 },
  kicker: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: Spacing.two, paddingVertical: 4 },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#C0C8D0' },
  chipText: { fontWeight: '500', fontSize: 12 },
  content: { gap: Spacing.three, paddingBottom: Spacing.five },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metric: { flex: 1, minWidth: 80, padding: Spacing.two, borderRadius: 6, gap: 2 },
  metricVal: { fontSize: 20, fontWeight: '700' },
  sectionLabel: { fontWeight: '600', opacity: 0.7, textTransform: 'uppercase', fontSize: 11 },
  materiaCard: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  materiaName: { fontWeight: '600' },
  notaWrap: { alignItems: 'center', minWidth: 52 },
  notaGrande: { fontSize: 22, fontWeight: '700' },
  asistRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  asistCard: { flex: 1, minWidth: 70, padding: Spacing.two, borderRadius: 6, alignItems: 'center', gap: 2 },
  asistNum: { fontSize: 20, fontWeight: '700' },
  emptyBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  btn: { minHeight: 38, minWidth: 100, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
