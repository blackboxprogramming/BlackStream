import React, { useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError('Could not connect to the BlackStream API. Is the API Gateway running?');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="logo-text">BlackStream</h1>
        <p className="tagline">Discover content across all your streaming services</p>
      </header>

      <main className="App-main">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="search-input"
            type="text"
            placeholder="Search shows, movies, genres, or platforms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search content"
          />
          <button className="search-button" type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {results && (
          <section className="results-section">
            <p className="results-count">
              {results.total} result{results.total !== 1 ? 's' : ''} for &ldquo;{results.query}&rdquo;
            </p>
            {results.results.length === 0 ? (
              <p className="no-results">No titles found. Try a different search.</p>
            ) : (
              <ul className="results-list">
                {results.results.map((item) => (
                  <li key={item.id} className="result-card">
                    <div className="result-title">{item.title}</div>
                    <div className="result-meta">
                      <span className="result-platform">{item.platform}</span>
                      <span className="result-genre">{item.genre}</span>
                      <span className="result-year">{item.year}</span>
                      <span className="result-rating">★ {item.rating}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
