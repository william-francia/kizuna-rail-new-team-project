const statusMessage = document.querySelector('#bookings-status');
const bookingList = document.querySelector('#bookings-list');
const bookingRowTemplate = document.querySelector('#booking-row-template');

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

const fetchBookings = async () => {
    const response = await fetch('/api/bookings', { credentials: 'same-origin' });

    if (redirectIfUnauthorized(response)) return [];
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
                statusMessage.textContent = 'Booking updated.';
                await loadBookings();
            } catch (error) {
                statusMessage.textContent = error.message;
            }
        });

        row.querySelector('.btn-delete').addEventListener('click', async () => {
            if (!window.confirm(`Delete booking ${booking.id}? This cannot be undone.`)) return;

            try {
                const result = await deleteBookingRequest(booking.id);
                if (!result) return;
                statusMessage.textContent = 'Booking deleted.';
                await loadBookings();
            } catch (error) {
                statusMessage.textContent = error.message;
            }
        });

        fragment.append(row);
    });

    bookingList.replaceChildren(fragment);
};

const loadBookings = async () => {
    statusMessage.textContent = 'Loading bookings...';

    try {
        const bookings = await fetchBookings();
        renderBookings(bookings);
        statusMessage.textContent = bookings.length === 0
            ? 'No bookings yet, or none match your account.'
            : `Showing ${bookings.length} booking${bookings.length === 1 ? '' : 's'}.`;
    } catch (error) {
        bookingList.replaceChildren();
        statusMessage.textContent = 'Bookings could not be loaded. Refresh the page to try again.';
    }
};

loadBookings();