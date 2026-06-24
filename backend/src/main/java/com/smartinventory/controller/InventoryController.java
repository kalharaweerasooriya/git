package com.smartinventory.controller;

import com.smartinventory.dto.StockRequest;
import com.smartinventory.model.Product;
import com.smartinventory.model.StockMovement;
import com.smartinventory.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/{productId}/adjust")
    public Product adjust(@PathVariable Long productId, @RequestBody StockRequest req) {
        return inventoryService.adjustStock(productId, req);
    }

    @GetMapping("/{productId}/history")
    public List<StockMovement> history(@PathVariable Long productId) {
        return inventoryService.history(productId);
    }

    @GetMapping("/low-stock")
    public List<Product> lowStock() {
        return inventoryService.lowStock();
    }

    @GetMapping("/over-stock")
    public List<Product> overStock() {
        return inventoryService.overStock();
    }
}
