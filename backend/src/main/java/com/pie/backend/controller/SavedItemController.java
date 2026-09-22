package com.pie.backend.controller;

import com.pie.backend.model.SavedItem;
import com.pie.backend.security.SecurityIdentityService;
import com.pie.backend.service.SavedItemService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/saved")
public class SavedItemController {

    private final SavedItemService savedItemService;
    private final SecurityIdentityService securityIdentityService;

    public SavedItemController(
            SavedItemService savedItemService,
            SecurityIdentityService securityIdentityService) {

        this.savedItemService =
                savedItemService;

        this.securityIdentityService =
                securityIdentityService;
    }

    @PostMapping
    public ResponseEntity<SavedItem> saveItem(
            @RequestParam UUID userId,
            @RequestParam String title,
            @RequestParam(required = false) String url,
            @RequestParam(required = false) String content) {

        securityIdentityService.requireSameUser(userId);

        return ResponseEntity.ok(
                savedItemService.saveItem(
                        userId,
                        title,
                        url,
                        content
                )
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<SavedItem>> getSavedItems(
            @PathVariable UUID userId) {

        securityIdentityService.requireSameUser(userId);

        return ResponseEntity.ok(
                savedItemService.getSavedItems(userId)
        );
    }

    @DeleteMapping("/{userId}/{savedItemId}")
    public ResponseEntity<Void> deleteSavedItem(
            @PathVariable UUID userId,
            @PathVariable UUID savedItemId) {

        securityIdentityService.requireSameUser(userId);

        savedItemService.deleteSavedItem(
                userId,
                savedItemId
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearSavedItems(
            @PathVariable UUID userId) {

        securityIdentityService.requireSameUser(userId);

        savedItemService.clearSavedItems(userId);

        return ResponseEntity.noContent().build();
    }
}