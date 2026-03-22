import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Grid, List, Filter, ChevronDown, Star, ShoppingCart } from 'lucide-react';
import { productService } from '../../api/productService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { cartService } from '../../api/cartService';
import useCartStore from '../../store/useCartStore';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(true);
  const [localMinPrice, setLocalMinPrice] = useState('');
  const [localMaxPrice, setLocalMaxPrice] = useState('');
  
  const { incrementCart } = useCartStore();
  const [addingIds, setAddingIds] = useState(new Set());

  // Get filters from URL params
  const page = parseInt(searchParams.get('page') || '1');
  const categoryId = searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';
  const keyword = searchParams.get('keyword') || '';
  const sortBy = searchParams.get('sortBy') || 'ngayTao';
  const sortDirection = searchParams.get('sortDirection') || 'DESC';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Sync local price state with URL params on mount/change
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, categoryId, brandId, keyword, sortBy, sortDirection, minPrice, maxPrice],
    queryFn: () => productService.getProducts({
      page: page - 1,
      size: 12,
      categoryId,
      brandId,
      keyword,
      sortBy,
      sortDirection,
      minPrice,
      maxPrice,
    }),
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: productService.getBrands,
  });

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Only reset to page 1 when filtering (not when changing page itself)
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleAddToCart = useCallback(async (productId) => {
    if (addingIds.has(productId)) return;
    setAddingIds(prev => new Set(prev).add(productId));
    try {
      await cartService.addToCart(productId, 1);
      // Fetch cart count from backend to get accurate count
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
  }, [addingIds]);

  const products = productsData?.content || [];
  const totalPages = productsData?.totalPages || 0;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span>Sản phẩm</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Sản phẩm {keyword && `- "${keyword}"`}
        </h1>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List size={20} />
            </button>
          </div>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [newSortBy, newSortDirection] = e.target.value.split('-');
              const newParams = new URLSearchParams(searchParams);
              newParams.set('sortBy', newSortBy);
              newParams.set('sortDirection', newSortDirection);
              setSearchParams(newParams);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ngayTao-DESC">Mới nhất</option>
            <option value="giaBan-ASC">Giá: Thấp đến cao</option>
            <option value="giaBan-DESC">Giá: Cao đến thấp</option>
            <option value="tenProduct-ASC">Tên: A-Z</option>
            <option value="tenProduct-DESC">Tên: Z-A</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className={`${showFilters ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Bộ lọc</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-medium mb-3">Danh mục</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="categoryId"
                    checked={!categoryId}
                    onChange={() => handleFilterChange('categoryId', '')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Tất cả</span>
                </label>
                {categories?.map((cat) => (
                  <label key={cat.idCategory} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="categoryId"
                      checked={categoryId === cat.idCategory.toString()}
                      onChange={() => handleFilterChange('categoryId', cat.idCategory.toString())}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{cat.tenCategory}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="font-medium mb-3">Thương hiệu</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="brandId"
                    checked={!brandId}
                    onChange={() => handleFilterChange('brandId', '')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Tất cả</span>
                </label>
                {brands?.map((br) => (
                  <label key={br.idBrand} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brandId"
                      checked={brandId === br.idBrand.toString()}
                      onChange={() => handleFilterChange('brandId', br.idBrand.toString())}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{br.tenBrand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-medium mb-3">Khoảng giá (VNĐ)</h4>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Ví dụ: 100000"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Ví dụ: 500000"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    if (localMinPrice) {
                      newParams.set('minPrice', localMinPrice);
                    } else {
                      newParams.delete('minPrice');
                    }
                    if (localMaxPrice) {
                      newParams.set('maxPrice', localMaxPrice);
                    } else {
                      newParams.delete('maxPrice');
                    }
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid/List */}
        <main className="flex-1">
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              className="mb-4 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
              Hiện bộ lọc
            </button>
          )}

          <div className="mb-4 text-sm text-gray-600">
            Hiển thị {products.length} sản phẩm
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
              }>
                {products.map((product) => (
                  <ProductCard
                    key={product.idProduct}
                    product={product}
                    viewMode={viewMode}
                    onAddToCart={handleAddToCart}
                    isAdding={addingIds.has(product.idProduct)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum.toString())}
                      className={`px-4 py-2 rounded-lg ${
                        pageNum === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ProductCard({ product, viewMode, onAddToCart, isAdding = false }) {
  const rating = product.avgRating || 0;
  const reviewCount = product.totalReviews || 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4 hover:shadow-md transition">
        <img
          src={product.thumbnailUrl || '/placeholder-product.jpg'}
          alt={product.tenProduct}
          className="w-32 h-32 object-cover rounded-lg"
        />
        <div className="flex-1">
          <Link to={`/products/${product.idProduct}`}>
            <h3 className="font-semibold text-lg hover:text-primary-600 mb-2">
              {product.tenProduct}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.moTa}</p>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(product.giaBan)}
              </p>
              {product.giaGoc && product.giaGoc > product.giaBan && (
                <p className="text-sm text-gray-400 line-through">{formatPrice(product.giaGoc)}</p>
              )}
              {product.soLuongTonKho < 10 && product.soLuongTonKho > 0 && (
                <p className="text-sm text-orange-600">Chỉ còn {product.soLuongTonKho} sản phẩm</p>
              )}
            </div>
            <button
              onClick={() => onAddToCart(product.idProduct)}
              disabled={product.soLuongTonKho === 0 || isAdding}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ShoppingCart size={20} />
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group">
      <Link to={`/products/${product.idProduct}`}>
        <div className="relative overflow-hidden">
          <img
            src={product.thumbnailUrl || '/placeholder-product.jpg'}
            alt={product.tenProduct}
            className="w-full h-64 object-cover group-hover:scale-110 transition duration-300"
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
          <h3 className="font-semibold text-lg hover:text-primary-600 mb-2 line-clamp-2">
            {product.tenProduct}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-1">{product.brandName}</p>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          ))}
          <span className="text-sm text-gray-600 ml-1">({reviewCount})</span>
        </div>
        <div className="mb-3">
          <p className="text-2xl font-bold text-primary-600">
            {formatPrice(product.giaBan)}
          </p>
          {product.giaGoc && product.giaGoc > product.giaBan && (
            <p className="text-sm text-gray-400 line-through">{formatPrice(product.giaGoc)}</p>
          )}
        </div>
        <button
          onClick={() => onAddToCart(product.idProduct)}
          disabled={product.soLuongTonKho === 0 || isAdding}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}
