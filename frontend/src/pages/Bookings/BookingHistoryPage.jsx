import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Phone, Mail, PawPrint, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import bookingService from '../../api/bookingService';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  PENDING:         { label: 'Chờ xác nhận',       color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  CONFIRMED:       { label: 'Đã xác nhận',        color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500' },
  CONTACTING:      { label: 'Đang liên hệ',       color: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  CONTACT_SUCCESS: { label: 'Liên hệ thành công', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  COMPLETED:       { label: 'Đã hoàn thành',      color: 'bg-green-100 text-green-800',   dot: 'bg-green-500' },
  CANCELLED:       { label: 'Đã hủy',             color: 'bg-red-100 text-red-800',       dot: 'bg-red-500' },
};

const SERVICE_MAP = {
  PET_HOTEL: 'Pet Hotel',
  SPA_GROOMING: 'Spa & Grooming',
  HOME_SERVICE: 'Dịch vụ tận nhà',
};

export default function BookingHistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: bookingService.getMyBookings,
    enabled: isAuthenticated,
    select: (res) => res.data?.data || [],
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookings']);
      toast.success('Đã hủy đặt lịch thành công');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Hủy đặt lịch thất bại');
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem lịch sử đặt dịch vụ</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const filtered = filter === 'ALL' ? bookings : bookings.filter((b) => b.bookingStatus === filter);

  const canCancel = (status) => !['COMPLETED', 'CANCELLED', 'CONTACT_SUCCESS'].includes(status);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử đặt dịch vụ</h1>
        <p className="text-gray-600 mb-6">Theo dõi và quản lý các lịch hẹn dịch vụ của bạn</p>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ key: 'ALL', label: 'Tất cả' }, ...Object.entries(STATUS_MAP).map(([key, val]) => ({ key, label: val.label }))].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === tab.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {tab.label}
              {tab.key === 'ALL' ? ` (${bookings.length})` : ` (${bookings.filter((b) => b.bookingStatus === tab.key).length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Không có lịch đặt dịch vụ nào</p>
            <button onClick={() => navigate('/services')} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Đặt dịch vụ ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const status = STATUS_MAP[booking.bookingStatus] || STATUS_MAP.PENDING;
              const isExpanded = expandedId === booking.idBooking;
              return (
                <div key={booking.idBooking} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedId(isExpanded ? null : booking.idBooking)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status.dot}`}></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{SERVICE_MAP[booking.serviceType] || booking.serviceType}</h3>
                          <p className="text-sm text-gray-500">#{booking.idBooking} · {formatDate(booking.ngayTao)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                        {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-gray-600">Ngày hẹn:</span>
                            <span className="font-medium">{formatDate(booking.ngayGioDat)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="text-gray-600">Chi nhánh:</span>
                            <span className="font-medium">{booking.location}</span>
                          </div>
                          {booking.diaChi && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin size={16} className="text-gray-400" />
                              <span className="text-gray-600">Địa chỉ:</span>
                              <span className="font-medium">{booking.diaChi}</span>
                            </div>
                          )}
                          {booking.petName && (
                            <div className="flex items-center gap-2 text-sm">
                              <PawPrint size={16} className="text-gray-400" />
                              <span className="text-gray-600">Thú cưng:</span>
                              <span className="font-medium">{booking.petName}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-gray-600">SĐT:</span>
                            <span className="font-medium">{booking.soDienThoai}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={16} className="text-gray-400" />
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{booking.email}</span>
                          </div>
                          {booking.ghiChu && (
                            <div className="text-sm">
                              <span className="text-gray-600">Ghi chú:</span>
                              <p className="font-medium mt-1">{booking.ghiChu}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {canCancel(booking.bookingStatus) && (
                        <div className="mt-4 pt-4 border-t flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Bạn có chắc chắn muốn hủy đặt lịch này?')) {
                                cancelMutation.mutate(booking.idBooking);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                          >
                            <XCircle size={16} />
                            Hủy đặt lịch
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
