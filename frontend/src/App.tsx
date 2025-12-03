import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

type TagEvent = {
  id: number;
  tagId: string;
  source: string;
  type: string;
  createdAt: string;
};

type Stats = {
  totalEvents: number;
  uniqueTags: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
};

const API_BASE = "http://localhost:4000";

const Loader: React.FC<{ size?: "sm" | "md" }> = ({ size = "md" }) => (
  <div className={`loader loader-${size}`}>
    <span />
    <span />
    <span />
  </div>
);

const App: React.FC = () => {
  const getPreferredTheme = () => {
    if (typeof window === "undefined") return "dark";
    return (
      (localStorage.getItem("theme") as "light" | "dark" | null) ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    );
  };

  const [theme, setTheme] = useState<"light" | "dark">(getPreferredTheme);
  const [tagId, setTagId] = useState("");
  const [source, setSource] = useState("");
  const [type, setType] = useState("check-in");
  const [events, setEvents] = useState<TagEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const loadData = async () => {
    try {
      setError(null);
      setIsFetching(true);
      const [eventsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/events`),
        fetch(`${API_BASE}/api/stats`),
      ]);

      if (!eventsRes.ok || !statsRes.ok) {
        throw new Error("Failed to load data from API");
      }

      const eventsJson = await eventsRes.json();
      const statsJson = await statsRes.json();

      setEvents(eventsJson);
      setStats(statsJson);
    } catch (err) {
      console.error(err);
      setError("Could not load data from server.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId || !source || !type) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, source, type }),
      });

      if (!res.ok) {
        throw new Error("Failed to create event");
      }

      setTagId("");
      setSource("");
      setType("check-in");

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save event.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const typeEntries = useMemo(
    () => (stats ? Object.entries(stats.eventsByType) : []),
    [stats]
  );
  const sourceEntries = useMemo(
    () => (stats ? Object.entries(stats.eventsBySource) : []),
    [stats]
  );
  const maxType = useMemo(
    () => Math.max(1, ...typeEntries.map(([, count]) => count)),
    [typeEntries]
  );
  const maxSource = useMemo(
    () => Math.max(1, ...sourceEntries.map(([, count]) => count)),
    [sourceEntries]
  );

  const trendEvents = useMemo(() => {
    const ordered = [...events].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return ordered.slice(-12);
  }, [events]);

  const sparkPoints = useMemo(() => {
    if (!trendEvents.length) return "";
    const total = trendEvents.length;
    const segments = trendEvents.map((event, idx) => {
      const x = (idx / Math.max(1, total - 1)) * 100;
      const weight =
        event.type === "alert" ? 0.9 : event.type === "status" ? 0.6 : 0.4;
      const y = 35 - weight * 20 - Math.random() * 4;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    return segments.join(" ");
  }, [trendEvents]);

  const themeLabel = theme === "dark" ? "Dark" : "Light";
  const themeIcon = theme === "dark" ? "🌙" : "☀️";

  return (
    <div className="app-root" data-theme={theme}>
      <div className="app-bg" />
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-pill">ST</span>
            <div>
              <h2>Smart Tag</h2>
              <p>Event Console</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item nav-item-active">
              <span></span>
              Dashboard
            </button>
           { /*} <button className="nav-item">
              <span></span>
              Tags
            </button>
            <button className="nav-item">
              <span></span>
              Settings
            </button>
            <button className="nav-item">
              <span></span>
              Devices
            </button>*/}
          </nav>

          <div className="sidebar-footer">
            <button className="theme-toggle" onClick={toggleTheme}>
              <span className="theme-icon">{themeIcon}</span>
              <span>{themeLabel} mode</span>
            </button>
            <div className="sidebar-stat">
              <p>Total events</p>
              <strong>{stats ? stats.totalEvents : "--"}</strong>
            </div>
          </div>
        </aside>

        <main className="app-shell">
          <header className="app-header">
            <div>
              <p className="eyebrow">Smart Tag Event Tracker</p>
              <h1>Unified event operations</h1>
              <p>
                Simulate IoT / NFC-style events, watch real-time stats, and keep
                your devices in sync.
              </p>
            </div>
            <button className="theme-toggle mobile-only" onClick={toggleTheme}>
              <span className="theme-icon">{themeIcon}</span>
              <span>{themeLabel}</span>
            </button>
          </header>

          {error && (
            <div className="banner banner-error">
              <span>{error}</span>
            </div>
          )}

          <section className="top-grid">
            <section className="card">
              <div className="card-header">
                <h2>Simulate event</h2>
                <p>Add events as if they came from the field.</p>
              </div>

              <form className="form-grid" onSubmit={handleSubmit}>
                <label className="field">
                  <span>Tag ID</span>
                  <input
                    placeholder="e.g. NFC-101, device-01"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Source</span>
                  <input
                    placeholder="e.g. gate-1, kiosk-3"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Event type</span>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="check-in">check-in</option>
                    <option value="alert">alert</option>
                    <option value="status">status</option>
                  </select>
                </label>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Add event"}
                </button>
              </form>
            </section>

            <section className="card card-stats">
              <div className="card-header">
                <h2>Live overview</h2>
                <p>Snapshot of current load.</p>
              </div>

              <div className="stats-grid">
                <div className="stat-pill">
                  <span className="stat-label">Total events</span>
                  <span className="stat-value">
                    {stats ? stats.totalEvents : "--"}
                  </span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">Unique tags</span>
                  <span className="stat-value">
                    {stats ? stats.uniqueTags : "--"}
                  </span>
                </div>
              </div>

              <div className="chart-columns">
                <div className="chart-block">
                  <div className="chart-heading">
                    <h3>Type load</h3>
                    {isFetching && <Loader size="sm" />}
                  </div>
                  {typeEntries.length ? (
                    <div className="bar-chart">
                      {typeEntries.map(([label, count]) => (
                        <div className="bar-row" key={label}>
                          <span>{label}</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${(count / maxType) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="bar-value">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text">Awaiting events…</p>
                  )}
                </div>

                <div className="chart-block">
                  <div className="chart-heading">
                    <h3>Source load</h3>
                    {isFetching && <Loader size="sm" />}
                  </div>
                  {sourceEntries.length ? (
                    <div className="bar-chart">
                      {sourceEntries.map(([label, count]) => (
                        <div className="bar-row" key={label}>
                          <span>{label}</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill alt"
                              style={{
                                width: `${(count / maxSource) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="bar-value">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text">Awaiting sources…</p>
                  )}
                </div>
              </div>
            </section>
          </section>

          <section className="card chart-panel">
            <div className="card-header row-between">
              <div>
                <h2>Traffic trend</h2>
                <p>Last 12 events stream.</p>
              </div>
              <span className="status-pill">
                {trendEvents.length ? `${trendEvents.length} samples` : "Idle"}
              </span>
            </div>

            {trendEvents.length ? (
              <div className="sparkline">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d={sparkPoints} vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            ) : (
              <p className="empty-text">Waiting for events…</p>
            )}
          </section>

          <section className="card">
            <div className="card-header row-between">
              <div>
                <h2>Recent events</h2>
                <p>Latest records arriving from devices.</p>
              </div>
              <button className="btn-ghost" onClick={loadData}>
                {isFetching ? <Loader size="sm" /> : "Refresh"}
              </button>
            </div>

            {isFetching ? (
              <div className="table-loader">
                <Loader />
                <p>Updating feed…</p>
              </div>
            ) : events.length === 0 ? (
              <p className="empty-text">
                No events yet. Add one using the form above.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="events-table">
                  <thead>
                    <tr>
                      <th>Tag</th>
                      <th>Source</th>
                      <th>Type</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td>{e.tagId}</td>
                        <td>{e.source}</td>
                        <td>
                          <span className={`badge badge-${e.type}`}>
                            {e.type}
                          </span>
                        </td>
                        <td>{new Date(e.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="app-footer">
            <span>· Simulated IoT / NFC event tracker</span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
