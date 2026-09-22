package com.pie.backend.dto;

import com.pie.backend.model.SearchMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SearchRequest(

        @NotBlank(message = "Search query cannot be empty")
        @Size(max = 2000, message = "Search query cannot exceed 2000 characters")
        String query,

        @NotNull(message = "Search mode must be specified")
        SearchMode mode,

        @NotNull(message = "User ID must be specified")
        UUID userId
) {
}
