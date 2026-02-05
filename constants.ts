import { Team, User } from './types';

export const REPAIR_TEAMS: Team[] = [
  { id: 't1', name: 'TỔ 1', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 't2', name: 'TỔ 2', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 't3', name: 'TỔ 3', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 't4', name: 'TỔ 4', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export const MOCK_CONTAINER_SUGGESTIONS = [
  'MSKU1234567',
  'MSKU9876543',
  'MRKU1122334',
  'TCLU8889991',
  'SUDU5556667',
  'TRHU4561230',
  'PONU9988776'
];

export const USERS: Record<string, User> = {
  'admin': { username: 'admin', name: 'Administrator', role: 'admin' },
  'qc': { username: 'qc', name: 'QC Manager', role: 'qc' },
  'qc01': { username: 'qc01', name: 'QC Tổ 1', role: 'worker', assignedTeamId: 't1' },
  'qc02': { username: 'qc02', name: 'QC Tổ 2', role: 'worker', assignedTeamId: 't2' },
  'qc03': { username: 'qc03', name: 'QC Tổ 3', role: 'worker', assignedTeamId: 't3' },
  'qc04': { username: 'qc04', name: 'QC Tổ 4', role: 'worker', assignedTeamId: 't4' },
};