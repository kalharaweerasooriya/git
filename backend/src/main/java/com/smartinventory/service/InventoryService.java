package com.smartinventory.service;

import com.smartinventory.dto.StockRequest;
import com.smartinventory.exception.BadRequestException;
import com.smartinventory.model.MovementType;
import com.smartinventory.model.Product;
import com.smartinventory.model.StockMovement;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockMovementRepository movementRepository;
    private final ProductService productService;

    public InventoryService(ProductRepository productRepository,
                            StockMovementRepository movementRepository,
                            ProductService productService) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
        this.productService = productService;
    }

    /** Adjust stock for a product and record a movement. */
    @Transactional
    public Product adjustStock(Long productId, StockRequest req) {
        Product product = productService.findById(productId);
        MovementType type;
        try {
            type = MovementType.valueOf(req.getType() == null ? "ADJUST" : req.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid movement type: " + req.getType());
        }

        int delta = req.getChangeQty() == null ? 0 : req.getChangeQty();
        // For OUT movements, callers may pass a positive number; normalise to negative.
        if (type == MovementType.OUT && delta > 0) delta = -delta;
        if (type == MovementType.IN && delta < 0) delta = -delta;

        int newQty = product.getQuantity() + delta;
        if (newQty < 0) throw new BadRequestException("Stock cannot go below zero");

        product.setQuantity(newQty);
        productRepository.save(product);
        movementRepository.save(new StockMovement(productId, delta, type, req.getReason()));
        return product;
    }

    public List<StockMovement> history(Long productId) {
        return movementRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public List<Product> lowStock() {
        return productRepository.findLowStock();
    }

    public List<Product> overStock() {
        return productRepository.findOverStock();
    }
}
