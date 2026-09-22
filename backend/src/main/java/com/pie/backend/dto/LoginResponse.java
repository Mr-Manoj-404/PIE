package com.pie.backend.dto;

import com.pie.backend.model.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record LoginResponse(
        UUID id,
        String name,
        String email,
        LocalDateTime createdAt,
        String token,
        String message
) {

    public static LoginResponse from(
            User user,
            String token) {

        return new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt(),
                token,
                "Login successful"
        );
    }
}