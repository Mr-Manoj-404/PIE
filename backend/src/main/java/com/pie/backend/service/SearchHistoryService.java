package com.pie.backend.service;

import com.pie.backend.model.SearchHistory;
import com.pie.backend.model.SearchMode;
import com.pie.backend.repository.SearchHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SearchHistoryService {

    private final SearchHistoryRepository searchHistoryRepository;
    private final UserService userService;

    public SearchHistoryService(
            SearchHistoryRepository searchHistoryRepository,
            UserService userService) {

        this.searchHistoryRepository = searchHistoryRepository;
        this.userService = userService;
    }

    public void storeAlphaSearch(UUID userId, String query) {

        // Verify that the user exists before storing search history.
        userService.getUserById(userId);

        SearchHistory history = new SearchHistory(
                userId,
                query,
                SearchMode.ALPHA
        );

        searchHistoryRepository.save(history);
    }

    public List<SearchHistory> getAlphaSearchHistory(UUID userId) {

        // Verify that the user exists before returning history.
        userService.getUserById(userId);

        return searchHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void deleteHistoryItem(UUID userId, UUID historyId) {

        // Verify that the user exists.
        userService.getUserById(userId);

        SearchHistory history = searchHistoryRepository
                .findById(historyId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Search history not found"));

        // Make sure a user cannot delete another user's history.
        if (!history.getUserId().equals(userId)) {
            throw new IllegalArgumentException(
                    "You cannot delete another user's search history"
            );
        }

        searchHistoryRepository.delete(history);
    }

    public void clearHistory(UUID userId) {

        // Verify that the user exists.
        userService.getUserById(userId);

        List<SearchHistory> history =
                searchHistoryRepository
                        .findByUserIdOrderByCreatedAtDesc(userId);

        if (!history.isEmpty()) {
            searchHistoryRepository.deleteAllInBatch(history);
        }
    }
}
