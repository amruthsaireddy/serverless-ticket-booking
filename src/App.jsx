
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import "./App.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function apiRequest(path, options = {}) {
  if (!API) {
    throw new Error("VITE_API_URL is missing from .env");
  }

  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `HTTP ${response.status}`
    );
  }

  return data;
}

function formatDate(date) {
  const [day, month, year] = date.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
  setLoading(true);
  setError("");

  try {
    const [eventData, bookingData] = await Promise.all([
      apiRequest("/events"),
      apiRequest("/bookings"),
    ]);

    setEvents(eventData);
    setBookings(bookingData);
  } catch (err) {
    setError(err.message);
    } finally {
      setLoading(false);
      }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function bookTickets(item) {
    const quantity = Number(quantities[item.eventId] || 1);

    setBusy(item.eventId);
    setNotice("");
    setError("");

    try {
      const booking = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          eventId: item.eventId,
          quantity,
        }),
      });

      setNotice(
        `Booking confirmed! ${booking.bookingId} — Total ₹${booking.totalPrice}`
      );

      await loadData();
    } catch (err) {
      setError(err.message);
      await loadData();
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <nav className="navbar">
          <a className="brand" href="#">evently<span>.</span></a>
          <a className="nav-link" href="#bookings">My bookings ↓</a>
        </nav>

        <div className="hero-content">
          <span className="eyebrow">YOUR CITY. YOUR MOMENTS.</span>
          <h1>Make room for<br /><span>something memorable.</span></h1>
          <p>Discover experiences, find your people, and book your next great day out.</p>
          <a href="#events" className="hero-button">Explore events <span>↗</span></a>
        </div>

        <div className="hero-decoration">✳</div>
        <div className="hero-footer">CHENNAI · INDIA <span>POWERED BY AWS SERVERLESS</span></div>
      </header>

      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="section" id="events">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR NEXT EXPERIENCE</span>
            <h2>What's happening</h2>
          </div>
          <button className="refresh" onClick={loadData}>↻ Refresh</button>
        </div>

        {loading ? (
          <p className="muted">Loading events from AWS...</p>
        ) : events.length === 0 ? (
          <p className="muted">No events available right now.</p>
        ) : (
          <div className="event-grid">
            {events.map((item, index) => (
              <article className="event-card" key={item.eventId}>
                <div className={`event-art art-${index + 1}`}>
                  <span className="category">{item.category}</span>
                  <span className="art-number">0{index + 1}</span>
                  <span className="art-shape">
                    {index === 0 ? "✳" : index === 1 ? "♫" : "◈"}
                  </span>
                  <span className="art-caption">CHENNAI / 2026</span>
                </div>

                <div className="event-content">
                  <div className="event-date">{formatDate(item.date)}</div>
                  <h3>{item.title}</h3>
                  <p className="venue">⌖ {item.venue}</p>

                  <div className="event-meta">
                    <div>
                      <span className="meta-label">TICKET PRICE</span>
                      <strong>₹{item.price}</strong>
                    </div>
                    <div>
                      <span className="meta-label">SEATS LEFT</span>
                      <strong>{item.availableSeats}</strong>
                    </div>
                  </div>
                {Number(item.availableSeats) > 0 ? (
                  <>
                    <div className="booking-controls">
                      <label htmlFor={`quantity-${item.eventId}`}>
                        Tickets
                      </label>

                      <select
                        id={`quantity-${item.eventId}`}
                        value={quantities[item.eventId] || 1}
                        onChange={(e) =>
                          setQuantities((previous) => ({
                            ...previous,
                            [item.eventId]: Number(e.target.value),
                          }))
                        }
                      >
                        {Array.from(
                          { length: Math.min(10, Number(item.availableSeats)) },
                          (_, i) => i + 1
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="book-button"
                      disabled={busy !== ""}
                      onClick={() => bookTickets(item)}
                    >
                      {busy === item.eventId
                        ? "Confirming..."
                        : "Reserve tickets ↗"}
                    </button>
                  </>
                ) : (
                  <div className="sold-out">
                    <span className="sold-out-icon">✓</span>
                    <span>SEATS FILLED</span>
                  </div>
                )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section bookings-section" id="bookings">
        <span className="eyebrow">KEEP YOUR PLANS CLOSE</span>
        <h2>Your bookings</h2>
        {bookings.length === 0 ? (
          <p className="muted">Your confirmed reservations will appear here.</p>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-row" key={booking.bookingId}>
                <div>
                  <span className="confirmed">{booking.status}</span>
                  <h3>{booking.eventTitle}</h3>
                  <p className="muted">
                    {booking.quantity} ticket(s) · {booking.createdAt}
                  </p>
                  <p className="booking-id">Booking ID: {booking.bookingId}</p>
                </div>
                <strong className="booking-total">₹{booking.totalPrice}</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <a className="brand" href="#">evently<span>.</span></a>
        <p>Thoughtful experiences. Seamless bookings.</p>
        <small>CLOUD COMPUTING PROJECT · AWS LAMBDA · API GATEWAY · DYNAMODB</small>
      </footer>
    </main>
  );
}
