// Heutiges Datum als Minimum setzen (kein Datum in der Vergangenheit)
const today = new Date().toISOString().split('T')[0];
document.getElementById('date').setAttribute('min', today);

// Standard-Uhrzeit setzen
document.getElementById('time').setAttribute('min', '11:00');
document.getElementById('time').setAttribute('max', '22:00');

const form = document.getElementById('reservation-form');
const statusMsg = document.getElementById('status-msg');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Uhrzeit prüfen
  const time = document.getElementById('time').value;
  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 11 || hours >= 22) {
    statusMsg.textContent = '✗ Bitte wählen Sie eine Uhrzeit zwischen 11:00 und 22:00 Uhr.';
    statusMsg.className = 'error';
    statusMsg.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Wird gesendet...';
  statusMsg.className = '';
  statusMsg.style.display = 'none';

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
    const antwort = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daten)
    });

    const ergebnis = await antwort.json();

    if (antwort.ok) {
      // Formular verstecken und Bestätigung zeigen
      form.style.display = 'none';
      statusMsg.innerHTML = `
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h2>Vielen Dank, ${daten.name}!</h2>
          <p>Ihre Reservation wurde erfolgreich gesendet.</p>
          <div class="success-details">
            <div class="success-detail">
              <span class="detail-label">Datum</span>
              <span class="detail-value">${formatDate(daten.date)}</span>
            </div>
            <div class="success-detail">
              <span class="detail-label">Uhrzeit</span>
              <span class="detail-value">${daten.time} Uhr</span>
            </div>
            <div class="success-detail">
              <span class="detail-label">Personen</span>
              <span class="detail-value">${daten.guests}</span>
            </div>
            <div class="success-detail">
              <span class="detail-label">E-Mail</span>
              <span class="detail-value">${daten.email}</span>
            </div>
          </div>
          <p class="success-note">Wir werden uns in Kürze bei Ihnen melden.</p>
          <a href="index.html" class="btn" style="margin-top:1.5rem; display:inline-block;">Zurück zur Startseite</a>
        </div>
      `;
      statusMsg.style.display = 'block';
      statusMsg.className = '';
      window.scrollTo(0, 0);
    } else {
      statusMsg.textContent = '✗ Fehler: ' + (ergebnis.error || 'Unbekannter Fehler.');
      statusMsg.className = 'error';
      statusMsg.style.display = 'block';
    }

  } catch (fehler) {
    statusMsg.textContent = '✗ Verbindung zum Server fehlgeschlagen. Ist der Server gestartet?';
    statusMsg.className = 'error';
    statusMsg.style.display = 'block';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Reservation absenden';
});

// Datum formatieren: 2025-06-15 → 15. Juni 2025
function formatDate(dateStr) {
  const months = ['Januar','Februar','März','April','Mai','Juni',
                  'Juli','August','September','Oktober','November','Dezember'];
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(day)}. ${months[parseInt(month) - 1]} ${year}`;
}