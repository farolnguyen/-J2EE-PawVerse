import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Tag, X } from 'lucide-react';
import { adminService } from '../../api/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function BrandManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ tenBrand: '', moTa: '', logo: '', trangThai: 'Hoạt động' });
  const queryClient = useQueryClient();

  const { data: brands, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: adminService.getAllBrands,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-brands']);
      toast.success('Tạo thương hiệu thành công!');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Không thể tạo thương hiệu');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-brands']);
      toast.success('Cập nhật thương hiệu thành công!');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Không thể cập nhật thương hiệu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-brands']);
      toast.success('Xóa thương hiệu thành công!');
    },
    onError: () => {
      toast.error('Không thể xóa thương hiệu');
    },
  });

  const handleOpenModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        tenBrand: brand.tenBrand,
        moTa: brand.moTa || '',
        logo: brand.logo || '',
        trangThai: brand.trangThai || 'Hoạt động',
      });
    } else {
      setEditingBrand(null);
      setFormData({ tenBrand: '', moTa: '', logo: '', trangThai: 'Hoạt động' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setFormData({ tenBrand: '', moTa: '', logo: '', trangThai: 'Hoạt động' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.idBrand, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (brand) => {
    if (window.confirm(`Bạn có chắc muốn xóa thương hiệu "${brand.tenBrand}"?`)) {
      deleteMutation.mutate(brand.idBrand);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý thương hiệu</h1>
          <p className="text-gray-600 mt-1">Quản lý thương hiệu sản phẩm</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Thêm thương hiệu
        </button>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands?.map((brand) => (
          <div key={brand.idBrand} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.tenBrand} className="w-full h-full object-cover" />
                ) : (
                  <Tag className="text-orange-600" size={24} />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(brand)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Sửa"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(brand)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Xóa"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{brand.tenBrand}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                brand.trangThai === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {brand.trangThai}
              </span>
            </div>
            <p className="text-gray-600 text-sm line-clamp-2">
              {brand.moTa || 'Chưa có mô tả'}
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                {brand.productCount || 0} sản phẩm
              </p>
            </div>
          </div>
        ))}
      </div>

      {brands?.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Tag size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">Chưa có thương hiệu nào</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên thương hiệu <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tenBrand}
                    onChange={(e) => setFormData({ ...formData, tenBrand: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nhập tên thương hiệu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.moTa}
                    onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nhập mô tả thương hiệu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="VD: /images/brands/TenBrand.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Ngưng hoạt động">Ngưng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Đang xử lý...'
                    : editingBrand
                    ? 'Cập nhật'
                    : 'Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
