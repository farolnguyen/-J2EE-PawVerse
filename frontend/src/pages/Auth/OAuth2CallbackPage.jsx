import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { authService } from '../../api/authService';
import { cartService } from '../../api/cartService';

export default function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setCartCount } = useCartStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Đăng nhập OAuth thất bại: ' + error);
        navigate('/login');
        return;
      }

      if (!token) {
        toast.error('Không nhận được token từ server');
        navigate('/login');
        return;
      }

      try {
        // Use the token as access token and fetch user info
        // Store token temporarily to make authenticated request
        localStorage.setItem('accessToken', token);
        
        // Fetch user profile with the token
        const userProfile = await authService.getCurrentUser();
        
        const user = {
          userId: userProfile.idUser,
          username: userProfile.username,
          email: userProfile.email,
          fullName: userProfile.fullName,
          role: userProfile.roleName,
        };

        // Set auth with the token (using access token as refresh token for now since OAuth doesn't provide refresh)
        setAuth(user, token, token);
        
        // Fetch cart count from backend to sync with database
        try {
          const cart = await cartService.getCart();
          setCartCount(cart?.items?.length || 0);
        } catch (error) {
          console.error('Failed to fetch cart:', error);
        }
        
        toast.success('Đăng nhập thành công!');
        
        // Role-based redirect
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'STAFF') {
          navigate('/staff');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Không thể lấy thông tin người dùng');
        localStorage.removeItem('accessToken');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
