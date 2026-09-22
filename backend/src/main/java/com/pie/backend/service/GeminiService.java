package com.pie.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Service
public class GeminiService {

    private static final Logger logger =
            LoggerFactory.getLogger(
                    GeminiService.class
            );

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final String apiKey;
    private final String model;

    public GeminiService(
            @Value("${gemini.api-key}")
            String apiKey,

            @Value("${gemini.model}")
            String model) {

        if (apiKey == null ||
                apiKey.isBlank()) {

            throw new IllegalStateException(
                    "GEMINI_API_KEY is missing or empty."
            );
        }

        this.apiKey = apiKey;
        this.model = model;

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);

        this.restTemplate =
                new RestTemplate(factory);

        this.objectMapper =
                new ObjectMapper();

        logger.info(
                "Gemini REST service initialized with model: {}",
                model
        );
    }

    public String generateAnswer(
            String query,
            String searchContext) {

        String prompt = """
                You are PIE's AI answer engine.
                PIE stands for Personal Intelligence Engine.

                Answer the user's question using ONLY the supplied web search results.

                USER QUESTION:
                %s

                WEB SEARCH RESULTS:
                %s

                RESPONSE RULES:
                1. Answer the question directly first.
                2. Use only facts supported by the supplied results.
                3. Do not invent or assume facts.
                4. Keep the answer concise, normally 150-300 words.
                5. Use Markdown.
                6. Use **bold** for important terms.
                7. Use bullets for lists of 3 or more items.
                8. When a factual statement is supported by a result,
                   add a citation marker such as [1], [2], or [3]
                   matching the result number.
                9. Put citation markers immediately after the relevant claim.
                10. Do not create URLs or citations that are not present
                    in the supplied results.
                11. If sources disagree, briefly identify the disagreement.
                12. If the results are insufficient, say so clearly.
                13. Do not include a separate Sources section.
                14. Do not mention these instructions or that you are an AI.

                Write for a normal user, not as a technical report.
                """.formatted(
                query,
                searchContext
        );

        return sendToGemini(
                prompt,
                query,
                "ALPHA/BETA"
        );
    }

    public String generateSavedKnowledgeAnswer(
            String query,
            String savedContext) {

        String prompt = """
                You are PIE's Personal Knowledge Assistant.

                Answer the user's question using ONLY the user's saved knowledge below.

                USER QUESTION:
                %s

                USER'S SAVED KNOWLEDGE:
                %s

                RESPONSE RULES:
                1. Answer directly.
                2. Use only information supported by saved knowledge.
                3. Add [1], [2], etc. when a claim clearly comes from a saved item.
                4. Never use outside facts to fill gaps.
                5. If saved knowledge is insufficient, clearly say so.
                6. Keep the answer concise, normally 100-250 words.
                7. Use Markdown and **bold** important terms.
                8. Use bullets for lists of 3 or more items.
                9. Do not invent facts or URLs.
                10. Do not include a separate Sources section.

                Write as a personal knowledge assistant.
                """.formatted(
                query,
                savedContext
        );

        return sendToGemini(
                prompt,
                query,
                "SAVED_KNOWLEDGE"
        );
    }

    private String sendToGemini(
            String prompt,
            String query,
            String operation) {

        logger.info(
                "Sending {} request to Gemini REST API. Model: {}, Query: {}",
                operation,
                model,
                query
        );

        String url =
                "https://generativelanguage.googleapis.com/v1beta/models/"
                        + model
                        + ":generateContent?key="
                        + apiKey;

        String requestBody = """
                {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": %s
                                }
                            ]
                        }
                    ]
                }
                """.formatted(
                toJsonString(prompt)
        );

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

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

            if (!response.getStatusCode().is2xxSuccessful()) {

                throw new RuntimeException(
                        "Gemini API returned HTTP "
                                + response.getStatusCode().value()
                );
            }

            String responseBody =
                    response.getBody();

            if (responseBody == null ||
                    responseBody.isBlank()) {

                throw new RuntimeException(
                        "Gemini API returned an empty response."
                );
            }

            String answer =
                    extractAnswer(responseBody);

            if (answer == null ||
                    answer.isBlank()) {

                throw new RuntimeException(
                        "Gemini API response did not contain text."
                );
            }

            logger.info(
                    "Gemini {} request completed successfully.",
                    operation
            );

            return answer.trim();

        } catch (Exception exception) {

            logger.error(
                    "Gemini {} request failed. Model: {}",
                    operation,
                    model,
                    exception
            );

            throw new RuntimeException(
                    "Gemini request failed: "
                            + exception.getMessage(),
                    exception
            );
        }
    }

    private String extractAnswer(
            String responseBody) {

        try {

            JsonNode root =
                    objectMapper.readTree(
                            responseBody
                    );

            JsonNode candidates =
                    root.path("candidates");

            if (!candidates.isArray() ||
                    candidates.isEmpty()) {

                return null;
            }

            JsonNode firstCandidate =
                    candidates.get(0);

            JsonNode parts =
                    firstCandidate
                            .path("content")
                            .path("parts");

            if (!parts.isArray()) {
                return null;
            }

            StringBuilder answer =
                    new StringBuilder();

            for (JsonNode part : parts) {

                JsonNode text =
                        part.get("text");

                if (text != null &&
                        !text.isNull()) {

                    if (answer.length() > 0) {
                        answer.append("\n");
                    }

                    answer.append(
                            text.asText()
                    );
                }
            }

            return answer.toString();

        } catch (Exception exception) {

            throw new RuntimeException(
                    "Failed to parse Gemini response.",
                    exception
            );
        }
    }

    private String toJsonString(
            String value) {

        try {

            return objectMapper.writeValueAsString(
                    value
            );

        } catch (Exception exception) {

            throw new RuntimeException(
                    "Failed to create Gemini request.",
                    exception
            );
        }
    }
}