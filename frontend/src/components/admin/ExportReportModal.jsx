import { useState, useEffect } from 'react';
import { X, Download, FileSpreadsheet, RefreshCw, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { adminService } from '../../api/adminService';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'PRODUCTS', label: 'Thống kê sản phẩm', icon: '📦', desc: 'Danh sách sản phẩm, doanh thu, tồn kho' },
  { value: 'ORDERS', label: 'Doanh số đơn hàng', icon: '🛒', desc: 'Chi tiết đơn hàng, thanh toán, trạng thái' },
  { value: 'CUSTOMERS', label: 'Khách hàng chi tiêu', icon: '👥', desc: 'Thống kê chi tiêu, số đơn hàng theo KH' },
  { value: 'REVENUE', label: 'Doanh thu theo tháng', icon: '💰', desc: 'Doanh thu, số đơn, TB/đơn theo kỳ' },
];

const LIMITS = [
  { value: 10, label: 'Top 10' },
  { value: 20, label: 'Top 20' },
  { value: 50, label: 'Top 50' },
  { value: 100, label: 'Top 100' },
  { value: 0, label: 'Tất cả' },
];

const SORT_OPTIONS = {
  PRODUCTS: [
    { value: 'idProduct', label: 'ID' },
    { value: 'tenProduct', label: 'Tên sản phẩm' },
    { value: 'giaBan', label: 'Giá bán' },
    { value: 'soLuongTonKho', label: 'Tồn kho' },
    { value: 'soLuongDaBan', label: 'Số lượng bán' },
    { value: 'avgRating', label: 'Đánh giá' },
    { value: 'ngayTao', label: 'Ngày tạo' },
  ],
  ORDERS: [
    { value: 'idOrder', label: 'ID' },
    { value: 'tongTienCuoiCung', label: 'Tổng thanh toán' },
    { value: 'ngayTao', label: 'Ngày đặt' },
    { value: 'orderStatus', label: 'Trạng thái' },
  ],
  CUSTOMERS: [
    { value: 'idUser', label: 'ID' },
    { value: 'fullName', label: 'Họ tên' },
    { value: 'totalOrders', label: 'Số đơn hàng' },
    { value: 'totalSpent', label: 'Tổng chi tiêu' },
    { value: 'ngayTao', label: 'Ngày đăng ký' },
  ],
  REVENUE: [
    { value: 'period', label: 'Kỳ' },
    { value: 'revenue', label: 'Doanh thu' },
    { value: 'orderCount', label: 'Số đơn hàng' },
  ],
};

const ALL_COLUMNS = {
  PRODUCTS: {
    idProduct: 'ID',
    tenProduct: 'Tên sản phẩm',
    categoryName: 'Danh mục',
    brandName: 'Thương hiệu',
    giaBan: 'Giá bán',
    giaGoc: 'Giá gốc',
    soLuongTonKho: 'Tồn kho',
    soLuongDaBan: 'Đã bán',
    revenue: 'Doanh thu ước tính',
    avgRating: 'Đánh giá TB',
    totalReviews: 'Số đánh giá',
    isEnabled: 'Trạng thái',
    isFeatured: 'Nổi bật',
    ngayTao: 'Ngày tạo',
  },
  ORDERS: {
    idOrder: 'ID',
    maOrder: 'Mã đơn hàng',
    customerName: 'Khách hàng',
    email: 'Email',
    soDienThoai: 'Số điện thoại',
    tongTienSanPham: 'Tổng tiền SP',
    phiVanChuyen: 'Phí vận chuyển',
    tienGiamGia: 'Giảm giá',
    tongTienCuoiCung: 'Tổng thanh toán',
    orderStatus: 'Trạng thái',
    paymentMethod: 'Phương thức TT',
    paymentStatus: 'TT thanh toán',
    diaChiGiaoHang: 'Địa chỉ',
    ngayTao: 'Ngày đặt',
  },
  CUSTOMERS: {
    idUser: 'ID',
    fullName: 'Họ tên',
    email: 'Email',
    soDienThoai: 'Số điện thoại',
    totalOrders: 'Số đơn hàng',
    totalSpent: 'Tổng chi tiêu',
    roleName: 'Vai trò',
    locked: 'Trạng thái',
    ngayTao: 'Ngày đăng ký',
  },
  REVENUE: {
    period: 'Kỳ',
    revenue: 'Doanh thu',
    orderCount: 'Số đơn hàng',
    avgOrderValue: 'TB/đơn',
  },
};

export default function ExportReportModal({ isOpen, onClose }) {
  const [reportType, setReportType] = useState('PRODUCTS');
  const [limit, setLimit] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize columns and sort when report type changes
  useEffect(() => {
    const cols = ALL_COLUMNS[reportType];
    if (cols) {
      setSelectedColumns(Object.keys(cols));
    }
    const sortOpts = SORT_OPTIONS[reportType];
    if (sortOpts?.length > 0) {
      setSortBy(sortOpts[0].value);
    }
  }, [reportType]);

  if (!isOpen) return null;

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(Object.keys(ALL_COLUMNS[reportType]));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 cột dữ liệu');
      return;
    }
    setLoading(true);
    try {
      const blob = await adminService.exportReport({
        reportType,
        limit: limit || null,
        sortBy,
        sortDirection,
        columns: selectedColumns,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-${reportType.toLowerCase()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Xuất báo cáo thành công!');
    } catch {
      toast.error('Không thể xuất báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const currentColumns = ALL_COLUMNS[reportType] || {};
  const currentSortOptions = SORT_OPTIONS[reportType] || [];
  const currentReportInfo = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="text-blue-600" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Xuất báo cáo Excel</h2>
              <p className="text-sm text-gray-500">Tùy chỉnh nội dung và format báo cáo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Report Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">1. Loại báo cáo</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setReportType(rt.value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition ${
                    reportType === rt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl mt-0.5">{rt.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${reportType === rt.value ? 'text-blue-700' : 'text-gray-900'}`}>
                      {rt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{rt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Limit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">2. Giới hạn số lượng</label>
            <div className="flex flex-wrap gap-2">
              {LIMITS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLimit(l.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    limit === l.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sort By + 4. Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">3. Sắp xếp theo</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
                >
                  {currentSortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">4. Thứ tự</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortDirection('ASC')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                    sortDirection === 'ASC'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  ↑ Tăng dần
                </button>
                <button
                  onClick={() => setSortDirection('DESC')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                    sortDirection === 'DESC'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  ↓ Giảm dần
                </button>
              </div>
            </div>
          </div>

          {/* 5. Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">
                5. Các cột dữ liệu ({selectedColumns.length}/{Object.keys(currentColumns).length})
              </label>
              <div className="flex gap-2">
                <button onClick={selectAllColumns} className="text-xs text-blue-600 hover:underline">Chọn tất cả</button>
                <span className="text-gray-300">|</span>
                <button onClick={deselectAllColumns} className="text-xs text-gray-500 hover:underline">Bỏ chọn</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto border rounded-xl p-3 bg-gray-50">
              {Object.entries(currentColumns).map(([key, label]) => {
                const checked = selectedColumns.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleColumn(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${
                      checked ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare size={16} className="text-blue-600 shrink-0" />
                    ) : (
                      <Square size={16} className="text-gray-400 shrink-0" />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview summary */}
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Xem trước:</span>{' '}
              Xuất <strong>{currentReportInfo?.label}</strong>,{' '}
              {limit > 0 ? `top ${limit}` : 'tất cả'} bản ghi,{' '}
              sắp xếp theo <strong>{currentSortOptions.find(s => s.value === sortBy)?.label || sortBy}</strong>{' '}
              ({sortDirection === 'ASC' ? 'tăng dần' : 'giảm dần'}),{' '}
              <strong>{selectedColumns.length}</strong> cột.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={loading || selectedColumns.length === 0}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition"
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin" /> Đang xuất...</>
            ) : (
              <><Download size={16} /> Xuất báo cáo Excel</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
