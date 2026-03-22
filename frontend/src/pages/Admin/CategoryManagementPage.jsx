import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderTree, X } from 'lucide-react';
import { adminService } from '../../api/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CategoryManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ tenCategory: '', moTa: '', hinhAnh: '', trangThai: 'Hoạt động' });
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getAllCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success('Tạo danh mục thành công!');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Không thể tạo danh mục');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success('Cập nhật danh mục thành công!');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Không thể cập nhật danh mục');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success('Xóa danh mục thành công!');
    },
    onError: () => {
      toast.error('Không thể xóa danh mục');
    },
  });

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        tenCategory: category.tenCategory,
        moTa: category.moTa || '',
        hinhAnh: category.hinhAnh || '',
        trangThai: category.trangThai || 'Hoạt động',
      });
    } else {
      setEditingCategory(null);
      setFormData({ tenCategory: '', moTa: '', hinhAnh: '', trangThai: 'Hoạt động' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ tenCategory: '', moTa: '', hinhAnh: '', trangThai: 'Hoạt động' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.idCategory, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (category) => {
    if (window.confirm(`Bạn có chắc muốn xóa danh mục "${category.tenCategory}"?`)) {
      deleteMutation.mutate(category.idCategory);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Thêm danh mục
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <div key={category.idCategory} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center overflow-hidden">
                {category.hinhAnh ? (
                  <img src={category.hinhAnh} alt={category.tenCategory} className="w-full h-full object-cover" />
                ) : (
                  <FolderTree className="text-primary-600" size={24} />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Sửa"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Xóa"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{category.tenCategory}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                category.trangThai === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {category.trangThai}
              </span>
            </div>
            <p className="text-gray-600 text-sm line-clamp-2">
              {category.moTa || 'Chưa có mô tả'}
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                {category.productCount || 0} sản phẩm
              </p>
            </div>
          </div>
        ))}
      </div>

      {categories?.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FolderTree size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">Chưa có danh mục nào</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
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
                    Tên danh mục <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tenCategory}
                    onChange={(e) => setFormData({ ...formData, tenCategory: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nhập tên danh mục"
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
                    placeholder="Nhập mô tả danh mục"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.hinhAnh}
                    onChange={(e) => setFormData({ ...formData, hinhAnh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="VD: /images/categories/TenDanhMuc.png"
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
                    : editingCategory
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
