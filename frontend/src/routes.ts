import type { Role } from './lib/api';

export interface RouteDef {
  path: string;
  label: string;
  group: 'Public' | 'Athlete' | 'Coach';
  roles?: Role[];
}

export const routes: RouteDef[] = [
  { path: '/login', label: 'Login', group: 'Public' },
  { path: '/onboarding', label: 'Onboarding', group: 'Athlete', roles: ['athlete'] },
  { path: '/home', label: 'Home', group: 'Athlete', roles: ['athlete'] },
  { path: '/summary', label: 'Session Summary', group: 'Athlete', roles: ['athlete'] },
  { path: '/warmup', label: 'Warmup', group: 'Athlete', roles: ['athlete'] },
  { path: '/session', label: 'Active Session', group: 'Athlete', roles: ['athlete'] },
  { path: '/victory', label: 'Victory', group: 'Athlete', roles: ['athlete'] },
  { path: '/performance', label: 'Performance', group: 'Athlete', roles: ['athlete'] },
  { path: '/oly-index', label: 'Oly Index', group: 'Athlete', roles: ['athlete'] },
  { path: '/schedule', label: 'Schedule', group: 'Athlete', roles: ['athlete'] },
  { path: '/pulse', label: 'Pulse Hub', group: 'Athlete', roles: ['athlete'] },
  { path: '/pills', label: 'Knowledge Pills', group: 'Athlete', roles: ['athlete'] },
  { path: '/social', label: 'Social Card', group: 'Athlete', roles: ['athlete'] },
  { path: '/profile', label: 'Profile', group: 'Athlete', roles: ['athlete'] },
  { path: '/coach', label: 'Command Center', group: 'Coach', roles: ['coach', 'admin'] },
  { path: '/coach/athlete', label: 'Athlete Deep Dive', group: 'Coach', roles: ['coach', 'admin'] },
  { path: '/coach/assign', label: 'Assign Macrocycle', group: 'Coach', roles: ['coach', 'admin'] },
];
