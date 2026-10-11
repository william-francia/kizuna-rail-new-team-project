const PAGE_SIZE = 10;

const statusMessage = document.querySelector('#bookings-status');
const bookingList = document.querySelector('#bookings-list');
const bookingRowTemplate = document.querySelector('#booking-row-template');
const prevButton = document.querySelector('#page-prev');
const nextButton = document.querySelector('#page-next');
const pageInfo = document.querySelector('#page-info');

const filterForm = document.querySelector('#bookings-filter');
const ticketClassSelect = document.querySelector('#filter-ticket-class');
const fromInput = document.querySelector('#filter-from');
const toInput = document.querySelector('#filter-to');
const clearButton = document.querySelector('#filter-clear');

// Start from whatever the URL says: ?page=2&ticketClass=premium&from=2026-10-01&to=2026-10-31
const urlParams = new URLSearchParams(window.location.search);

let currentPage = Number.parseInt(urlParams.get('page'), 10) || 1;
if (currentPage < 1) currentPage = 1;

let filters = {
    ticketClass: urlParams.get('ticketClass') || '',
    from: urlParams.get('from') || '',
    to: urlParams.get('to') || '',
};

const hasActiveFilters = () => Boolean(filters.ticketClass || filters.from || filters.to);

// Redirect to login if the session expired while the page was open
const redirectIfUnauthorized = (response) => {
    if (response.status === 401) {
        window.location.href = '/login';
        return true;
    }
    return false;
};

const readErrorMessage = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    return data.message || data.error || fallback;
};

// Date inputs give a calendar date. Send the start and end of that day in the
// browser's own time zone, so "Booked to Oct 31" includes the whole local day.
const startOfLocalDay = (dateText) => new Date(`${dateText}T00:00:00`).toISOString();
const endOfLocalDay = (dateText) => new Date(`${dateText}T23:59:59.999`).toISOString();

const fetchBookings = async (page) => {
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });

    if (filters.ticketClass) params.set('ticketClass', filters.ticketClass);
    if (filters.from) params.set('from', startOfLocalDay(filters.from));
    if (filters.to) params.set('to', endOfLocalDay(filters.to));

    const response = await fetch(`/api/bookings?${params}`, { credentials: 'same-origin' });

    if (redirectIfUnauthorized(response)) return null;
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to load bookings.'));
    }
    return response.json();
};

const updateBookingRequest = async (id, updates) => {
    const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });

    if (redirectIfUnauthorized(response)) return null;
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to update booking.'));
    }
    return response.json();
};

const deleteBookingRequest = async (id) => {
    const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
    });

    if (redirectIfUnauthorized(response)) return null;
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to delete booking.'));
    }
    return response.json();
};

const renderBookings = (bookings) => {
    const fragment = document.createDocumentFragment();

    bookings.forEach((booking) => {
        const passengers = booking.passengers || [];
        const row = bookingRowTemplate.content.cloneNode(true);

        row.querySelector('.booking-code').textContent = booking.id;
        row.querySelector('.booking-route').textContent = booking.routeId;
        row.querySelector('.booking-schedule').textContent = booking.scheduleId;
        row.querySelector('.booking-ticket').textContent = booking.ticketClass;
        row.querySelector('.booking-day').textContent = booking.selectedDay;
        row.querySelector('.booking-passenger-count').textContent = passengers.length;
        row.querySelector('.booking-passengers').textContent = passengers
            .map((passenger) => `${passenger.firstName} ${passenger.lastName}`)
            .join(', ');
        row.querySelector('.booking-created').textContent = new Date(booking.createdAt)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        row.querySelector('.btn-edit').addEventListener('click', async () => {
            const newTicketClass = window.prompt('Ticket class (e.g. standard, premium):', booking.ticketClass);
            if (newTicketClass === null) return;

            const newDay = window.prompt('Travel day (e.g. monday):', booking.selectedDay);
            if (newDay === null) return;

            try {
                const result = await updateBookingRequest(booking.id, {
                    ticketClass: newTicketClass,
                    selectedDay: newDay,
                });
                if (!result) return;
                await loadBookings(currentPage);
            } catch (error) {
                statusMessage.textContent = error.message;
            }
        });

        row.querySelector('.btn-delete').addEventListener('click', async () => {
            if (!window.confirm(`Delete booking ${booking.id}? This cannot be undone.`)) return;

            try {
                const result = await deleteBookingRequest(booking.id);
                if (!result) return;
                await loadBookings(currentPage);
            } catch (error) {
                statusMessage.textContent = error.message;
            }
        });

        fragment.append(row);
    });

    bookingList.replaceChildren(fragment);
};

const renderPagination = ({ page, totalPages, total, limit }) => {
    prevButton.disabled = page <= 1;
    nextButton.disabled = page >= totalPages;
    pageInfo.textContent = `Page ${page} of ${totalPages}`;

    if (total === 0) {
        statusMessage.textContent = hasActiveFilters()
            ? 'No bookings match these filters.'
            : 'No bookings yet, or none match your account.';
        return;
    }

    const first = (page - 1) * limit + 1;
    const last = Math.min(page * limit, total);
    statusMessage.textContent =
        `Showing ${first}-${last} of ${total} booking${total === 1 ? '' : 's'}` +
        `${hasActiveFilters() ? ' (filtered)' : ''}.`;
};

// Keep page and filters in the address bar so a refresh or shared link shows the same view
const syncUrl = () => {
    const params = new URLSearchParams({ page: currentPage });

    if (filters.ticketClass) params.set('ticketClass', filters.ticketClass);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

    window.history.replaceState(null, '', `?${params}`);
};

const loadBookings = async (page = currentPage) => {
    statusMessage.textContent = 'Loading bookings...';

    try {
        const data = await fetchBookings(page);
        if (!data) return; // redirected to login

        // The last item on the last page was deleted: step back to the new last page
        if (data.bookings.length === 0 && data.total > 0 && page > data.totalPages) {
            return loadBookings(data.totalPages);
        }

        currentPage = data.page;
        renderBookings(data.bookings);
        renderPagination(data);
        syncUrl();
    } catch (error) {
        bookingList.replaceChildren();
        prevButton.disabled = true;
        nextButton.disabled = true;
        statusMessage.textContent = 'Bookings could not be loaded. Refresh the page to try again.';
    }
};

// Fill the ticket class dropdown from the ticket classes API
const loadTicketClassOptions = async () => {
    try {
        const response = await fetch('/api/ticket-classes', { credentials: 'same-origin' });
        if (!response.ok) return;

        const ticketClasses = await response.json();
        if (!Array.isArray(ticketClasses)) return;

        ticketClasses.forEach((ticketClass) => {
            const option = document.createElement('option');
            option.value = ticketClass.class;
            option.textContent = ticketClass.name || ticketClass.class;
            ticketClassSelect.append(option);
        });
    } catch (error) {
        // The page still works without the dropdown options; filtering by class is just unavailable
    }
};

// Show the current filters in the form controls
const showFiltersInForm = () => {
    // A class from the URL that isn't in the list still needs an option so the filter shows
    if (
        filters.ticketClass &&
        ![...ticketClassSelect.options].some((option) => option.value === filters.ticketClass)
    ) {
        const option = document.createElement('option');
        option.value = filters.ticketClass;
        option.textContent = filters.ticketClass;
        ticketClassSelect.append(option);
    }

    ticketClassSelect.value = filters.ticketClass;
    fromInput.value = filters.from;
    toInput.value = filters.to;
};

filterForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const next = {
        ticketClass: ticketClassSelect.value,
        from: fromInput.value,
        to: toInput.value,
    };

    if (next.from && next.to && next.from > next.to) {
        statusMessage.textContent = '"Booked from" must not be after "Booked to".';
        return;
    }

    filters = next;
    loadBookings(1); // a new filter always starts at the first page
});

clearButton.addEventListener('click', () => {
    filters = { ticketClass: '', from: '', to: '' };
    showFiltersInForm();
    loadBookings(1);
});

prevButton.addEventListener('click', () => loadBookings(currentPage - 1));
nextButton.addEventListener('click', () => loadBookings(currentPage + 1));

const init = async () => {
    await loadTicketClassOptions();
    showFiltersInForm();
    await loadBookings(currentPage);
};

init();