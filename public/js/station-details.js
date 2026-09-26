document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.station-info-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stationId = btn.dataset.stationId;
            if (stationId && typeof fetchStationDetails === 'function') {
                fetchStationDetails(stationId);
            }
        });
    });

    const modal = document.getElementById('stationModal');
    const closeBtn = document.querySelector('.close-modal-btn');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});