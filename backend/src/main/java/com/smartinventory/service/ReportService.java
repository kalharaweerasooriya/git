package com.smartinventory.service;

import com.smartinventory.model.Product;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;

    public ReportService(SaleRepository saleRepository, ProductRepository productRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
    }

    /** Daily sales for the last N days. */
    public List<Map<String, Object>> dailySales(int days) {
        LocalDateTime from = LocalDate.now().minusDays(days).atStartOfDay();
        List<Object[]> rows = saleRepository.dailyTotals(from);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", String.valueOf(r[0]));
            m.put("total", r[1]);
            m.put("transactions", r[2]);
            out.add(m);
        }
        return out;
    }

    /** Monthly sales totals. */
    public List<Map<String, Object>> monthlySales() {
        List<Object[]> rows = saleRepository.monthlyTotals();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", String.valueOf(r[0]));
            m.put("total", r[1]);
            m.put("transactions", r[2]);
            out.add(m);
        }
        return out;
    }

    /** Product performance: units sold and revenue per product. */
    public List<Map<String, Object>> productPerformance() {
        List<Object[]> rows = saleRepository.productPerformance();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", r[0]);
            m.put("name", r[1]);
            m.put("unitsSold", r[2]);
            m.put("revenue", r[3]);
            out.add(m);
        }
        return out;
    }

    /** Current product stock report. */
    public List<Map<String, Object>> stockReport() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Product p : productRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", p.getId());
            m.put("sku", p.getSku());
            m.put("name", p.getName());
            m.put("quantity", p.getQuantity());
            m.put("reorderLevel", p.getReorderLevel());
            m.put("maxStock", p.getMaxStock());
            m.put("status", p.getQuantity() <= p.getReorderLevel() ? "LOW"
                    : p.getQuantity() >= p.getMaxStock() ? "OVER" : "OK");
            out.add(m);
        }
        return out;
    }

    /** Dashboard summary metrics. */
    public Map<String, Object> dashboardSummary() {
        LocalDateTime today = LocalDate.now().atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalProducts", productRepository.count());
        m.put("lowStockCount", productRepository.findLowStock().size());
        m.put("todayRevenue", saleRepository.revenueSince(today));
        m.put("todayTransactions", saleRepository.countSince(today));
        m.put("monthRevenue", saleRepository.revenueSince(monthStart));
        m.put("monthTransactions", saleRepository.countSince(monthStart));
        return m;
    }
}
