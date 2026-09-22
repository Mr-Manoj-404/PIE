package com.pie.backend.dto;

import com.pie.backend.model.SearchMode;

import java.time.LocalDateTime;
import java.util.List;

public record SearchResponse(
        String query,
        SearchMode mode,
        String aiAnswer,
        List<SearchResult> results,
        LocalDateTime timestamp
) {
}