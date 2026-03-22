import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { orderService } from '../../api/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusConfig = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  PROCESSING: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  SHIPPED: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: Package },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function OrdersPage() {
  const [filter, setFilter] = useState('ALL');

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => orderService.getUserOrders({ 
      status: filter === 'ALL' ? undefined : filter 
    }),
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const orders = ordersData?.content || [];

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span>Đơn hàng của tôi</span>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Đơn hàng của tôi</h1>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex overflow-x-auto">
            {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition ${
                  filter === status
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-primary-600'
                }`}
              >
                {status === 'ALL' ? 'Tất cả' : statusConfig[status]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package size={80} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có đơn hàng nào
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'ALL' 
                ? 'Bạn chưa có đơn hàng nào'
                : `Không có đơn hàng ${statusConfig[filter]?.label.toLowerCase()}`
              }
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = statusConfig[order.orderStatus] || statusConfig.PENDING;
              const StatusIcon = config.icon;

              return (
                <div key={order.orderId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Mã đơn hàng</p>
                        <p className="font-semibold">#{order.orderNumber || order.orderId}</p>
                      </div>
                      <div className="h-8 w-px bg-gray-300" />
                      <div>
                        <p className="text-sm text-gray-600">Ngày đặt</p>
                        <p className="font-medium">{order.orderDate ? formatDate(order.orderDate) : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${config.color}`}>
                        <StatusIcon size={16} />
                        {config.label}
                      </span>
                      <Link
                        to={`/orders/${order.orderId}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Xem chi tiết"
                      >
                        <Eye size={20} />
                      </Link>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <img
                            src={item.productImage || '/placeholder-product.jpg'}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">
                              {item.productName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Số lượng: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">{formatPrice(item.total || item.price * item.quantity)}</p>
                        </div>
                      ))}
                      {order.items?.length > 2 && (
                        <p className="text-sm text-gray-600 text-center">
                          +{order.items.length - 2} sản phẩm khác
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tổng tiền</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {formatPrice(order.finalAmount || order.totalAmount)}
                        </p>
                      </div>
                      <Link
                        to={`/orders/${order.orderId}`}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
