import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Star, ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw, Edit3, Trash2, MessageSquare, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { productService } from '../../api/productService';
import { cartService } from '../../api/cartService';
import { wishlistService } from '../../api/wishlistService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useCartStore from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { setCartCount } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  // Review state
  const [ratingFilter, setRatingFilter] = useState(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [editingReview, setEditingReview] = useState(null);
  const [revealedReviews, setRevealedReviews] = useState(new Set());
  const [staffReplyText, setStaffReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id),
  });

  // Fetch product reviews with filter
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id, ratingFilter, reviewPage],
    queryFn: () => productService.getProductReviews(id, { rating: ratingFilter, page: reviewPage, size: 10 }),
    enabled: !!id,
  });

  const reviews = reviewsData?.content || [];
  const totalPages = reviewsData?.totalPages || 0;

  // Fetch rating distribution stats
  const { data: reviewStats } = useQuery({
    queryKey: ['review-stats', id],
    queryFn: () => productService.getReviewStats(id),
    enabled: !!id,
  });

  // Check if user can review
  const { data: canReview } = useQuery({
    queryKey: ['can-review', id],
    queryFn: () => productService.canReviewProduct(id),
    enabled: isAuthenticated && !!id,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data) => productService.createReview(data),
    onSuccess: () => {
      toast.success('Đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      resetReviewForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể đánh giá'),
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, data }) => productService.updateReview(reviewId, data),
    onSuccess: () => {
      toast.success('Cập nhật đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      resetReviewForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể cập nhật đánh giá'),
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => productService.deleteReview(reviewId),
    onSuccess: () => {
      toast.success('Xóa đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể xóa đánh giá'),
  });

  // Staff reply mutation
  const staffReplyMutation = useMutation({
    mutationFn: ({ reviewId, reply }) => productService.staffReplyReview(reviewId, { reply }),
    onSuccess: () => {
      toast.success('Phản hồi thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      setReplyingTo(null);
      setStaffReplyText('');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể phản hồi'),
  });

  const resetReviewForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    setReviewRating(5);
    setReviewComment('');
    setHoverRating(0);
  };

  const handleSubmitReview = () => {
    if (reviewComment.trim().length < 10) {
      toast.error('Nội dung đánh giá phải từ 10 ký tự');
      return;
    }
    if (editingReview) {
      updateReviewMutation.mutate({ reviewId: editingReview.reviewId, data: { rating: reviewRating, comment: reviewComment } });
    } else {
      createReviewMutation.mutate({ productId: parseInt(id), rating: reviewRating, comment: reviewComment });
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setShowReviewForm(true);
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const toggleRevealReview = (reviewId) => {
    setRevealedReviews(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  // Redirect if product is disabled
  useEffect(() => {
    if (product && product.isEnabled === false) {
      toast.error('Sản phẩm này hiện không khả dụng');
      navigate('/', { replace: true });
    }
  }, [product, navigate]);

  // Check if product is in wishlist
  const { data: inWishlist } = useQuery({
    queryKey: ['wishlist-check', id],
    queryFn: () => wishlistService.isInWishlist(id),
    enabled: isAuthenticated,
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: () => wishlistService.addToWishlist(product.idProduct),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['wishlist-check', id]);
      toast.success('Đã thêm vào danh sách yêu thích!');
    },
    onError: () => {
      toast.error('Không thể thêm vào danh sách yêu thích');
    },
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await cartService.addToCart(product.idProduct, quantity);
      const cart = await cartService.getCart();
      setCartCount(cart?.items?.length || 0);
      queryClient.invalidateQueries(['cart']);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
      navigate('/login');
      return;
    }
    addToWishlistMutation.mutate();
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
        <Link to="/products" className="text-primary-600 hover:text-primary-700">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  // Build images array from product DTO
  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : [product.thumbnailUrl || '/placeholder-product.jpg'];

  const avgRating = product.avgRating || 0;
  const totalReviews = product.totalReviews || 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-primary-600">Sản phẩm</Link>
          <span className="mx-2">/</span>
          <span>{product.tenProduct}</span>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={images[selectedImage]}
                  alt={product.tenProduct}
                  className="w-full h-96 object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`rounded-lg overflow-hidden border-2 ${
                        selectedImage === idx ? 'border-primary-600' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.tenProduct}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.floor(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {avgRating.toFixed(1)} ({totalReviews} đánh giá)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <p className="text-4xl font-bold text-primary-600">{formatPrice(product.giaBan)}</p>
                {product.giaGoc && product.giaGoc > product.giaBan && (
                  <p className="text-lg text-gray-400 line-through mt-1">{formatPrice(product.giaGoc)}
                    <span className="ml-2 text-sm text-red-500 font-semibold">
                      -{Math.round((1 - product.giaBan / product.giaGoc) * 100)}%
                    </span>
                  </p>
                )}
                {product.soLuongTonKho < 10 && product.soLuongTonKho > 0 && (
                  <p className="text-orange-600 mt-2">Chỉ còn {product.soLuongTonKho} sản phẩm</p>
                )}
                {product.soLuongTonKho === 0 && (
                  <p className="text-red-600 mt-2 font-semibold">Hết hàng</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Mô tả sản phẩm:</h3>
                <p className="text-gray-600">{product.moTa}</p>
              </div>

              {/* Quantity Selector */}
              {product.soLuongTonKho > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Số lượng:</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-gray-100"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.soLuongTonKho, quantity + 1))}
                        className="px-4 py-2 hover:bg-gray-100"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <span className="text-gray-600">
                      {product.soLuongTonKho} sản phẩm có sẵn
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={product.soLuongTonKho === 0 || isAddingToCart}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                >
                  <ShoppingCart size={20} />
                  {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.soLuongTonKho === 0 || isAddingToCart}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  Mua ngay
                </button>
                <button 
                  onClick={handleToggleWishlist}
                  disabled={addToWishlistMutation.isPending}
                  className={`px-4 py-3 border rounded-lg transition ${
                    inWishlist 
                      ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100' 
                      : 'border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  <Heart size={20} className={inWishlist ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Features */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Truck size={20} className="text-primary-600" />
                  <span>Miễn phí vận chuyển cho đơn hàng trên 500.000đ</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Shield size={20} className="text-primary-600" />
                  <span>Bảo hành chính hãng</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <RotateCcw size={20} className="text-primary-600" />
                  <span>Đổi trả trong 7 ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="border-b mb-6">
            <button className="px-6 py-3 border-b-2 border-primary-600 text-primary-600 font-semibold">
              Chi tiết sản phẩm
            </button>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-600">{product.moTa}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Danh mục:</p>
                <p className="text-gray-600">{product.categoryName || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Thương hiệu:</p>
                <p className="text-gray-600">{product.brandName || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Đánh giá sản phẩm</h2>
            {isAuthenticated && canReview && !showReviewForm && (
              <button
                onClick={() => { resetReviewForm(); setShowReviewForm(true); }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition flex items-center gap-2"
              >
                <Edit3 size={18} /> Viết đánh giá
              </button>
            )}
          </div>
          
          {/* Rating Summary + Distribution */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-8 pb-8 border-b">
            <div className="text-center min-w-[120px]">
              <p className="text-5xl font-bold text-primary-600 mb-2">
                {reviewStats?.avgRating?.toFixed?.(1) || avgRating.toFixed(1)}
              </p>
              <div className="flex items-center gap-1 mb-1 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20}
                    className={i < Math.floor(reviewStats?.avgRating || avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                ))}
              </div>
              <p className="text-gray-600">{reviewStats?.totalReviews || totalReviews} đánh giá</p>
            </div>

            {/* Rating Distribution Bars */}
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats?.distribution?.[star] || 0;
                const total = reviewStats?.totalReviews || 1;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <button key={star}
                    onClick={() => { setRatingFilter(ratingFilter === star ? null : star); setReviewPage(0); }}
                    className={`flex items-center gap-3 w-full group hover:bg-gray-50 rounded px-2 py-1 transition ${ratingFilter === star ? 'bg-primary-50' : ''}`}
                  >
                    <span className="text-sm font-medium w-8 text-right">{star} <Star size={12} className="inline fill-yellow-400 text-yellow-400" /></span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-10 text-right">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Badge */}
          {ratingFilter && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Đang lọc:</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {ratingFilter} <Star size={12} className="fill-primary-600 text-primary-600" />
                <button onClick={() => { setRatingFilter(null); setReviewPage(0); }} className="ml-1 hover:text-primary-900">&times;</button>
              </span>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border">
              <h3 className="text-lg font-semibold mb-4">
                {editingReview ? `Chỉnh sửa đánh giá (${editingReview.editCount}/2 lần chỉnh sửa đã dùng)` : 'Viết đánh giá của bạn'}
              </h3>
              {/* Star Picker */}
              <div className="flex items-center gap-1 mb-4">
                <span className="text-sm text-gray-600 mr-2">Đánh giá:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-125"
                  >
                    <Star size={28}
                      className={star <= (hoverRating || reviewRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'} />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">{reviewRating}/5</span>
              </div>
              {/* Comment Textarea */}
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (tối thiểu 10 ký tự)"
                rows={4}
                maxLength={1000}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{reviewComment.length}/1000</span>
                <div className="flex gap-3">
                  <button onClick={resetReviewForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                    Hủy
                  </button>
                  <button onClick={handleSubmitReview}
                    disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium">
                    {createReviewMutation.isPending || updateReviewMutation.isPending ? 'Đang gửi...'
                      : editingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => {
                const isOwner = user?.idUser === review.userId;
                const isReviewHidden = review.isHidden && !revealedReviews.has(review.reviewId);
                return (
                  <div key={review.reviewId} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-white text-lg">
                          {(review.userFullName || review.userName || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{review.userFullName || review.userName}</h4>
                            {review.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} /> Đã mua hàng
                              </span>
                            )}
                            {review.editCount > 0 && (
                              <span className="text-xs text-gray-400">(đã chỉnh sửa)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {review.createdAt ? formatDate(review.createdAt) : ''}
                            </span>
                            {/* Owner actions */}
                            {isOwner && (
                              <div className="flex items-center gap-1">
                                {review.editCount < 2 && (
                                  <button onClick={() => handleEditReview(review)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Chỉnh sửa">
                                    <Edit3 size={16} />
                                  </button>
                                )}
                                <button onClick={() => handleDeleteReview(review.reviewId)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                  title="Xóa">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16}
                              className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                          ))}
                        </div>
                        {/* Comment with hidden toggle */}
                        {isReviewHidden ? (
                          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                            <span className="text-sm text-amber-700">
                              Bình luận này có thể chứa nội dung nhạy cảm.
                            </span>
                            <button onClick={() => toggleRevealReview(review.reviewId)}
                              className="text-sm text-amber-600 hover:text-amber-800 font-medium underline ml-auto flex items-center gap-1">
                              <Eye size={14} /> Hiển thị
                            </button>
                          </div>
                        ) : (
                          <div>
                            {review.isHidden && revealedReviews.has(review.reviewId) && (
                              <button onClick={() => toggleRevealReview(review.reviewId)}
                                className="text-xs text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
                                <EyeOff size={12} /> Ẩn bình luận
                              </button>
                            )}
                            <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                          </div>
                        )}

                        {/* Staff Reply */}
                        {review.staffReply && (
                          <div className="mt-3 ml-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare size={14} className="text-blue-600" />
                              <span className="text-sm font-semibold text-blue-700">
                                Phản hồi từ {review.staffReplyUserName || 'Nhân viên'}
                              </span>
                              <span className="text-xs text-blue-400">
                                {review.staffReplyDate ? formatDate(review.staffReplyDate) : ''}
                              </span>
                            </div>
                            <p className="text-sm text-blue-800">{review.staffReply}</p>
                          </div>
                        )}

                        {/* Staff Reply Button */}
                        {isStaff && !review.staffReply && (
                          <>
                            {replyingTo === review.reviewId ? (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                <textarea
                                  value={staffReplyText}
                                  onChange={(e) => setStaffReplyText(e.target.value)}
                                  placeholder="Phản hồi đánh giá này..."
                                  rows={2}
                                  maxLength={1000}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button onClick={() => { setReplyingTo(null); setStaffReplyText(''); }}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 transition">
                                    Hủy
                                  </button>
                                  <button
                                    onClick={() => staffReplyMutation.mutate({ reviewId: review.reviewId, reply: staffReplyText })}
                                    disabled={staffReplyText.trim().length < 5 || staffReplyMutation.isPending}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition">
                                    {staffReplyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setReplyingTo(review.reviewId); setStaffReplyText(''); }}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                                <MessageSquare size={14} /> Phản hồi
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-8">
                {ratingFilter
                  ? `Chưa có đánh giá ${ratingFilter} sao nào`
                  : 'Chưa có đánh giá nào cho sản phẩm này'}
              </p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setReviewPage(Math.max(0, reviewPage - 1))}
                disabled={reviewPage === 0}
                className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                Trước
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i}
                  onClick={() => setReviewPage(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    reviewPage === i ? 'bg-primary-600 text-white' : 'border hover:bg-gray-50'
                  }`}>
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setReviewPage(Math.min(totalPages - 1, reviewPage + 1))}
                disabled={reviewPage >= totalPages - 1}
                className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
