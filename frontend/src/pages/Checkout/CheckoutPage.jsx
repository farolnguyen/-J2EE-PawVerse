import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { cartService } from '../../api/cartService';
import { orderService } from '../../api/orderService';
import { authService } from '../../api/authService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  shippingAddress: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự'),
  shippingCity: z.string().min(2, 'Vui lòng nhập thành phố'),
  shippingDistrict: z.string().min(1, 'Vui lòng nhập quận/huyện'),
  shippingWard: z.string().optional(),
  note: z.string().optional(),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Fetch cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
  });

  // Fetch fresh profile for address fields
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getCurrentUser,
  });

  // Form handling - use profile data (fresh from backend) with user as fallback
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shippingSchema),
    values: {
      fullName: profile?.fullName || user?.fullName || '',
      email: profile?.email || user?.email || '',
      phone: profile?.soDienThoai || user?.soDienThoai || '',
      shippingAddress: profile?.diaChi || user?.diaChi || '',
      shippingCity: profile?.tinhThanhPho || '',
      shippingDistrict: profile?.quanHuyen || '',
      shippingWard: profile?.phuongXa || '',
      note: '',
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData) => orderService.createOrder(orderData),
    onSuccess: (data) => {
      toast.success('Đặt hàng thành công!');
      
      navigate(`/orders/${data.orderId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
    },
  });

  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: (code) => orderService.applyCoupon(code),
    onSuccess: (data) => {
      setAppliedVoucher(data);
      toast.success(`Áp dụng "${data.tenVoucher}" thành công!`);
    },
    onError: (err) => {
      setAppliedVoucher(null);
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
    },
  });

  const onSubmit = async (data) => {
    if (!cart || cart.items?.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    const orderData = {
      ...data,
      paymentMethod: paymentMethod,
      voucherCode: couponCode || null,
    };

    createOrderMutation.mutate(orderData);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCouponMutation.mutate(couponCode);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!cart || cart.items?.length === 0) {
    navigate('/cart');
    return null;
  }

  const items = cart.items || [];
  const subtotal = cart.totalAmount || items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const discountAmount = (() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.voucherType === 'PERCENTAGE') {
      const pct = (subtotal * (appliedVoucher.discountPercentage || 0)) / 100;
      return appliedVoucher.maxDiscountAmount ? Math.min(pct, Number(appliedVoucher.maxDiscountAmount)) : pct;
    }
    if (appliedVoucher.voucherType === 'FIXED_AMOUNT') {
      return Math.min(Number(appliedVoucher.discountValue || 0), subtotal);
    }
    if (appliedVoucher.voucherType === 'FREE_SHIPPING') {
      return shippingFee;
    }
    return 0;
  })();
  const total = subtotal + shippingFee - discountAmount;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Shipping & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Thông tin giao hàng</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      {...register('fullName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      {...register('phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      {...register('email')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ *
                    </label>
                    <input
                      {...register('shippingAddress')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Số nhà, tên đường"
                    />
                    {errors.shippingAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phường/Xã
                    </label>
                    <input
                      {...register('shippingWard')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quận/Huyện *
                    </label>
                    <input
                      {...register('shippingDistrict')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.shippingDistrict && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingDistrict.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/Thành phố *
                    </label>
                    <input
                      {...register('shippingCity')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.shippingCity && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingCity.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú đơn hàng (tùy chọn)
                    </label>
                    <textarea
                      {...register('note')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <Wallet className="text-gray-600" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </label>

                  <div className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg opacity-50 cursor-not-allowed bg-gray-50">
                    <input type="radio" name="payment" disabled className="cursor-not-allowed" />
                    <CreditCard className="text-gray-400" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-400">VNPay</p>
                      <p className="text-sm text-gray-400">Đang phát triển</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-medium">Sắp có</span>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg opacity-50 cursor-not-allowed bg-gray-50">
                    <input type="radio" name="payment" disabled className="cursor-not-allowed" />
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      M
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-400">Ví MoMo</p>
                      <p className="text-sm text-gray-400">Đang phát triển</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-medium">Sắp có</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Đơn hàng của bạn</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-3">
                      <img
                        src={item.productImage || '/placeholder-product.jpg'}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatPrice(item.subtotal || item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-4 pb-4 border-b">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã giảm giá
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nhập mã"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={applyCouponMutation.isPending}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                      {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                    </span>
                  </div>
                  {appliedVoucher && discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Giảm giá
                        {appliedVoucher.voucherType === 'PERCENTAGE' && ` (${appliedVoucher.discountPercentage}%)`}
                        {appliedVoucher.voucherType === 'FREE_SHIPPING' && ' (miễn ship)'}
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-xl font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-primary-600">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Đặt hàng
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng của PawVerse
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
