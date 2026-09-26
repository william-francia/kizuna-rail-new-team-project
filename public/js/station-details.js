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
async function fetchStationDetails(stationIdentifier) {
    const modal = document.getElementById('stationModal');
    const detailsContainer = document.getElementById('stationModalDetails');
    
    if (!modal || !detailsContainer) return;

    modal.style.display = 'flex';
    detailsContainer.innerHTML = '<p class="loading-spinner">Loading...</p>';
    
    try {
        const response = await fetch(`/api/stations/${stationIdentifier}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch station details');
        }
        
        const station = await response.json();
        
        detailsContainer.innerHTML = `
            <h3>${station.name || 'Station Details'}</h3>
            <p><strong>Code:</strong> ${station.code || 'N/A'}</p>
            <p><strong>Location:</strong> ${station.location || 'N/A'}</p>
            <p><strong>Lines:</strong> ${Array.isArray(station.lines) ? station.lines.join(', ') : 'N/A'}</p>
        `;
    } catch (error) {
        console.error('Error fetching station details:', error);
        detailsContainer.innerHTML = '<p style="color: #d9534f;">Could not load station details.</p>';
    }
}