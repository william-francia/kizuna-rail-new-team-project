document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('trips-table-body');
  const editModal = document.getElementById('edit-trip-modal');
  const editForm = document.getElementById('edit-trip-form');
  const cancelBtn = document.getElementById('cancel-edit-btn');

  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  const pageInfo = document.getElementById('page-info');

  const searchInput = document.getElementById('search-input');
  const regionFilter = document.getElementById('region-filter');
  const seasonFilter = document.getElementById('season-filter');
  const resetBtn = document.getElementById('reset-filters-btn');

  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get('page'), 10) || 1;
  let currentLimit = parseInt(urlParams.get('limit'), 10) || 10;
  let currentSearch = urlParams.get('search') || '';
  let currentRegion = urlParams.get('region') || '';
  let currentSeason = urlParams.get('season') || ''
  ;

  let totalPages = 1;
  let currentTrips = [];
  let searchDebounceTimeout = null;

  if (searchInput) searchInput.value = currentSearch;
  if (regionFilter) regionFilter.value = currentRegion;
  if (seasonFilter) seasonFilter.value = currentSeason;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
  

  async function loadTrips(page = currentPage) {
    try {
      currentPage = page;

      const params = new URLSearchParams();
params.set('page', currentPage);
params.set('limit', currentLimit);
if (currentSearch) params.set('search', currentSearch);
if (currentRegion) params.set('region', currentRegion);

if (currentSeason) {
  params.set('season', currentSeason);
  params.set('bestSeason', currentSeason); 
}

      const response = await fetch(`/api/trips?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load trips');

      const data = await response.json();
      currentTrips = data.trips || data.results || [];
      
      const meta = data.meta || data.pagination || {};
      totalPages = meta.totalPages || 1;
      currentPage = meta.page || meta.currentPage || page;

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, '', newUrl);

      renderTrips(currentTrips);
      updatePaginationControls();
    } catch (error) {
      console.error('Error loading trips:', error);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error loading trips.</td></tr>`;
      }
    }
  }

  function updatePaginationControls() {
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }

  function renderTrips(trips) {
    if (!tableBody) return;

    if (!trips || trips.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No routes found.</td></tr>';
      return;
    }

    tableBody.innerHTML = trips.map(trip => {
      const id = trip._id || trip.id;
      const routeName = esc(trip.name || trip.routeName) || 'N/A';
      const start = esc(trip.startStation || trip.start_station || trip.departureStation || trip.start) || 'N/A';
      const end = esc(trip.endStation || trip.end_station || trip.arrivalStation || trip.end) || 'N/A';

      return `
        <tr data-id="${esc(id)}">
          <td><strong>${routeName}</strong></td>
          <td class="text-capitalize">${esc(trip.region) || 'N/A'}</td>
          <td class="text-capitalize">${start}</td>
          <td class="text-capitalize">${end}</td>
          <td>${esc(trip.duration) || 'N/A'}</td>
          <td>${trip.distance ? esc(trip.distance) + ' km' : 'N/A'}</td>
          <td>
            <div class="action-buttons">
              <button type="button" class="btn btn-edit" data-id="${esc(id)}" aria-label="Edit ${routeName}">Edit</button>
              <button type="button" class="btn btn-delete" data-id="${esc(id)}" aria-label="Delete ${routeName}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        loadTrips(1);
      }, 300);
    });
  }

  if (regionFilter) {
    regionFilter.addEventListener('change', (e) => {
      currentRegion = e.target.value;
      loadTrips(1);
    });
  }

  if (seasonFilter) {
    seasonFilter.addEventListener('change', (e) => {
      currentSeason = e.target.value;
      loadTrips(1);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentSearch = '';
      currentRegion = '';
      currentSeason = '';
      if (searchInput) searchInput.value = '';
      if (regionFilter) regionFilter.value = '';
      if (seasonFilter) seasonFilter.value = '';
      loadTrips(1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) loadTrips(currentPage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) loadTrips(currentPage + 1);
    });
  }

  if (tableBody) {
    tableBody.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.btn-edit');
      const deleteBtn = e.target.closest('.btn-delete');

      if (editBtn) {
        const tripId = editBtn.dataset.id;
        const trip = currentTrips.find(t => String(t._id || t.id) === String(tripId));

        if (trip && editForm) {
          editForm.dataset.tripId = tripId;

          const nameInput = document.getElementById('edit-name');
          const regionInput = document.getElementById('edit-region');
          const startInput = document.getElementById('edit-start');
          const endInput = document.getElementById('edit-end');
          const durationInput = document.getElementById('edit-duration');
          const distanceInput = document.getElementById('edit-distance');

          if (nameInput) nameInput.value = trip.name || trip.routeName || '';
          if (regionInput) regionInput.value = trip.region || '';
          if (startInput) startInput.value = trip.startStation || trip.start_station || trip.departureStation || trip.start || '';
          if (endInput) endInput.value = trip.endStation || trip.end_station || trip.arrivalStation || trip.end || '';
          if (durationInput) durationInput.value = trip.duration || '';
          if (distanceInput) distanceInput.value = trip.distance ?? '';

          if (editModal && typeof editModal.showModal === 'function') {
            editModal.showModal();
          } else if (editModal) {
            editModal.style.display = 'block';
          }
        }
      }

      if (deleteBtn) {
        const tripId = deleteBtn.dataset.id;
        if (confirm('Are you sure you want to delete this trip?')) {
          try {
            const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete trip');
            await loadTrips(currentPage);
          } catch (err) {
            console.error(err);
            alert('Error deleting trip');
          }
        }
      }
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tripId = editForm.dataset.tripId;

      const nameVal = document.getElementById('edit-name')?.value.trim() || '';
      const regionVal = document.getElementById('edit-region')?.value.trim() || '';
      const startVal = document.getElementById('edit-start')?.value.trim() || '';
      const endVal = document.getElementById('edit-end')?.value.trim() || '';
      const durationVal = document.getElementById('edit-duration')?.value.trim() || '';
      const distVal = document.getElementById('edit-distance')?.value || '0';

      const updatedTrip = {
        name: nameVal,
        region: regionVal,
        startStation: startVal,
        start_station: startVal,
        endStation: endVal,
        end_station: endVal,
        duration: durationVal,
        distance: Number(distVal)
      };

      try {
        const res = await fetch(`/api/trips/${tripId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTrip)
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error updating trip');
        }

        closeModal();
        await loadTrips(currentPage);
      } catch (err) {
        console.error('Error al actualizar:', err);
        alert(`Error al actualizar el viaje: ${err.message}`);
      }
    });
  }

  function closeModal() {
    if (editForm) editForm.reset();
    if (editModal && typeof editModal.close === 'function') {
      editModal.close();
    } else if (editModal) {
      editModal.style.display = 'none';
    }
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  loadTrips(currentPage);
});