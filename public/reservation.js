// Datum minimum heute
const today = new Date().toISOString().split('T')[0];
document.getElementById('date').setAttribute('min', today);
document.getElementById('time').setAttribute('min', '11:00');
document.getElementById('time').setAttribute('max', '22:00');

const form = document.getElementById('reservation-form');
const statusMsg = document.getElementById('status-msg');
const submitBtn = document.getElementById('submit-btn');

// Verfügbarkeit prüfen wenn Datum oder Uhrzeit geändert wird
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const availabilityMsg = document.getElementById('availability-msg');

async function pruefeVerfuegbarkeit() {
  const date = dateInput.value;
  const time = timeInput.value;

  if (!date || !time) return;

  availabilityMsg.textContent = '⏳ Verfügbarkeit wird geprüft...';
  availabilityMsg.className = 'availability checking';
  availabilityMsg.style.display = 'block';

  try {
    const antwort = await fetch(`/api/check-availability?date=${date}&time=${time}`);
    const ergebnis = await antwort.json();

if (ergebnis.available) {
      availabilityMsg.textContent = `✓ Noch ${ergebnis.remaining} Plätze verfügbar!`;
      availabilityMsg.className = 'availability available';
    } else {
      availabilityMsg.textContent = '✗ Dieser Zeitpunkt ist leider ausgebucht. Bitte wählen Sie eine andere Zeit.';
      availabilityMsg.className = 'availability unavailable';
    }
  } catch (err) {
    availabilityMsg.style.display = 'none';
  }
}

dateInput.addEventListener('change', pruefeVerfuegbarkeit);
timeInput.addEventListener('change', pruefeVerfuegbarkeit);

// ===== VALIDIERUNGSFUNKTIONEN =====

function istGueltigeEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function istGueltigeTelefon(phone) {
  if (!phone) return true; // Telefon ist optional
  const cleaned = phone.replace(/\s/g, '');
  return /^[+0][0-9]{9,14}$/.test(cleaned);
}

function istGueltigeUhrzeit(time) {
  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 11) return false;
  if (hours > 21) return false;
  if (hours === 21 && minutes > 30) return false;
  return true;
}

function istGueltigesDatum(date) {
  const gewählt = new Date(date);
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  return gewählt >= heute;
}

function zeigeFormularFehler(nachricht) {
  statusMsg.textContent = '✗ ' + nachricht;
  statusMsg.className = 'error';
  statusMsg.style.display = 'block';
  window.scrollTo(0, statusMsg.offsetTop - 20);
}

// ===== FORMULAR ABSENDEN =====
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const daten = {
    name:    document.getElementById('name').value.trim(),
    email:   document.getElementById('email').value.trim(),
    phone:   document.getElementById('phone').value.trim(),
    date:    document.getElementById('date').value,
    time:    document.getElementById('time').value,
    guests:  document.getElementById('guests').value,
    message: document.getElementById('message').value.trim()
  };

  // ===== VALIDIERUNG =====
  if (!daten.name || daten.name.length < 2) {
    zeigeFormularFehler('Bitte geben Sie einen gültigen Namen ein (mindestens 2 Zeichen).');
    return;
  }

  if (!istGueltigeEmail(daten.email)) {
    zeigeFormularFehler('Bitte geben Sie eine gültige E-Mail-Adresse ein (z.B. name@beispiel.ch).');
    return;
  }

  if (!istGueltigeTelefon(daten.phone)) {
    zeigeFormularFehler('Bitte geben Sie eine gültige Telefonnummer ein (z.B. 041 123 45 67 oder +41791234567).');
    return;
  }

  if (!daten.date) {
    zeigeFormularFehler('Bitte wählen Sie ein Datum aus.');
    return;
  }

  if (!istGueltigesDatum(daten.date)) {
    zeigeFormularFehler('Das gewählte Datum liegt in der Vergangenheit. Bitte wählen Sie ein zukünftiges Datum.');
    return;
  }

  if (!daten.time) {
    zeigeFormularFehler('Bitte wählen Sie eine Uhrzeit aus.');
    return;
  }

  if (!istGueltigeUhrzeit(daten.time)) {
    zeigeFormularFehler('Unsere Öffnungszeiten sind 11:00 – 21:30 Uhr. Bitte wählen Sie eine Uhrzeit innerhalb dieser Zeiten.');
    return;
  }

  if (!daten.guests || daten.guests < 1 || daten.guests > 20) {
    zeigeFormularFehler('Bitte geben Sie eine gültige Personenanzahl ein (1 – 20 Personen).');
    return;
  }

  // ===== ABSENDEN =====
  submitBtn.disabled = true;
  submitBtn.textContent = 'Wird gesendet...';
  statusMsg.style.display = 'none';

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

        <div class="email-preview">
          <div class="email-header">
            <span class="email-label">📧 Simulierte Bestätigungs-E-Mail</span>
          </div>
          <div class="email-body">
            <div class="email-meta">
              <div class="email-meta-row"><span class="email-meta-label">Von:</span><span>info@bellaitalia.ch</span></div>
              <div class="email-meta-row"><span class="email-meta-label">An:</span><span>${daten.email}</span></div>
              <div class="email-meta-row"><span class="email-meta-label">Betreff:</span><span>Reservationsbestätigung – Bella Italia</span></div>
            </div>
            <div class="email-content">
              <div class="email-logo">Bella <span>Italia</span></div>
              <div class="email-flag"><div class="eg"></div><div class="ew"></div><div class="er"></div></div>
              <p class="email-greeting">Guten Tag, ${daten.name}</p>
              <p class="email-text">Vielen Dank für Ihre Reservation. Wir freuen uns, Sie bei uns begrüssen zu dürfen!</p>
              <div class="email-details">
                <div class="email-detail-row"><span>📅 Datum</span><strong>${formatDate(daten.date)}</strong></div>
                <div class="email-detail-row"><span>🕐 Uhrzeit</span><strong>${daten.time} Uhr</strong></div>
                <div class="email-detail-row"><span>👥 Personen</span><strong>${daten.guests}</strong></div>
                ${daten.phone ? `<div class="email-detail-row"><span>📞 Telefon</span><strong>${daten.phone}</strong></div>` : ''}
                ${daten.message ? `<div class="email-detail-row"><span>💬 Nachricht</span><strong>${daten.message}</strong></div>` : ''}
              </div>
              <p class="email-text">Bei Fragen erreichen Sie uns unter <strong>041 123 45 67</strong> oder <strong>info@bellaitalia.ch</strong>.</p>
              <p class="email-sign">Herzliche Grüsse<br><strong>Das Team von Bella Italia</strong></p>
              <div class="email-footer-bar"><p>Bella Italia · Musterstrasse 12 · 6000 Luzern</p></div>
            </div>
          </div>
        </div>
      `;
      statusMsg.style.display = 'block';
      window.scrollTo(0, 0);

    } else if (antwort.status === 409) {
      zeigeFormularFehler('Für dieses Datum und diese Uhrzeit ist bereits eine Reservation vorhanden. Bitte wählen Sie eine andere Zeit.');
    } else {
      zeigeFormularFehler('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    }

  } catch (fehler) {
    zeigeFormularFehler('Verbindung zum Server fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung.');
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