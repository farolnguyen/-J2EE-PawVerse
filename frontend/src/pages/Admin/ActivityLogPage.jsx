import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Filter, User, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { adminService } from '../../api/adminService';

const ACTION_COLORS = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
};

const ACTION_LABELS = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
};

export default function ActivityLogPage() {
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity-logs', page, filterAction, filterEntityType],
    queryFn: () => adminService.getActivityLogs({
      page,
      size: 20,
      ...(filterAction && { action: filterAction }),
      ...(filterEntityType && { entityType: filterEntityType }),
    }),
  });

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const truncateJson = (str, maxLen = 80) => {
    if (!str) return '—';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="text-primary-600" size={28} />
          Lịch sử hoạt động
        </h1>
        <p className="text-gray-500 mt-1">Theo dõi tất cả hoạt động trong hệ thống ({totalElements} bản ghi)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <Filter size={18} className="text-gray-400" />

        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Tất cả hành động</option>
          <option value="CREATE">Tạo mới</option>
          <option value="UPDATE">Cập nhật</option>
          <option value="DELETE">Xóa</option>
        </select>

        <select
          value={filterEntityType}
          onChange={(e) => { setFilterEntityType(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Tất cả đối tượng</option>
          <option value="Product">Sản phẩm</option>
          <option value="Order">Đơn hàng</option>
          <option value="User">Tài khoản</option>
          <option value="Category">Danh mục</option>
          <option value="Brand">Thương hiệu</option>
          <option value="Voucher">Voucher</option>
          <option value="Review">Đánh giá</option>
          <option value="ServiceBooking">Đặt dịch vụ</option>
        </select>

        {(filterAction || filterEntityType) && (
          <button
            onClick={() => { setFilterAction(''); setFilterEntityType(''); setPage(0); }}
            className="text-sm text-primary-600 hover:text-primary-700 underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Activity size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Thời gian</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Người thực hiện</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Hành động</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Đối tượng</th>
                  <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Giá trị cũ</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Giá trị mới</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.idLog} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock size={14} />
                        <span className="text-xs">{formatDate(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{log.userFullName || log.username}</p>
                          <p className="text-[10px] text-gray-400">@{log.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {log.entityType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-xs">
                      #{log.entityId}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-xs text-gray-500 break-all" title={log.oldValue}>
                        {truncateJson(log.oldValue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-xs text-gray-500 break-all" title={log.newValue}>
                        {truncateJson(log.newValue)}
                      </span>
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
            <p className="text-xs text-gray-500">
              Trang {page + 1} / {totalPages} ({totalElements} bản ghi)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
