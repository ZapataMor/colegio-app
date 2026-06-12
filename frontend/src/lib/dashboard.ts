import type { CrudIcon } from '@/components/crud/crud-icons';
import { CrudIcons } from '@/components/crud/crud-icons';

export type Modulo = {
  id: string;
  nombre: string;
  descripcion: string;
  icon: CrudIcon;
  ruta: string;
};

export const MODULOS_ADMIN: Modulo[] = [
  {
    id: 'notas',
    nombre: 'Notas',
    descripcion: 'Registro y consulta de calificaciones por periodo',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/notas',
  },
  {
    id: 'asistencias',
    nombre: 'Asistencias',
    descripcion: 'Seguimiento diario de presencia, tardanzas y excusas',
    icon: CrudIcons.checkCircle,
    ruta: '/(dashboard)/asistencias',
  },
  {
    id: 'boletines',
    nombre: 'Boletines',
    descripcion: 'Consulta e imprime reportes academicos por estudiante',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/boletines',
  },
  {
    id: 'horarios',
    nombre: 'Horarios',
    descripcion: 'Planeacion semanal de cursos, docentes y salones',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/horarios',
  },
  {
    id: 'periodos',
    nombre: 'Periodos academicos',
    descripcion: 'Gestion del calendario escolar por periodos',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/periodos',
  },
  {
    id: 'matricula',
    nombre: 'Matricula',
    descripcion: 'Gestion de matriculas de estudiantes',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/matricula',
  },
  {
    id: 'estudiantes',
    nombre: 'Estudiantes',
    descripcion: 'Lista y gestion de estudiantes',
    icon: CrudIcons.student,
    ruta: '/(dashboard)/estudiantes',
  },
  {
    id: 'profesores',
    nombre: 'Profesores',
    descripcion: 'Gestion de profesores y docentes',
    icon: CrudIcons.academicCap,
    ruta: '/(dashboard)/profesores',
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Accesos al sistema por persona',
    icon: CrudIcons.users,
    ruta: '/(dashboard)/usuarios',
  },
  {
    id: 'salones',
    nombre: 'Salones',
    descripcion: 'Gestion de salones y aulas',
    icon: CrudIcons.building,
    ruta: '/(dashboard)/salones',
  },
];

export const MODULOS_PROFESOR: Modulo[] = [
  {
    id: 'notas',
    nombre: 'Registrar notas',
    descripcion: 'Ingresa y edita calificaciones de tus estudiantes.',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/notas',
  },
  {
    id: 'asistencia',
    nombre: 'Registrar asistencia',
    descripcion: 'Marca asistencia por curso, asignatura y fecha.',
    icon: CrudIcons.checkCircle,
    ruta: '/(dashboard)/asistencias',
  },
  {
    id: 'horarios',
    nombre: 'Mis horarios',
    descripcion: 'Consulta tus clases asignadas por dia.',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/horarios',
  },
  {
    id: 'boletines',
    nombre: 'Boletines',
    descripcion: 'Consulta el reporte academico de tus estudiantes.',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/boletines',
  },
];

export const MODULOS_ESTUDIANTE: Modulo[] = [
  {
    id: 'mis-notas',
    nombre: 'Mis notas',
    descripcion: 'Revisa tus calificaciones y desempeno por periodo.',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/mis-notas',
  },
  {
    id: 'mis-asistencias',
    nombre: 'Mis asistencias',
    descripcion: 'Consulta tu historial de asistencia por materia.',
    icon: CrudIcons.checkCircle,
    ruta: '/(dashboard)/mis-asistencias',
  },
];

export const MODULOS_ACUDIENTE: Modulo[] = [
  {
    id: 'mis-notas',
    nombre: 'Notas del acudido',
    descripcion: 'Consulta las calificaciones y boletin de tu acudido.',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/mis-notas',
  },
  {
    id: 'mis-asistencias',
    nombre: 'Asistencias del acudido',
    descripcion: 'Revisa el historial de asistencia de tu acudido.',
    icon: CrudIcons.checkCircle,
    ruta: '/(dashboard)/mis-asistencias',
  },
];

export const WELCOME_BY_ROLE: Record<string, { titulo: string; subtitulo: string }> = {
  administrador: {
    titulo: 'Panel de administracion',
    subtitulo: 'Gestiona matriculas, agenda academica y recursos del colegio.',
  },
  profesor: {
    titulo: 'Panel docente',
    subtitulo: 'Consulta tus horarios y registra asistencia diaria.',
  },
  estudiante: {
    titulo: 'Panel estudiante',
    subtitulo: 'Consulta tu informacion academica y prepara tu experiencia digital.',
  },
  acudiente: {
    titulo: 'Panel acudiente',
    subtitulo: 'Consulta el seguimiento academico de tus acudidos.',
  },
};

export function getWelcomeForRole(rol: string, nombre: string) {
  const config = WELCOME_BY_ROLE[rol] ?? {
    titulo: `Hola, ${nombre}`,
    subtitulo: 'Bienvenido a Colegio App.',
  };

  return {
    titulo: ['administrador', 'profesor', 'estudiante', 'acudiente'].includes(rol)
      ? config.titulo
      : `${config.titulo}, ${nombre}`,
    subtitulo: config.subtitulo,
  };
}

export function isAdmin(rol: string) {
  return rol === 'administrador';
}

export function isProfessor(rol: string) {
  return rol === 'profesor';
}

export function isStudent(rol: string) {
  return rol === 'estudiante';
}

export function isGuardian(rol: string) {
  return rol === 'acudiente';
}

export function getModulesForRole(rol: string) {
  if (isAdmin(rol)) return MODULOS_ADMIN;
  if (isProfessor(rol)) return MODULOS_PROFESOR;
  if (isStudent(rol)) return MODULOS_ESTUDIANTE;
  if (isGuardian(rol)) return MODULOS_ACUDIENTE;
  return [];
}
