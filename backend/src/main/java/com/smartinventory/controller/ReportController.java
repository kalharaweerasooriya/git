package com.smartinventory.controller;

import com.smartinventory.service.ReportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/daily")
    public List<Map<String, Object>> daily(@RequestParam(defaultValue = "30") int days) {
        return reportService.dailySales(days);
    }

    @GetMapping("/monthly")
    public List<Map<String, Object>> monthly() {
        return reportService.monthlySales();
    }

    @GetMapping("/product-performance")
    public List<Map<String, Object>> productPerformance() {
        return reportService.productPerformance();
    }

    @GetMapping("/stock")
    public List<Map<String, Object>> stock() {
        return reportService.stockReport();
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return reportService.dashboardSummary();
    }
}
