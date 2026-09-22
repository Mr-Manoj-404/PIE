package com.pie.backend.model;

public enum SearchMode {

    /**
     * Normal PIE search.
     * Search history may be stored according to retention policy.
     */
    ALPHA,

    /**
     * Private PIE search.
     * No search history or persistent user-search data is stored.
     */
    BETA
}
