document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // DATEN – kommen jetzt aus der echten Datenbank
  // ============================================
  let reservations = [];

  // Status: server speichert 'offen'/'bestätigt'/'storniert' (Deutsch)
  const statusLabels = {
    'offen':      'Offen',
    'bestätigt':  'Bestätigt',
    'storniert':  'Storniert',
  };

  const statusClass = {
    'offen':     'open',
    'bestätigt': 'confirmed',
    'storniert': 'cancelled',
  };

  // ============================================
  // ELEMENTE
  // ============================================
  const navButtons           = document.querySelectorAll('.nav__link');
  const panels               = document.querySelectorAll('.panel');
  const nav                  = document.getElementById('primary-nav');
  const mobileToggle         = document.querySelector('.mobile-nav-toggle');

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
  // HEUTIGES DATUM
  // ============================================
  if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString('de-CH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ============================================
  // API – RESERVIERUNGEN LADEN
  // ============================================
  async function loadReservations() {
    try {
      const res = await fetch('/api/reservations');
      if (!res.ok) throw new Error('Fehler beim Laden');
      const data = await res.json();

      // Datum formatieren: YYYY-MM-DD → DD.MM.YYYY (für Anzeige)
      reservations = data.map(r => ({
        ...r,
        dateFormatted: formatDate(r.date),
        status: r.status || 'offen',
      }));

      populateDateFilters();
      updateAllViews();
    } catch (err) {
      console.error('Laden fehlgeschlagen:', err);
      showToast('Daten konnten nicht geladen werden.', 'error');
    }
  }

  // ============================================
  // API – STATUS ÄNDERN (Bestätigen / Stornieren)
  // ============================================
  async function updateStatus(id, newStatus) {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update fehlgeschlagen');
      await loadReservations();
    } catch (err) {
      showToast('Status konnte nicht geändert werden.', 'error');
    }
  }

  // ============================================
  // API – RESERVIERUNG LÖSCHEN
  // ============================================
  async function deleteReservation(id) {
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      await loadReservations();
    } catch (err) {
      showToast('Reservierung konnte nicht gelöscht werden.', 'error');
    }
  }

  // ============================================
  // API – NEUE RESERVIERUNG SPEICHERN
  // ============================================
  async function saveReservation(data) {
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      await loadReservations();
      showToast(`Reservierung für ${data.name} wurde gespeichert.`, 'success');
      newReservationForm.reset();
    } catch (err) {
      showToast('Reservierung konnte nicht gespeichert werden.', 'error');
    }
  }

  // ============================================
  // HILFSFUNKTIONEN
  // ============================================
  function formatDate(dateStr) {
    if (!dateStr) return '–';
    if (dateStr.includes('.')) return dateStr; // bereits DD.MM.YYYY
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  }

  function statusBadge(status) {
    const cls   = statusClass[status]  || 'open';
    const label = statusLabels[status] || status;
    return `<span class="status status--${cls}">${label}</span>`;
  }

  function filterReservations(dayValue, statusValue = 'all') {
    return reservations.filter(r => {
      const dayMatch    = dayValue    === 'all' || r.dateFormatted === dayValue;
      const statusMatch = statusValue === 'all' || r.status        === statusValue;
      return dayMatch && statusMatch;
    });
  }

  // Datumsfilter dynamisch aus echten Daten befüllen
  function populateDateFilters() {
    const dates = [...new Set(reservations.map(r => r.dateFormatted))].sort();

    [overviewDayFilter, reservationsDayFilter].forEach(sel => {
      if (!sel) return;
      while (sel.options.length > 1) sel.remove(1);
      dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        sel.appendChild(opt);
      });
    });

    if (tablesDayFilter && dates.length) {
      tablesDayFilter.innerHTML = '';
      dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        tablesDayFilter.appendChild(opt);
      });
    }
  }

  // ============================================
  // KPI KARTEN
  // ============================================
  function updateKpis(dayValue) {
    const filtered = filterReservations(dayValue, 'all');
    animateCounter(kpiTotal,     filtered.length);
    animateCounter(kpiOpen,      filtered.filter(r => r.status === 'offen').length);
    animateCounter(kpiConfirmed, filtered.filter(r => r.status === 'bestätigt').length);
  }

  function animateCounter(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / 400, 1);
      el.textContent = Math.round(start + (target - start) * p);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ============================================
  // ÜBERSICHT RENDERN
  // ============================================
  function renderOverview() {
    const dayVal    = overviewDayFilter?.value    || 'all';
    const statusVal = overviewStatusFilter?.value || 'all';
    const filtered  = filterReservations(dayVal, statusVal);

    overviewTbody.innerHTML = filtered.length
      ? filtered.map(r => {
          const isOpen = r.status === 'offen';
          const actions = isOpen
            ? `<button class="small-button confirm-btn"  data-id="${r.id}">✓ Bestätigen</button>
               <button class="danger-button cancel-btn"  data-id="${r.id}">✕ Stornieren</button>`
            : `<button class="danger-button delete-btn"  data-id="${r.id}">🗑 Löschen</button>`;

          return `<tr>
            <td>${r.dateFormatted}</td>
            <td>${r.time}</td>
            <td><strong>${r.name}</strong></td>
            <td>${r.guests} Pers.</td>
            <td>–</td>
            <td>${statusBadge(r.status)}</td>
            <td class="action-group">${actions}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="7" style="color:#9ca3af;text-align:center;padding:32px;">
           Keine Reservierungen gefunden.
         </td></tr>`;

    updateKpis(dayVal);
  }

  // ============================================
  // RESERVIERUNGEN RENDERN
  // ============================================
  function renderReservations() {
    const dayVal   = reservationsDayFilter?.value || 'all';
    const filtered = filterReservations(dayVal, 'all');

    reservationsTbody.innerHTML = filtered.length
      ? filtered.map(r => `<tr>
          <td>${r.dateFormatted}</td>
          <td>${r.time}</td>
          <td><strong>${r.name}</strong></td>
          <td>${r.guests} Pers.</td>
          <td>–</td>
          <td>${statusBadge(r.status)}</td>
        </tr>`).join('')
      : `<tr><td colspan="6" style="color:#9ca3af;text-align:center;padding:32px;">
           Keine Reservierungen für dieses Datum.
         </td></tr>`;
  }

  // ============================================
  // TISCH-ÜBERSICHT RENDERN
  // ============================================
  function renderTables() {
    const dayVal   = tablesDayFilter?.value;
    const filtered = dayVal ? filterReservations(dayVal, 'all') : reservations;

    // Keine Tischnummern in DB → zeige Reservierungen als Liste
    tablesGrid.innerHTML = filtered.length
      ? filtered.map(r => {
          const cls   = statusClass[r.status] || 'open';
          const label = statusLabels[r.status] || r.status;
          return `<article class="table-card table-card--${cls}">
            <h3>${r.name}</h3>
            <p>${label}</p>
            <p style="font-size:.8rem;margin-top:4px;opacity:.7;">${r.dateFormatted} · ${r.time} · ${r.guests} Pers.</p>
          </article>`;
        }).join('')
      : `<p style="color:#9ca3af;padding:20px;">Keine Reservierungen für dieses Datum.</p>`;
  }

  function updateAllViews() {
    renderOverview();
    renderReservations();
    renderTables();
  }

  // ============================================
  // EVENTS – AKTIONEN IN DER TABELLE
  // ============================================
  overviewTbody?.addEventListener('click', async e => {
    const confirmBtn = e.target.closest('.confirm-btn');
    const cancelBtn  = e.target.closest('.cancel-btn');
    const deleteBtn  = e.target.closest('.delete-btn');

    if (confirmBtn) {
      const id   = Number(confirmBtn.dataset.id);
      const item = reservations.find(r => r.id === id);
      await updateStatus(id, 'bestätigt');
      showToast(`${item?.name || 'Reservierung'} bestätigt.`, 'success');
    }
    if (cancelBtn) {
      const id   = Number(cancelBtn.dataset.id);
      const item = reservations.find(r => r.id === id);
      await updateStatus(id, 'storniert');
      showToast(`${item?.name || 'Reservierung'} storniert.`, 'error');
    }
    if (deleteBtn) {
      const id   = Number(deleteBtn.dataset.id);
      const item = reservations.find(r => r.id === id);
      if (confirm(`Reservierung von ${item?.name || 'Gast'} wirklich löschen?`)) {
        await deleteReservation(id);
        showToast('Reservierung gelöscht.', 'error');
      }
    }
  });

  // ============================================
  // EVENTS – NEUE RESERVIERUNG
  // ============================================
  newReservationForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const telefon = document.getElementById('telefon').value.trim();
    const datum   = document.getElementById('datum').value;
    const uhrzeit = document.getElementById('uhrzeit').value;
    const persons = document.getElementById('personen').value;

    if (!name || !datum || !uhrzeit || !persons) {
      showToast('Bitte alle Pflichtfelder ausfüllen.', 'error');
      return;
    }

    await saveReservation({
      name,
      email,
      phone:   telefon,
      date:    datum,       // YYYY-MM-DD – so erwartet der Server
      time:    uhrzeit,
      guests:  parseInt(persons),
      message: document.getElementById('notiz').value.trim(),
    });
  });

  // ============================================
  // EVENTS – FILTER
  // ============================================
  overviewDayFilter?.addEventListener('change', renderOverview);
  overviewStatusFilter?.addEventListener('change', renderOverview);
  reservationsDayFilter?.addEventListener('change', renderReservations);
  tablesDayFilter?.addEventListener('change', renderTables);

  // ============================================
  // NAVIGATION
  // ============================================
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => { b.classList.remove('is-active'); b.removeAttribute('aria-current'); });
      panels.forEach(p => p.classList.remove('is-visible'));
      btn.classList.add('is-active');
      btn.setAttribute('aria-current', 'page');
      document.getElementById(btn.dataset.target)?.classList.add('is-visible');
      if (window.innerWidth <= 900) {
        nav.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  mobileToggle?.addEventListener('click', () => {
    const open = mobileToggle.getAttribute('aria-expanded') === 'true';
    mobileToggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open');
  });

  // ============================================
  // TOAST
  // ============================================
  function showToast(message, type = 'success') {
    document.querySelector('.toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '28px', right: '28px',
      background: type === 'success' ? '#2e7d52' : '#c0392b',
      color: '#fff', padding: '14px 22px', borderRadius: '10px',
      fontFamily: 'var(--font-body)', fontSize: '.95rem', fontWeight: '600',
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)', zIndex: '9999', maxWidth: '320px',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ============================================
  // START – echte Daten aus Datenbank laden
  // ============================================
  loadReservations();
});