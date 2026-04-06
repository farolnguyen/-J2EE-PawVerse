package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.voucher.CreateVoucherRequest;
import J2EE.PawVerse.dto.voucher.UpdateVoucherRequest;
import J2EE.PawVerse.dto.voucher.VoucherDTO;
import J2EE.PawVerse.entity.Brand;
import J2EE.PawVerse.entity.Category;
import J2EE.PawVerse.entity.Voucher;
import J2EE.PawVerse.repository.BrandRepository;
import J2EE.PawVerse.repository.CategoryRepository;
import J2EE.PawVerse.repository.OrderRepository;
import J2EE.PawVerse.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public VoucherDTO validateVoucher(String code) {
        Voucher voucher = voucherRepository.findByMaVoucherAndIsActiveTrue(code)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa"));

        LocalDate today = LocalDate.now();
        if (today.isBefore(voucher.getNgayBatDau())) {
            throw new RuntimeException("Mã giảm giá chưa có hiệu lực");
        }
        if (today.isAfter(voucher.getNgayKetThuc())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }
        if (voucher.getMaxUsage() != null && voucher.getUsedCount() >= voucher.getMaxUsage()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
        }

        return convertToDTO(voucher);
    }

    @Transactional(readOnly = true)
    public Page<VoucherDTO> getAllVouchers(Pageable pageable) {
        return voucherRepository.findAll(pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public VoucherDTO getVoucherById(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
        return convertToDTO(voucher);
    }

    @Transactional
    public VoucherDTO createVoucher(CreateVoucherRequest request) {
        // Check unique code
        if (voucherRepository.findByMaVoucher(request.getMaVoucher()).isPresent()) {
            throw new RuntimeException("Mã voucher đã tồn tại");
        }

        // Validate dates
        if (request.getNgayKetThuc().isBefore(request.getNgayBatDau())) {
            throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        // Validate discount values based on type
        Voucher.VoucherType type = Voucher.VoucherType.valueOf(request.getVoucherType());
        validateDiscountValues(type, request.getDiscountPercentage(), request.getDiscountValue());

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
        }

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu"));
        }

        Voucher voucher = Voucher.builder()
                .maVoucher(request.getMaVoucher().toUpperCase().trim())
                .tenVoucher(request.getTenVoucher())
                .moTa(request.getMoTa())
                .voucherType(type)
                .discountValue(request.getDiscountValue())
                .discountPercentage(request.getDiscountPercentage())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(request.getMinOrderAmount())
                .maxUsage(request.getMaxUsage())
                .usedCount(0)
                .ngayBatDau(request.getNgayBatDau())
                .ngayKetThuc(request.getNgayKetThuc())
                .isFirstTimeOnly(request.getIsFirstTimeOnly() != null ? request.getIsFirstTimeOnly() : false)
                .isActive(true)
                .category(category)
                .brand(brand)
                .build();

        voucher = voucherRepository.save(voucher);
        log.info("Created voucher: {} ({})", voucher.getMaVoucher(), voucher.getVoucherType());
        return convertToDTO(voucher);
    }

    @Transactional
    public VoucherDTO updateVoucher(Long id, UpdateVoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));

        if (request.getTenVoucher() != null) voucher.setTenVoucher(request.getTenVoucher());
        if (request.getMoTa() != null) voucher.setMoTa(request.getMoTa());

        if (request.getVoucherType() != null) {
            Voucher.VoucherType type = Voucher.VoucherType.valueOf(request.getVoucherType());
            voucher.setVoucherType(type);
        }

        if (request.getDiscountValue() != null) voucher.setDiscountValue(request.getDiscountValue());
        if (request.getDiscountPercentage() != null) voucher.setDiscountPercentage(request.getDiscountPercentage());
        if (request.getMaxDiscountAmount() != null) voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        if (request.getMinOrderAmount() != null) voucher.setMinOrderAmount(request.getMinOrderAmount());
        if (request.getMaxUsage() != null) voucher.setMaxUsage(request.getMaxUsage());

        if (request.getNgayBatDau() != null) voucher.setNgayBatDau(request.getNgayBatDau());
        if (request.getNgayKetThuc() != null) voucher.setNgayKetThuc(request.getNgayKetThuc());

        if (voucher.getNgayKetThuc().isBefore(voucher.getNgayBatDau())) {
            throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        if (request.getIsFirstTimeOnly() != null) voucher.setIsFirstTimeOnly(request.getIsFirstTimeOnly());
        if (request.getIsActive() != null) voucher.setIsActive(request.getIsActive());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
            voucher.setCategory(category);
        }

        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu"));
            voucher.setBrand(brand);
        }

        voucher = voucherRepository.save(voucher);
        log.info("Updated voucher: {}", voucher.getMaVoucher());
        return convertToDTO(voucher);
    }

    @Transactional
    public void toggleVoucherActive(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
        voucher.setIsActive(!voucher.getIsActive());
        voucherRepository.save(voucher);
        log.info("Toggled voucher {} active={}", voucher.getMaVoucher(), voucher.getIsActive());
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
        orderRepository.nullifyVoucherReference(id);
        voucherRepository.delete(voucher);
        log.info("Deleted voucher: {} (was used {} time(s))", voucher.getMaVoucher(), voucher.getUsedCount());
    }

    private void validateDiscountValues(Voucher.VoucherType type, Integer percentage, java.math.BigDecimal fixedValue) {
        if (type == Voucher.VoucherType.PERCENTAGE) {
            if (percentage == null || percentage < 1 || percentage > 100) {
                throw new RuntimeException("Phần trăm giảm giá phải từ 1 đến 100");
            }
        } else if (type == Voucher.VoucherType.FIXED_AMOUNT) {
            if (fixedValue == null || fixedValue.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Số tiền giảm phải lớn hơn 0");
            }
        }
    }

    private VoucherDTO convertToDTO(Voucher v) {
        String status;
        LocalDate today = LocalDate.now();
        if (!v.getIsActive()) {
            status = "INACTIVE";
        } else if (today.isBefore(v.getNgayBatDau())) {
            status = "UPCOMING";
        } else if (today.isAfter(v.getNgayKetThuc())) {
            status = "EXPIRED";
        } else if (v.getMaxUsage() != null && v.getUsedCount() >= v.getMaxUsage()) {
            status = "EXHAUSTED";
        } else {
            status = "ACTIVE";
        }

        return VoucherDTO.builder()
                .idVoucher(v.getIdVoucher())
                .maVoucher(v.getMaVoucher())
                .tenVoucher(v.getTenVoucher())
                .moTa(v.getMoTa())
                .voucherType(v.getVoucherType().name())
                .discountValue(v.getDiscountValue())
                .discountPercentage(v.getDiscountPercentage())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .minOrderAmount(v.getMinOrderAmount())
                .maxUsage(v.getMaxUsage())
                .usedCount(v.getUsedCount())
                .ngayBatDau(v.getNgayBatDau())
                .ngayKetThuc(v.getNgayKetThuc())
                .isFirstTimeOnly(v.getIsFirstTimeOnly())
                .isActive(v.getIsActive())
                .categoryId(v.getCategory() != null ? v.getCategory().getIdCategory() : null)
                .categoryName(v.getCategory() != null ? v.getCategory().getTenCategory() : null)
                .brandId(v.getBrand() != null ? v.getBrand().getIdBrand() : null)
                .brandName(v.getBrand() != null ? v.getBrand().getTenBrand() : null)
                .status(status)
                .build();
    }
}
