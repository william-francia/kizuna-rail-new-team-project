document.addEventListener('DOMContentLoaded', () => {
    console.log('Route details page loaded');

    const schedulesContainer = document.getElementById('schedules-container');
    const monthButtons = document.querySelectorAll('.month-badge');
    const routeId = window.routeId;

    if (!schedulesContainer || !routeId) {
        console.error('Schedule container or route ID is missing.');
        return;
    }

    async function loadSchedules(month = null) {
        try {
            schedulesContainer.innerHTML = `
                <p>Loading available schedules...</p>
            `;

            let url = `/api/trips/${routeId}/schedules`;

            if (month !== null) {
                url += `?month=${month}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const schedules = await response.json();

            console.log('Schedules received:', schedules);

            if (schedules.length === 0) {
                schedulesContainer.innerHTML = `
                    <p>No schedules are available for this month.</p>
                `;
                return;
            }

            let monthHeading = '';

            if (month !== null) {
                const monthNames = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December'
                ];

                monthHeading = `
                    <h3>Schedules for ${monthNames[Number(month) - 1]}</h3>
                `;
            }

            schedulesContainer.innerHTML = `
                ${monthHeading}

                <div class="schedules-grid">
                    ${schedules.map(schedule => `
                        <div class="schedule-card">
                            <div class="schedule-times">
                                <div class="time-block">
                                    <span class="time-label">Departs</span>
                                    <span class="time-value">${schedule.departureTime}</span>
                                </div>

                                <span class="time-arrow">→</span>

                                <div class="time-block">
                                    <span class="time-label">Arrives</span>
                                    <span class="time-value">${schedule.arrivalTime}</span>
                                </div>
                            </div>

                            <div class="schedule-days">
                                ${schedule.daysOfWeek.map(day => `
                                    <span class="day-badge">
                                        ${day.substring(0, 3)}
                                    </span>
                                `).join('')}
                            </div>

                            <a href="/routes/booking/${schedule.id}" class="book-btn">
                                Book Now
                            </a>
                        </div>
                    `).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Error loading schedules:', error);

            schedulesContainer.innerHTML = `
                <p>Unable to load schedules. Please try again later.</p>
            `;
        }
    }

    monthButtons.forEach(button => {
        button.addEventListener('click', () => {
            const month = button.dataset.month;

            console.log(`Loading schedules for month ${month}`);

            monthButtons.forEach(monthButton => {
                monthButton.classList.remove('active');
            });

            button.classList.add('active');

            loadSchedules(month);
        });
    });

    loadSchedules();
});