document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // MOCK-DATEN (später durch API-Aufrufe ersetzen)
  // ============================================
  const reservations = [
    { id: 1,  date: '09.03.2026', time: '18:00', name: 'Müller',   persons: 2, table: 5,  status: 'open' },
    { id: 2,  date: '09.03.2026', time: '18:30', name: 'Rossi',    persons: 4, table: 12, status: 'confirmed' },
    { id: 3,  date: '09.03.2026', time: '19:00', name: 'Weber',    persons: 2, table: 3,  status: 'open' },
    { id: 4,  date: '09.03.2026', time: '19:30', name: 'Schmidt',  persons: 6, table: 8,  status: 'confirmed' },
    { id: 5,  date: '09.03.2026', time: '20:00', name: 'Ferrari',  persons: 3, table: 2,  status: 'open' },
    { id: 6,  date: '10.03.2026', time: '18:00', name: 'Bianchi',  persons: 2, table: 1,  status: 'open' },
    { id: 7,  date: '10.03.2026', time: '18:30', name: 'Keller',   persons: 5, table: 6,  status: 'confirmed' },
    { id: 8,  date: '10.03.2026', time: '19:00', name: 'Romano',   persons: 2, table: 10, status: 'cancelled' },
    { id: 9,  date: '10.03.2026', time: '20:30', name: 'Huber',    persons: 4, table: 9,  status: 'open' },
    { id: 10, date: '11.03.2026', time: '17:30', name: 'Moretti',  persons: 2, table: 4,  status: 'confirmed' },
    { id: 11, date: '11.03.2026', time: '19:00', name: 'Greco',    persons: 3, table: 7,  status: 'open' },
    { id: 12, date: '11.03.2026', time: '20:00', name: 'Luca',     persons: 6, table: 11, status: 'cancelled' },
  ];

  const statusLabels = {
    open:      'Offen',
    confirmed: 'Bestätigt',
    cancelled: 'Storniert',
  };

  // ============================================
  // ELEMENTE
  // ============================================
  const navButtons          = document.querySelectorAll('.nav__link');
  const panels              = document.querySelectorAll('.panel');
  const nav                 = document.getElementById('primary-nav');
  const mobileToggle        = document.querySelector('.mobile-nav-toggle');

  const overviewDayFilter    = document.getElementById('overview-day-filter');
  const overviewStatusFilter = document.getElementById('overview-status-filter');
  const reservationsDayFilter= document.getElementById('reservations-day-filter');
  const tablesDayFilter      = document.getElementById('tables-day-filter');

  const overviewTbody        = document.getElementById('overview-tbody');
  const reservationsTbody    = document.getElementById('reservations-tbody');
  const tablesGrid           = document.getElementById('tables-grid');

  const kpiTotal             = document.getElementById('kpi-total');
  const kpiOpen              = document.getElementById('kpi-open');
  const kpiConfirmed         = document.getElementById('kpi-confirmed');

  const todayDate            = document.getElementById('today-date');
  const newReservationForm   = document.getElementById('new-reservation-form');

  // ============================================
  // HEUTIGES DATUM ANZEIGEN
  // ============================================
  if (todayDate) {
    const now = new Date();
    todayDate.textContent = now.toLocaleDateString('de-CH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ============================================
  // HILFSFUNKTIONEN
  // ============================================
  function statusBadge(status) {
    return `<span class="status status--${status}">${statusLabels[status] || status}</span>`;
  }

  function filterReservations(dayValue, statusValue = 'all') {
    return reservations.filter(item => {
      const dayMatch    = dayValue    === 'all' || item.date   === dayValue;
      const statusMatch = statusValue === 'all' || item.status === statusValue;
      return dayMatch && statusMatch;
    });
  }

  // ============================================
  // KPI KARTEN
  // ============================================
  function updateKpis(dayValue) {
    const filtered = filterReservations(dayValue, 'all');
    animateCounter(kpiTotal,     filtered.length);
    animateCounter(kpiOpen,      filtered.filter(r => r.status === 'open').length);
    animateCounter(kpiConfirmed, filtered.filter(r => r.status === 'confirmed').length);
  }

  function animateCounter(el, targetValue) {
    if (!el) return;
    const start    = parseInt(el.textContent) || 0;
    const duration = 400;
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(start + (targetValue - start) * progress);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ============================================
  // ÜBERSICHT RENDERN
  // ============================================
  function renderOverview() {
    const dayValue    = overviewDayFilter.value;
    const statusValue = overviewStatusFilter.value;
    const filtered    = filterReservations(dayValue, statusValue);

    overviewTbody.innerHTML = filtered.length
      ? filtered.map(item => {
          const isOpen = item.status === 'open';
          const actions = isOpen
            ? `<button class="small-button confirm-btn" type="button" data-id="${item.id}">✓ Bestätigen</button>
               <button class="danger-button cancel-btn"  type="button" data-id="${item.id}">✕ Stornieren</button>`
            : `<button class="ghost-button" type="button" disabled style="opacity:.5;cursor:default;">–</button>`;
          return `<tr>
            <td>${item.date}</td>
            <td>${item.time}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.persons} Pers.</td>
            <td>Tisch ${item.table}</td>
            <td>${statusBadge(item.status)}</td>
            <td class="action-group">${actions}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="7" style="color:#9ca3af;text-align:center;padding:32px;">
           Keine Reservierungen für die gewählten Filter.
         </td></tr>`;

    updateKpis(dayValue);
  }

  // ============================================
  // RESERVIERUNGEN RENDERN
  // ============================================
  function renderReservations() {
    const dayValue = reservationsDayFilter.value;
    const filtered = filterReservations(dayValue, 'all');

    reservationsTbody.innerHTML = filtered.length
      ? filtered.map(item => `<tr>
          <td>${item.date}</td>
          <td>${item.time}</td>
          <td><strong>${item.name}</strong></td>
          <td>${item.persons} Pers.</td>
          <td>Tisch ${item.table}</td>
          <td>${statusBadge(item.status)}</td>
        </tr>`).join('')
      : `<tr><td colspan="6" style="color:#9ca3af;text-align:center;padding:32px;">
           Keine Reservierungen für dieses Datum.
         </td></tr>`;
  }

  // ============================================
  // TISCH-ÜBERSICHT RENDERN
  // ============================================
  function renderTables() {
    const dayValue = tablesDayFilter.value;
    const filtered = filterReservations(dayValue, 'all');
    const tableMap = new Map(filtered.map(item => [item.table, item]));

    tablesGrid.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map(num => {
      const res = tableMap.get(num);
      let cardClass = 'table-card--free';
      let statusText = '✓ Frei';
      let detail = '';

      if (res) {
        cardClass = `table-card--${res.status}`;
        statusText = statusLabels[res.status];
        detail = `<br><small style="font-size:.8rem;">${res.time} · ${res.name} · ${res.persons} Pers.</small>`;
      }

      return `<article class="table-card ${cardClass}">
        <h3>Tisch ${num}</h3>
        <p>${statusText}${detail}</p>
      </article>`;
    }).join('');
  }

  // ============================================
  // ALLE VIEWS AKTUALISIEREN
  // ============================================
  function updateAllViews() {
    renderOverview();
    renderReservations();
    renderTables();
  }

  // ============================================
  // NAVIGATION
  // ============================================
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;

      navButtons.forEach(btn => {
        btn.classList.remove('is-active');
        btn.removeAttribute('aria-current');
      });
      panels.forEach(panel => panel.classList.remove('is-visible'));

      button.classList.add('is-active');
      button.setAttribute('aria-current', 'page');
      document.getElementById(target)?.classList.add('is-visible');

      // Mobile: Nav nach Klick schliessen
      if (window.innerWidth <= 900) {
        nav.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Mobile Toggle
  mobileToggle?.addEventListener('click', () => {
    const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
    mobileToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });

  // ============================================
  // FILTER EVENTS
  // ============================================
  overviewDayFilter?.addEventListener('change', renderOverview);
  overviewStatusFilter?.addEventListener('change', renderOverview);
  reservationsDayFilter?.addEventListener('change', renderReservations);
  tablesDayFilter?.addEventListener('change', renderTables);

  // ============================================
  // AKTIONEN: BESTÄTIGEN / STORNIEREN
  // ============================================
  overviewTbody?.addEventListener('click', event => {
    const confirmBtn = event.target.closest('.confirm-btn');
    const cancelBtn  = event.target.closest('.cancel-btn');

    if (confirmBtn) {
      const id   = Number(confirmBtn.dataset.id);
      const item = reservations.find(r => r.id === id);
      if (item) {
        item.status = 'confirmed';
        showToast(`Reservierung von ${item.name} bestätigt.`, 'success');
        updateAllViews();
      }
    }

    if (cancelBtn) {
      const id   = Number(cancelBtn.dataset.id);
      const item = reservations.find(r => r.id === id);
      if (item) {
        item.status = 'cancelled';
        showToast(`Reservierung von ${item.name} storniert.`, 'error');
        updateAllViews();
      }
    }
  });

  // ============================================
  // NEUE RESERVIERUNG ANLEGEN
  // ============================================
  newReservationForm?.addEventListener('submit', e => {
    e.preventDefault();
    const name     = document.getElementById('name').value.trim();
    const telefon  = document.getElementById('telefon').value.trim();
    const datum    = document.getElementById('datum').value;
    const uhrzeit  = document.getElementById('uhrzeit').value;
    const personen = document.getElementById('personen').value;
    const tisch    = document.getElementById('tisch').value;

    if (!name || !datum || !uhrzeit || !personen || !tisch) {
      showToast('Bitte alle Pflichtfelder ausfüllen.', 'error');
      return;
    }

    // Datum in deutsches Format umwandeln (YYYY-MM-DD → DD.MM.YYYY)
    const [year, month, day] = datum.split('-');
    const datumFormatted = `${day}.${month}.${year}`;

    const tischNr = parseInt(tisch.replace('Tisch ', ''));
    const newId   = reservations.length ? Math.max(...reservations.map(r => r.id)) + 1 : 1;

    reservations.push({
      id:      newId,
      date:    datumFormatted,
      time:    uhrzeit,
      name:    name,
      persons: parseInt(personen),
      table:   tischNr,
      status:  'open',
    });

    showToast(`Reservierung für ${name} wurde angelegt.`, 'success');
    newReservationForm.reset();
    updateAllViews();
  });

  // ============================================
  // TOAST BENACHRICHTIGUNGEN
  // ============================================
  function showToast(message, type = 'success') {
    // Alten Toast entfernen
    document.querySelector('.toast')?.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    Object.assign(toast.style, {
      position:     'fixed',
      bottom:       '28px',
      right:        '28px',
      background:   type === 'success' ? '#2e7d52' : '#c0392b',
      color:        '#fff',
      padding:      '14px 22px',
      borderRadius: '10px',
      fontFamily:   'var(--font-body)',
      fontSize:     '.95rem',
      fontWeight:   '600',
      boxShadow:    '0 4px 20px rgba(0,0,0,0.18)',
      zIndex:       '9999',
      animation:    'slideIn .25s ease',
      maxWidth:     '320px',
    });

    // CSS Animation inline hinzufügen
    if (!document.getElementById('toast-style')) {
      const style = document.createElement('style');
      style.id = 'toast-style';
      style.textContent = `
        @keyframes slideIn {
          from { opacity:0; transform: translateY(10px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ============================================
  // INIT
  // ============================================
  updateAllViews();
});