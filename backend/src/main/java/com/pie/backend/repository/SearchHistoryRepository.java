package com.pie.backend.repository;

import com.pie.backend.model.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SearchHistoryRepository
        extends JpaRepository<SearchHistory, UUID> {

    List<SearchHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<SearchHistory> findByCreatedAtBefore(LocalDateTime cutoff);
}