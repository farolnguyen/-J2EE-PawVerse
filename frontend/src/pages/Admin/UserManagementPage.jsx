import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Shield, ShieldCheck, UserX, UserCheck, Users, Lock, Unlock,
  Eye, X, Clock, AlertTriangle, Crown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminService } from '../../api/adminService';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ROLE_TABS = [
  { key: '', label: 'Tất cả', icon: Users },
  { key: 'ADMIN', label: 'Admin', icon: Crown },
  { key: 'STAFF', label: 'Staff', icon: ShieldCheck },
  { key: 'USER', label: 'Khách hàng', icon: Users },
];

const ROLE_BADGE = {
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
  STAFF: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Staff' },
  USER: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'User' },
};

const LOCK_OPTIONS = [
  { hours: 1, label: '1 giờ' },
  { hours: 6, label: '6 giờ' },
  { hours: 24, label: '24 giờ' },
  { hours: 72, label: '3 ngày' },
  { hours: 168, label: '7 ngày' },
  { hours: 999, label: 'Vĩnh viễn' },
];

/* ====== STAT CARD ====== */
const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
        <Icon className={color} size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
        <p className="text-xs text-gray-500">{title}</p>
      </div>
    </div>
  </div>
);

/* ====== LOCK MODAL ====== */
function LockModal({ user, onClose, onConfirm, isPending }) {
  const [hours, setHours] = useState(999);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lock size={20} className="text-red-500" /> Khóa tài khoản
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Khóa tài khoản <span className="font-semibold text-gray-900">{user.fullName}</span> ({user.email})
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian khóa</label>
            <div className="grid grid-cols-3 gap-2">
              {LOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  onClick={() => setHours(opt.hours)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    hours === opt.hours
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button
            onClick={() => onConfirm(user.idUser, hours)}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Đang xử lý...' : 'Xác nhận khóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====== USER DETAIL MODAL ====== */
function UserDetailModal({ user, onClose }) {
  if (!user) return null;
  const rb = ROLE_BADGE[user.roleName] || ROLE_BADGE.USER;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết người dùng</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600">
                {user.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-bold text-gray-900">{user.fullName}</h4>
                {user.isFirstAdmin && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    <Crown size={12} /> Super Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">@{user.username}</p>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${rb.bg} ${rb.text}`}>{rb.label}</span>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Email" value={user.email} />
            <Field label="Số điện thoại" value={user.soDienThoai} />
            <Field label="Giới tính" value={user.gioiTinh} />
            <Field label="Ngày sinh" value={user.ngaySinh} />
            <Field label="Tỉnh/Thành phố" value={user.tinhThanhPho} />
            <Field label="Quận/Huyện" value={user.quanHuyen} />
            <Field label="Phường/Xã" value={user.phuongXa} />
            <Field label="Địa chỉ" value={user.diaChi} />
            <Field label="Đăng nhập qua" value={user.oauthProvider || 'Email'} />
            <Field label="Email xác thực" value={user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'} />
            <Field label="Ngày tạo" value={user.createdAt ? formatDate(user.createdAt) : 'N/A'} />
            <Field label="Cập nhật lần cuối" value={user.updatedAt ? formatDate(user.updatedAt) : 'N/A'} />
          </div>

          {/* Lock Info */}
          <div className={`rounded-lg p-4 ${user.isLocked ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {user.isLocked ? <Lock size={16} className="text-red-500" /> : <Unlock size={16} className="text-green-500" />}
              <span className={`font-semibold text-sm ${user.isLocked ? 'text-red-700' : 'text-green-700'}`}>
                {user.isLocked ? 'Tài khoản đang bị khóa' : 'Tài khoản hoạt động'}
              </span>
            </div>
            {user.isLocked && (
              <div className="text-xs text-red-600 space-y-1 mt-2">
                <p>Thời gian khóa: {user.lockTimeHours === 999 ? 'Vĩnh viễn (bởi Admin)' : `${user.lockTimeHours} giờ`}</p>
                {user.lockedUntil && <p>Mở khóa lúc: {formatDate(user.lockedUntil)}</p>}
                {user.failedLoginAttempts > 0 && <p>Số lần đăng nhập sai: {user.failedLoginAttempts}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-gray-900 font-medium">{value || 'N/A'}</p>
    </div>
  );
}

/* ====== MAIN PAGE ====== */
export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [lockTarget, setLockTarget] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: adminService.getUserStats,
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', currentPage, searchTerm, roleFilter, statusFilter],
    queryFn: () => adminService.getAllUsers({
      page: currentPage,
      size: 10,
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => { invalidateAll(); toast.success('Cập nhật vai trò thành công!'); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể cập nhật vai trò'),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, hours }) => adminService.lockUser(id, hours),
    onSuccess: () => { invalidateAll(); setLockTarget(null); toast.success('Khóa tài khoản thành công!'); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể khóa tài khoản'),
  });

  const unlockMutation = useMutation({
    mutationFn: (id) => adminService.unlockUser(id),
    onSuccess: () => { invalidateAll(); toast.success('Mở khóa tài khoản thành công!'); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể mở khóa tài khoản'),
  });

  const handleRoleChange = (user, newRole) => {
    if (user.isFirstAdmin) { toast.error('Không thể thay đổi vai trò của Admin đầu tiên'); return; }
    if (user.roleName === newRole) return;
    updateRoleMutation.mutate({ id: user.idUser, role: newRole });
  };

  const handleLockConfirm = (id, hours) => {
    lockMutation.mutate({ id, hours });
  };

  const handleUnlock = (user) => {
    unlockMutation.mutate(user.idUser);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const handleTabChange = (key) => {
    setRoleFilter(key);
    setCurrentPage(0);
  };

  const users = usersData?.content || [];
  const totalPages = usersData?.totalPages || 0;
  const totalElements = usersData?.totalElements || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý tài khoản, phân quyền và trạng thái người dùng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Tổng người dùng" value={stats?.totalUsers} icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="Admin" value={stats?.totalAdmins} icon={Crown} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard title="Staff" value={stats?.totalStaff} icon={ShieldCheck} color="text-indigo-600" bgColor="bg-indigo-50" />
        <StatCard title="Khách hàng" value={stats?.totalCustomers} icon={Users} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Đã khóa" value={stats?.lockedUsers} icon={Lock} color="text-red-600" bgColor="bg-red-50" />
      </div>

      {/* Role Tabs + Search + Status Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-gray-100">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = roleFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                placeholder="Tìm theo tên, email, username..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const rb = ROLE_BADGE[user.roleName] || ROLE_BADGE.USER;
                    const isProtected = user.isFirstAdmin;
                    return (
                      <tr key={user.idUser} className="hover:bg-gray-50/50 transition">
                        {/* User info */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 font-semibold text-sm">{user.fullName?.charAt(0) || 'U'}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-gray-900 text-sm truncate">{user.fullName}</p>
                                {isProtected && <Crown size={14} className="text-yellow-500 shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-5 py-3 text-sm text-gray-600 truncate max-w-[200px]">{user.email}</td>
                        {/* Role */}
                        <td className="px-5 py-3">
                          {isProtected ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${rb.bg} ${rb.text}`}>
                              <Crown size={12} /> {rb.label}
                            </span>
                          ) : (
                            <select
                              value={user.roleName}
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              disabled={updateRoleMutation.isPending}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 ${rb.bg} ${rb.text}`}
                            >
                              <option value="USER">User</option>
                              <option value="STAFF">Staff</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-5 py-3">
                          {user.isLocked ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                <Lock size={12} /> Đã khóa
                              </span>
                              {user.lockTimeHours && (
                                <p className="text-[10px] text-red-500 mt-0.5 ml-1">
                                  {user.lockTimeHours === 999 ? 'Vĩnh viễn' : `${user.lockTimeHours}h`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <UserCheck size={12} /> Hoạt động
                            </span>
                          )}
                        </td>
                        {/* Created */}
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setDetailUser(user)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                            {!isProtected && (
                              user.isLocked ? (
                                <button
                                  onClick={() => handleUnlock(user)}
                                  disabled={unlockMutation.isPending}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                  title="Mở khóa"
                                >
                                  <Unlock size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setLockTarget(user)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Khóa tài khoản"
                                >
                                  <Lock size={16} />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-16">
                <Shield size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Không tìm thấy người dùng nào</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Hiển thị {users.length} / {totalElements} người dùng
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i;
                    if (totalPages > 5) {
                      const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                      pageNum = start + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lock Modal */}
      {lockTarget && (
        <LockModal
          user={lockTarget}
          onClose={() => setLockTarget(null)}
          onConfirm={handleLockConfirm}
          isPending={lockMutation.isPending}
        />
      )}

      {/* Detail Modal */}
      {detailUser && (
        <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}
    </div>
  );
}
