const form = document.getElementById('reservation-form');
const statusMsg = document.getElementById('status-msg');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async function (e) {
  e.preventDefault(); // Seite nicht neu laden

  // Button deaktivieren während dem Senden
  submitBtn.disabled = true;
  submitBtn.textContent = 'Wird gesendet...';
  statusMsg.className = '';
  statusMsg.style.display = 'none';

  // Daten aus dem Formular lesen
  const daten = {
    name:    document.getElementById('name').value,
    email:   document.getElementById('email').value,
    phone:   document.getElementById('phone').value,
    date:    document.getElementById('date').value,
    time:    document.getElementById('time').value,
    guests:  document.getElementById('guests').value,
    message: document.getElementById('message').value
  };

  try {
    // An das Backend senden
    const antwort = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daten)
    });

    const ergebnis = await antwort.json();

    if (antwort.ok) {
      // Erfolg
      statusMsg.textContent = '✓ Ihre Reservation wurde erfolgreich gesendet. Wir melden uns bald!';
      statusMsg.className = 'success';
      statusMsg.style.display = 'block';
      form.reset();
    } else {
      // Fehler vom Server
      statusMsg.textContent = '✗ Fehler: ' + (ergebnis.error || 'Unbekannter Fehler.');
      statusMsg.className = 'error';
      statusMsg.style.display = 'block';
    }

  } catch (fehler) {
    // Verbindungsfehler
    statusMsg.textContent = '✗ Verbindung zum Server fehlgeschlagen. Ist der Server gestartet?';
    statusMsg.className = 'error';
    statusMsg.style.display = 'block';
  }

  // Button wieder aktivieren
  submitBtn.disabled = false;
  submitBtn.textContent = 'Reservation absenden';
});