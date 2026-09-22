import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

const API_BASE_URL = `${API_ORIGIN}/api/v1`;
const SEARCH_API_URL = `${API_ORIGIN}/api/search`;
const HISTORY_API_URL = `${API_ORIGIN}/api/history`;
const SAVED_API_URL = `${API_ORIGIN}/api/saved`;

const TOKEN_KEY = "pie_token";
const USER_KEY = "pie_user";

/* =========================================================
   AUTHENTICATED API HELPER
   ========================================================= */

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function getStoredUser() {
  try {
    const value = localStorage.getItem(USER_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch {
    return null;
  }
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function apiFetch(url, options = {}) {
  const token = getToken();

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("X-PIE-Token", token);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredAuth();

    window.dispatchEvent(
      new Event("pie-auth-expired")
    );
  }

  return response;
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const storedUser = getStoredUser();
  const storedToken = getToken();

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(
    storedToken && storedUser
      ? storedUser
      : null
  );

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [activePage, setActivePage] =
    useState("home");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchMode, setSearchMode] =
    useState("ALPHA");

  const [searchResults, setSearchResults] =
    useState([]);

  const [aiAnswer, setAiAnswer] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const [searchMessage, setSearchMessage] =
    useState("");

  const [history, setHistory] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyMessage, setHistoryMessage] =
    useState("");

  const [saved, setSaved] =
    useState([]);

  const [savedLoading, setSavedLoading] =
    useState(false);

  const [savedMessage, setSavedMessage] =
    useState("");

  const [savedQuestion, setSavedQuestion] =
    useState("");

  const [savedAnswer, setSavedAnswer] =
    useState("");

  const [
    savedQuestionLoading,
    setSavedQuestionLoading,
  ] = useState(false);

  const [
    savedQuestionMessage,
    setSavedQuestionMessage,
  ] = useState("");

  const [darkMode, setDarkMode] =
    useState(() => localStorage.getItem("pie_dark_mode") === "true");

  const [profileName, setProfileName] =
    useState(storedUser?.name || "");

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  useEffect(() => {
    localStorage.setItem("pie_dark_mode", String(darkMode));
  }, [darkMode]);

  const betaModeActive =
    searchMode === "BETA";

  /* =========================================================
     AUTH
     ========================================================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      if (!data.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      localStorage.setItem(
        TOKEN_KEY,
        data.token
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(data)
      );

      setUser(data);
      setProfileName(data.name || "");
      setPassword("");
      setMessage("");
      setActivePage("home");
      setSearchMode("ALPHA");
    } catch (error) {
      setMessage(
        error.message || "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Registration failed"
        );
      }

      setMessage(
        "Registration successful. You can now sign in."
      );

      setName("");
      setPassword("");
      setIsLogin(true);
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to create account"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetApplicationState = () => {
    setUser(null);

    setName("");
    setEmail("");
    setPassword("");

    setSearchQuery("");
    setSearchResults([]);
    setAiAnswer("");

    setHistory([]);
    setSaved([]);

    setSavedQuestion("");
    setSavedAnswer("");
    setSavedQuestionMessage("");

    setSearchMessage("");
    setHistoryMessage("");
    setSavedMessage("");
    setProfileMessage("");
    setMessage("");

    setActivePage("home");
    setSearchMode("ALPHA");
  };

  const handleLogout = async () => {
    try {
      const token = getToken();

      if (token) {
        await fetch(
          `${API_BASE_URL}/auth/logout`,
          {
            method: "POST",
            headers: {
              "X-PIE-Token": token,
            },
          }
        );
      }
    } catch {
      // Local logout still happens even if
      // the server cannot be reached.
    } finally {
      clearStoredAuth();
      resetApplicationState();
    }
  };

  /* =========================================================
     RESTORE AUTHENTICATED USER
     ========================================================= */

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStoredAuth();
      resetApplicationState();
      setMessage(
        "Your session has expired. Please sign in again."
      );
    };

    window.addEventListener(
      "pie-auth-expired",
      handleAuthExpired
    );

    return () => {
      window.removeEventListener(
        "pie-auth-expired",
        handleAuthExpired
      );
    };
  }, []);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    const loadCurrentUser = async () => {
      try {
        const response = await apiFetch(
          `${API_BASE_URL}/users/me`
        );

        if (!response.ok) {
          clearStoredAuth();
          setUser(null);
          return;
        }

        const data = await readJson(response);

        localStorage.setItem(
          USER_KEY,
          JSON.stringify({
            ...data,
            token,
          })
        );

        setUser({
          ...data,
          token,
        });

        setProfileName(data.name || "");
      } catch {
        // Keep the stored user during temporary
        // network problems.
      }
    };

    loadCurrentUser();
  }, []);

  /* =========================================================
     SAVED ITEMS
     ========================================================= */

  const loadSavedItems = async (
    userId = user?.id
  ) => {
    if (!userId || !getToken()) {
      return;
    }

    setSavedLoading(true);
    setSavedMessage("");

    try {
      const response = await apiFetch(
        `${SAVED_API_URL}/${userId}`
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load saved items"
        );
      }

      setSaved(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      setSavedMessage(
        error.message ||
          "Failed to load saved items"
      );
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && getToken()) {
      loadSavedItems(user.id);
    }
  }, [user?.id]);

  /* =========================================================
     SEARCH HISTORY
     ========================================================= */

  const loadHistory = async (
    userId = user?.id
  ) => {
    if (!userId || !getToken()) {
      return;
    }

    setHistoryLoading(true);
    setHistoryMessage("");

    try {
      const response = await apiFetch(
        `${HISTORY_API_URL}/${userId}`
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load search history"
        );
      }

      setHistory(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      setHistoryMessage(
        error.message ||
          "Failed to load search history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && getToken()) {
      loadHistory(user.id);
    }
  }, [user?.id]);

  /* =========================================================
     SEARCH
     ========================================================= */

  const performSearch = async (
    query = searchQuery
  ) => {
    if (!query.trim()) {
      setSearchMessage(
        "Enter something to search."
      );
      return;
    }

    if (!user?.id || !getToken()) {
      setSearchMessage(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    setSearching(true);
    setSearchMessage("");
    setSearchResults([]);
    setAiAnswer("");

    try {
      const response = await apiFetch(
        SEARCH_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query.trim(),
            mode: searchMode,
            userId: user.id,
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Search failed"
        );
      }

      const results =
        data.results || [];

      const answer =
        data.aiAnswer || "";

      setSearchQuery(query);
      setAiAnswer(answer);
      setSearchResults(results);
      setActivePage("search");

      if (searchMode === "ALPHA") {
        await loadHistory(user.id);
      }
    } catch (error) {
      setSearchMessage(
        error.message || "Search failed"
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    await performSearch();
  };

  const handleSuggestion = async (
    query
  ) => {
    setSearchQuery(query);
    setActivePage("search");

    await performSearch(query);
  };

  /* =========================================================
     SAVED TOGGLE
     ========================================================= */

  const toggleSaved = async (result) => {
    if (
      !user?.id ||
      !result?.url ||
      !getToken()
    ) {
      return;
    }

    const existingItem =
      saved.find(
        (item) =>
          item.url === result.url
      );

    setSavedMessage("");

    try {
      if (existingItem) {
        const response = await apiFetch(
          `${SAVED_API_URL}/${user.id}/${existingItem.id}`,
          {
            method: "DELETE",
          }
        );

        const data =
          await readJson(response);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to remove saved item"
          );
        }

        setSaved((previous) =>
          previous.filter(
            (item) =>
              item.id !== existingItem.id
          )
        );

        return;
      }

      const params =
        new URLSearchParams();

      params.append(
        "userId",
        user.id
      );

      params.append(
        "title",
        result.title ||
          "Untitled result"
      );

      params.append(
        "url",
        result.url
      );

      if (result.content) {
        params.append(
          "content",
          result.content
        );
      }

      const response = await apiFetch(
        `${SAVED_API_URL}?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const data =
        await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save result"
        );
      }

      setSaved((previous) => [
        data,
        ...previous.filter(
          (item) =>
            item.url !== result.url
        ),
      ]);
    } catch (error) {
      setSavedMessage(
        error.message ||
          "Unable to update saved items"
      );
    }
  };

  const isSaved = (result) => {
    return saved.some(
      (item) =>
        item.url === result?.url
    );
  };

  /* =========================================================
     SAVED KNOWLEDGE AI
     ========================================================= */

  const askSavedKnowledge = async (
    e
  ) => {
    e.preventDefault();

    if (!savedQuestion.trim()) {
      setSavedQuestionMessage(
        "Enter a question first."
      );
      return;
    }

    if (!user?.id || !getToken()) {
      setSavedQuestionMessage(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    setSavedQuestionLoading(true);
    setSavedQuestionMessage("");
    setSavedAnswer("");

    try {
      const params =
        new URLSearchParams();

      params.append(
        "userId",
        user.id
      );

      params.append(
        "query",
        savedQuestion.trim()
      );

      const response = await apiFetch(
        `${SAVED_API_URL}/ask?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const data =
        await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to ask your saved knowledge"
        );
      }

      setSavedAnswer(
        data.answer || ""
      );
    } catch (error) {
      setSavedQuestionMessage(
        error.message ||
          "Unable to answer from saved knowledge"
      );
    } finally {
      setSavedQuestionLoading(false);
    }
  };

  /* =========================================================
     HISTORY MANAGEMENT
     ========================================================= */

  const deleteHistoryItem = async (
    historyId
  ) => {
    if (!user?.id || !getToken()) {
      return;
    }

    setHistoryMessage("");

    try {
      const response = await apiFetch(
        `${HISTORY_API_URL}/${user.id}/${historyId}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete history item"
        );
      }

      setHistory((previous) =>
        previous.filter(
          (item) =>
            item.id !== historyId
        )
      );
    } catch (error) {
      setHistoryMessage(
        error.message ||
          "Unable to delete history"
      );
    }
  };

  const clearHistory = async () => {
    if (
      !user?.id ||
      !getToken() ||
      history.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Clear all search history?"
      );

    if (!confirmed) {
      return;
    }

    setHistoryLoading(true);
    setHistoryMessage("");

    try {
      const response = await apiFetch(
        `${HISTORY_API_URL}/${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to clear search history"
        );
      }

      setHistory([]);
    } catch (error) {
      setHistoryMessage(
        error.message ||
          "Unable to clear history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  /* =========================================================
     SAVED CLEAR
     ========================================================= */

  const clearSaved = async () => {
    if (
      !user?.id ||
      !getToken() ||
      saved.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove all saved items?"
      );

    if (!confirmed) {
      return;
    }

    setSavedLoading(true);
    setSavedMessage("");

    try {
      const response = await apiFetch(
        `${SAVED_API_URL}/${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to clear saved items"
        );
      }

      setSaved([]);
    } catch (error) {
      setSavedMessage(
        error.message ||
          "Unable to clear saved items"
      );
    } finally {
      setSavedLoading(false);
    }
  };

  /* =========================================================
     PROFILE
     ========================================================= */

  const saveProfile = async (e) => {
    e.preventDefault();

    const trimmedName =
      profileName.trim();

    if (trimmedName.length < 2) {
      setProfileMessage(
        "Name must contain at least 2 characters."
      );
      return;
    }

    if (!getToken()) {
      setProfileMessage(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    setProfileSaving(true);
    setProfileMessage("");

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/users/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data =
        await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update profile"
        );
      }

      const updatedUser = {
        ...user,
        ...data,
        token: getToken(),
      };

      setUser(updatedUser);
      setProfileName(
        data.name || trimmedName
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(updatedUser)
      );

      setProfileMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      setProfileMessage(
        error.message ||
          "Unable to update profile"
      );
    } finally {
      setProfileSaving(false);
    }
  };

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const navigate = (page) => {
    setActivePage(page);

    setSearchMessage("");
    setHistoryMessage("");
    setSavedMessage("");
    setProfileMessage("");

    if (
      page === "history" &&
      user?.id
    ) {
      loadHistory(user.id);
    }

    if (
      page === "saved" &&
      user?.id
    ) {
      loadSavedItems(user.id);
    }

    if (page === "profile") {
      setProfileName(
        user?.name || ""
      );
    }
  };

  const changeSearchMode = (
    mode
  ) => {
    setSearchMode(mode);
    setSearchMessage("");

    if (mode === "BETA") {
      setActivePage("search");
      setSearchResults([]);
      setAiAnswer("");
    }
  };

  /* =====================================================
     LOGIN SCREEN
     ===================================================== */

  if (!user) {
    return (
      <div className="auth-app">
        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>

        <div className="auth-layout">

          <section className="auth-showcase">

            <div className="showcase-content">

              <div className="brand large-brand">
                <img className="pie-symbol" src="/pie-logo.png" alt="PIE" />

                <div className="brand-text">
                  <span className="brand-name">
                    PIE
                  </span>

                  <span className="brand-subtitle">
                    Personal Intelligence Engine
                  </span>
                </div>
              </div>

              <div className="showcase-copy">

                <span className="eyebrow">
                  THE INTELLIGENCE LAYER
                </span>

                <h1>
                  Information,
                  <br />
                  <span>reimagined.</span>
                </h1>

                <p>
                  Search, discover and explore information
                  through your personal intelligence engine.
                </p>

              </div>

              <div className="showcase-orbit">

                <div className="orbit-ring ring-one"></div>
                <div className="orbit-ring ring-two"></div>

                <div className="orbit-core">
                  <img src="/pie-logo.png" alt="PIE" />
                </div>

                <div className="orbit-dot dot-one"></div>
                <div className="orbit-dot dot-two"></div>
                <div className="orbit-dot dot-three"></div>

              </div>

              <div className="feature-row">

                <div>
                  <span>✦</span>
                  <strong>Intelligent</strong>
                </div>

                <div>
                  <span>◉</span>
                  <strong>Private</strong>
                </div>

                <div>
                  <span>⌁</span>
                  <strong>Connected</strong>
                </div>

              </div>

            </div>

          </section>

          <section className="auth-panel">

            <div className="auth-card">

              <div className="mobile-brand">

                <img className="pie-symbol" src="/pie-logo.png" alt="PIE" />

                <span>PIE</span>

              </div>

              <div className="auth-heading">

                <span className="eyebrow">
                  {isLogin
                    ? "WELCOME BACK"
                    : "GET STARTED"}
                </span>

                <h2>
                  {isLogin
                    ? "Sign in to PIE"
                    : "Create your PIE"}
                </h2>

                <p>
                  {isLogin
                    ? "Continue your intelligent journey."
                    : "Build your personal intelligence space."}
                </p>

              </div>

              <div className="tabs">

                <button
                  className={
                    isLogin
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() => {
                    setIsLogin(true);
                    setMessage("");
                  }}
                >
                  Sign In
                </button>

                <button
                  className={
                    !isLogin
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() => {
                    setIsLogin(false);
                    setMessage("");
                  }}
                >
                  Create Account
                </button>

              </div>

              {message && (
                <div
                  className={
                    message
                      .toLowerCase()
                      .includes("successful")
                      ? "message success"
                      : "message error"
                  }
                >
                  <span>
                    {message
                      .toLowerCase()
                      .includes("successful")
                      ? "✓"
                      : "!"}
                  </span>

                  {message}

                </div>
              )}

              {isLogin ? (

                <form
                  onSubmit={handleLogin}
                  className="auth-form"
                >

                  <div className="input-group">

                    <label>Email</label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="input-group">

                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                    />

                  </div>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="button-spinner"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <span>→</span>
                      </>
                    )}
                  </button>

                </form>

              ) : (

                <form
                  onSubmit={handleRegister}
                  className="auth-form"
                >

                  <div className="input-group">

                    <label>Name</label>

                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="input-group">

                    <label>Email</label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="input-group">

                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                    />

                  </div>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="button-spinner"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account
                        <span>→</span>
                      </>
                    )}
                  </button>

                </form>

              )}

              <div className="auth-footer">
                <span>PIE</span>
                <span>
                  Personal intelligence, beautifully simple.
                </span>
              </div>

            </div>

          </section>

        </div>
      </div>
    );
  }


  /* =========================================================
     MAIN APPLICATION
     ========================================================= */

  return (
    <div
      className={
        darkMode
          ? betaModeActive
            ? "pie-app dark beta-mode"
            : "pie-app dark"
          : betaModeActive
          ? "pie-app beta-mode"
          : "pie-app"
      }
    >

      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      {/* =====================================================
          SIDEBAR
         ===================================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <img className="pie-symbol" src="/pie-logo.png" alt="PIE" />

          <div className="brand-text">

            <strong className="brand-name">
              PIE
            </strong>

            <span className="brand-subtitle">
              Personal Intelligence
            </span>

          </div>

        </div>

        <div className="sidebar-section">

          <span className="sidebar-label">
            WORKSPACE
          </span>

          <button
            className={
              activePage === "home"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("home")
            }
          >
            <span>⌂</span>
            Home
          </button>

          <button
            className={
              activePage === "search"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("search")
            }
          >
            <span>⌕</span>
            Search
          </button>

          <button
            className={
              activePage === "history"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("history")
            }
          >
            <span>◷</span>
            History
          </button>

          <button
            className={
              activePage === "saved"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("saved")
            }
          >
            <span>☆</span>
            Saved
          </button>

        </div>

        <div className="sidebar-section">

          <span className="sidebar-label">
            ACCOUNT
          </span>

          <button
            className={
              activePage === "profile"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("profile")
            }
          >
            <span>◉</span>
            Profile
          </button>

          <button
            className={
              activePage === "settings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>

        </div>

        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="sidebar-avatar">
              {user.name
                ?.charAt(0)
                ?.toUpperCase()}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {user.name}
              </strong>

              <span>
                {user.email}
              </span>
            </div>

          </div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Logout"
          >
            ↪
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
         ===================================================== */}

      <div className="main-area">

        <header className="app-header">

          <div className="mobile-logo">

            <img className="pie-symbol" src="/pie-logo.png" alt="PIE" />

            <strong>
              PIE
            </strong>

          </div>

          <div className="header-title">

            <span>
              {betaModeActive
                ? "PIE BETA // Neural Workspace"
                : activePage === "home"
                ? "Home"
                : activePage === "search"
                ? "Search"
                : activePage === "history"
                ? "History"
                : activePage === "saved"
                ? "Saved"
                : activePage === "profile"
                ? "Profile"
                : "Settings"}
            </span>

          </div>

          <div className="header-actions">

            <button
              className="theme-button"
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
              title="Toggle appearance"
            >
              {darkMode
                ? "☀"
                : "☾"}
            </button>

            <button
              className="header-avatar"
              onClick={() =>
                navigate("profile")
              }
            >
              {user.name
                ?.charAt(0)
                ?.toUpperCase()}
            </button>

          </div>

        </header>

        <main className="page-content">

          {/* =================================================
              HOME
             ================================================= */}

          {activePage === "home" && (
            <section className="page home-page">

              <div className="home-hero">

                <div className="hero-badge">

                  <span className="status-dot"></span>

                  PIE Intelligence Online

                </div>

                <h1>
                  What can I help you
                  <span>
                    {" "}discover?
                  </span>
                </h1>

                <p>
                  Search the web, explore
                  information and let PIE bring
                  the intelligence to you.
                </p>

                <form
                  className="search-box"
                  onSubmit={handleSearch}
                >

                  <div className="search-icon">
                    ⌕
                  </div>

                  <input
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    placeholder="Ask PIE anything..."
                  />

                  <button
                    className="search-button"
                    type="submit"
                    disabled={searching}
                  >
                    {searching
                      ? "Searching..."
                      : "Search"}
                  </button>

                </form>

                <ModeSelector
                  searchMode={searchMode}
                  onModeChange={
                    changeSearchMode
                  }
                />

                {searchMessage && (
                  <div className="search-error">
                    {searchMessage}
                  </div>
                )}

              </div>

              <QuickSuggestions
                onSelect={
                  handleSuggestion
                }
              />

            </section>
          )}

          {/* =================================================
              SEARCH
             ================================================= */}

          {activePage === "search" &&
            !betaModeActive && (
              <section className="page search-page">

                <div className="page-intro">

                  <span className="eyebrow">
                    SEARCH
                  </span>

                  <h1>
                    Explore with PIE
                  </h1>

                  <p>
                    Ask anything and PIE will
                    search the web and build an
                    intelligent answer.
                  </p>

                </div>

                <form
                  className="search-box search-page-box"
                  onSubmit={handleSearch}
                >

                  <div className="search-icon">
                    ⌕
                  </div>

                  <input
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    placeholder="Ask PIE anything..."
                  />

                  <button
                    className="search-button"
                    type="submit"
                    disabled={searching}
                  >
                    {searching
                      ? "Searching..."
                      : "Search"}
                  </button>

                </form>

                <ModeSelector
                  searchMode={searchMode}
                  onModeChange={
                    changeSearchMode
                  }
                />

                {searchMessage && (
                  <div className="search-error">
                    {searchMessage}
                  </div>
                )}

                {searching ? (
                  <LoadingState />
                ) : (
                  <>
                    {aiAnswer && (
                      <AIAnswer
                        answer={aiAnswer}
                      />
                    )}

                    {searchResults.length >
                      0 && (
                      <Results
                        results={
                          searchResults
                        }
                        toggleSaved={
                          toggleSaved
                        }
                        isSaved={
                          isSaved
                        }
                      />
                    )}
                  </>
                )}

              </section>
            )}

          {/* =================================================
              BETA NEURAL WORKSPACE
             ================================================= */}

          {activePage === "search" &&
            betaModeActive && (
              <section className="beta-search-page">

                <div className="beta-neural-hero">

                  <div className="beta-core-mark">

                    <div className="beta-core-ring">
                      β
                    </div>

                  </div>

                  <span className="beta-eyebrow">
                    BETA INTELLIGENCE MODE
                  </span>

                  <h1>
                    Think beyond
                    the obvious.
                  </h1>

                  <p>
                    BETA gives you a focused
                    search workspace with a
                    distinct neural interface.
                  </p>

                  <form
                    className="beta-search-box"
                    onSubmit={handleSearch}
                  >

                    <div className="beta-search-icon">
                      ⌕
                    </div>

                    <input
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(
                          e.target.value
                        )
                      }
                      placeholder="Ask PIE BETA anything..."
                    />

                    <button
                      className="beta-search-button"
                      type="submit"
                      disabled={searching}
                    >
                      {searching
                        ? "Thinking..."
                        : "Explore"}
                    </button>

                  </form>

                  <div className="beta-mode-strip">

                    <span>
                      β BETA ACTIVE
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        changeSearchMode(
                          "ALPHA"
                        )
                      }
                    >
                      Return to Alpha
                    </button>

                  </div>

                  {searchMessage && (
                    <div className="search-error beta-search-error">
                      {searchMessage}
                    </div>
                  )}

                </div>

                {searching ? (
                  <LoadingState />
                ) : (
                  <>
                    {aiAnswer && (
                      <AIAnswer
                        answer={aiAnswer}
                        betaMode
                      />
                    )}

                    {searchResults.length >
                      0 && (
                      <Results
                        results={
                          searchResults
                        }
                        toggleSaved={
                          toggleSaved
                        }
                        isSaved={
                          isSaved
                        }
                        betaMode
                      />
                    )}

                    {!searching &&
                      !aiAnswer &&
                      searchResults.length ===
                        0 && (
                        <div className="beta-empty-state">

                          <div className="empty-icon">
                            β
                          </div>

                          <h2>
                            Neural workspace ready
                          </h2>

                          <p>
                            Enter a question above
                            to begin your BETA
                            exploration.
                          </p>

                        </div>
                      )}
                  </>
                )}

              </section>
            )}

          {/* =================================================
              HISTORY
             ================================================= */}

          {activePage === "history" && (
            <section className="page">

              <div className="page-intro history-intro">

                <div>

                  <span className="eyebrow">
                    YOUR ACTIVITY
                  </span>

                  <h1>
                    Search History
                  </h1>

                  <p>
                    Your ALPHA searches saved
                    by PIE.
                  </p>

                </div>

                {history.length > 0 && (
                  <button
                    className="secondary-button"
                    onClick={
                      clearHistory
                    }
                  >
                    Clear history
                  </button>
                )}

              </div>

              {historyMessage && (
                <div className="search-error">
                  {historyMessage}
                </div>
              )}

              {historyLoading ? (
                <LoadingState />
              ) : history.length ===
                0 ? (
                <div className="empty-state">

                  <div className="empty-icon">
                    ◷
                  </div>

                  <h2>
                    No search history
                  </h2>

                  <p>
                    Your ALPHA searches will
                    appear here.
                  </p>

                </div>
              ) : (
                <div className="history-list">

                  {history.map(
                    (item, index) => (
                      <div
                        className="history-row"
                        key={
                          item.id ||
                          `${item.query}-${index}`
                        }
                      >

                        <button
                          className="history-delete"
                          onClick={() =>
                            deleteHistoryItem(
                              item.id
                            )
                          }
                          title="Delete search"
                        >
                          ×
                        </button>

                        <button
                          className="history-item-main"
                          onClick={() => {
                            setSearchQuery(
                              item.query
                            );

                            setSearchMode(
                              "ALPHA"
                            );

                            setActivePage(
                              "search"
                            );

                            performSearch(
                              item.query
                            );
                          }}
                        >

                          <span className="history-icon">
                            ⌕
                          </span>

                          <span className="history-query">
                            {item.query}
                          </span>

                          <span className="history-time">
                            {item.createdAt
                              ? new Date(
                                  item.createdAt
                                ).toLocaleString()
                              : ""}
                          </span>

                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>
          )}

          {/* =================================================
              SAVED
             ================================================= */}

          {activePage === "saved" && (
            <section className="page">

              <div className="page-intro history-intro">

                <div>

                  <span className="eyebrow">
                    YOUR LIBRARY
                  </span>

                  <h1>
                    Saved
                  </h1>

                  <p>
                    Keep useful search results
                    close.
                  </p>

                </div>

                {saved.length > 0 && (
                  <button
                    className="secondary-button"
                    onClick={clearSaved}
                  >
                    Clear saved
                  </button>
                )}

              </div>

              {saved.length > 0 && (
                <section className="saved-knowledge-section">

                  <div className="saved-knowledge-header">

                    <div>

                      <span className="eyebrow">
                        PERSONAL KNOWLEDGE
                      </span>

                      <h2>
                        Ask your saved knowledge
                      </h2>

                      <p>
                        Ask a question and PIE
                        will answer using the
                        information you have
                        saved.
                      </p>

                    </div>

                    <span className="saved-knowledge-badge">
                      ✦ PIE
                    </span>

                  </div>

                  <form
                    className="saved-knowledge-form"
                    onSubmit={
                      askSavedKnowledge
                    }
                  >

                    <div className="saved-knowledge-input-wrap">

                      <span className="saved-knowledge-icon">
                        ⌕
                      </span>

                      <input
                        value={
                          savedQuestion
                        }
                        onChange={(e) =>
                          setSavedQuestion(
                            e.target.value
                          )
                        }
                        placeholder="Ask something about your saved items..."
                        disabled={
                          savedQuestionLoading
                        }
                      />

                    </div>

                    <button
                      className="saved-knowledge-button"
                      type="submit"
                      disabled={
                        savedQuestionLoading
                      }
                    >
                      {savedQuestionLoading
                        ? "Thinking..."
                        : "Ask"}
                    </button>

                  </form>

                  {savedQuestionMessage && (
                    <div className="search-error">
                      {
                        savedQuestionMessage
                      }
                    </div>
                  )}

                  {savedAnswer && (
                    <div className="saved-knowledge-answer">

                      <div className="saved-knowledge-answer-icon">
                        ✦
                      </div>

                      <div className="saved-knowledge-answer-content">

                        <ReactMarkdown
                          components={{
                            a: ({
                              node,
                              ...props
                            }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noreferrer"
                              />
                            ),
                          }}
                        >
                          {
                            savedAnswer
                          }
                        </ReactMarkdown>

                      </div>

                    </div>
                  )}

                </section>
              )}

              {savedMessage && (
                <div className="search-error">
                  {savedMessage}
                </div>
              )}

              {savedLoading ? (
                <LoadingState />
              ) : saved.length ===
                0 ? (
                <div className="empty-state">

                  <div className="empty-icon">
                    ☆
                  </div>

                  <h2>
                    Nothing saved yet
                  </h2>

                  <p>
                    Save useful results from
                    your searches to see them
                    here.
                  </p>

                </div>
              ) : (
                <Results
                  results={saved}
                  saved={saved}
                  toggleSaved={
                    toggleSaved
                  }
                  isSaved={isSaved}
                />
              )}

            </section>
          )}

          {/* =================================================
              PROFILE
             ================================================= */}

          {activePage === "profile" && (
            <section className="page">

              <div className="page-intro">

                <span className="eyebrow">
                  ACCOUNT
                </span>

                <h1>
                  Your Profile
                </h1>

                <p>
                  Manage your PIE account
                  information.
                </p>

              </div>

              <div className="profile-card">

                <div className="profile-main">

                  <div className="profile-avatar">
                    {user.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <div>

                    <h2>
                      {user.name}
                    </h2>

                    <p>
                      {user.email}
                    </p>

                  </div>

                </div>

                <form
                  className="profile-edit-form"
                  onSubmit={saveProfile}
                >

                  <label className="profile-field">

                    <span>
                      Name
                    </span>

                    <input
                      value={
                        profileName
                      }
                      onChange={(e) =>
                        setProfileName(
                          e.target.value
                        )
                      }
                      minLength={2}
                      maxLength={100}
                      required
                    />

                  </label>

                  <label className="profile-field">

                    <span>
                      Email
                    </span>

                    <input
                      value={
                        user.email || ""
                      }
                      disabled
                    />

                  </label>

                  <button
                    className="profile-save-button"
                    type="submit"
                    disabled={
                      profileSaving
                    }
                  >
                    {profileSaving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                  {profileMessage && (
                    <div className="profile-message">
                      {profileMessage}
                    </div>
                  )}

                </form>

                <div className="profile-details">

                  <ProfileDetail
                    label="Name"
                    value={user.name}
                  />

                  <ProfileDetail
                    label="Email"
                    value={user.email}
                  />

                  <ProfileDetail
                    label="User ID"
                    value={user.id}
                  />

                  <ProfileDetail
                    label="Account Created"
                    value={
                      user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleString()
                        : "—"
                    }
                  />

                </div>

              </div>

              <button
                className="danger-button"
                onClick={handleLogout}
              >
                Sign Out
              </button>

            </section>
          )}

          {/* =================================================
              SETTINGS
             ================================================= */}

          {activePage === "settings" && (
            <section className="page">

              <div className="page-intro">

                <span className="eyebrow">
                  PREFERENCES
                </span>

                <h1>
                  Settings
                </h1>

                <p>
                  Customize your PIE
                  experience.
                </p>

              </div>

              <div className="settings-list">

                <div className="setting-card">

                  <div className="setting-icon blue">
                    ◐
                  </div>

                  <div className="setting-content">

                    <strong>
                      Appearance
                    </strong>

                    <span>
                      Choose between light and
                      dark appearance.
                    </span>

                  </div>

                  <button
                    className="switch"
                    onClick={() =>
                      setDarkMode(
                        !darkMode
                      )
                    }
                  >

                    <span
                      className={
                        darkMode
                          ? "switch-thumb active"
                          : "switch-thumb"
                      }
                    ></span>

                  </button>

                </div>

                <div className="setting-card">

                  <div className="setting-icon purple">
                    β
                  </div>

                  <div className="setting-content">

                    <strong>
                      Search Mode
                    </strong>

                    <span>
                      Current mode:{" "}
                      {searchMode}
                    </span>

                  </div>

                  <button
                    className="setting-action"
                    onClick={() =>
                      changeSearchMode(
                        searchMode ===
                          "ALPHA"
                          ? "BETA"
                          : "ALPHA"
                      )
                    }
                  >
                    Switch
                  </button>

                </div>

                <div className="setting-card">

                  <div className="setting-icon green">
                    ✓
                  </div>

                  <div className="setting-content">

                    <strong>
                      Account Security
                    </strong>

                    <span>
                      PIE protects your API
                      resources using your
                      authenticated session.
                    </span>

                  </div>

                  <span className="setting-status">
                    Active
                  </span>

                </div>

                <div className="setting-card">

                  <div className="setting-icon orange">
                    ◷
                  </div>

                  <div className="setting-content">

                    <strong>
                      Alpha History
                    </strong>

                    <span>
                      Only ALPHA searches are
                      stored in PIE history.
                    </span>

                  </div>

                </div>

                <div className="setting-card">

                  <div className="setting-icon violet">
                    ☆
                  </div>

                  <div className="setting-content">

                    <strong>
                      Saved Knowledge
                    </strong>

                    <span>
                      Your saved items are
                      scoped to your account.
                    </span>

                  </div>

                </div>

              </div>

            </section>
          )}

        </main>

        {/* =================================================
            MOBILE NAV
           ================================================= */}

        <nav className="mobile-nav">

          <button
            className={
              activePage === "home"
                ? "mobile-nav-item active"
                : "mobile-nav-item"
            }
            onClick={() =>
              navigate("home")
            }
          >
            <span>⌂</span>
            <small>Home</small>
          </button>

          <button
            className={
              activePage === "search"
                ? "mobile-nav-item active"
                : "mobile-nav-item"
            }
            onClick={() =>
              navigate("search")
            }
          >
            <span>⌕</span>
            <small>Search</small>
          </button>

          <button
            className={
              activePage === "history"
                ? "mobile-nav-item active"
                : "mobile-nav-item"
            }
            onClick={() =>
              navigate("history")
            }
          >
            <span>◷</span>
            <small>History</small>
          </button>

          <button
            className={
              activePage === "saved"
                ? "mobile-nav-item active"
                : "mobile-nav-item"
            }
            onClick={() =>
              navigate("saved")
            }
          >
            <span>☆</span>
            <small>Saved</small>
          </button>

          <button
            className={
              activePage === "settings"
                ? "mobile-nav-item active"
                : "mobile-nav-item"
            }
            onClick={() =>
              navigate("settings")
            }
          >
            <span>⚙</span>
            <small>Settings</small>
          </button>

        </nav>

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function ModeSelector({
  searchMode,
  onModeChange,
}) {
  return (
    <div className="mode-selector">

      <button
        type="button"
        className={
          searchMode === "ALPHA"
            ? "mode active"
            : "mode"
        }
        onClick={() =>
          onModeChange("ALPHA")
        }
      >

        <span className="mode-icon alpha-icon">
          ✦
        </span>

        <span>

          <strong>
            ALPHA
          </strong>

          <small>
            Standard search
          </small>

        </span>

      </button>

      <button
        type="button"
        className={
          searchMode === "BETA"
            ? "mode active beta-active"
            : "mode"
        }
        onClick={() =>
          onModeChange("BETA")
        }
      >

        <span className="mode-icon beta-icon">
          ◉
        </span>

        <span>

          <strong>
            BETA
          </strong>

          <small>
            Focused search
          </small>

        </span>

      </button>

    </div>
  );
}

function QuickSuggestions({
  onSelect,
}) {
  return (
    <section className="quick-section">

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            EXPLORE
          </span>

          <h2>
            Try asking PIE
          </h2>

        </div>

      </div>

      <div className="suggestion-grid">

        <button
          onClick={() =>
            onSelect(
              "Latest artificial intelligence news"
            )
          }
        >

          <span>
            ✦
          </span>

          <div>

            <strong>
              AI & Technology
            </strong>

            <small>
              Latest developments and news
            </small>

          </div>

          <b>
            →
          </b>

        </button>

        <button
          onClick={() =>
            onSelect(
              "Latest technology trends"
            )
          }
        >

          <span>
            ◈
          </span>

          <div>

            <strong>
              Technology Trends
            </strong>

            <small>
              Discover what's happening now
            </small>

          </div>

          <b>
            →
          </b>

        </button>

        <button
          onClick={() =>
            onSelect(
              "Best programming languages to learn"
            )
          }
        >

          <span>
            ⌘
          </span>

          <div>

            <strong>
              Programming
            </strong>

            <small>
              Learn, build and explore
            </small>

          </div>

          <b>
            →
          </b>

        </button>

      </div>

    </section>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">

      <div className="loading-orb"></div>

      <h2>
        PIE is thinking...
      </h2>

      <p>
        Searching the web and gathering
        relevant information.
      </p>

    </div>
  );
}

function AIAnswer({
  answer,
  betaMode = false,
}) {
  return (
    <section
      className={
        betaMode
          ? "ai-answer-section beta-ai-answer"
          : "ai-answer-section"
      }
    >

      <div className="ai-answer-header">

        <div>

          <span className="eyebrow">
            PIE INTELLIGENCE
          </span>

          <h2>
            AI Answer
          </h2>

        </div>

        <span className="ai-answer-badge">
          ✦ Gemini
        </span>

      </div>

      <div className="ai-answer-card">

        <div className="ai-answer-icon">
          ✦
        </div>

        <div className="ai-answer-content">

          <ReactMarkdown
            components={{
              a: ({
                node,
                ...props
              }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noreferrer"
                />
              ),
            }}
          >
            {answer}
          </ReactMarkdown>

        </div>

      </div>

    </section>
  );
}

function Results({
  results,
  toggleSaved,
  isSaved,
  betaMode = false,
}) {
  return (
    <div
      className={
        betaMode
          ? "results-section beta-results-section"
          : "results-section"
      }
    >

      <div className="results-header">

        <div>

          <span className="eyebrow">
            RESULTS
          </span>

          <h2>
            What PIE found
          </h2>

        </div>

        <span className="results-count">
          {results.length} results
        </span>

      </div>

      <div className="results-grid">

        {results.map(
          (result, index) => (
            <article
              className="result-card"
              key={
                result.url ||
                result.title ||
                index
              }
            >

              <div className="result-top">

                <span className="result-number">
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>

                <button
                  className={
                    isSaved(result)
                      ? "save-button saved"
                      : "save-button"
                  }
                  onClick={() =>
                    toggleSaved(
                      result
                    )
                  }
                  title={
                    isSaved(result)
                      ? "Remove from saved"
                      : "Save result"
                  }
                >
                  {isSaved(result)
                    ? "★"
                    : "☆"}
                </button>

              </div>

              <h3>
                {result.title ||
                  "Untitled result"}
              </h3>

              {(result.content ||
                result.snippet) && (
                <p>
                  {result.content ||
                    result.snippet}
                </p>
              )}

              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="result-link"
                >
                  Open source
                  <span>
                    ↗
                  </span>
                </a>
              )}

            </article>
          )
        )}

      </div>

    </div>
  );
}

function ProfileDetail({
  label,
  value,
}) {
  return (
    <div className="profile-detail">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}

export default App;