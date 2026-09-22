package com.pie.backend.service;

import com.pie.backend.model.SearchHistory;
import com.pie.backend.repository.SearchHistoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SearchHistoryCleanupService {

    private final SearchHistoryRepository searchHistoryRepository;

    @Value("${pie.search.history.retention-days:30}")
    private int retentionDays;

    public SearchHistoryCleanupService(
            SearchHistoryRepository searchHistoryRepository) {
        this.searchHistoryRepository = searchHistoryRepository;
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void deleteExpiredHistory() {

        LocalDateTime cutoff =
                LocalDateTime.now().minusDays(retentionDays);

        List<SearchHistory> expired =
                searchHistoryRepository.findByCreatedAtBefore(cutoff);

        if (!expired.isEmpty()) {
            searchHistoryRepository.deleteAllInBatch(expired);
        }
    }
}