import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { wishlistService } from '../../api/wishlistService';
import { cartService } from '../../api/cartService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useCartStore from '../../store/useCartStore';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const { incrementCart } = useCartStore();

  // Fetch wishlist
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistService.getWishlist,
  });

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: (itemId) => wishlistService.removeFromWishlist(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success('Đã xóa khỏi danh sách yêu thích');
    },
    onError: () => {
      toast.error('Không thể xóa sản phẩm');
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (productId) => cartService.addToCart(productId, 1),
    onSuccess: async () => {
      // Fetch cart count from backend to get accurate count
      const cart = await cartService.getCart();
      const { setCartCount } = useCartStore.getState();
      setCartCount(cart?.items?.length || 0);
      queryClient.invalidateQueries(['cart']);
      toast.success('Đã thêm vào giỏ hàng!');
    },
    onError: () => {
      toast.error('Không thể thêm vào giỏ hàng');
    },
  });

  const handleRemove = (itemId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?')) {
      removeMutation.mutate(itemId);
    }
  };

  const handleAddToCart = async (productId, wishlistItemId) => {
    await addToCartMutation.mutateAsync(productId);
    removeMutation.mutate(wishlistItemId);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const items = Array.isArray(wishlist) ? wishlist : (wishlist?.items || []);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <Heart size={80} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Danh sách yêu thích trống
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn chưa có sản phẩm nào trong danh sách yêu thích
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Khám phá sản phẩm
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
          <span>Danh sách yêu thích</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Danh sách yêu thích ({items.length} sản phẩm)
          </h1>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.wishlistId}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group"
            >
              <Link to={`/products/${item.productId}`}>
                <div className="relative overflow-hidden">
                  <img
                    src={item.productImage || '/placeholder-product.jpg'}
                    alt={item.productName}
                    className="w-full h-64 object-cover group-hover:scale-110 transition duration-300"
                  />
                  {item.inStock === false && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold">Hết hàng</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(item.wishlistId);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                    disabled={removeMutation.isPending}
                  >
                    <Heart size={20} className="fill-red-500 text-red-500" />
                  </button>
                </div>
              </Link>

              <div className="p-4">
                <Link to={`/products/${item.productId}`}>
                  <h3 className="font-semibold text-lg hover:text-primary-600 mb-2 line-clamp-2">
                    {item.productName}
                  </h3>
                </Link>
                <div className="mb-3">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatPrice(item.salePrice || item.price)}
                  </p>
                  {item.salePrice && item.salePrice < item.price && (
                    <p className="text-sm text-gray-400 line-through">{formatPrice(item.price)}</p>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(item.productId, item.wishlistId)}
                  disabled={item.inStock === false || addToCartMutation.isPending}
                  className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
