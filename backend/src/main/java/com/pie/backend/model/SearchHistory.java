package com.pie.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "search_history",
        indexes = {
                @Index(name = "idx_search_history_user", columnList = "user_id"),
                @Index(name = "idx_search_history_created", columnList = "created_at")
        }
)
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 2000)
    private String query;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SearchMode mode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public SearchHistory() {
    }

    public SearchHistory(UUID userId, String query, SearchMode mode) {
        this.userId = userId;
        this.query = query;
        this.mode = mode;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getQuery() {
        return query;
    }

    public SearchMode getMode() {
        return mode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}