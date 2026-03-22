import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ticket, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, X, Search
} from 'lucide-react';
import { adminService } from '../../api/adminService';
import toast from 'react-hot-toast';

const VOUCHER_TYPES = [
  { value: 'PERCENTAGE', label: 'Giảm theo %' },
  { value: 'FIXED_AMOUNT', label: 'Giảm cố định' },
  { value: 'FREE_SHIPPING', label: 'Miễn phí vận chuyển' },
];

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  UPCOMING: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-red-100 text-red-700',
  EXHAUSTED: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Vô hiệu',
  UPCOMING: 'Sắp áp dụng',
  EXPIRED: 'Hết hạn',
  EXHAUSTED: 'Hết lượt',
};

const emptyForm = {
  maVoucher: '',
  tenVoucher: '',
  moTa: '',
  voucherType: 'PERCENTAGE',
  discountValue: '',
  discountPercentage: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  maxUsage: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  isFirstTimeOnly: false,
};

export default function VoucherManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff-vouchers', page],
    queryFn: () => adminService.getAllVouchers({ page, size: 15 }),
  });

  const vouchers = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createVoucher(data),
    onSuccess: () => {
      toast.success('Tạo voucher thành công');
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi khi tạo voucher'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateVoucher(id, data),
    onSuccess: () => {
      toast.success('Cập nhật voucher thành công');
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi khi cập nhật'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminService.toggleVoucherActive(id),
    onSuccess: () => {
      toast.success('Đã thay đổi trạng thái');
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteVoucher(id),
    onSuccess: () => {
      toast.success('Đã xóa voucher');
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể xóa voucher'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditingId(v.idVoucher);
    setForm({
      maVoucher: v.maVoucher,
      tenVoucher: v.tenVoucher,
      moTa: v.moTa || '',
      voucherType: v.voucherType,
      discountValue: v.discountValue || '',
      discountPercentage: v.discountPercentage || '',
      maxDiscountAmount: v.maxDiscountAmount || '',
      minOrderAmount: v.minOrderAmount || '',
      maxUsage: v.maxUsage || '',
      ngayBatDau: v.ngayBatDau || '',
      ngayKetThuc: v.ngayKetThuc || '',
      isFirstTimeOnly: v.isFirstTimeOnly || false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      discountValue: form.discountValue ? Number(form.discountValue) : null,
      discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : null,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    return Number(val).toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN');
  };

  const formatDiscount = (v) => {
    if (v.voucherType === 'PERCENTAGE') return `${v.discountPercentage}%`;
    if (v.voucherType === 'FIXED_AMOUNT') return formatCurrency(v.discountValue);
    return 'Miễn ship';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="text-emerald-600" size={28} />
            Quản lý Voucher
          </h1>
          <p className="text-gray-500 mt-1">{totalElements} voucher</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          <Plus size={18} /> Tạo voucher
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Ticket size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Chưa có voucher nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Mã</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Tên voucher</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Loại</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Giảm giá</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Đơn tối thiểu</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Sử dụng</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Thời hạn</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vouchers.map((v) => (
                  <tr key={v.idVoucher} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs">
                        {v.maVoucher}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">
                      {v.tenVoucher}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {VOUCHER_TYPES.find(t => t.value === v.voucherType)?.label || v.voucherType}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatDiscount(v)}
                      {v.voucherType === 'PERCENTAGE' && v.maxDiscountAmount && (
                        <div className="text-[10px] text-gray-400 font-normal">
                          Tối đa {formatCurrency(v.maxDiscountAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {v.minOrderAmount ? formatCurrency(v.minOrderAmount) : 'Không'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-xs">{v.usedCount}/{v.maxUsage || '∞'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(v.ngayBatDau)} — {formatDate(v.ngayKetThuc)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[v.status] || v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleMutation.mutate(v.idVoucher)}
                          title={v.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                        >
                          {v.isActive
                            ? <ToggleRight size={18} className="text-green-600" />
                            : <ToggleLeft size={18} className="text-gray-400" />}
                        </button>
                        <button
                          onClick={() => openEdit(v)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition text-blue-600"
                          title="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(v.idVoucher)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition text-red-500"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-xs text-gray-500">Trang {page + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">
                {editingId ? 'Cập nhật Voucher' : 'Tạo Voucher mới'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher *</label>
                  <input
                    type="text"
                    value={form.maVoucher}
                    onChange={(e) => setForm(f => ({ ...f, maVoucher: e.target.value.toUpperCase() }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                    placeholder="VD: SALE50"
                    required
                    disabled={!!editingId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại voucher *</label>
                  <select
                    value={form.voucherType}
                    onChange={(e) => setForm(f => ({ ...f, voucherType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {VOUCHER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên voucher *</label>
                <input
                  type="text"
                  value={form.tenVoucher}
                  onChange={(e) => setForm(f => ({ ...f, tenVoucher: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="VD: Giảm 50% đơn đầu tiên"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={form.moTa}
                  onChange={(e) => setForm(f => ({ ...f, moTa: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {form.voucherType === 'PERCENTAGE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phần trăm giảm (%) *</label>
                      <input type="number" min="1" max="100"
                        value={form.discountPercentage}
                        onChange={(e) => setForm(f => ({ ...f, discountPercentage: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (đ)</label>
                      <input type="number" min="0"
                        value={form.maxDiscountAmount}
                        onChange={(e) => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
                {form.voucherType === 'FIXED_AMOUNT' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền giảm (đ) *</label>
                    <input type="number" min="1"
                      value={form.discountValue}
                      onChange={(e) => setForm(f => ({ ...f, discountValue: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (đ)</label>
                  <input type="number" min="0"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lượt sử dụng tối đa *</label>
                  <input type="number" min="1"
                    value={form.maxUsage}
                    onChange={(e) => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                  <input type="date"
                    value={form.ngayBatDau}
                    onChange={(e) => setForm(f => ({ ...f, ngayBatDau: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                  <input type="date"
                    value={form.ngayKetThuc}
                    onChange={(e) => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={form.isFirstTimeOnly}
                  onChange={(e) => setForm(f => ({ ...f, isFirstTimeOnly: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Chỉ áp dụng cho đơn hàng đầu tiên</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium">
                  Hủy
                </button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : editingId ? 'Cập nhật' : 'Tạo voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn xóa voucher này? Hành động không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Hủy
              </button>
              <button onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
