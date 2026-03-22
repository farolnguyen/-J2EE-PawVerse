import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, XCircle, Truck, ArrowRight, Ban, ShieldCheck, Download, Star } from 'lucide-react';
import { orderService } from '../../api/orderService';
import { adminService } from '../../api/adminService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  SHIPPING: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: Truck },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];

const paymentMethodLabels = {
  COD: 'Thanh toán khi nhận hàng',
  VNPAY: 'VNPay',
  MOMO: 'Ví MoMo',
};

function getNextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function OrderProgressBar({ currentStatus }) {
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="mt-6 pt-6 border-t">
      <h3 className="font-semibold mb-6">Tiến trình đơn hàng</h3>

      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600 text-white shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <p className="font-semibold text-red-700">Đơn hàng đã bị hủy</p>
            <p className="text-sm text-red-600">Đơn hàng này không còn được xử lý</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Progress line */}
          <div className="flex items-center justify-between mb-2">
            {STATUS_FLOW.map((status, idx) => {
              const isCompleted = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              const StepIcon = statusConfig[status].icon;

              return (
                <div key={status} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}>
                    {isCompleted ? <CheckCircle size={20} /> : <StepIcon size={18} />}
                  </div>
                  <p className={`text-xs mt-2 text-center font-medium ${
                    isCompleted ? 'text-primary-700' : 'text-gray-400'
                  }`}>
                    {statusConfig[status].label}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Connector lines */}
          <div className="absolute top-5 left-0 right-0 flex px-12" style={{ zIndex: 0 }}>
            {STATUS_FLOW.slice(0, -1).map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 mx-1">
                <div className={`h-full ${currentIdx > idx ? 'bg-primary-600' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StaffStatusActions({ order, onStatusChange, isPending }) {
  const nextStatus = getNextStatus(order.orderStatus);
  const isFinal = order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED';
  const canCancel = !isFinal;

  if (isFinal) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">
            Đơn hàng đã ở trạng thái cuối — không thể thay đổi
          </span>
        </div>
      </div>
    );
  }

  const nextLabels = {
    CONFIRMED: { text: 'Xác nhận đơn hàng', desc: 'Xác nhận đơn hàng và bắt đầu xử lý' },
    SHIPPING: { text: 'Chuyển sang giao hàng', desc: 'Đơn hàng đã được đóng gói và giao cho đơn vị vận chuyển' },
    DELIVERED: { text: 'Xác nhận đã giao', desc: 'Đơn hàng đã được giao thành công cho khách hàng' },
  };

  return (
    <div className="space-y-3">
      {nextStatus && (
        <button
          onClick={() => onStatusChange(nextStatus)}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition"
        >
          <ArrowRight size={18} />
          {nextLabels[nextStatus]?.text || statusConfig[nextStatus]?.label}
        </button>
      )}
      {nextStatus && nextLabels[nextStatus] && (
        <p className="text-xs text-gray-500 text-center">{nextLabels[nextStatus].desc}</p>
      )}
      {canCancel && (
        <button
          onClick={() => onStatusChange('CANCELLED')}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium transition"
        >
          <Ban size={18} />
          Hủy đơn hàng
        </button>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Check if viewing as staff/admin
  const isStaffView = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin');

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => isStaffView ? adminService.getOrderById(id) : orderService.getOrderById(id),
  });

  // Cancel order mutation (user)
  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['orders']);
      toast.success('Đã hủy đơn hàng');
    },
    onError: () => {
      toast.error('Không thể hủy đơn hàng');
    },
  });

  // Update status mutation (staff)
  const updateStatusMutation = useMutation({
    mutationFn: (status) => adminService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái');
    },
  });

  const handleCancelOrder = () => {
    if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      cancelMutation.mutate();
    }
  };

  const handleStaffStatusChange = (newStatus) => {
    const label = newStatus === 'CANCELLED' ? 'HỦY' : statusConfig[newStatus]?.label?.toUpperCase();
    if (window.confirm(`Xác nhận chuyển trạng thái đơn hàng sang "${label}"?`)) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const blob = isStaffView
        ? await adminService.downloadInvoice(id)
        : await orderService.downloadInvoice(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hoadon-${order.orderNumber || order.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể tải hóa đơn. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy đơn hàng</h2>
        <Link to={isStaffView ? '/staff/orders' : '/orders'} className="text-primary-600 hover:text-primary-700">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const config = statusConfig[order.orderStatus] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const canUserCancel = order.orderStatus === 'PENDING';

  return (
    <div className={isStaffView ? '' : 'bg-gray-50 min-h-screen py-8'}>
      <div className={isStaffView ? '' : 'container mx-auto px-4'}>
        {/* Back Button */}
        <Link
          to={isStaffView ? '/staff/orders' : '/orders'}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft size={20} />
          {isStaffView ? 'Quay lại quản lý đơn hàng' : 'Quay lại đơn hàng của tôi'}
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Đơn hàng #{order.orderNumber || order.orderId}
              </h1>
              <p className="text-gray-600">
                Đặt ngày {order.orderDate ? formatDate(order.orderDate) : 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${config.color}`}>
                <StatusIcon size={20} />
                {config.label}
              </span>
              {order.orderStatus === 'DELIVERED' && (
                <button
                  onClick={handleDownloadInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                >
                  <Download size={18} />
                  Xuất hóa đơn PDF
                </button>
              )}
              {!isStaffView && canUserCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          </div>

          {/* Order Progress Bar */}
          <OrderProgressBar currentStatus={order.orderStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Sản phẩm đã đặt</h2>
              <div className="space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                    <img
                      src={item.productImage || '/placeholder-product.jpg'}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      {item.productId ? (
                        <Link
                          to={`/products/${item.productId}`}
                          className="font-semibold hover:text-primary-600"
                        >
                          {item.productName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-500">{item.productName} <span className="text-xs">(đã xóa)</span></span>
                      )}
                      <p className="text-gray-600 text-sm mt-1">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price)}</p>
                      <p className="text-sm text-gray-600">
                        Tổng: {formatPrice(item.total || item.price * item.quantity)}
                      </p>
                      {order.orderStatus === 'DELIVERED' && item.productId && !isStaffView && (
                        <Link
                          to={`/products/${item.productId}#reviews`}
                          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                        >
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          Đánh giá
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Staff Status Update Panel */}
            {isStaffView && (
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-100">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-800">
                  <ShieldCheck size={20} />
                  Cập nhật trạng thái
                </h3>
                <StaffStatusActions
                  order={order}
                  onStatusChange={handleStaffStatusChange}
                  isPending={updateStatusMutation.isPending}
                />
              </div>
            )}

            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-primary-600" />
                Thông tin giao hàng
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-gray-600">{order.customerPhone}</p>
                <p className="text-gray-600">
                  {order.shippingAddress}{order.shippingDistrict && `, ${order.shippingDistrict}`}{order.shippingCity && `, ${order.shippingCity}`}
                </p>
                {order.orderNote && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="font-medium">Ghi chú:</p>
                    <p className="text-gray-600">{order.orderNote}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-primary-600" />
                Thanh toán
              </h3>
              <p className="text-sm">
                {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold mb-4">Tổng đơn hàng</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(order.shippingFee || 0)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{formatPrice(order.finalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
