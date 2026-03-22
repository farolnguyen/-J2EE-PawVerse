import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Sparkles, Building2, Clock, MapPin, Phone, Mail, Shield, X, ChevronRight, ChevronLeft, PawPrint, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import bookingService from '../../api/bookingService';
import petService from '../../api/petService';
import PetProfileModal from '../../components/pet/PetProfileModal';

const SERVICE_MAP = {
  PET_HOTEL: { name: 'Pet Hotel', icon: Building2 },
  SPA_GROOMING: { name: 'Spa & Grooming', icon: Sparkles },
  HOME_SERVICE: { name: 'Home Service', icon: Home },
};

const services = [
  {
    id: 1,
    name: 'Pet Hotel',
    type: 'PET_HOTEL',
    icon: Building2,
    description: 'Dịch vụ lưu trú cao cấp cho thú cưng với phòng ốc tiện nghi, chăm sóc 24/7',
    features: [
      'Phòng riêng biệt có máy lạnh',
      'Chăm sóc sức khỏe hàng ngày',
      'Camera giám sát 24/7',
      'Vui chơi và tập luyện',
      'Thức ăn dinh dưỡng cao cấp',
    ],
    pricing: [
      { label: 'Nhỏ (< 5kg)', price: '150.000đ/ngày' },
      { label: 'Vừa (5-15kg)', price: '200.000đ/ngày' },
      { label: 'Lớn (> 15kg)', price: '300.000đ/ngày' },
    ],
    locations: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'],
    needsAddress: false,
  },
  {
    id: 2,
    name: 'Spa & Grooming',
    type: 'SPA_GROOMING',
    icon: Sparkles,
    description: 'Dịch vụ spa và làm đẹp chuyên nghiệp cho thú cưng với đội ngũ groomer giàu kinh nghiệm',
    features: [
      'Tắm gội với sản phẩm cao cấp',
      'Cắt tỉa lông chuyên nghiệp',
      'Vệ sinh tai, móng, răng',
      'Massage thư giãn',
      'Nhuộm lông an toàn',
    ],
    pricing: [
      { label: 'Gói cơ bản', price: '150.000đ - 300.000đ' },
      { label: 'Gói cao cấp', price: '300.000đ - 500.000đ' },
      { label: 'Gói VIP', price: '500.000đ - 1.000.000đ' },
    ],
    locations: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'],
    needsAddress: false,
  },
  {
    id: 3,
    name: 'Home Service',
    type: 'HOME_SERVICE',
    icon: Home,
    description: 'Dịch vụ chăm sóc tại nhà tiện lợi, mang chuyên gia đến tận nơi',
    features: [
      'Tắm gội tại nhà',
      'Khám sức khỏe định kỳ',
      'Tiêm phòng, tẩy giun',
      'Huấn luyện cơ bản',
      'Tư vấn dinh dưỡng',
    ],
    pricing: [
      { label: 'Tắm gội', price: '200.000đ - 400.000đ' },
      { label: 'Khám sức khỏe', price: '300.000đ - 500.000đ' },
      { label: 'Gói tổng hợp', price: '500.000đ - 1.000.000đ' },
    ],
    locations: ['TP. Hồ Chí Minh', 'Hà Nội'],
    needsAddress: true,
  },
];

function BookingModal({ isOpen, onClose, initialService }) {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [showPetModal, setShowPetModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    serviceType: initialService?.type || '',
    packageLabel: '',
    hoTen: user?.fullName || '',
    soDienThoai: '',
    email: user?.email || '',
    location: '',
    diaChi: '',
    ngayGioDat: '',
    ghiChu: '',
    petId: null,
  });

  const selectedServiceData = services.find((s) => s.type === form.serviceType);

  const { data: petsData } = useQuery({
    queryKey: ['myPets'],
    queryFn: () => petService.getMyPets(),
    enabled: isOpen && isAuthenticated,
    select: (res) => res.data?.data || [],
  });
  const pets = petsData || [];

  const createBookingMutation = useMutation({
    mutationFn: (data) => bookingService.createBooking(data),
    onSuccess: () => {
      setBookingSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch');
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setError('');
    const payload = {
      hoTen: form.hoTen,
      soDienThoai: form.soDienThoai,
      email: form.email,
      serviceType: form.serviceType,
      ngayGioDat: form.ngayGioDat ? new Date(form.ngayGioDat).toISOString() : null,
      location: form.location,
      diaChi: form.diaChi || null,
      ghiChu: form.ghiChu ? `[${form.packageLabel}] ${form.ghiChu}` : form.packageLabel || null,
      petId: form.petId || null,
    };
    createBookingMutation.mutate(payload);
  };

  const canNext = () => {
    if (step === 1) return form.serviceType && form.packageLabel;
    if (step === 2) return form.hoTen && form.soDienThoai && form.email && form.location && form.ngayGioDat && (!selectedServiceData?.needsAddress || form.diaChi);
    if (step === 3) return true;
    return false;
  };

  const handleClose = () => {
    setStep(1);
    setBookingSuccess(false);
    setError('');
    setForm({ serviceType: '', packageLabel: '', hoTen: user?.fullName || '', soDienThoai: '', email: user?.email || '', location: '', diaChi: '', ngayGioDat: '', ghiChu: '', petId: null });
    onClose();
  };

  if (!isOpen) return null;

  if (bookingSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt lịch thành công!</h2>
          <p className="text-gray-600 mb-2">Email xác nhận đã được gửi đến hộp thư của bạn.</p>
          <p className="text-gray-500 text-sm mb-6">Nhân viên sẽ liên hệ xác nhận qua email và số điện thoại bạn đã cung cấp.</p>
          <div className="space-y-2">
            <button onClick={() => { handleClose(); navigate('/bookings'); }} className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold">
              Xem lịch sử đặt dịch vụ
            </button>
            <button onClick={handleClose} className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <CalendarDays size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Đặt lịch dịch vụ</h2>
              <p className="text-xs text-gray-500">Bước {step} / 3</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex px-5 pt-4 gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition ${s <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Service & Package */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Chọn loại dịch vụ</h3>
                <div className="grid grid-cols-3 gap-3">
                  {services.map((svc) => {
                    const Icon = svc.icon;
                    const selected = form.serviceType === svc.type;
                    return (
                      <button
                        key={svc.type}
                        onClick={() => setForm({ ...form, serviceType: svc.type, packageLabel: '', location: '' })}
                        className={`p-4 rounded-xl border-2 text-center transition ${selected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                      >
                        <Icon size={32} className={`mx-auto mb-2 ${selected ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${selected ? 'text-primary-700' : 'text-gray-600'}`}>{svc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedServiceData && (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Chọn gói dịch vụ</h3>
                  <div className="space-y-2">
                    {selectedServiceData.pricing.map((pkg) => (
                      <button
                        key={pkg.label}
                        onClick={() => setForm({ ...form, packageLabel: pkg.label })}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${form.packageLabel === pkg.label ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                      >
                        <span className={`font-medium ${form.packageLabel === pkg.label ? 'text-primary-700' : 'text-gray-700'}`}>{pkg.label}</span>
                        <span className={`font-bold ${form.packageLabel === pkg.label ? 'text-primary-600' : 'text-gray-500'}`}>{pkg.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Customer Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-1">Thông tin khách hàng</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                  <input type="text" value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input type="tel" value={form.soDienThoai} onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedServiceData?.needsAddress ? 'Thành phố *' : 'Chi nhánh *'}
                  </label>
                  <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    <option value="">Chọn</option>
                    {(selectedServiceData?.locations || []).map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giờ hẹn *</label>
                  <input
                    type="datetime-local"
                    value={form.ngayGioDat}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setForm({ ...form, ngayGioDat: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              {selectedServiceData?.needsAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể *</label>
                  <input type="text" value={form.diaChi} onChange={(e) => setForm({ ...form, diaChi: e.target.value })} placeholder="Số nhà, đường, quận/huyện..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Yêu cầu đặc biệt..." />
              </div>
            </div>
          )}

          {/* Step 3: Pet Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-1">Chọn thú cưng</h3>
              <p className="text-sm text-gray-500">Chọn thú cưng sẽ sử dụng dịch vụ (không bắt buộc)</p>

              {pets.length > 0 ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setForm({ ...form, petId: null })}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${!form.petId ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <PawPrint size={20} className="text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-600">Không chọn thú cưng</span>
                  </button>
                  {pets.map((pet) => (
                    <button
                      key={pet.idPet}
                      onClick={() => setForm({ ...form, petId: pet.idPet })}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${form.petId === pet.idPet ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.petId === pet.idPet ? 'bg-primary-200' : 'bg-primary-100'}`}>
                        <PawPrint size={20} className="text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{pet.tenPet}</p>
                        <p className="text-xs text-gray-500">
                          {pet.loaiPet}{pet.giong ? ` · ${pet.giong}` : ''}{pet.tuoi ? ` · ${pet.tuoi} tuổi` : ''}{pet.gioiTinh ? ` · ${pet.gioiTinh}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                  <PawPrint size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-1">Bạn chưa có profile thú cưng</p>
                  <p className="text-sm text-gray-400">Tạo profile để chúng tôi phục vụ tốt hơn</p>
                </div>
              )}

              <button
                onClick={() => setShowPetModal(true)}
                className="w-full py-3 border-2 border-dashed border-primary-300 text-primary-600 rounded-xl hover:bg-primary-50 transition font-medium flex items-center justify-center gap-2"
              >
                <PawPrint size={18} />
                Tạo profile cho thú cưng của bạn
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-red-500 text-sm text-center">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-gray-50">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition">
              <ChevronLeft size={18} /> Quay lại
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tiếp theo <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createBookingMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50"
            >
              {createBookingMutation.isPending ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
            </button>
          )}
        </div>
      </div>

      {/* Pet Profile Modal */}
      <PetProfileModal isOpen={showPetModal} onClose={() => setShowPetModal(false)} />
    </div>
  );
}

export default function ServicesPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingServiceState] = useState(null);

  const handleBookNow = (service) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookingServiceState(service);
    setBookingOpen(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Dịch vụ chăm sóc thú cưng</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Chúng tôi cung cấp các dịch vụ chăm sóc thú cưng chuyên nghiệp, 
            mang lại sự an tâm tuyệt đối cho bạn và người bạn bốn chân
          </p>
          <button
            onClick={() => handleBookNow(null)}
            className="mt-8 px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 font-bold text-lg transition shadow-lg"
          >
            Đặt lịch ngay
          </button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group cursor-pointer"
                onClick={() => setSelectedService(service)}
              >
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Icon size={80} className="text-primary-600" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary-600 transition">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <button className="text-primary-600 font-semibold hover:text-primary-700">
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service Details */}
        {selectedService && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">{selectedService.name}</h2>
              <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Features */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Dịch vụ bao gồm:</h3>
                <ul className="space-y-3">
                  {selectedService.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">Khu vực phục vụ:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedService.locations.map((location, idx) => (
                    <span key={idx} className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      <MapPin size={14} className="inline mr-1" />{location}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Bảng giá:</h3>
                <div className="space-y-3">
                  {selectedService.pricing.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <span className="text-primary-600 font-bold">{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-primary-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Liên hệ đặt lịch:</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2"><Phone size={16} className="text-primary-600" /><span>Hotline: 1900 xxxx</span></p>
                    <p className="flex items-center gap-2"><Mail size={16} className="text-primary-600" /><span>Email: service@pawverse.com</span></p>
                    <p className="flex items-center gap-2"><Clock size={16} className="text-primary-600" /><span>Giờ làm việc: 8:00 - 20:00 (T2-CN)</span></p>
                  </div>
                </div>

                <button
                  onClick={() => handleBookNow(selectedService)}
                  className="w-full mt-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                >
                  Đặt lịch ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pet Profile CTA */}
        {isAuthenticated && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <PawPrint size={28} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Tạo profile cho thú cưng của bạn</h3>
                <p className="text-sm text-gray-600">Lưu thông tin thú cưng để đặt lịch dịch vụ nhanh hơn</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-pets')}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium transition flex-shrink-0"
            >
              Quản lý thú cưng
            </button>
          </div>
        )}

        {/* Why Choose Us */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Tại sao chọn PawVerse?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Chuyên nghiệp</h3>
              <p className="text-sm text-gray-600">Đội ngũ được đào tạo bài bản</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">An toàn</h3>
              <p className="text-sm text-gray-600">Cam kết sức khỏe thú cưng</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Nhanh chóng</h3>
              <p className="text-sm text-gray-600">Dịch vụ tận tâm 24/7</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Tiện lợi</h3>
              <p className="text-sm text-gray-600">Nhiều chi nhánh trên cả nước</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialService={bookingService}
      />
    </div>
  );
}
