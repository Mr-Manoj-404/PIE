package com.pie.backend.service;

import com.pie.backend.model.SavedItem;
import com.pie.backend.repository.SavedItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SavedItemService {

    private final SavedItemRepository savedItemRepository;
    private final UserService userService;

    public SavedItemService(
            SavedItemRepository savedItemRepository,
            UserService userService) {

        this.savedItemRepository = savedItemRepository;
        this.userService = userService;
    }

    public SavedItem saveItem(
            UUID userId,
            String title,
            String url,
            String content) {

        userService.getUserById(userId);

        if (url != null &&
                savedItemRepository.existsByUserIdAndUrl(userId, url)) {
            throw new IllegalArgumentException(
                    "This item is already saved"
            );
        }

        SavedItem savedItem = new SavedItem(
                userId,
                title,
                url,
                content
        );

        return savedItemRepository.save(savedItem);
    }

    public List<SavedItem> getSavedItems(UUID userId) {

        userService.getUserById(userId);

        return savedItemRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void deleteSavedItem(
            UUID userId,
            UUID savedItemId) {

        userService.getUserById(userId);

        SavedItem savedItem = savedItemRepository
                .findById(savedItemId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Saved item not found"
                        ));

        if (!savedItem.getUserId().equals(userId)) {
            throw new IllegalArgumentException(
                    "You cannot delete another user's saved item"
            );
        }

        savedItemRepository.delete(savedItem);
    }

    public void clearSavedItems(UUID userId) {

        userService.getUserById(userId);

        List<SavedItem> items =
                savedItemRepository
                        .findByUserIdOrderByCreatedAtDesc(userId);

        if (!items.isEmpty()) {
            savedItemRepository.deleteAllInBatch(items);
        }
    }
}