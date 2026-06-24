package com.smartinventory.repository;

import com.smartinventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku);

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.reorderLevel")
    List<Product> findLowStock();

    @Query("SELECT p FROM Product p WHERE p.quantity >= p.maxStock")
    List<Product> findOverStock();

    boolean existsBySku(String sku);
}
