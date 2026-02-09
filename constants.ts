import { Team, User } from './types';

export const REPAIR_TEAMS: Team[] = [
  { id: 't1', name: 'TỔ 1', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 't2', name: 'TỔ 2', color: 'bg-green-100 text-blue-700 border-blue-200' },
  { id: 't3', name: 'TỔ 3', color: 'bg-orange-100 text-blue-700 border-blue-200' },
  { id: 't4', name: 'TỔ 4', color: 'bg-purple-100 text-blue-700 border-blue-200' },
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
  'admin': { 
    username: 'admin', 
    name: 'Administrator', 
    password: 'admin9', 
    role: 'admin' 
  },
  'qc': { 
    username: 'QC Manager', 
    name: 'QC Manager', 
    role: 'qc' 
  },
  // ────────────── TÀI KHOẢN MỚI ──────────────
  'thi.nb': { 
    username: 'Nguyễn Bá Thi', 
    name: 'Nguyễn Bá Thi - QC Manager', 
    role: 'qc' 
  },
  'tuan.pq': { 
    username: 'Phạm Quang Tuấn', 
    name: 'Phạm Quang Tuấn - Tổ 1', 
    role: 'worker', 
    assignedTeamId: 't1' 
  },
  'viet.th': { 
    username: 'Trần Hoàng Việt', 
    name: 'Trần Hoàng Việt - Tổ 1', 
    role: 'worker', 
    assignedTeamId: 't1' 
  },
  'khai.lq': { 
    username: 'Lê Quang Khải', 
    name: 'Lê Quang Khải - Tổ 2', 
    role: 'worker', 
    assignedTeamId: 't2' 
  },
  'long.mv': { 
    username: 'Mai Văn Long', 
    name: 'Mai Văn Long - Tổ 2', 
    role: 'worker', 
    assignedTeamId: 't2' 
  },
  'ha.bt': { 
    username: 'Bùi Trọng Hà', 
    name: 'Bùi Trọng Hà - Tổ 2', 
    role: 'worker', 
    assignedTeamId: 't2' 
  },
  'canh.mx': { 
    username: 'Mai Xuân Cảnh', 
    name: 'Mai Xuân Cảnh - Tổ 3', 
    role: 'worker', 
    assignedTeamId: 't3' 
  },
  'kien.dv': { 
    username: 'Đặng Văn Kiên', 
    name: 'Đặng Văn Kiên - Tổ 3', 
    role: 'worker', 
    assignedTeamId: 't3' 
  },
  'tuan.nv': { 
    username: 'Nguyễn Văn Tuấn', 
    name: 'Nguyễn Văn Tuấn - Tổ 3', 
    role: 'worker', 
    assignedTeamId: 't3' 
  },
  'ngung.vv': { 
    username: 'Vũ Văn Ngừng', 
    name: 'Vũ Văn Ngừng - Tổ 4', 
    role: 'worker', 
    assignedTeamId: 't4' 
  },
  'anh.bv': { 
    username: 'Bùi Văn Anh', 
    name: 'Bùi Văn Anh - Tổ 4', 
    role: 'worker', 
    assignedTeamId: 't4' 
  },
};
