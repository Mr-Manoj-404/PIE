package com.pie.backend.service;

import com.pie.backend.dto.SearchRequest;
import com.pie.backend.dto.SearchResponse;
import com.pie.backend.dto.SearchResult;
import com.pie.backend.model.SearchMode;
import com.pie.backend.security.SecurityIdentityService;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SearchService {

    private final SearchHistoryService searchHistoryService;
    private final SearchProvider searchProvider;
    private final GeminiService geminiService;
    private final SecurityIdentityService securityIdentityService;

    public SearchService(
            SearchHistoryService searchHistoryService,
            SearchProvider searchProvider,
            GeminiService geminiService,
            SecurityIdentityService securityIdentityService) {

        this.searchHistoryService =
                searchHistoryService;

        this.searchProvider =
                searchProvider;

        this.geminiService =
                geminiService;

        this.securityIdentityService =
                securityIdentityService;
    }

    public SearchResponse search(
            SearchRequest request) {

        if (request.mode() == SearchMode.BETA) {
            return performBetaSearch(
                    request.query()
            );
        }

        UUID userId =
                securityIdentityService.currentUserId();

        return performAlphaSearch(
                userId,
                request.query()
        );
    }

    private SearchResponse performAlphaSearch(
            UUID userId,
            String query) {

        List<SearchResult> results =
                searchProvider.search(query);

        String aiAnswer =
                generateAiAnswerSafely(
                        query,
                        results
                );

        searchHistoryService.storeAlphaSearch(
                userId,
                query
        );

        return new SearchResponse(
                query,
                SearchMode.ALPHA,
                aiAnswer,
                results,
                LocalDateTime.now()
        );
    }

    private SearchResponse performBetaSearch(
            String query) {

        List<SearchResult> results =
                searchProvider.search(query);

        String aiAnswer =
                generateAiAnswerSafely(
                        query,
                        results
                );

        return new SearchResponse(
                query,
                SearchMode.BETA,
                aiAnswer,
                results,
                LocalDateTime.now()
        );
    }

    private String generateAiAnswerSafely(
            String query,
            List<SearchResult> results) {

        if (results == null ||
                results.isEmpty()) {

            return "No search results were found to generate an AI answer.";
        }

        String searchContext =
                buildSearchContext(results);

        try {

            return geminiService.generateAnswer(
                    query,
                    searchContext
            );

        } catch (Exception exception) {

            return "AI answer is temporarily unavailable. "
                    + "The search results are still available below.";
        }
    }

    private String buildSearchContext(
            List<SearchResult> results) {

        StringBuilder context =
                new StringBuilder();

        for (int i = 0;
             i < results.size();
             i++) {

            SearchResult result =
                    results.get(i);

            context.append("Result ")
                    .append(i + 1)
                    .append("\n");

            context.append("Title: ")
                    .append(safe(result.title()))
                    .append("\n");

            context.append("URL: ")
                    .append(safe(result.url()))
                    .append("\n");

            context.append("Snippet: ")
                    .append(safe(result.snippet()))
                    .append("\n\n");
        }

        return context.toString();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}