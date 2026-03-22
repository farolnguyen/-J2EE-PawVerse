import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../api/authService';

const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

const resetSchema = z.object({
  otp: z.string().length(6, 'Mã OTP gồm 6 chữ số'),
  newPassword: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// Step 1: email entry  Step 2: otp + new password  Step 3: success
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
  });

  const onSubmitEmail = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setStep(2);
      toast.success('Mã OTP đã được gửi đến email của bạn!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi email. Kiểm tra lại địa chỉ email.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(submittedEmail, data.otp, data.newPassword);
      setStep(3);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(submittedEmail);
      toast.success('Đã gửi lại mã OTP!');
    } catch (error) {
      toast.error('Không thể gửi lại. Thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="text-6xl">🐾</div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Quên mật khẩu?
          </h2>

          {/* Step indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step > s ? 'bg-green-500 text-white' :
                  step === s ? 'bg-primary-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <CheckCircle size={16} /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Enter email */}
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={emailForm.handleSubmit(onSubmitEmail)}>
            <p className="text-center text-sm text-gray-600">
              Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...emailForm.register('email')}
                  type="email"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="email@example.com"
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Loader2 className="animate-spin mr-2" size={18} /> Đang gửi...</> : 'Gửi mã OTP'}
            </button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500">
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Enter OTP + new password */}
        {step === 2 && (
          <form className="mt-8 space-y-5" onSubmit={resetForm.handleSubmit(onSubmitReset)}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              Mã OTP đã được gửi đến <strong>{submittedEmail}</strong>. Kiểm tra hộp thư đến và thư mục spam.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã OTP (6 chữ số)
              </label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...resetForm.register('otp')}
                  type="text"
                  maxLength={6}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg tracking-widest font-mono"
                  placeholder="000000"
                />
              </div>
              {resetForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.otp.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  {...resetForm.register('newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  placeholder="Ít nhất 6 ký tự"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  {...resetForm.register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Loader2 className="animate-spin mr-2" size={18} /> Đang xử lý...</> : 'Đặt lại mật khẩu'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-primary-600 hover:text-primary-500 disabled:opacity-50"
              >
                Gửi lại mã OTP
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={14} /> Nhập email khác
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Đặt lại mật khẩu thành công!
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
