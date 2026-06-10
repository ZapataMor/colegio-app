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
    id: 'horarios',
    nombre: 'Gestionar horarios',
    descripcion: 'Consulta y organiza tus clases asignadas.',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/dashboard',
  },
  {
    id: 'asistencia',
    nombre: 'Registrar asistencia',
    descripcion: 'Marca asistencia por curso, asignatura y fecha.',
    icon: CrudIcons.users,
    ruta: '/(dashboard)/dashboard',
  },
  {
    id: 'notas',
    nombre: 'Registrar notas',
    descripcion: 'Registra calificaciones de estudiantes por periodo.',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/dashboard',
  },
  {
    id: 'actividades',
    nombre: 'Gestionar actividades',
    descripcion: 'Crea y administra actividades academicas.',
    icon: CrudIcons.academicCap,
    ruta: '/(dashboard)/dashboard',
  },
];

export const MODULOS_ESTUDIANTE: Modulo[] = [
  {
    id: 'consultar-notas',
    nombre: 'Consultar notas',
    descripcion: 'Revisa tus calificaciones por periodo.',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/dashboard',
  },
  {
    id: 'consultar-asistencias',
    nombre: 'Consultar asistencias',
    descripcion: 'Consulta tu historial de asistencia.',
    icon: CrudIcons.users,
    ruta: '/(dashboard)/dashboard',
  },
  {
    id: 'consultar-horario',
    nombre: 'Consultar horario',
    descripcion: 'Mira tu horario academico.',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/dashboard',
  },
];

export const MODULOS_ACUDIENTE: Modulo[] = [
  {
    id: 'notas-acudido',
    nombre: 'Ver notas del acudido',
    descripcion: 'Consulta las calificaciones de tus acudidos.',
    icon: CrudIcons.document,
    ruta: '/(dashboard)/dashboard',
  },
  {
    id: 'asistencias-acudido',
    nombre: 'Ver asistencias',
    descripcion: 'Revisa la asistencia de tus acudidos.',
    icon: CrudIcons.users,
    ruta: '/(dashboard)/dashboard',
  },
  {
    id: 'horario-acudido',
    nombre: 'Ver horario',
    descripcion: 'Consulta el horario de tus acudidos.',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/dashboard',
  },
];

export const WELCOME_BY_ROLE: Record<string, { titulo: string; subtitulo: string }> = {
  administrador: {
    titulo: 'Panel de administracion',
    subtitulo: 'Gestiona matriculas, personas, usuarios y recursos del colegio.',
  },
  profesor: {
    titulo: 'Panel docente',
    subtitulo: 'Gestiona horarios, asistencia, notas y actividades de tus cursos.',
  },
  estudiante: {
    titulo: 'Panel estudiante',
    subtitulo: 'Consulta tus notas, asistencias y horario academico.',
  },
  acudiente: {
    titulo: 'Panel acudiente',
    subtitulo: 'Acompana el avance academico de tus acudidos.',
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
