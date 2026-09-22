package com.pie.backend.controller;

import com.pie.backend.security.SecurityIdentityService;
import com.pie.backend.service.SavedKnowledgeService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/saved")
public class SavedKnowledgeController {

    private final SavedKnowledgeService savedKnowledgeService;
    private final SecurityIdentityService securityIdentityService;

    public SavedKnowledgeController(
            SavedKnowledgeService savedKnowledgeService,
            SecurityIdentityService securityIdentityService) {

        this.savedKnowledgeService =
                savedKnowledgeService;

        this.securityIdentityService =
                securityIdentityService;
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> ask(
            @RequestParam UUID userId,
            @RequestParam String query) {

        securityIdentityService.requireSameUser(userId);

        String answer =
                savedKnowledgeService.ask(
                        userId,
                        query
                );

        return ResponseEntity.ok(
                Map.of("answer", answer)
        );
    }
}