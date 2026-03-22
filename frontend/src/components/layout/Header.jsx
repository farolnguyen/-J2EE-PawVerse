import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, Shield, PawPrint, CalendarCheck, Bell, Check } from 'lucide-react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import SearchSuggestions from '../common/SearchSuggestions';
import { notificationService } from '../../api/notificationService';

export default function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);
  
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cartCount, resetCart } = useCartStore();

  // Notification queries (only when authenticated)
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30s
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationService.getNotifications({ page: 0, size: 8 }),
    enabled: isAuthenticated && showNotifDropdown,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = notifData?.content || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatNotifTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const handleLogout = () => {
    // Clear cart store
    resetCart();
    
    // Clear all React Query cache (profile, cart, orders, etc.)
    queryClient.clear();
    
    // Clear zustand persist storage completely
    localStorage.removeItem('auth-storage');
    
    // Call logout to clear auth state
    logout();
    
    navigate('/');
  };

  // Check user roles
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const dashboardLink = isAdmin ? '/admin' : isStaff ? '/staff' : null;
  const dashboardLabel = isAdmin ? 'Admin' : isStaff ? 'Staff' : '';

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary-600">
              PawVerse
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Trang chủ
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Sản phẩm
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Dịch vụ
            </Link>
          </nav>

          {/* Search with Suggestions */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <SearchSuggestions />
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-6">
            {/* Dashboard Panel - Visible to Admin and Staff */}
            {isAuthenticated && dashboardLink && (
              <Link 
                to={dashboardLink} 
                className="relative text-gray-700 hover:text-primary-600 transition-colors group" 
                title={`Trang quản lý ${dashboardLabel}`}
              >
                <div className="flex items-center space-x-1">
                  <Shield size={24} className={isAdmin ? 'text-primary-600' : 'text-emerald-600'} />
                  <span className={`hidden md:inline text-sm font-medium ${isAdmin ? 'text-primary-600' : 'text-emerald-600'}`}>
                    {dashboardLabel}
                  </span>
                </div>
              </Link>
            )}

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="relative text-gray-700 hover:text-primary-600 transition-colors" title="Danh sách yêu thích">
                <Heart size={24} />
              </Link>
            )}
            {/* Cart */}
            <Link to="/cart" className="relative text-gray-700 hover:text-primary-600 transition-colors" title="Giỏ hàng">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
              {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors">
                  <User size={24} />
                  <span className="hidden md:inline font-medium">{user?.fullName || user?.username}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {/* Dashboard Link in dropdown for Admin/Staff */}
                  {dashboardLink && (
                    <>
                      <Link to={dashboardLink} className={`flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors font-medium ${isAdmin ? 'text-primary-600' : 'text-emerald-600'}`}>
                        <Shield size={18} />
                        <span>Trang quản lý</span>
                      </Link>
                      <hr className="my-2" />
                    </>
                  )}
                  <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                    Thông tin cá nhân
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                    Đơn hàng của tôi
                  </Link>
                  <Link to="/bookings" className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                    <CalendarCheck size={16} />
                    Lịch sử đặt dịch vụ
                  </Link>
                  <Link to="/my-pets" className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                    <PawPrint size={16} />
                    Thú cưng của tôi
                  </Link>
                  <Link to="/wishlist" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors md:hidden">
                    Danh sách yêu thích
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Đăng nhập
              </Link>
            )}
            {/* Notifications Bell */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative text-gray-700 hover:text-primary-600 transition-colors"
                  title="Thông báo"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                      <h4 className="font-semibold text-sm text-gray-800">Thông báo</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Check size={12} /> Đọc tất cả
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                          Chưa có thông báo
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.idNotification}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                              !n.isRead ? 'bg-primary-50/50' : ''
                            }`}
                          >
                            <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {n.subject}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{formatNotifTime(n.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            

            

            {/* Mobile Menu */}
            <button className="md:hidden text-gray-700">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

    </header>
  );
}
