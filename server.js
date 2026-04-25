const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

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
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT,
 email TEXT,
 date TEXT,
 guests INTEGER,
 status TEXT DEFAULT 'offen'
)
`);

app.get("/api/test", (req,res)=>{
 res.json({message:"Backend läuft!"});
});

app.post("/api/reservations", (req, res) => {
  const { name, email, date, guests } = req.body;

  db.run(
    "INSERT INTO reservations (name, email, date, guests) VALUES (?, ?, ?, ?)",
    [name, email, date, guests],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          message: "Reservierung gespeichert",
          id: this.lastID
        });
      }
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

app.delete("/api/reservations/:id", (req,res) => {
  const id = req.params.id;

  db.run(
    "DELETE FROM reservations WHERE id = ?",
    [id],
    function(err){
      if(err){
        res.status(500).json({error: err.message});
      } else {
        res.json({message:"Reservierung gelöscht"});
      }
    }
  );
});

app.listen(PORT, () => {
 console.log(`Server läuft auf http://localhost:${PORT}`);
});