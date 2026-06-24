package com.smartinventory.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Thin client that proxies requests to the Flask AI/ML microservice.
 * If the AI service is unreachable, a friendly fallback payload is returned
 * so the dashboard never breaks.
 */
@Service
public class AiClientService {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public AiClientService(RestTemplate restTemplate,
                           @Value("${app.ai.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public Object restockPrediction() { return get("/api/ai/restock"); }
    public Object movementAnalysis() { return get("/api/ai/movement"); }
    public Object salesTrend()       { return get("/api/ai/trend"); }
    public Object alerts()           { return get("/api/ai/alerts"); }
    public Object insightsSummary()  { return get("/api/ai/insights"); }

    private Object get(String path) {
        try {
            return restTemplate.getForObject(baseUrl + path, Object.class);
        } catch (Exception e) {
            return Map.of(
                    "available", false,
                    "message", "AI service unavailable at " + baseUrl + ". Start the Flask service (ai-service/app.py).",
                    "error", e.getMessage()
            );
        }
    }
}
