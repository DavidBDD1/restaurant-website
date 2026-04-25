const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

function berechneAlleBetroffenenSlots(time) {
  const slots = new Set();
  const [h, m] = time.split(':').map(Number);
  const totalMinuten = h * 60 + m;

  for (let i = 0; i < 4; i++) {
    const slotMin = totalMinuten + (i * 30);
    const sh = Math.floor(slotMin / 60);
    const sm = slotMin % 60;
    if (sh > 21 || (sh === 21 && sm > 30)) break;
    slots.add(`${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`);
  }

  for (let i = 1; i < 4; i++) {
    const slotMin = totalMinuten - (i * 30);
    if (slotMin < 660) break;
    const sh = Math.floor(slotMin / 60);
    const sm = slotMin % 60;
    slots.add(`${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`);
  }

  return Array.from(slots);
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./restaurant.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Mit SQLite verbunden.");
  }
});

db.run(`
CREATE TABLE IF NOT EXISTS reservations (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT,
  email   TEXT,
  phone   TEXT,
  date    TEXT,
  time    TEXT,
  guests  INTEGER,
  message TEXT,
  status  TEXT DEFAULT 'offen'
)
`);

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend läuft!" });
});

app.get("/api/check-availability", (req, res) => {
  const { date, time } = req.query;
  if (!date || !time) return res.json({ available: true });

  const zuPruefendeSlots = berechneAlleBetroffenenSlots(time);

  db.get(
    `SELECT SUM(guests) as total FROM reservations 
     WHERE date = ? AND time IN (${zuPruefendeSlots.map(() => '?').join(',')}) 
     AND status != 'storniert'`,
    [date, ...zuPruefendeSlots],
    function (err, row) {
      if (err) return res.status(500).json({ error: err.message });
      const total = row.total || 0;
      const remaining = 20 - total;
      res.json({ available: remaining > 0, remaining: Math.max(0, remaining) });
    }
  );
});

app.get("/api/reservations/find", (req, res) => {
  const { email, date } = req.query;

  db.get(
    "SELECT * FROM reservations WHERE email = ? AND date = ? AND status != 'storniert'",
    [email, date],
    function (err, row) {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
      res.json(row);
    }
  );
});

app.get("/api/reservations", (req, res) => {
  db.all("SELECT * FROM reservations", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post("/api/reservations", (req, res) => {
  const { name, email, phone, date, time, message } = req.body;
  const guests = parseInt(req.body.guests);

  const zuPruefendeSlots = berechneAlleBetroffenenSlots(time);

  db.get(
    `SELECT SUM(guests) as total FROM reservations 
     WHERE date = ? AND time IN (${zuPruefendeSlots.map(() => '?').join(',')}) 
     AND status != 'storniert'`,
    [date, ...zuPruefendeSlots],
    function (err, row) {
      if (err) return res.status(500).json({ error: err.message });

      const total = row.total || 0;
      const remaining = 20 - total;

      if (guests > remaining) {
        return res.status(409).json({
          error: `Nicht genügend Plätze. Noch ${remaining} Plätze in diesem Zeitraum verfügbar.`
        });
      }

      db.run(
        "INSERT INTO reservations (name, email, phone, date, time, guests, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, email, phone, date, time, guests, message],
        function (err) {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json({ message: "Reservierung gespeichert", id: this.lastID });
          }
        }
      );
    }
  );
});

app.put("/api/reservations/:id", (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  db.run(
    "UPDATE reservations SET status = ? WHERE id = ?",
    [status, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: "Status aktualisiert" });
      }
    }
  );
});

app.delete("/api/reservations/:id", (req, res) => {
  const id = req.params.id;

  db.run(
    "DELETE FROM reservations WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: "Reservierung gelöscht" });
      }
    }
  );
});

// 404 – muss immer ganz am Ende stehen!
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});