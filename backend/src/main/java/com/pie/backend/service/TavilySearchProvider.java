package com.pie.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pie.backend.dto.SearchResult;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.ArrayList;
import java.util.List;

@Service
public class TavilySearchProvider implements SearchProvider {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tavily.api-key}")
    private String apiKey;

    @Value("${tavily.base-url}")
    private String baseUrl;

    public TavilySearchProvider() {

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        // Maximum time to establish a connection with Tavily.
        factory.setConnectTimeout(10_000);

        // Maximum time to wait for Tavily's response.
        factory.setReadTimeout(20_000);

        this.restTemplate =
                new RestTemplate(factory);

        this.objectMapper =
                new ObjectMapper();
    }

    @Override
    public List<SearchResult> search(String query) {

        if (query == null || query.isBlank()) {
            return List.of();
        }

        String url = baseUrl + "/search";

        String requestBody = """
                {
                    "query": "%s",
                    "search_depth": "basic",
                    "max_results": 5
                }
                """.formatted(
                escapeJson(query.trim())
        );

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.setBearerAuth(apiKey);

        HttpEntity<String> request =
                new HttpEntity<>(
                        requestBody,
                        headers
                );

        try {

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.POST,
                            request,
                            String.class
                    );

            return parseResults(
                    response.getBody()
            );

        } catch (Exception exception) {

            throw new RuntimeException(
                    "Tavily search failed: "
                            + exception.getMessage(),
                    exception
            );
        }
    }

    private List<SearchResult> parseResults(
            String responseBody) {

        List<SearchResult> results =
                new ArrayList<>();

        try {

            JsonNode root =
                    objectMapper.readTree(
                            responseBody
                    );

            JsonNode resultArray =
                    root.path("results");

            if (!resultArray.isArray()) {
                return results;
            }

            for (JsonNode result :
                    resultArray) {

                String title =
                        result.path("title")
                                .asText("");

                String url =
                        result.path("url")
                                .asText("");

                String snippet =
                        result.path("content")
                                .asText("");

                results.add(
                        new SearchResult(
                                title,
                                url,
                                snippet
                        )
                );
            }

            return results;

        } catch (Exception exception) {

            throw new RuntimeException(
                    "Failed to process Tavily search response",
                    exception
            );
        }
    }

    private String escapeJson(
            String value) {

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}