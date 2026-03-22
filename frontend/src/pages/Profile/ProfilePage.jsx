import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, MapPin, Camera, Edit2, Save, X, ShieldCheck, CheckCircle, KeyRound } from 'lucide-react';
import { userService } from '../../api/userService';
import { authService } from '../../api/authService';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  soDienThoai: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  diaChi: z.string().optional(),
  phuongXa: z.string().optional(),
  quanHuyen: z.string().optional(),
  tinhThanhPho: z.string().optional(),
  email: z.string().email('Email không hợp lệ'),
});

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  // Fetch user profile - always fetch fresh from server (no initialData to avoid stale auth store data)
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getCurrentUser,
    staleTime: 0,
  });

  const isOAuthUser = !!profile?.oauthProvider;

  // Profile form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName || '',
      soDienThoai: profile?.soDienThoai || '',
      diaChi: profile?.diaChi || '',
      phuongXa: profile?.phuongXa || '',
      quanHuyen: profile?.quanHuyen || '',
      tinhThanhPho: profile?.tinhThanhPho || '',
      email: profile?.email || '',
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profile']);
      updateUser(data);
      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công!');
    },
    onError: () => {
      toast.error('Cập nhật thất bại');
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userService.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profile']);
      updateUser({ avatar: data.avatarUrl });
      setAvatarPreview(null);
      toast.success('Cập nhật ảnh đại diện thành công!');
    },
    onError: () => {
      toast.error('Upload ảnh thất bại');
    },
  });

  // Send email verification mutation
  const sendVerificationMutation = useMutation({
    mutationFn: () => api.post('/api/auth/email/send-verification'),
    onSuccess: () => {
      setShowVerifyForm(true);
      toast.success('Mã xác thực đã được gửi đến email của bạn!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gửi mã xác thực thất bại');
    },
  });

  // Confirm email verification mutation
  const confirmVerificationMutation = useMutation({
    mutationFn: (otp) => api.post('/api/auth/email/confirm-verification', { otp }),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setShowVerifyForm(false);
      setVerifyOtp('');
      toast.success('Xác thực email thành công! 🎉');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xác thực thất bại');
    },
  });

  const onSubmitProfile = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thông tin cá nhân</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto">
                    {avatarPreview || profile?.avatar ? (
                      <img
                        src={avatarPreview || profile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700">
                    <Camera size={20} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploadAvatarMutation.isPending}
                    />
                  </label>
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{profile?.fullName}</h2>
                <p className="text-gray-600">{profile?.email}</p>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      profile?.roleName === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {profile?.roleName === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Thông tin cá nhân</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Edit2 size={20} />
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmitProfile)}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('fullName')}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('email')}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('soDienThoai')}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </div>
                    {errors.soDienThoai && (
                      <p className="mt-1 text-sm text-red-600">{errors.soDienThoai.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ
                    </label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('diaChi')}
                        disabled={!isEditing}
                        placeholder="Số nhà, tên đường..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phường/Xã
                      </label>
                      <input
                        {...register('phuongXa')}
                        disabled={!isEditing}
                        placeholder="Phường/Xã"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quận/Huyện
                      </label>
                      <input
                        {...register('quanHuyen')}
                        disabled={!isEditing}
                        placeholder="Quận/Huyện"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tỉnh/Thành phố
                      </label>
                      <input
                        {...register('tinhThanhPho')}
                        disabled={!isEditing}
                        placeholder="Tỉnh/Thành phố"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Email Verification */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck size={24} />
                  Xác thực email
                </h3>
                {profile?.emailVerified && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    Đã xác thực
                  </span>
                )}
              </div>

              {profile?.emailVerified ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    Email của bạn đã được xác thực. Bạn sẽ nhận được phiếu giảm giá cho lần mua đầu tiên!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      Xác thực email để nhận phiếu giảm giá cho lần mua đầu tiên! Chúng tôi sẽ gửi mã OTP đến email <strong>{profile?.email}</strong>.
                    </p>
                  </div>

                  {!showVerifyForm ? (
                    <button
                      onClick={() => sendVerificationMutation.mutate()}
                      disabled={sendVerificationMutation.isPending}
                      className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {sendVerificationMutation.isPending ? 'Đang gửi...' : 'Gửi mã xác thực'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nhập mã OTP
                        </label>
                        <input
                          value={verifyOtp}
                          onChange={(e) => setVerifyOtp(e.target.value)}
                          placeholder="Nhập mã 6 chữ số"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg tracking-widest"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => confirmVerificationMutation.mutate(verifyOtp)}
                          disabled={confirmVerificationMutation.isPending || verifyOtp.length !== 6}
                          className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          {confirmVerificationMutation.isPending ? 'Đang xác thực...' : 'Xác thực'}
                        </button>
                        <button
                          onClick={() => sendVerificationMutation.mutate()}
                          disabled={sendVerificationMutation.isPending}
                          className="px-4 py-2 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50"
                        >
                          Gửi lại
                        </button>
                        <button
                          onClick={() => { setShowVerifyForm(false); setVerifyOtp(''); }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Change Password Info - Only for non-OAuth users */}
            {!isOAuthUser && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <KeyRound className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Đổi mật khẩu</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Nếu bạn muốn đổi mật khẩu, hãy chọn phần <strong>Quên mật khẩu</strong> trong trang đăng nhập.
                    </p>
                    <a
                      href="/forgot-password"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      Đến trang đặt lại mật khẩu →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
