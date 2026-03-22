import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, Phone, ChevronDown, ArrowRight, Ban, Eye } from 'lucide-react';
import bookingService from '../../api/bookingService';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING:         { label: 'Chờ xác nhận',       color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED:       { label: 'Đã xác nhận',        color: 'bg-blue-100 text-blue-800',     icon: CheckCircle },
  CONTACTING:      { label: 'Liên hệ',            color: 'bg-indigo-100 text-indigo-800', icon: Phone },
  CONTACT_SUCCESS: { label: 'Liên hệ thành công', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  COMPLETED:       { label: 'Hoàn thành',         color: 'bg-green-100 text-green-800',   icon: CheckCircle },
  CANCELLED:       { label: 'Đã hủy',             color: 'bg-red-100 text-red-800',       icon: XCircle },
};

const SERVICE_MAP = {
  PET_HOTEL: 'Pet Hotel',
  SPA_GROOMING: 'Spa & Grooming',
  HOME_SERVICE: 'Dịch vụ tận nhà',
};

const STATUS_TABS = ['PENDING', 'CONFIRMED', 'CONTACTING', 'CONTACT_SUCCESS', 'COMPLETED', 'CANCELLED'];

function getNextStatus(current) {
  const flow = { PENDING: 'CONFIRMED', CONFIRMED: 'CONTACTING', CONTACT_SUCCESS: 'COMPLETED' };
  return flow[current] || null;
}

function getNextStatusLabel(nextStatus) {
  const labels = {
    CONFIRMED: 'Xác nhận dịch vụ',
    CONTACTING: 'Bắt đầu liên hệ',
    COMPLETED: 'Hoàn thành dịch vụ',
  };
  return labels[nextStatus] || statusConfig[nextStatus]?.label;
}

function StatusDropdown({ booking, onStatusChange, isPending }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isFinal = booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED';
  const isContacting = booking.bookingStatus === 'CONTACTING';
  const nextStatus = getNextStatus(booking.bookingStatus);
  const canCancel = !isFinal;

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
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-1">
          {/* Normal forward transition */}
          {nextStatus && (
            <button
              onClick={() => { onStatusChange(booking.idBooking, nextStatus); setOpen(false); }}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-blue-700 font-medium"
            >
              <ArrowRight size={16} />
              {getNextStatusLabel(nextStatus)}
            </button>
          )}
          {/* Branching at CONTACTING */}
          {isContacting && (
            <>
              <button
                onClick={() => { onStatusChange(booking.idBooking, 'CONTACT_SUCCESS'); setOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 text-green-700 font-medium"
              >
                <CheckCircle size={16} />
                Liên hệ thành công
              </button>
              <button
                onClick={() => { onStatusChange(booking.idBooking, 'CONTACT_FAIL'); setOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 text-amber-700 font-medium"
              >
                <XCircle size={16} />
                Liên hệ thất bại ({booking.contactFailCount || 0}/3)
              </button>
            </>
          )}
          {canCancel && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { onStatusChange(booking.idBooking, 'CANCELLED'); setOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 font-medium"
              >
                <Ban size={16} />
                Hủy dịch vụ
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BookingManagementPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['staffBookings', statusFilter],
    queryFn: () => bookingService.getAllBookings({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
    select: (res) => res.data?.data || [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }) => bookingService.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['staffBookings']);
      toast.success('Cập nhật trạng thái thành công!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  const handleStatusChange = (bookingId, newStatus) => {
    if (newStatus === 'CONTACT_FAIL') {
      const booking = bookings.find((b) => b.idBooking === bookingId);
      const failCount = (booking?.contactFailCount || 0) + 1;
      const msg = failCount >= 3
        ? 'Đây là lần thất bại thứ 3 — lịch hẹn sẽ bị TỰ ĐỘNG HỦY. Tiếp tục?'
        : `Ghi nhận liên hệ thất bại lần ${failCount}/3?`;
      if (window.confirm(msg)) {
        updateStatusMutation.mutate({ bookingId, status: newStatus });
      }
      return;
    }
    const label = newStatus === 'CANCELLED' ? 'HỦY' : statusConfig[newStatus]?.label?.toUpperCase();
    if (window.confirm(`Xác nhận chuyển trạng thái dịch vụ sang "${label}"?`)) {
      updateStatusMutation.mutate({ bookingId, status: newStatus });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý đặt dịch vụ</h1>
        <p className="text-gray-600 mt-1">Quản lý và theo dõi các lịch hẹn dịch vụ</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex overflow-x-auto">
          {['ALL', ...STATUS_TABS].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
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

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã đặt lịch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dịch vụ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày hẹn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chi nhánh
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
            {bookings.map((booking) => {
              const config = statusConfig[booking.bookingStatus] || statusConfig.PENDING;
              const StatusIcon = config.icon;

              return (
                <tr key={booking.idBooking} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">#{booking.idBooking}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{booking.hoTen}</p>
                      <p className="text-sm text-gray-500">{booking.soDienThoai}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {SERVICE_MAP[booking.serviceType] || booking.serviceType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(booking.ngayGioDat)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {booking.location}
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
                        to={`/staff/bookings/${booking.idBooking}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </Link>
                      <StatusDropdown
                        booking={booking}
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

        {!isLoading && bookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">Không có lịch đặt dịch vụ nào</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Đang tải...</p>
          </div>
        )}
      </div>
    </div>
  );
}
