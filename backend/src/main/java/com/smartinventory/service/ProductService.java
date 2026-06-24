package com.smartinventory.service;

import com.smartinventory.dto.ProductRequest;
import com.smartinventory.exception.BadRequestException;
import com.smartinventory.exception.ResourceNotFoundException;
import com.smartinventory.model.Category;
import com.smartinventory.model.Product;
import com.smartinventory.repository.CategoryRepository;
import com.smartinventory.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    public List<Product> search(String q) {
        if (q == null || q.isBlank()) return productRepository.findAll();
        return productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(q, q);
    }

    public List<Product> lowStock() {
        return productRepository.findLowStock();
    }

    public Product create(ProductRequest req) {
        if (req.getSku() == null || req.getSku().isBlank())
            throw new BadRequestException("SKU is required");
        if (productRepository.existsBySku(req.getSku()))
            throw new BadRequestException("SKU already exists: " + req.getSku());
        Product p = new Product();
        apply(p, req);
        return productRepository.save(p);
    }

    public Product update(Long id, ProductRequest req) {
        Product p = findById(id);
        apply(p, req);
        return productRepository.save(p);
    }

    public void delete(Long id) {
        if (!productRepository.existsById(id))
            throw new ResourceNotFoundException("Product not found: " + id);
        productRepository.deleteById(id);
    }

    private void apply(Product p, ProductRequest req) {
        if (req.getSku() != null) p.setSku(req.getSku());
        if (req.getName() != null) p.setName(req.getName());
        if (req.getUnitPrice() != null) p.setUnitPrice(req.getUnitPrice());
        if (req.getCostPrice() != null) p.setCostPrice(req.getCostPrice());
        if (req.getQuantity() != null) p.setQuantity(req.getQuantity());
        if (req.getReorderLevel() != null) p.setReorderLevel(req.getReorderLevel());
        if (req.getMaxStock() != null) p.setMaxStock(req.getMaxStock());
        if (req.getExpiryDate() != null) p.setExpiryDate(req.getExpiryDate());
        if (req.getUnitPrice() == null && p.getUnitPrice() == null) p.setUnitPrice(BigDecimal.ZERO);
        if (req.getCategoryId() != null) {
            Category c = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + req.getCategoryId()));
            p.setCategory(c);
        }
    }
}
