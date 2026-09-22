package com.pie.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SearchHistoryResponse(
        UUID id,
        String query,
        String mode,
        LocalDateTime createdAt
) {
}
