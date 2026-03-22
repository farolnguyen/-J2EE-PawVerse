package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.category.CategoryDTO;
import J2EE.PawVerse.dto.category.CategoryRequest;
import J2EE.PawVerse.entity.Category;
import J2EE.PawVerse.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getActiveCategories() {
        return categoryRepository.findAllActive().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy category"));
        return convertToDTO(category);
    }
    
    @Transactional
    public CategoryDTO createCategory(CategoryRequest request) {
        String trangThai = request.getTrangThai();
        if (trangThai == null || trangThai.isBlank()) {
            trangThai = "Hoạt động";
        }
        
        Category category = Category.builder()
                .tenCategory(request.getTenCategory())
                .moTa(request.getMoTa())
                .hinhAnh(request.getHinhAnh())
                .trangThai(trangThai)
                .build();
        
        category = categoryRepository.save(category);
        return convertToDTO(category);
    }
    
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy category"));
        
        category.setTenCategory(request.getTenCategory());
        category.setMoTa(request.getMoTa());
        if (request.getHinhAnh() != null) {
            category.setHinhAnh(request.getHinhAnh());
        }
        if (request.getTrangThai() != null && !request.getTrangThai().isBlank()) {
            category.setTrangThai(request.getTrangThai());
        }
        
        category = categoryRepository.save(category);
        return convertToDTO(category);
    }
    
    @Transactional
    public void deleteCategory(Long id) {
        if (categoryRepository.hasProducts(id)) {
            throw new RuntimeException("Không thể xóa category đang có sản phẩm");
        }
        categoryRepository.deleteById(id);
    }
    
    private CategoryDTO convertToDTO(Category category) {
        long productCount = category.getProducts() != null ? category.getProducts().size() : 0L;
        return CategoryDTO.builder()
                .idCategory(category.getIdCategory())
                .tenCategory(category.getTenCategory())
                .moTa(category.getMoTa())
                .hinhAnh(category.getHinhAnh())
                .trangThai(category.getTrangThai())
                .productCount(productCount)
                .build();
    }
}
