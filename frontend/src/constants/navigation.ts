import type { ReactNode } from 'react';
import { createElement } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import GridViewIcon from '@mui/icons-material/GridView';
import type { UserRole } from '../types/auth';

export interface NavConfigItem {
  label: string;
  path: string;
  icon: ReactNode;
}

export const HOME_NAV_ITEM: NavConfigItem = {
  label: 'Home',
  path: '/home',
  icon: createElement(HomeIcon),
};

export const NAV_BY_ROLE: Record<UserRole, NavConfigItem[]> = {
  PLAYER: [
    { label: 'Lekcje', path: '/home/player/lessons', icon: createElement(MenuBookIcon) },
    { label: 'Zadania', path: '/home/player/tasks', icon: createElement(AssignmentIcon) },
    { label: 'Trenerzy', path: '/home/player/coaches', icon: createElement(GroupIcon) },
  ],
  COACH: [
    { label: 'Lekcje', path: '/home/coach/lessons', icon: createElement(MenuBookIcon) },
    { label: 'Zawodnicy', path: '/home/coach/players', icon: createElement(PeopleIcon) },
    { label: 'Pozycje', path: '/home/coach/positions', icon: createElement(GridViewIcon) },
  ],
};
