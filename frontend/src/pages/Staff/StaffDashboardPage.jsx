import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Users, Package, DollarSign, TrendingUp, AlertTriangle,
  Download, Clock, Truck, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminService } from '../../api/adminService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportReportModal from '../../components/admin/ExportReportModal';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const ORDER_STATUS_MAP = {
  PENDING: { label: 'Chờ xử lý', color: '#f59e0b', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: '#3b82f6', icon: Package },
  SHIPPED: { label: 'Đang giao', color: '#8b5cf6', icon: Truck },
  DELIVERED: { label: 'Đã giao', color: '#10b981', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444', icon: XCircle },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
        <Icon className={color} size={22} />
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((item, i) => (
        <p key={i} style={{ color: item.color }}>
          {item.name}: <span className="font-medium">{typeof item.value === 'number' && item.value > 1000 ? formatPrice(item.value) : item.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function StaffDashboardPage() {
  const [exportOpen, setExportOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['staff-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Prepare chart data
  const revenueChartData = (stats?.revenueLast7Days || []).map((d) => ({
    name: d.period?.slice(5) || '',
    'Doanh thu': Number(d.revenue) || 0,
    'Đơn hàng': d.orderCount || 0,
  }));

  const orderStatusData = [
    { name: 'Chờ xử lý', value: stats?.pendingOrders || 0, color: '#f59e0b' },
    { name: 'Đang xử lý', value: stats?.processingOrders || 0, color: '#3b82f6' },
    { name: 'Đang giao', value: stats?.shippingOrders || 0, color: '#8b5cf6' },
    { name: 'Đã giao', value: stats?.deliveredOrders || 0, color: '#10b981' },
    { name: 'Đã hủy', value: stats?.cancelledOrders || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const categoryChartData = (stats?.categoryStats || [])
    .sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0))
    .slice(0, 6)
    .map((c) => ({
      name: c.categoryName?.length > 12 ? c.categoryName.slice(0, 12) + '…' : c.categoryName,
      'Doanh thu': Number(c.revenue) || 0,
      'Sản phẩm': c.productCount || 0,
    }));

  const topProducts = stats?.topProducts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Tổng quan hoạt động kinh doanh PawVerse</p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
        >
          <Download size={18} />
          Xuất báo cáo Excel
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatPrice(stats?.totalRevenue || 0)}
          subtitle="Từ đơn đã giao"
          icon={DollarSign}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Đơn hàng"
          value={stats?.totalOrders || 0}
          subtitle={`${stats?.pendingOrders || 0} chờ xử lý`}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Khách hàng"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Sản phẩm"
          value={stats?.totalProducts || 0}
          subtitle={stats?.lowStockProducts > 0 ? `⚠ ${stats.lowStockProducts} sắp hết hàng` : 'Kho hàng ổn định'}
          icon={Package}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Row 1: Revenue Chart + Order Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Doanh thu 7 ngày qua</h2>
              <p className="text-xs text-gray-400">Doanh thu từ đơn hàng đã giao</p>
            </div>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Doanh thu" stroke="#10b981" strokeWidth={2.5} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Trạng thái đơn hàng</h2>
          <p className="text-xs text-gray-400 mb-3">Phân bố {stats?.totalOrders || 0} đơn</p>
          {orderStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {orderStatusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có đơn hàng</div>
          )}
        </div>
      </div>

      {/* Row 2: Category Revenue Bar + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Doanh thu theo danh mục</h2>
          <p className="text-xs text-gray-400 mb-4">Ước tính từ giá bán × số lượng đã bán</p>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Doanh thu" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Top 5 Products */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Top sản phẩm bán chạy</h2>
          <p className="text-xs text-gray-400 mb-4">Theo số lượng đã bán từ đơn hoàn tất</p>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((product, idx) => {
              const maxSold = topProducts[0]?.totalSold || 1;
              const pct = Math.round(((product.totalSold || 0) / maxSold) * 100);
              return (
                <div key={product.productId} className="group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-300'
                    }`}>
                      {idx + 1}
                    </div>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{product.totalSold} đã bán</span>
                        <span className="text-emerald-600 font-medium">{formatPrice(product.revenue)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5 ml-11">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu bán hàng</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Orders + Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold text-gray-900">Đơn hàng gần đây</h2>
          </div>
          <div className="divide-y">
            {(stats?.recentOrders || []).map((order) => {
              const statusInfo = ORDER_STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#6b7280', icon: Clock };
              const StatusIcon = statusInfo.icon;
              return (
                <div key={order.orderId} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: statusInfo.color + '15' }}>
                      <StatusIcon size={16} style={{ color: statusInfo.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        #{order.orderNumber || order.orderId}
                      </p>
                      <p className="text-xs text-gray-500">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(order.finalAmount)}</p>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: statusInfo.color + '15', color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">Chưa có đơn hàng</div>
            )}
          </div>
        </div>

        {/* Quick Stats / Alerts */}
        <div className="space-y-4">
          {/* Order Summary Mini Cards */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Tình trạng đơn hàng</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Chờ xử lý', value: stats?.pendingOrders || 0, color: 'text-amber-600 bg-amber-50' },
                { label: 'Đang xử lý', value: stats?.processingOrders || 0, color: 'text-blue-600 bg-blue-50' },
                { label: 'Đang giao', value: stats?.shippingOrders || 0, color: 'text-purple-600 bg-purple-50' },
                { label: 'Đã giao', value: stats?.deliveredOrders || 0, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Đã hủy', value: stats?.cancelledOrders || 0, color: 'text-red-600 bg-red-50' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock warning */}
          {(stats?.lowStockProducts || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Cảnh báo tồn kho</p>
                  <p className="text-xs text-amber-700 mt-1">
                    <strong>{stats.lowStockProducts}</strong> sản phẩm có tồn kho dưới 10 đơn vị. 
                    Cần bổ sung hàng sớm.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportReportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
