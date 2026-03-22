import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { cartService } from '../../api/cartService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useCartStore from '../../store/useCartStore';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCartCount } = useCartStore();

  // Fetch cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
  });

  // Update cart item mutation
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => cartService.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Cập nhật giỏ hàng thành công');
    },
    onError: () => {
      toast.error('Không thể cập nhật giỏ hàng');
    },
  });

  // Remove cart item mutation
  const removeMutation = useMutation({
    mutationFn: (itemId) => cartService.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      setCartCount(cart?.items?.length - 1 || 0);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    },
    onError: () => {
      toast.error('Không thể xóa sản phẩm');
    },
  });

  // Clear cart mutation
  const clearMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      setCartCount(0);
      toast.success('Đã xóa tất cả sản phẩm');
    },
  });

  const handleUpdateQuantity = (itemId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty > 0) {
      updateMutation.mutate({ itemId, quantity: newQty });
    }
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      removeMutation.mutate(itemId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      clearMutation.mutate();
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const items = cart?.items || [];
  const subtotal = cart?.totalAmount || items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag size={80} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span>Giỏ hàng</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Giỏ hàng ({items.length} sản phẩm)
          </h1>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft size={20} />
              Tiếp tục mua sắm
            </Link>

            {items.map((item) => (
              <div key={item.cartItemId} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link to={`/products/${item.productId}`}>
                    <img
                      src={item.productImage || '/placeholder-product.jpg'}
                      alt={item.productName}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="font-semibold text-lg hover:text-primary-600 mb-1 block"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-primary-600 font-bold text-xl">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleRemoveItem(item.cartItemId)}
                      className="text-gray-400 hover:text-red-600"
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity, -1)}
                        disabled={item.quantity <= 1 || updateMutation.isPending}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity, 1)}
                        disabled={item.quantity >= item.availableStock || updateMutation.isPending}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(item.subtotal || item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({items.length} sản phẩm)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                    {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                  </span>
                </div>
                {subtotal < 500000 && shippingFee > 0 && (
                  <p className="text-sm text-orange-600">
                    Mua thêm {formatPrice(500000 - subtotal)} để được miễn phí vận chuyển
                  </p>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold mb-3"
              >
                Tiến hành thanh toán
              </button>

              <Link
                to="/products"
                className="block text-center text-primary-600 hover:text-primary-700 text-sm"
              >
                Tiếp tục mua sắm
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  ✓ Thanh toán an toàn & bảo mật
                </p>
                <p className="flex items-center gap-2">
                  ✓ Miễn phí đổi trả trong 7 ngày
                </p>
                <p className="flex items-center gap-2">
                  ✓ Hỗ trợ khách hàng 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
