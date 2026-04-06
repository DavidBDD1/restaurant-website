const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// public Ordner freigeben
app.use(express.static(path.join(__dirname, "public")));

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});