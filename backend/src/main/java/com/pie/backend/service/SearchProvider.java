package com.pie.backend.service;

import com.pie.backend.dto.SearchResult;

import java.util.List;

public interface SearchProvider {

    List<SearchResult> search(String query);
}
