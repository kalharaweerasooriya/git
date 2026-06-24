package com.smartinventory.controller;

import com.smartinventory.service.AiClientService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Proxies AI/ML insights from the Flask microservice through the authenticated backend.
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiClientService aiClientService;

    public AiController(AiClientService aiClientService) {
        this.aiClientService = aiClientService;
    }

    @GetMapping("/restock")
    public Object restock() { return aiClientService.restockPrediction(); }

    @GetMapping("/movement")
    public Object movement() { return aiClientService.movementAnalysis(); }

    @GetMapping("/trend")
    public Object trend() { return aiClientService.salesTrend(); }

    @GetMapping("/alerts")
    public Object alerts() { return aiClientService.alerts(); }

    @GetMapping("/insights")
    public Object insights() { return aiClientService.insightsSummary(); }
}
