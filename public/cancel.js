let gefundeneReservationId = null;

async function sucheReservation() {
  const email = document.getElementById('email').value.trim();
  const date  = document.getElementById('date').value;
  const statusMsg = document.getElementById('status-msg');

  if (!email || !date) {
    statusMsg.textContent = '✗ Bitte E-Mail und Datum eingeben.';
    statusMsg.className = 'error';
    statusMsg.style.display = 'block';
    return;
  }

  try {
    const antwort = await fetch(`/api/reservations/find?email=${encodeURIComponent(email)}&date=${date}`);
    const ergebnis = await antwort.json();

    if (!ergebnis || ergebnis.error || !ergebnis.id) {
      statusMsg.textContent = '✗ Keine Reservation gefunden für diese E-Mail und dieses Datum.';
      statusMsg.className = 'error';
      statusMsg.style.display = 'block';
      document.getElementById('reservation-info').style.display = 'none';
      return;
    }

    statusMsg.style.display = 'none';
    gefundeneReservationId = ergebnis.id;

    const months = ['Januar','Februar','März','April','Mai','Juni',
                    'Juli','August','September','Oktober','November','Dezember'];
    const [year, month, day] = ergebnis.date.split('-');
    const datumFormatiert = `${parseInt(day)}. ${months[parseInt(month)-1]} ${year}`;

    document.getElementById('reservation-details').innerHTML = `
      <div class="success-detail">
        <span class="detail-label">Name</span>
        <span class="detail-value">${ergebnis.name}</span>
      </div>
      <div class="success-detail">
        <span class="detail-label">Datum</span>
        <span class="detail-value">${datumFormatiert}</span>
      </div>
      <div class="success-detail">
        <span class="detail-label">Uhrzeit</span>
        <span class="detail-value">${ergebnis.time} Uhr</span>
      </div>
      <div class="success-detail">
        <span class="detail-label">Personen</span>
        <span class="detail-value">${ergebnis.guests}</span>
      </div>
      <div class="success-detail">
        <span class="detail-label">Status</span>
        <span class="detail-value">${ergebnis.status}</span>
      </div>
    `;

    document.getElementById('reservation-info').style.display = 'block';

    document.getElementById('stornieren-btn').onclick = async function() {
      if (!confirm('Möchten Sie diese Reservation wirklich stornieren?')) return;

      const res = await fetch(`/api/reservations/${gefundeneReservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'storniert' })
      });

      if (res.ok) {
        document.getElementById('reservation-info').style.display = 'none';
        document.getElementById('such-form').style.display = 'none';
        statusMsg.innerHTML = `
          <div class="success-box">
            <div class="success-icon">✓</div>
            <h2>Reservation storniert</h2>
            <p>Ihre Reservation wurde erfolgreich storniert.</p>
            <a href="index.html" class="btn" style="margin-top:1.5rem; display:inline-block;">Zurück zur Startseite</a>
          </div>
        `;
        statusMsg.style.display = 'block';
      } else {
        statusMsg.textContent = '✗ Fehler beim Stornieren. Bitte versuchen Sie es erneut.';
        statusMsg.className = 'error';
        statusMsg.style.display = 'block';
      }
    };

  } catch (err) {
    statusMsg.textContent = '✗ Verbindung fehlgeschlagen. Ist der Server gestartet?';
    statusMsg.className = 'error';
    statusMsg.style.display = 'block';
  }
}