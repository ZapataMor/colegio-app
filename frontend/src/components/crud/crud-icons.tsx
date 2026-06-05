import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import FunnelIcon from 'react-native-heroicons/outline/FunnelIcon';
import DocumentTextIcon from 'react-native-heroicons/outline/DocumentTextIcon';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import UsersIcon from 'react-native-heroicons/outline/UsersIcon';
import BuildingOffice2Icon from 'react-native-heroicons/outline/BuildingOffice2Icon';
import ClipboardDocumentListIcon from 'react-native-heroicons/outline/ClipboardDocumentListIcon';
import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

export type CrudIcon = ComponentType<SvgProps>;

export const CrudIcons = {
  back: ArrowLeftIcon,
  add: PlusIcon,
  search: MagnifyingGlassIcon,
  filter: FunnelIcon,
  edit: PencilSquareIcon,
  delete: TrashIcon,
  document: DocumentTextIcon,
  student: AcademicCapIcon,
  academicCap: AcademicCapIcon,
  users: UsersIcon,
  building: BuildingOffice2Icon,
  list: ClipboardDocumentListIcon,
} as const;
