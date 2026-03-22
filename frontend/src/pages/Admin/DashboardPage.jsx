import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, ShieldCheck, Shield, Clock } from 'lucide-react';
import { adminService } from '../../api/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 flex items-center justify-center`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
    </div>
    <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-overview'],
    queryFn: () => adminService.getAllUsers({ page: 0, size: 100 }),
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const userList = users?.content || [];
  const totalUsers = stats?.totalUsers || userList.length || 0;
  const lockedUsers = userList.filter(u => u.locked).length;
  const adminCount = userList.filter(u => u.roleName === 'ADMIN').length;
  const staffCount = userList.filter(u => u.roleName === 'STAFF').length;
  const customerCount = userList.filter(u => u.roleName === 'USER').length;

  const statCards = [
    {
      title: 'Tổng tài khoản',
      value: totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      subtitle: 'Tất cả người dùng trong hệ thống',
    },
    {
      title: 'Admin',
      value: adminCount,
      icon: ShieldCheck,
      color: 'bg-purple-500',
      subtitle: 'Quản trị viên hệ thống',
    },
    {
      title: 'Staff',
      value: staffCount,
      icon: Shield,
      color: 'bg-emerald-500',
      subtitle: 'Nhân viên quản lý sản phẩm',
    },
    {
      title: 'Tài khoản bị khóa',
      value: lockedUsers,
      icon: UserX,
      color: 'bg-red-500',
      subtitle: 'Đang bị khóa hoặc vô hiệu hóa',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Quản lý tài khoản và giám sát hệ thống PawVerse</p>
      </div>

      {/* Account Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Phân bố quyền hạn</h2>
          <div className="space-y-4">
            {[
              { label: 'Khách hàng (User)', count: customerCount, total: totalUsers, color: 'bg-blue-500' },
              { label: 'Nhân viên (Staff)', count: staffCount, total: totalUsers, color: 'bg-emerald-500' },
              { label: 'Quản trị viên (Admin)', count: adminCount, total: totalUsers, color: 'bg-purple-500' },
            ].map((role) => (
              <div key={role.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{role.label}</span>
                  <span className="text-sm text-gray-500">{role.count} / {role.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`${role.color} h-2.5 rounded-full transition-all`}
                    style={{ width: `${role.total > 0 ? (role.count / role.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Accounts */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Tài khoản gần đây</h2>
            <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {userList.slice(0, 6).map((u) => (
              <div key={u.idUser} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                    {u.fullName?.charAt(0) || u.username?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.fullName || u.username}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.roleName === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    u.roleName === 'STAFF' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {u.roleName}
                  </span>
                  {u.locked && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                      Khóa
                    </span>
                  )}
                </div>
              </div>
            ))}
            {userList.length === 0 && (
              <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Thông tin hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Clock size={24} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Trạng thái hệ thống</p>
              <p className="text-sm text-green-600 font-semibold">Hoạt động bình thường</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <UserCheck size={24} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Khách hàng đang hoạt động</p>
              <p className="text-sm text-gray-900 font-semibold">{customerCount} tài khoản</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <UserX size={24} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Tài khoản bị khóa</p>
              <p className="text-sm text-red-600 font-semibold">{lockedUsers} tài khoản</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
