package com.pie.backend.controller;

import com.pie.backend.model.SearchHistory;
import com.pie.backend.security.SecurityIdentityService;
import com.pie.backend.service.SearchHistoryService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/history")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;
    private final SecurityIdentityService securityIdentityService;

    public SearchHistoryController(
            SearchHistoryService searchHistoryService,
            SecurityIdentityService securityIdentityService) {

        this.searchHistoryService =
                searchHistoryService;

        this.securityIdentityService =
                securityIdentityService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<SearchHistory>> getHistory(
            @PathVariable UUID userId) {

        securityIdentityService.requireSameUser(userId);

        return ResponseEntity.ok(
                searchHistoryService
                        .getAlphaSearchHistory(userId)
        );
    }

    @DeleteMapping("/{userId}/{historyId}")
    public ResponseEntity<Void> deleteHistoryItem(
            @PathVariable UUID userId,
            @PathVariable UUID historyId) {

        securityIdentityService.requireSameUser(userId);

        searchHistoryService.deleteHistoryItem(
                userId,
                historyId
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearHistory(
            @PathVariable UUID userId) {

        securityIdentityService.requireSameUser(userId);

        searchHistoryService.clearHistory(userId);

        return ResponseEntity.noContent().build();
    }
}