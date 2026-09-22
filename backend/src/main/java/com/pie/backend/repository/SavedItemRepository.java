package com.pie.backend.repository;

import com.pie.backend.model.SavedItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SavedItemRepository extends JpaRepository<SavedItem, UUID> {

    List<SavedItem> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByUserIdAndUrl(UUID userId, String url);
}