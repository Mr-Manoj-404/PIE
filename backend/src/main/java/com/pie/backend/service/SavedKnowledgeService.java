package com.pie.backend.service;

import com.pie.backend.model.SavedItem;
import com.pie.backend.repository.SavedItemRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SavedKnowledgeService {

    private static final int MAX_CONTEXT_CHARS = 12000;

    private final SavedItemRepository savedItemRepository;
    private final UserService userService;
    private final GeminiService geminiService;

    public SavedKnowledgeService(
            SavedItemRepository savedItemRepository,
            UserService userService,
            GeminiService geminiService) {

        this.savedItemRepository =
                savedItemRepository;

        this.userService =
                userService;

        this.geminiService =
                geminiService;
    }

    public String ask(
            UUID userId,
            String query) {

        userService.getUserById(userId);

        List<SavedItem> items =
                savedItemRepository
                        .findByUserIdOrderByCreatedAtDesc(
                                userId
                        );

        if (items.isEmpty()) {

            return "You don't have any saved knowledge yet. "
                    + "Save a few useful results first.";
        }

        String context =
                buildContext(items);

        try {

            return geminiService
                    .generateSavedKnowledgeAnswer(
                            query,
                            context
                    );

        } catch (Exception exception) {

            throw new IllegalStateException(
                    "Unable to generate an answer from saved knowledge",
                    exception
            );
        }
    }

    private String buildContext(
            List<SavedItem> items) {

        StringBuilder context =
                new StringBuilder();

        for (int i = 0;
             i < items.size();
             i++) {

            SavedItem item =
                    items.get(i);

            String block =
                    "Saved item [" + (i + 1) + "]\n"
                    + "Title: "
                    + safe(item.getTitle())
                    + "\n"
                    + "URL: "
                    + safe(item.getUrl())
                    + "\n"
                    + "Content: "
                    + safe(item.getContent())
                    + "\n\n";

            if (context.length()
                    + block.length()
                    > MAX_CONTEXT_CHARS) {

                break;
            }

            context.append(block);
        }

        return context.toString();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}