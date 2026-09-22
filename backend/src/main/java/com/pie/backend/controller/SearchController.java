package com.pie.backend.controller;

import com.pie.backend.dto.SearchRequest;
import com.pie.backend.dto.SearchResponse;
import com.pie.backend.security.SecurityIdentityService;
import com.pie.backend.service.SearchService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;
    private final SecurityIdentityService securityIdentityService;

    public SearchController(
            SearchService searchService,
            SecurityIdentityService securityIdentityService) {

        this.searchService = searchService;
        this.securityIdentityService =
                securityIdentityService;
    }

    @PostMapping
    public ResponseEntity<SearchResponse> search(
            @Valid @RequestBody SearchRequest request) {

        if (request.userId() != null) {
            securityIdentityService.requireSameUser(
                    request.userId()
            );
        }

        SearchResponse response =
                searchService.search(request);

        return ResponseEntity.ok(response);
    }
}