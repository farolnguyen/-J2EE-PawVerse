import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, Eye, Package, X, Star, ToggleLeft, ToggleRight, ImagePlus, FileSpreadsheet } from 'lucide-react';
import { adminService } from '../../api/adminService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import ExcelImportModal from '../../components/admin/ExcelImportModal';

const EMPTY_FORM = {
  tenProduct: '',
  moTa: '',
  giaBan: '',
  giaGoc: '',
  soLuongTonKho: '',
  categoryId: '',
  brandId: '',
  isFeatured: false,
  isEnabled: true,
  imageUrls: ['', '', '', '', ''],
};

export default function ProductManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', currentPage, searchTerm, statusFilter],
    queryFn: () => adminService.getAllProducts({
      page: currentPage,
      size: 10,
      keyword: searchTerm || undefined,
    }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminService.getAllCategories(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => adminService.getAllBrands(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Thêm sản phẩm thành công!');
      closeModal();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể thêm sản phẩm'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Cập nhật sản phẩm thành công!');
      closeModal();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể cập nhật sản phẩm'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Đã xóa sản phẩm!');
    },
    onError: () => toast.error('Không thể xóa sản phẩm'),
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ id, isEnabled }) => adminService.toggleProductEnabled(id, isEnabled),
    onSuccess: () => queryClient.invalidateQueries(['admin-products']),
    onError: () => toast.error('Không thể thay đổi trạng thái'),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }) => adminService.toggleProductFeatured(id, isFeatured),
    onSuccess: () => queryClient.invalidateQueries(['admin-products']),
    onError: () => toast.error('Không thể thay đổi trạng thái nổi bật'),
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const urls = product.imageUrls || [];
    const paddedUrls = [...urls, '', '', '', '', ''].slice(0, 5);
    setForm({
      tenProduct: product.tenProduct || '',
      moTa: product.moTa || '',
      giaBan: product.giaBan || '',
      giaGoc: product.giaGoc || '',
      soLuongTonKho: product.soLuongTonKho ?? '',
      categoryId: product.categoryId || '',
      brandId: product.brandId || '',
      isFeatured: product.isFeatured || false,
      isEnabled: product.isEnabled !== false,
      imageUrls: paddedUrls,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUrlChange = (index, value) => {
    setForm((prev) => {
      const urls = [...prev.imageUrls];
      urls[index] = value;
      return { ...prev, imageUrls: urls };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      tenProduct: form.tenProduct,
      moTa: form.moTa,
      giaBan: parseFloat(form.giaBan),
      giaGoc: form.giaGoc ? parseFloat(form.giaGoc) : null,
      soLuongTonKho: parseInt(form.soLuongTonKho),
      categoryId: parseInt(form.categoryId),
      brandId: parseInt(form.brandId),
      isFeatured: form.isFeatured,
      imageUrls: form.imageUrls.filter((u) => u && u.trim()),
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.idProduct, data: { ...payload, isEnabled: form.isEnabled } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const allProducts = productsData?.content || [];
  const totalPages = productsData?.totalPages || 0;

  const filteredProducts = allProducts.filter((p) => {
    if (statusFilter === 'active') return p.isEnabled !== false;
    if (statusFilter === 'inactive') return p.isEnabled === false;
    return true;
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-1">
            {productsData?.totalElements ?? 0} sản phẩm trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
          >
            <FileSpreadsheet size={20} />
            Import Excel
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus size={20} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên sản phẩm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
              Tìm
            </button>
          </form>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Đang bán' },
              { value: 'inactive', label: 'Đã ẩn' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  statusFilter === opt.value
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục / Thương hiệu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá bán</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nổi bật</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.idProduct} className={`hover:bg-gray-50 ${product.isEnabled === false ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.tenProduct}
                          className="w-12 h-12 object-cover rounded-lg border"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[180px]">{product.tenProduct}</p>
                        <p className="text-xs text-gray-400">#{product.idProduct}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-800">{product.categoryName || '—'}</p>
                    <p className="text-xs text-gray-500">{product.brandName || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(product.giaBan)}</p>
                    {product.giaGoc && product.giaGoc > product.giaBan && (
                      <p className="text-xs text-gray-400 line-through">{formatPrice(product.giaGoc)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${
                      product.soLuongTonKho === 0 ? 'text-red-600' :
                      product.soLuongTonKho < 10 ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {product.soLuongTonKho}
                    </span>
                    {product.soLuongTonKho === 0 && (
                      <p className="text-xs text-red-500">Hết hàng</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleFeaturedMutation.mutate({ id: product.idProduct, isFeatured: !product.isFeatured })}
                      className={`p-1 rounded transition ${product.isFeatured ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-yellow-400'}`}
                      title={product.isFeatured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                    >
                      <Star size={18} fill={product.isFeatured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleEnabledMutation.mutate({ id: product.idProduct, isEnabled: !product.isEnabled })}
                      className={`flex items-center gap-1 mx-auto text-xs font-medium px-2 py-1 rounded-full transition ${
                        product.isEnabled !== false
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {product.isEnabled !== false ? (
                        <><ToggleRight size={14} /> Đang bán</>
                      ) : (
                        <><ToggleLeft size={14} /> Đã ẩn</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/products/${product.idProduct}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Xem trang sản phẩm"
                      >
                        <Eye size={16} />
                      </a>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn XÓA sản phẩm "${product.tenProduct}"?\n\nSản phẩm sẽ bị xóa khỏi giỏ hàng, wishlist, và review. Thông tin sản phẩm trong các đơn hàng cũ sẽ được giữ lại.`)) {
                            deleteMutation.mutate(product.idProduct);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Xóa sản phẩm vĩnh viễn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
          >
            Trước
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
            const page = start + i;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  page === currentPage
                    ? 'bg-emerald-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page + 1}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
          >
            Sau
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tên sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tenProduct}
                  onChange={(e) => handleFormChange('tenProduct', e.target.value)}
                  required
                  maxLength={200}
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.moTa}
                  onChange={(e) => handleFormChange('moTa', e.target.value)}
                  required
                  rows={4}
                  placeholder="Nhập mô tả sản phẩm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                />
              </div>

              {/* Giá bán + Giá gốc */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá bán (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.giaBan}
                    onChange={(e) => handleFormChange('giaBan', e.target.value)}
                    required
                    min="1"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá gốc (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={form.giaGoc}
                    onChange={(e) => handleFormChange('giaGoc', e.target.value)}
                    min="1"
                    placeholder="Không bắt buộc"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Số lượng + Danh mục + Thương hiệu */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tồn kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.soLuongTonKho}
                    onChange={(e) => handleFormChange('soLuongTonKho', e.target.value)}
                    required
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => handleFormChange('categoryId', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="">-- Chọn --</option>
                    {categories.map((c) => (
                      <option key={c.idCategory} value={c.idCategory}>{c.tenCategory}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.brandId}
                    onChange={(e) => handleFormChange('brandId', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="">-- Chọn --</option>
                    {brands.map((b) => (
                      <option key={b.idBrand} value={b.idBrand}>{b.tenBrand}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => handleFormChange('isFeatured', e.target.checked)}
                    className="w-4 h-4 text-yellow-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Sản phẩm nổi bật (hiển thị trang chủ)</span>
                </label>
                {editingProduct && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isEnabled}
                      onChange={(e) => handleFormChange('isEnabled', e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Kích hoạt (hiển thị trên website)</span>
                  </label>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImagePlus size={16} className="inline mr-1" />
                  Hình ảnh sản phẩm (tối đa 5, ảnh đầu là thumbnail)
                </label>
                <div className="space-y-2">
                  {form.imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20 shrink-0">
                        {index === 0 ? '🖼 Thumbnail' : `Ảnh ${index + 1}`}
                      </span>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder={`URL hình ảnh ${index + 1}...`}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      {url && (
                        <img
                          src={url}
                          alt=""
                          className="w-10 h-10 object-cover rounded border"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium"
                >
                  {isMutating ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => queryClient.invalidateQueries(['admin-products'])}
      />
    </div>
  );
}
