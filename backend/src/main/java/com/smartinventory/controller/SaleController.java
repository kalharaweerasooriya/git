package com.smartinventory.controller;

import com.smartinventory.dto.SaleRequest;
import com.smartinventory.model.Sale;
import com.smartinventory.model.User;
import com.smartinventory.repository.UserRepository;
import com.smartinventory.service.SaleService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;
    private final UserRepository userRepository;

    public SaleController(SaleService saleService, UserRepository userRepository) {
        this.saleService = saleService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public Sale record(@RequestBody SaleRequest req, Authentication authentication) {
        Long userId = null;
        if (authentication != null) {
            userId = userRepository.findByUsername(authentication.getName())
                    .map(User::getId).orElse(null);
        }
        return saleService.recordSale(req, userId);
    }

    @GetMapping
    public List<Sale> recent() {
        return saleService.recent();
    }

    @GetMapping("/{id}")
    public Sale get(@PathVariable Long id) {
        return saleService.findById(id);
    }
}
