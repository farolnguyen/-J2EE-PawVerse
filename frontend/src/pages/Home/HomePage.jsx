import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Star, ArrowRight, Truck, Shield, RotateCcw, Headphones, PawPrint } from 'lucide-react';
import { productService } from '../../api/productService';
import { formatPrice } from '../../utils/formatters';
import { cartService } from '../../api/cartService';
import useCartStore from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function HomePage() {
  const queryClient = useQueryClient();
  const { incrementCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [addingIds, setAddingIds] = useState(new Set());

  const { data: featuredProducts } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productService.getFeaturedProducts(8),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const { data: latestProducts } = useQuery({
    queryKey: ['latestProducts'],
    queryFn: () => productService.getProducts({ page: 0, size: 8, sort: 'newest' }),
  });

  const handleAddToCart = useCallback(async (productId) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    if (addingIds.has(productId)) return;
    setAddingIds(prev => new Set(prev).add(productId));
    try {
      await cartService.addToCart(productId, 1);
      const cart = await cartService.getCart();
      const { setCartCount } = useCartStore.getState();
      setCartCount(cart?.items?.length || 0);
      queryClient.invalidateQueries(['cart']);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
    }
  }, [addingIds, isAuthenticated, queryClient]);

  const products = featuredProducts || [];
  const latest = latestProducts?.content || [];
  const cats = categories || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Chào mừng đến với PawVerse
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Thế giới sản phẩm và dịch vụ tốt nhất cho thú cưng của bạn
          </p>
          <Link
            to="/products"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Khám phá ngay
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 justify-center">
              <Truck className="text-primary-600" size={28} />
              <div>
                <p className="font-semibold text-sm">Miễn phí vận chuyển</p>
                <p className="text-xs text-gray-500">Đơn hàng từ 500K</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Shield className="text-primary-600" size={28} />
              <div>
                <p className="font-semibold text-sm">Hàng chính hãng</p>
                <p className="text-xs text-gray-500">Đảm bảo 100%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <RotateCcw className="text-primary-600" size={28} />
              <div>
                <p className="font-semibold text-sm">Đổi trả dễ dàng</p>
                <p className="text-xs text-gray-500">Trong 7 ngày</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Headphones className="text-primary-600" size={28} />
              <div>
                <p className="font-semibold text-sm">Hỗ trợ 24/7</p>
                <p className="text-xs text-gray-500">Luôn sẵn sàng</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Pet Profile CTA */}
      {isAuthenticated && (
        <section className="container mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <PawPrint size={28} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Thú cưng của bạn</h3>
                <p className="text-sm text-gray-600">Tạo profile thú cưng để đặt lịch dịch vụ nhanh hơn</p>
              </div>
            </div>
            <Link
              to="/my-pets"
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium transition flex-shrink-0"
            >
              Quản lý thú cưng
            </Link>
          </div>
        </section>
      )}
      {/* Categories */}
      {cats.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Danh mục sản phẩm</h2>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
              Xem tất cả <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cats.map((cat) => (
              <Link
                key={cat.idCategory}
                to={`/products?category=${cat.idCategory}`}
                className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition group"
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition">
                  <span className="text-2xl">
                    {cat.tenCategory === 'Pate' ? '🥫' :
                     cat.tenCategory === 'Thức ăn hạt' ? '🌾' :
                     cat.tenCategory === 'Bánh thưởng' ? '🍪' :
                     cat.tenCategory === 'Thực phẩm chức năng' ? '💊' :
                     cat.tenCategory === 'Đồ chơi' ? '🎾' :
                     cat.tenCategory === 'Dụng cụ' ? '🔧' :
                     cat.tenCategory === 'Phụ kiện' ? '🎀' :
                     cat.tenCategory === 'Vệ sinh' ? '🧹' : '📦'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition">
                  {cat.tenCategory}
                </h3>
                {cat.productCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">{cat.productCount} sản phẩm</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
              <Link to="/products" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                Xem tất cả <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.idProduct} product={product} onAddToCart={handleAddToCart} isAdding={addingIds.has(product.idProduct)} />
              ))}
            </div>
          </div>
        </section>
      )}

      

      {/* Latest Products */}
      {latest.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sản phẩm mới nhất</h2>
            <Link to="/products?sort=newest" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
              Xem tất cả <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {latest.slice(0, 8).map((product) => (
              <ProductCard key={product.idProduct} product={product} onAddToCart={handleAddToCart} isAdding={addingIds.has(product.idProduct)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart, isAdding = false }) {
  const rating = product.avgRating || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group">
      <Link to={`/products/${product.idProduct}`}>
        <div className="relative overflow-hidden">
          <img
            src={product.thumbnailUrl || '/placeholder-product.jpg'}
            alt={product.tenProduct}
            className="w-full h-52 object-cover group-hover:scale-110 transition duration-300"
          />
          {product.soLuongTonKho === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Hết hàng</span>
            </div>
          )}
          {product.giaGoc && product.giaGoc > product.giaBan && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{Math.round((1 - product.giaBan / product.giaGoc) * 100)}%
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.idProduct}`}>
          <h3 className="font-semibold hover:text-primary-600 mb-1 line-clamp-2 text-sm">
            {product.tenProduct}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          ))}
        </div>
        <div className="mb-2">
          <p className="text-lg font-bold text-primary-600">{formatPrice(product.giaBan)}</p>
          {product.giaGoc && product.giaGoc > product.giaBan && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(product.giaGoc)}</p>
          )}
        </div>
        <button
          onClick={() => onAddToCart(product.idProduct)}
          disabled={product.soLuongTonKho === 0 || isAdding}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          <ShoppingCart size={16} />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}
