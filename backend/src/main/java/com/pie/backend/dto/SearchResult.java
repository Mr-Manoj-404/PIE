package com.pie.backend.dto;

public record SearchResult(
        String title,
        String url,
        String snippet
) {
}