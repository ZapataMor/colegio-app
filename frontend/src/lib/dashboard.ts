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
    id: 'comunicados',
    nombre: 'Comunicados',
    descripcion: 'Circulares y anuncios segmentados por rol o curso',
    icon: CrudIcons.megaphone,
    ruta: '/(dashboard)/comunicados',
  },
  {
    id: 'horarios',
    nombre: 'Horarios',
    descripcion: 'Planeacion semanal de cursos, docentes y salones',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/horarios',
  },
  {
    id: 'asistencias',
    nombre: 'Asistencias',
    descripcion: 'Seguimiento diario de presencia, tardanzas y excusas',
    icon: CrudIcons.checkCircle,
    ruta: '/(dashboard)/asistencias',
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
    id: 'horarios',
    nombre: 'Gestionar horarios',
    descripcion: 'Consulta y organiza tus clases asignadas.',
    icon: CrudIcons.list,
    ruta: '/(dashboard)/horarios',
  },
  {
    id: 'asistencia',
    nombre: 'Registrar asistencia',
    descripcion: 'Marca asistencia por curso, asignatura y fecha.',
    icon: CrudIcons.checkCircle,
    ruta: '/(dashboard)/asistencias',
  },
  {
    id: 'comunicados',
    nombre: 'Compartir comunicados',
    descripcion: 'Publica recordatorios y novedades para tu comunidad.',
    icon: CrudIcons.megaphone,
    ruta: '/(dashboard)/comunicados',
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
    id: 'comunicados',
    nombre: 'Comunicados',
    descripcion: 'Revisa avisos y recordatorios institucionales.',
    icon: CrudIcons.megaphone,
    ruta: '/(dashboard)/comunicados',
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
    id: 'comunicados',
    nombre: 'Comunicados',
    descripcion: 'Consulta circulares y mensajes del colegio.',
    icon: CrudIcons.megaphone,
    ruta: '/(dashboard)/comunicados',
  },
];

export const WELCOME_BY_ROLE: Record<string, { titulo: string; subtitulo: string }> = {
  administrador: {
    titulo: 'Panel de administracion',
    subtitulo: 'Gestiona matriculas, agenda academica, comunicados y recursos del colegio.',
  },
  profesor: {
    titulo: 'Panel docente',
    subtitulo: 'Consulta tus horarios, registra asistencia y comparte novedades con la comunidad.',
  },
  estudiante: {
    titulo: 'Panel estudiante',
    subtitulo: 'Consulta avisos institucionales y prepara tu experiencia academica digital.',
  },
  acudiente: {
    titulo: 'Panel acudiente',
    subtitulo: 'Sigue comunicados y mantente cerca del ritmo escolar de tus acudidos.',
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
