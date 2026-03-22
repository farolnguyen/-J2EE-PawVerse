import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FolderTree,
  Tag,
  Ticket,
  Menu,
  X,
  LogOut,
  Home,
  CalendarCheck
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/staff',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý sản phẩm',
    path: '/staff/products',
    icon: Package,
  },
  {
    title: 'Quản lý đơn hàng',
    path: '/staff/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Quản lý đặt dịch vụ',
    path: '/staff/bookings',
    icon: CalendarCheck,
  },
  {
    title: 'Quản lý Danh mục',
    path: '/staff/categories',
    icon: FolderTree,
  },
  {
    title: 'Quản lý Thương hiệu',
    path: '/staff/brands',
    icon: Tag,
  },
  {
    title: 'Quản lý Voucher',
    path: '/staff/vouchers',
    icon: Ticket,
  },
];

export default function StaffLayout() {
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
              <Link to="/staff" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  P
                </div>
                <span className="font-bold text-xl">PawVerse Staff</span>
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
            <div className="p-4 border-b bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-semibold">
                    {user?.hoTen?.charAt(0) || user?.fullName?.charAt(0) || 'S'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.hoTen || user?.fullName}</p>
                  <p className="text-xs text-emerald-600 font-medium">Staff</p>
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
                        ? 'bg-emerald-50 text-emerald-600 font-medium'
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
