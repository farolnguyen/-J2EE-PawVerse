package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.brand.BrandDTO;
import J2EE.PawVerse.dto.brand.BrandRequest;
import J2EE.PawVerse.entity.Brand;
import J2EE.PawVerse.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandService {
    
    private final BrandRepository brandRepository;
    
    @Transactional(readOnly = true)
    public List<BrandDTO> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BrandDTO> getActiveBrands() {
        return brandRepository.findAllActive().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public BrandDTO getBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy brand"));
        return convertToDTO(brand);
    }
    
    @Transactional
    public BrandDTO createBrand(BrandRequest request) {
        String trangThai = request.getTrangThai();
        if (trangThai == null || trangThai.isBlank()) {
            trangThai = "Hoạt động";
        }
        
        Brand brand = Brand.builder()
                .tenBrand(request.getTenBrand())
                .moTa(request.getMoTa())
                .logo(request.getLogo())
                .trangThai(trangThai)
                .build();
        
        brand = brandRepository.save(brand);
        return convertToDTO(brand);
    }
    
    @Transactional
    public BrandDTO updateBrand(Long id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy brand"));
        
        brand.setTenBrand(request.getTenBrand());
        brand.setMoTa(request.getMoTa());
        if (request.getLogo() != null) {
            brand.setLogo(request.getLogo());
        }
        if (request.getTrangThai() != null && !request.getTrangThai().isBlank()) {
            brand.setTrangThai(request.getTrangThai());
        }
        
        brand = brandRepository.save(brand);
        return convertToDTO(brand);
    }
    
    @Transactional
    public void deleteBrand(Long id) {
        if (brandRepository.hasProducts(id)) {
            throw new RuntimeException("Không thể xóa brand đang có sản phẩm");
        }
        brandRepository.deleteById(id);
    }
    
    private BrandDTO convertToDTO(Brand brand) {
        long productCount = brand.getProducts() != null ? brand.getProducts().size() : 0L;
        return BrandDTO.builder()
                .idBrand(brand.getIdBrand())
                .tenBrand(brand.getTenBrand())
                .moTa(brand.getMoTa())
                .logo(brand.getLogo())
                .trangThai(brand.getTrangThai())
                .productCount(productCount)
                .build();
    }
}
