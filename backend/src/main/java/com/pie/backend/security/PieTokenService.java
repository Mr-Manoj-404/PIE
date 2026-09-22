package com.pie.backend.security;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PieTokenService {

    private final SecureRandom secureRandom = new SecureRandom();

    private final ConcurrentHashMap<String, UUID> sessions =
            new ConcurrentHashMap<>();

    public String createToken(UUID userId) {

        byte[] bytes = new byte[32];

        secureRandom.nextBytes(bytes);

        String token =
                Base64.getUrlEncoder()
                        .withoutPadding()
                        .encodeToString(bytes);

        sessions.put(token, userId);

        return token;
    }

    public UUID getUserId(String token) {

        if (token == null || token.isBlank()) {
            return null;
        }

        return sessions.get(token);
    }

    public void revoke(String token) {

        if (token != null) {
            sessions.remove(token);
        }
    }
}