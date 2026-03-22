import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users,
  Activity,
  Menu,
  X,
  LogOut,
  Home
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý tài khoản',
    path: '/admin/users',
    icon: Users,
  },
  {
    title: 'Lịch sử hoạt động',
    path: '/admin/activity-logs',
    icon: Activity,
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { resetCart } = useCartStore();

  const handleLogout = () => {
    resetCart();
    queryClient.clear();
    localStorage.removeItem('auth-storage');
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg fixed h-screen transition-all duration-300 z-30`}>
          {/* Logo */}
          <div className="p-4 border-b flex items-center justify-between">
            {sidebarOpen && (
              <Link to="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                  P
                </div>
                <span className="font-bold text-xl">PawVerse Admin</span>
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* User Info */}
          {sidebarOpen && (
            <div className="p-4 border-b bg-primary-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {user?.hoTen?.charAt(0) || user?.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.hoTen || user?.fullName}</p>
                  <p className="text-xs text-primary-600 font-medium">Admin</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4 overflow-y-auto h-[calc(100vh-240px)]">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.title}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-700'
                    }`}
                    title={!sidebarOpen ? item.title : ''}
                  >
                    <item.icon size={20} />
                    {sidebarOpen && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <Link
              to="/"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition text-gray-700 mb-2"
            >
              <Home size={20} />
              {sidebarOpen && <span>Về trang chủ</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition text-red-600"
            >
              <LogOut size={20} />
              {sidebarOpen && <span>Đăng xuất</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
