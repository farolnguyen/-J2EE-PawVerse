import { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, ArrowRight, Package, RefreshCw } from 'lucide-react';
import { adminService } from '../../api/adminService';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  DONE: 'done',
};

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await adminService.downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mau-import-san-pham.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Đã tải file mẫu!');
    } catch {
      toast.error('Không thể tải file mẫu');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
      toast.error('Chỉ chấp nhận file Excel (.xlsx hoặc .xls)');
      return;
    }
    setFile(selected);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await adminService.previewImportExcel(file);
      setPreview(result);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi xử lý file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setStep(STEPS.IMPORTING);
    setLoading(true);
    try {
      const result = await adminService.confirmImportExcel(file);
      setImportResult(result);
      setStep(STEPS.DONE);
      if (result.message) {
        toast.success(result.message);
      }
      onImportSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi import sản phẩm');
      setStep(STEPS.PREVIEW);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="text-emerald-600" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import sản phẩm từ Excel</h2>
              <p className="text-sm text-gray-500">
                {step === STEPS.UPLOAD && 'Bước 1: Chọn file Excel'}
                {step === STEPS.PREVIEW && 'Bước 2: Xem trước dữ liệu'}
                {step === STEPS.IMPORTING && 'Đang import...'}
                {step === STEPS.DONE && 'Hoàn tất!'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* STEP: UPLOAD */}
          {step === STEPS.UPLOAD && (
            <div className="space-y-6">
              {/* Template download */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Download className="text-blue-600 mt-0.5 shrink-0" size={20} />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Tải file mẫu Excel</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Tải file mẫu để biết cấu trúc cần thiết. File mẫu bao gồm hướng dẫn chi tiết.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                    >
                      <Download size={16} />
                      Tải file mẫu (.xlsx)
                    </button>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={20} />
                  <div className="text-sm text-amber-800 space-y-1">
                    <p className="font-medium">Lưu ý khi import:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      <li>Sản phẩm trùng (cùng tên + danh mục + thương hiệu) sẽ được <strong>cộng dồn tồn kho</strong></li>
                      <li>Giá bán, giá gốc, hình ảnh, danh mục, thương hiệu sẽ được <strong>cập nhật</strong> nếu khác</li>
                      <li>Tên danh mục và thương hiệu phải <strong>khớp chính xác</strong> với hệ thống</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn file Excel</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 ${
                    file ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-300'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="text-emerald-600" size={32} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="ml-4 p-1 hover:bg-red-100 rounded-full text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto text-gray-400 mb-2" size={36} />
                      <p className="text-gray-600 font-medium">Nhấp để chọn hoặc kéo thả file Excel</p>
                      <p className="text-sm text-gray-400 mt-1">Chấp nhận .xlsx và .xls</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === STEPS.PREVIEW && preview && (
            <div className="space-y-5">
              {/* Global errors */}
              {preview.globalErrors?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-red-800">Lỗi cấu trúc file</p>
                      {preview.globalErrors.map((err, i) => (
                        <p key={i} className="text-sm text-red-700 mt-1">{err}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{preview.totalRows}</p>
                  <p className="text-xs text-gray-500">Tổng dòng</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{preview.validRows}</p>
                  <p className="text-xs text-green-600">Hợp lệ</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{preview.invalidRows}</p>
                  <p className="text-xs text-red-600">Lỗi</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{preview.existingProducts}</p>
                  <p className="text-xs text-blue-600">Đã tồn tại</p>
                </div>
              </div>

              {/* Rows table */}
              {preview.rows?.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Dòng</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tên sản phẩm</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Danh mục</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Thương hiệu</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giá bán</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Tồn kho</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.rows.map((row, idx) => (
                          <tr key={idx} className={`${!row.valid ? 'bg-red-50' : row.exists ? 'bg-blue-50/50' : ''}`}>
                            <td className="px-3 py-2 text-gray-500">{row.rowNumber}</td>
                            <td className="px-3 py-2">
                              {!row.valid ? (
                                <XCircle size={16} className="text-red-500" />
                              ) : (
                                <CheckCircle size={16} className="text-green-500" />
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate">{row.tenProduct}</td>
                            <td className="px-3 py-2 text-gray-600">{row.danhMuc}</td>
                            <td className="px-3 py-2 text-gray-600">{row.thuongHieu}</td>
                            <td className="px-3 py-2 text-right text-gray-900">{row.giaBan ? formatPrice(row.giaBan) : '—'}</td>
                            <td className="px-3 py-2 text-center">
                              {row.exists && row.existingStock != null ? (
                                <span className="text-blue-700">
                                  {row.existingStock} <ArrowRight size={12} className="inline" /> {row.existingStock + (row.soLuongTonKho || 0)}
                                </span>
                              ) : (
                                <span>{row.soLuongTonKho ?? '—'}</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {row.valid ? (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  row.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {row.action === 'UPDATE' ? 'Cập nhật' : 'Tạo mới'}
                                </span>
                              ) : (
                                <div className="text-xs text-red-600 max-w-[200px]">
                                  {row.errors?.map((e, i) => <p key={i}>{e}</p>)}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP: IMPORTING */}
          {step === STEPS.IMPORTING && (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw size={48} className="text-emerald-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900">Đang import sản phẩm...</p>
              <p className="text-sm text-gray-500 mt-1">Vui lòng không đóng cửa sổ này</p>
            </div>
          )}

          {/* STEP: DONE */}
          {step === STEPS.DONE && importResult && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import thành công!</h3>
              <p className="text-gray-600 mb-6">{importResult.message}</p>
              <div className="grid grid-cols-2 gap-4 w-64">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.data?.newProducts ?? 0}</p>
                  <p className="text-xs text-green-700">Sản phẩm mới</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{importResult.data?.existingProducts ?? 0}</p>
                  <p className="text-xs text-blue-700">Đã cập nhật</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between shrink-0">
          <div>
            {step === STEPS.PREVIEW && (
              <button
                onClick={() => { reset(); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                ← Chọn file khác
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {step === STEPS.UPLOAD && (
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition"
              >
                {loading ? (
                  <><RefreshCw size={16} className="animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Upload size={16} /> Xem trước</>
                )}
              </button>
            )}
            {step === STEPS.PREVIEW && preview && preview.validRows > 0 && (
              <button
                onClick={handleConfirmImport}
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition"
              >
                <CheckCircle size={16} />
                Xác nhận import ({preview.validRows} sản phẩm)
              </button>
            )}
            {step === STEPS.DONE && (
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition"
              >
                Đóng
              </button>
            )}
            {step !== STEPS.DONE && step !== STEPS.IMPORTING && (
              <button
                onClick={handleClose}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition"
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
