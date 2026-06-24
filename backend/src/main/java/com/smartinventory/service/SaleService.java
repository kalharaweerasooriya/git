package com.smartinventory.service;

import com.smartinventory.dto.SaleRequest;
import com.smartinventory.exception.BadRequestException;
import com.smartinventory.model.*;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.SaleRepository;
import com.smartinventory.repository.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository movementRepository;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       StockMovementRepository movementRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public Sale recordSale(SaleRequest req, Long userId) {
        if (req.getItems() == null || req.getItems().isEmpty())
            throw new BadRequestException("Sale must contain at least one item");

        Sale sale = new Sale();
        sale.setUserId(userId);
        sale.setSaleDate(LocalDateTime.now());
        try {
            sale.setPaymentMethod(PaymentMethod.valueOf(
                    req.getPaymentMethod() == null ? "CASH" : req.getPaymentMethod().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid payment method: " + req.getPaymentMethod());
        }

        String invoiceNo = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        sale.setInvoiceNo(invoiceNo);

        BigDecimal total = BigDecimal.ZERO;
        for (SaleRequest.Item item : req.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new BadRequestException("Product not found: " + item.getProductId()));
            int qty = item.getQuantity() == null ? 0 : item.getQuantity();
            if (qty <= 0) throw new BadRequestException("Quantity must be positive for " + product.getName());
            if (product.getQuantity() < qty)
                throw new BadRequestException("Insufficient stock for " + product.getName()
                        + " (available: " + product.getQuantity() + ")");

            BigDecimal lineTotal = product.getUnitPrice().multiply(BigDecimal.valueOf(qty));
            total = total.add(lineTotal);

            SaleItem si = new SaleItem();
            si.setProductId(product.getId());
            si.setQuantity(qty);
            si.setUnitPrice(product.getUnitPrice());
            si.setLineTotal(lineTotal);
            sale.addItem(si);

            // decrement stock + record movement
            product.setQuantity(product.getQuantity() - qty);
            productRepository.save(product);
            movementRepository.save(new StockMovement(product.getId(), -qty,
                    MovementType.OUT, "Sale " + invoiceNo));
        }
        sale.setTotalAmount(total);
        return saleRepository.save(sale);
    }

    public List<Sale> recent() {
        return saleRepository.findTop50ByOrderBySaleDateDesc();
    }

    public Sale findById(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Sale not found: " + id));
    }
}
