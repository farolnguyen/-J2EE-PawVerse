import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Phone, Mail, MapPin,
  CalendarDays, PawPrint, ArrowRight, Ban, ShieldCheck, FileText,
  PhoneOff, AlertTriangle,
} from 'lucide-react';
import bookingService from '../../api/bookingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING:         { label: 'Chờ xác nhận',      color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED:       { label: 'Đã xác nhận',       color: 'bg-blue-100 text-blue-800',     icon: CheckCircle },
  CONTACTING:      { label: 'Liên hệ',           color: 'bg-indigo-100 text-indigo-800', icon: Phone },
  CONTACT_SUCCESS: { label: 'Liên hệ thành công', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  COMPLETED:       { label: 'Hoàn thành',         color: 'bg-green-100 text-green-800',   icon: CheckCircle },
  CANCELLED:       { label: 'Đã hủy',             color: 'bg-red-100 text-red-800',       icon: XCircle },
};

const SERVICE_MAP = {
  PET_HOTEL:    'Pet Hotel',
  SPA_GROOMING: 'Spa & Grooming',
  HOME_SERVICE: 'Dịch vụ tận nhà',
};

// Visual progress bar steps (4 steps)
const PROGRESS_STEPS = [
  { key: 'PENDING',    label: 'Chờ xác nhận', icon: Clock },
  { key: 'CONFIRMED',  label: 'Đã xác nhận',  icon: CheckCircle },
  { key: 'CONTACTING', label: 'Liên hệ',      icon: Phone },
  { key: 'COMPLETED',  label: 'Hoàn thành',   icon: CheckCircle },
];

function getProgressIndex(status) {
  // CONTACT_SUCCESS maps to same visual position as CONTACTING (step 2), fully completed
  if (status === 'CONTACT_SUCCESS') return 2;
  return PROGRESS_STEPS.findIndex((s) => s.key === status);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function BookingProgressBar({ booking }) {
  const currentStatus = booking.bookingStatus;
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIdx = getProgressIndex(currentStatus);
  // CONTACT_SUCCESS means the "Liên hệ" step is fully done
  const contactDone = currentStatus === 'CONTACT_SUCCESS' || currentStatus === 'COMPLETED';
  const failCount = booking.contactFailCount || 0;

  return (
    <div className="mt-6 pt-6 border-t">
      <h3 className="font-semibold mb-6">Tiến trình đặt dịch vụ</h3>

      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600 text-white shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <p className="font-semibold text-red-700">Dịch vụ đã bị hủy</p>
            <p className="text-sm text-red-600">
              {failCount >= 3
                ? `Tự động hủy do không liên hệ được sau ${failCount} lần`
                : 'Lịch hẹn này không còn được xử lý'}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-start justify-between mb-2">
            {PROGRESS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentIdx || (idx === currentIdx && (contactDone || idx < currentIdx));
              const isCurrent = idx === currentIdx && !contactDone;
              const isDone = currentIdx > idx || (idx === 2 && contactDone);
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isCurrent
                        ? 'bg-white border-primary-500 text-primary-600 ring-4 ring-primary-100'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle size={20} /> : <StepIcon size={18} />}
                  </div>
                  <p className={`text-xs mt-2 text-center font-medium leading-tight ${
                    isDone || isCurrent ? 'text-primary-700' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="absolute top-5 left-0 right-0 flex px-12" style={{ zIndex: 0 }}>
            {PROGRESS_STEPS.slice(0, -1).map((_, idx) => {
              const filled = currentIdx > idx || (idx === 2 && contactDone);
              return (
                <div key={idx} className="flex-1 h-0.5 mx-1">
                  <div className={`h-full ${filled ? 'bg-primary-600' : 'bg-gray-300'}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact failure notes — shown below progress bar */}
      {failCount > 0 && currentStatus !== 'CANCELLED' && (
        <div className={`mt-4 p-3 rounded-lg border ${failCount >= 2 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className={failCount >= 2 ? 'text-red-500' : 'text-amber-500'} />
            <span className={`text-sm font-semibold ${failCount >= 2 ? 'text-red-700' : 'text-amber-700'}`}>
              Liên hệ thất bại: {failCount}/3 lần
            </span>
          </div>
          <p className={`text-xs ${failCount >= 2 ? 'text-red-600' : 'text-amber-600'}`}>
            {failCount >= 2
              ? 'Cảnh báo: Thêm 1 lần thất bại nữa sẽ tự động hủy lịch hẹn!'
              : 'Hệ thống đã gửi email nhắc nhở đến khách hàng.'}
          </p>
        </div>
      )}
    </div>
  );
}

function StaffStatusActions({ booking, onStatusChange, onContactFail, isPending }) {
  const { bookingStatus, contactFailCount = 0 } = booking;
  const isFinal = bookingStatus === 'COMPLETED' || bookingStatus === 'CANCELLED';
  const canCancel = !isFinal;

  if (isFinal) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">
            Lịch hẹn đã ở trạng thái cuối — không thể thay đổi
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* PENDING → CONFIRMED */}
      {bookingStatus === 'PENDING' && (
        <>
          <button
            onClick={() => onStatusChange('CONFIRMED')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition"
          >
            <ArrowRight size={18} />
            Xác nhận đặt dịch vụ
          </button>
          <p className="text-xs text-gray-500 text-center">Xác nhận và bắt đầu xử lý lịch hẹn</p>
        </>
      )}

      {/* CONFIRMED → CONTACTING */}
      {bookingStatus === 'CONFIRMED' && (
        <>
          <button
            onClick={() => onStatusChange('CONTACTING')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition"
          >
            <Phone size={18} />
            Bắt đầu liên hệ
          </button>
          <p className="text-xs text-gray-500 text-center">Chuyển sang trạng thái liên hệ khách hàng</p>
        </>
      )}

      {/* CONTACTING → branching: CONTACT_SUCCESS or CONTACT_FAIL */}
      {bookingStatus === 'CONTACTING' && (
        <>
          <p className="text-sm font-medium text-gray-700 text-center">Kết quả liên hệ:</p>
          <button
            onClick={() => onStatusChange('CONTACT_SUCCESS')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
          >
            <CheckCircle size={18} />
            Liên hệ thành công
          </button>
          <button
            onClick={() => onContactFail()}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 border-2 border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 disabled:opacity-50 font-medium transition"
          >
            <PhoneOff size={18} />
            Liên hệ thất bại ({contactFailCount}/3)
          </button>
          {contactFailCount >= 2 && (
            <p className="text-xs text-red-600 text-center font-medium">
              ⚠️ Lần thất bại tiếp theo sẽ tự động hủy lịch hẹn!
            </p>
          )}
        </>
      )}

      {/* CONTACT_SUCCESS → COMPLETED */}
      {bookingStatus === 'CONTACT_SUCCESS' && (
        <>
          <button
            onClick={() => onStatusChange('COMPLETED')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
          >
            <CheckCircle size={18} />
            Hoàn thành dịch vụ
          </button>
          <p className="text-xs text-gray-500 text-center">Xác nhận dịch vụ đã được thực hiện thành công</p>
        </>
      )}

      {/* Cancel always available */}
      {canCancel && (
        <>
          <div className="border-t pt-3 mt-1" />
          <button
            onClick={() => onStatusChange('CANCELLED')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium transition"
          >
            <Ban size={18} />
            Hủy dịch vụ
          </button>
        </>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['staffBooking', id],
    queryFn: () => bookingService.getBookingById(id),
    select: (res) => res.data?.data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => bookingService.updateBookingStatus(id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries(['staffBooking', id]);
      queryClient.invalidateQueries(['staffBookings']);
      if (status === 'CONTACT_FAIL') {
        toast('Đã ghi nhận liên hệ thất bại — email nhắc nhở đã được gửi', { icon: '⚠️' });
      } else {
        toast.success('Cập nhật trạng thái thành công!');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  const handleStatusChange = (newStatus) => {
    const label = newStatus === 'CANCELLED' ? 'HỦY' : statusConfig[newStatus]?.label?.toUpperCase();
    if (window.confirm(`Xác nhận chuyển trạng thái sang "${label}"?`)) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  const handleContactFail = () => {
    const failCount = (booking?.contactFailCount || 0) + 1;
    const msg = failCount >= 3
      ? 'Đây là lần thất bại thứ 3 — lịch hẹn sẽ bị TỰ ĐỘNG HỦY. Tiếp tục?'
      : `Ghi nhận liên hệ thất bại lần ${failCount}/3? Email nhắc nhở sẽ được gửi cho khách hàng.`;
    if (window.confirm(msg)) {
      updateStatusMutation.mutate('CONTACT_FAIL');
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!booking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy lịch đặt dịch vụ</h2>
        <Link to="/staff/bookings" className="text-primary-600 hover:text-primary-700">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const config = statusConfig[booking.bookingStatus] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/staff/bookings"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft size={20} />
        Quay lại quản lý đặt dịch vụ
      </Link>

      {/* Booking Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đặt dịch vụ #{booking.idBooking}
            </h1>
            <p className="text-gray-600">
              Tạo lúc {formatDate(booking.ngayTao)}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full font-medium inline-flex items-center gap-2 ${config.color}`}>
            <StatusIcon size={20} />
            {config.label}
          </span>
        </div>

        {/* Progress Bar */}
        <BookingProgressBar booking={booking} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CalendarDays size={22} className="text-primary-600" />
              Thông tin dịch vụ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Loại dịch vụ</p>
                <p className="font-semibold text-gray-900">
                  {SERVICE_MAP[booking.serviceType] || booking.serviceType}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Chi nhánh</p>
                <p className="font-semibold text-gray-900">{booking.location}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Ngày & giờ hẹn</p>
                <p className="font-semibold text-gray-900">{formatDate(booking.ngayGioDat)}</p>
              </div>
              {booking.diaChi && (
                <div>
                  <p className="text-gray-500 mb-1">Địa chỉ</p>
                  <p className="font-semibold text-gray-900">{booking.diaChi}</p>
                </div>
              )}
            </div>
            {booking.ghiChu && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 mb-1 flex items-center gap-1.5">
                  <FileText size={14} />
                  Ghi chú
                </p>
                <p className="text-gray-800 bg-gray-50 rounded-lg p-3 text-sm">{booking.ghiChu}</p>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin size={22} className="text-primary-600" />
              Thông tin khách hàng
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-primary-700 font-bold text-xs">
                    {booking.hoTen?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{booking.hoTen}</p>
                  {booking.userId && <p className="text-gray-400 text-xs">ID khách hàng: #{booking.userId}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span>{booking.soDienThoai}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <span>{booking.email}</span>
              </div>
            </div>
          </div>

          {/* Pet Info */}
          {booking.petName && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <PawPrint size={22} className="text-primary-600" />
                Thông tin thú cưng
              </h2>
              <div className="flex items-center gap-4">
                {booking.petAvatarUrl ? (
                  <img
                    src={booking.petAvatarUrl}
                    alt={booking.petName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-200">
                    <PawPrint size={28} className="text-amber-500" />
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 text-base">{booking.petName}</p>
                  {booking.petType && <p className="text-gray-500">{booking.petType}</p>}
                  {booking.petBreed && <p className="text-gray-500">{booking.petBreed}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Staff Status Update Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-100">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-800">
              <ShieldCheck size={20} />
              Cập nhật trạng thái
            </h3>
            <StaffStatusActions
              booking={booking}
              onStatusChange={handleStatusChange}
              onContactFail={handleContactFail}
              isPending={updateStatusMutation.isPending}
            />
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold mb-4">Tóm tắt lịch hẹn</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đặt lịch</span>
                <span className="font-medium">#{booking.idBooking}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dịch vụ</span>
                <span className="font-medium">{SERVICE_MAP[booking.serviceType] || booking.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chi nhánh</span>
                <span className="font-medium">{booking.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày hẹn</span>
                <span className="font-medium">{formatDate(booking.ngayGioDat)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
              {(booking.contactFailCount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Liên hệ thất bại</span>
                  <span className="font-medium text-amber-600">{booking.contactFailCount}/3 lần</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
