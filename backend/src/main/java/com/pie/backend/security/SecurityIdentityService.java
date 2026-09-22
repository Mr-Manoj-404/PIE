package com.pie.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SecurityIdentityService {

    public UUID currentUserId() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "Authentication required"
            );
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UUID uuid) {
            return uuid;
        }

        if (principal instanceof String value) {
            try {
                return UUID.fromString(value);
            } catch (IllegalArgumentException ignored) {
                // Continue to the standard error below.
            }
        }

        throw new IllegalStateException(
                "Unable to determine authenticated user"
        );
    }

    public void requireSameUser(UUID requestedUserId) {

        if (requestedUserId == null) {
            throw new IllegalArgumentException(
                    "User ID is required"
            );
        }

        UUID authenticatedUserId = currentUserId();

        if (!authenticatedUserId.equals(requestedUserId)) {
            throw new IllegalArgumentException(
                    "You cannot access another user's data"
            );
        }
    }
}