import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Eye, ChevronDown, Truck, ArrowRight, Ban } from 'lucide-react';
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

function getNextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function getNextStatusLabel(nextStatus) {
  const labels = {
    CONFIRMED: 'Xác nhận đơn',
    SHIPPING: 'Giao hàng',
    DELIVERED: 'Đã giao',
  };
  return labels[nextStatus] || statusConfig[nextStatus]?.label;
}

function StatusDropdown({ order, onStatusChange, isPending }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const nextStatus = getNextStatus(order.orderStatus);
  const canCancel = order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED';
  const isFinal = order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED';

  if (isFinal) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition"
      >
        Cập nhật
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-1 animate-in fade-in slide-in-from-top-1">
          {nextStatus && (
            <button
              onClick={() => { onStatusChange(order.orderId, nextStatus); setOpen(false); }}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-blue-700 font-medium"
            >
              <ArrowRight size={16} />
              {getNextStatusLabel(nextStatus)}
            </button>
          )}
          {canCancel && (
            <>
              {nextStatus && <div className="border-t border-gray-100 my-1" />}
              <button
                onClick={() => { onStatusChange(order.orderId, 'CANCELLED'); setOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 font-medium"
              >
                <Ban size={16} />
                Hủy đơn hàng
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderManagementPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, currentPage],
    queryFn: () => adminService.getAllOrders({
      page: currentPage,
      size: 10,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái');
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    const label = newStatus === 'CANCELLED' ? 'HỦY' : statusConfig[newStatus]?.label?.toUpperCase();
    if (window.confirm(`Xác nhận chuyển trạng thái đơn hàng sang "${label}"?`)) {
      updateStatusMutation.mutate({ id: orderId, status: newStatus });
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const orders = ordersData?.content || [];
  const totalPages = ordersData?.totalPages || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mt-1">Quản lý và theo dõi các đơn hàng</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex overflow-x-auto">
          {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(0);
              }}
              className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition ${
                statusFilter === status
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-primary-600'
              }`}
            >
              {status === 'ALL' ? 'Tất cả' : statusConfig[status]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã đơn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày đặt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => {
              const config = statusConfig[order.orderStatus] || statusConfig.PENDING;
              const StatusIcon = config.icon;

              return (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">#{order.orderNumber || order.orderId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.orderDate ? formatDate(order.orderDate) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-primary-600">{formatPrice(order.finalAmount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${config.color}`}>
                      <StatusIcon size={14} />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/staff/orders/${order.orderId}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </Link>
                      <StatusDropdown
                        order={order}
                        onStatusChange={handleStatusChange}
                        isPending={updateStatusMutation.isPending}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">Không có đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700">
            Trang {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
