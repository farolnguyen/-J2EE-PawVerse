import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PawPrint, Plus, Edit2, Trash2, Camera, X, Save, ArrowLeft, AlertCircle, Dog, Cat, Rabbit, Bird } from 'lucide-react';
import petService from '../../api/petService';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PET_TYPES = [
  { value: 'Chó', label: 'Chó', icon: Dog },
  { value: 'Mèo', label: 'Mèo', icon: Cat },
  { value: 'Hamster', label: 'Hamster', icon: PawPrint },
  { value: 'Thỏ', label: 'Thỏ', icon: Rabbit },
  { value: 'Chim', label: 'Chim', icon: Bird },
  { value: 'Khác', label: 'Khác', icon: PawPrint },
];

const GENDERS = ['Đực', 'Cái', 'Không rõ'];

const initialForm = { tenPet: '', loaiPet: 'Chó', giong: '', tuoi: '', gioiTinh: 'Đực', canNang: '' };

export default function PetProfilePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list | form | detail
  const [editingPet, setEditingPet] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [selectedPet, setSelectedPet] = useState(null);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['myPets'],
    queryFn: petService.getMyPets,
    enabled: isAuthenticated,
    select: (res) => res.data?.data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => petService.createPet(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPets']);
      toast.success('Thêm thú cưng thành công!');
      setView('list');
      setForm(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thêm thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ petId, data }) => petService.updatePet(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPets']);
      toast.success('Cập nhật thành công!');
      setView('list');
      setEditingPet(null);
      setForm(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (petId) => petService.deletePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPets']);
      toast.success('Đã xóa thú cưng');
      setView('list');
      setSelectedPet(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Xóa thất bại'),
  });

  const avatarMutation = useMutation({
    mutationFn: ({ petId, file }) => petService.uploadPetAvatar(petId, file),
    onSuccess: (res) => {
      const avatarUrl = res.data?.data;
      queryClient.invalidateQueries(['myPets']);
      if (selectedPet && avatarUrl) setSelectedPet({ ...selectedPet, anhPet: avatarUrl });
      toast.success('Cập nhật ảnh thành công!');
    },
    onError: () => toast.error('Upload ảnh thất bại'),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để quản lý thú cưng</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tenPet.trim()) { toast.error('Vui lòng nhập tên thú cưng'); return; }
    const data = {
      ...form,
      tuoi: form.tuoi ? parseInt(form.tuoi) : null,
      canNang: form.canNang ? parseFloat(form.canNang) : null,
    };
    if (editingPet) {
      updateMutation.mutate({ petId: editingPet.idPet, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (pet) => {
    setEditingPet(pet);
    setForm({
      tenPet: pet.tenPet || '',
      loaiPet: pet.loaiPet || 'Chó',
      giong: pet.giong || '',
      tuoi: pet.tuoi?.toString() || '',
      gioiTinh: pet.gioiTinh || 'Đực',
      canNang: pet.canNang?.toString() || '',
    });
    setView('form');
  };

  const openDetail = (pet) => {
    setSelectedPet(pet);
    setView('detail');
  };

  const handleAvatarChange = (petId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh không được vượt quá 5MB'); return; }
    avatarMutation.mutate({ petId, file });
  };

  const getPetIcon = (type) => {
    const found = PET_TYPES.find((p) => p.value === type);
    return found ? found.icon : PawPrint;
  };

  // ===== DETAIL VIEW =====
  if (view === 'detail' && selectedPet) {
    const PetIcon = getPetIcon(selectedPet.loaiPet);
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <button onClick={() => { setView('list'); setSelectedPet(null); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft size={20} /> Quay lại
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto border-4 border-amber-200">
                    {selectedPet.anhPet ? (
                      <img src={selectedPet.anhPet} alt={selectedPet.tenPet} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50">
                        <PetIcon size={48} className="text-amber-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-amber-500 text-white rounded-full cursor-pointer hover:bg-amber-600 transition">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarChange(selectedPet.idPet, e)} disabled={avatarMutation.isPending} />
                  </label>
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{selectedPet.tenPet}</h2>
                <p className="text-amber-600 font-medium">{selectedPet.loaiPet}</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <button onClick={() => openEdit(selectedPet)} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm flex items-center gap-1">
                    <Edit2 size={14} /> Sửa
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Bạn có chắc chắn muốn xóa?')) deleteMutation.mutate(selectedPet.idPet); }}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Thông tin thú cưng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Tên" value={selectedPet.tenPet} />
                  <InfoRow label="Loại" value={selectedPet.loaiPet} />
                  <InfoRow label="Giống" value={selectedPet.giong || 'Chưa cập nhật'} />
                  <InfoRow label="Tuổi" value={selectedPet.tuoi ? `${selectedPet.tuoi} tuổi` : 'Chưa cập nhật'} />
                  <InfoRow label="Giới tính" value={selectedPet.gioiTinh || 'Chưa cập nhật'} />
                  <InfoRow label="Cân nặng" value={selectedPet.canNang ? `${selectedPet.canNang} kg` : 'Chưa cập nhật'} />
                </div>
                {selectedPet.ngayTao && (
                  <p className="text-xs text-gray-400 mt-4">
                    Tạo ngày: {new Date(selectedPet.ngayTao).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== FORM VIEW =====
  if (view === 'form') {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <button onClick={() => { setView('list'); setEditingPet(null); setForm(initialForm); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft size={20} /> Quay lại
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">{editingPet ? 'Chỉnh sửa thú cưng' : 'Thêm thú cưng mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên thú cưng *</label>
                <input
                  value={form.tenPet}
                  onChange={(e) => setForm({ ...form, tenPet: e.target.value })}
                  placeholder="VD: Milu, Lucky..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại thú cưng</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PET_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({ ...form, loaiPet: type.value })}
                        className={`p-3 rounded-lg border-2 text-center transition ${
                          form.loaiPet === type.value ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={24} className={`mx-auto ${form.loaiPet === type.value ? 'text-amber-600' : 'text-gray-400'}`} />
                        <span className="text-xs mt-1 block">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giống</label>
                  <input
                    value={form.giong}
                    onChange={(e) => setForm({ ...form, giong: e.target.value })}
                    placeholder="VD: Corgi, Poodle..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.tuoi}
                    onChange={(e) => setForm({ ...form, tuoi: e.target.value })}
                    placeholder="Tuổi"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={form.gioiTinh}
                    onChange={(e) => setForm({ ...form, gioiTinh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.canNang}
                    onChange={(e) => setForm({ ...form, canNang: e.target.value })}
                    placeholder="VD: 3.5"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                <Save size={20} />
                {(createMutation.isPending || updateMutation.isPending) ? 'Đang lưu...' : editingPet ? 'Cập nhật' : 'Thêm thú cưng'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thú cưng của tôi</h1>
            <p className="text-gray-600 mt-1">Quản lý profile thú cưng của bạn</p>
          </div>
          <button
            onClick={() => { setForm(initialForm); setEditingPet(null); setView('form'); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
          >
            <Plus size={20} /> Thêm thú cưng
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto"></div>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <PawPrint size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có thú cưng nào</h3>
            <p className="text-gray-500 mb-4">Thêm thú cưng để đặt lịch dịch vụ nhanh hơn</p>
            <button
              onClick={() => { setForm(initialForm); setEditingPet(null); setView('form'); }}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              Thêm thú cưng đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((pet) => {
              const PetIcon = getPetIcon(pet.loaiPet);
              return (
                <div
                  key={pet.idPet}
                  onClick={() => openDetail(pet)}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer overflow-hidden group"
                >
                  <div className="h-40 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center relative">
                    {pet.anhPet ? (
                      <img src={pet.anhPet} alt={pet.tenPet} className="w-full h-full object-cover" />
                    ) : (
                      <PetIcon size={56} className="text-amber-300 group-hover:text-amber-400 transition" />
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-amber-700">{pet.loaiPet}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg">{pet.tenPet}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      {pet.giong && <span>{pet.giong}</span>}
                      {pet.tuoi && <span>· {pet.tuoi} tuổi</span>}
                      {pet.gioiTinh && <span>· {pet.gioiTinh}</span>}
                    </div>
                    {pet.canNang && <p className="text-xs text-gray-400 mt-1">{pet.canNang} kg</p>}
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

function InfoRow({ label, value }) {
  return (
    <div className="py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
