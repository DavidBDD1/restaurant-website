// Heutiges Datum als Minimum setzen
const today = new Date().toISOString().split('T')[0];
document.getElementById('date').setAttribute('min', today);
document.getElementById('time').setAttribute('min', '11:00');
document.getElementById('time').setAttribute('max', '22:00');

const form = document.getElementById('reservation-form');
const statusMsg = document.getElementById('status-msg');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Uhrzeit prüfen
  const time = document.getElementById('time').value;
  const [hours] = time.split(':').map(Number);
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
      form.style.display = 'none';
      statusMsg.innerHTML = `

        <!-- Bestätigung -->
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

        <!-- E-Mail Simulation -->
        <div class="email-preview">
          <div class="email-header">
            <span class="email-label">📧 Simulierte Bestätigungs-E-Mail</span>
          </div>
          <div class="email-body">
            <div class="email-meta">
              <div class="email-meta-row">
                <span class="email-meta-label">Von:</span>
                <span>info@bellaitalia.ch</span>
              </div>
              <div class="email-meta-row">
                <span class="email-meta-label">An:</span>
                <span>${daten.email}</span>
              </div>
              <div class="email-meta-row">
                <span class="email-meta-label">Betreff:</span>
                <span>Reservationsbestätigung – Bella Italia</span>
              </div>
            </div>

            <div class="email-content">
              <div class="email-logo">Bella <span>Italia</span></div>
              <div class="email-flag">
                <div class="eg"></div><div class="ew"></div><div class="er"></div>
              </div>

              <p class="email-greeting">Guten Tag, ${daten.name}</p>
              <p class="email-text">Vielen Dank für Ihre Reservation. Wir freuen uns, Sie bei uns begrüssen zu dürfen!</p>

              <div class="email-details">
                <div class="email-detail-row">
                  <span>📅 Datum</span>
                  <strong>${formatDate(daten.date)}</strong>
                </div>
                <div class="email-detail-row">
                  <span>🕐 Uhrzeit</span>
                  <strong>${daten.time} Uhr</strong>
                </div>
                <div class="email-detail-row">
                  <span>👥 Personen</span>
                  <strong>${daten.guests}</strong>
                </div>
                ${daten.phone ? `
                <div class="email-detail-row">
                  <span>📞 Telefon</span>
                  <strong>${daten.phone}</strong>
                </div>` : ''}
                ${daten.message ? `
                <div class="email-detail-row">
                  <span>💬 Nachricht</span>
                  <strong>${daten.message}</strong>
                </div>` : ''}
              </div>

              <p class="email-text">Bei Fragen erreichen Sie uns unter <strong>041 123 45 67</strong> oder <strong>info@bellaitalia.ch</strong>.</p>
              <p class="email-text">Wir freuen uns auf Ihren Besuch!</p>
              <p class="email-sign">Herzliche Grüsse<br><strong>Das Team von Bella Italia</strong></p>

              <div class="email-footer-bar">
                <p>Bella Italia · Musterstrasse 12 · 6000 Luzern</p>
              </div>
            </div>
          </div>
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

function formatDate(dateStr) {
  const months = ['Januar','Februar','März','April','Mai','Juni',
                  'Juli','August','September','Oktober','November','Dezember'];
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(day)}. ${months[parseInt(month) - 1]} ${year}`;
}