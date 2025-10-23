// script.js - Enhanced with form-to-map functionality
let activeView = 'home';
let map = null;
let markers = [];
let reports = [];

// Sample data
const recentActivity = [
    { id: 1, type: 'sensor_alert', location: 'Hatfield Area', time: '15 minutes ago', status: 'resolved', message: 'Sensor tampering detected' },
    { id: 2, type: 'community_report', location: 'Sunnyside', time: '1 hour ago', status: 'investigating', message: 'Suspicious vehicle spotted' }
];

const watchGroups = [
    { name: 'Hatfield Neighbourhood Watch', members: 234, active: true },
    { name: 'Sunnyside Community Guard', members: 187, active: true }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    render();
    initializeMap();
});

function navigateTo(view) {
    activeView = view;
    render();
    if (view === 'map') {
        setTimeout(initializeMap, 100);
    }
}

function renderHeader() {
    return `
        <header class="header">
            <div class="container header-content">
                <div class="logo">
                    <div class="logo-icon">
                        <i data-lucide="shield" class="text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-lg">NotiZAR</h1>
                        <p class="text-sm">Community Protection</p>
                    </div>
                </div>
                <nav class="nav">
                    <button onclick="navigateTo('home')" class="btn ${activeView === 'home' ? 'btn-primary' : ''}">
                        <i data-lucide="home"></i>Home
                    </button>
                    <button onclick="navigateTo('report')" class="btn ${activeView === 'report' ? 'btn-danger' : ''}">
                        <i data-lucide="alert-triangle"></i>Report
                    </button>
                    <button onclick="navigateTo('map')" class="btn ${activeView === 'map' ? 'btn-primary' : ''}">
                        <i data-lucide="map"></i>Live Map
                    </button>
                </nav>
            </div>
        </header>
    `;
}

function renderFooter() {
    return `
        <footer class="footer">
            <div class="container footer-content">
                <div>
                    <h3 class="text-lg">NotiZAR</h3>
                    <p>Community Protection System</p>
                    <div class="flex gap-sm m-md">
                        <button class="btn btn-danger">Emergency: 10177</button>
                        <button class="btn">Report Non-Emergency</button>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg">Quick Links</h4>
                    <div class="flex flex-col gap-sm">
                        <a href="#" class="text-sm">Report Emergency</a>
                        <a href="#" class="text-sm">Community Watch</a>
                        <a href="#" class="text-sm">Safety Tips</a>
                    </div>
                </div>
            </div>
        </footer>
    `;
}

function renderHome() {
    return `
        <main class="container p-lg">
            <div class="card">
                <h2 class="text-xl">Community Safety Dashboard</h2>
                <p class="text-sm text-gray">Welcome back! Here's the latest from your area.</p>
            </div>

            <div class="grid grid-4">
                <div class="card">
                    <div class="flex-between">
                        <div>
                            <h3 class="text-lg">Active Incidents</h3>
                            <p class="text-xl">${reports.filter(r => r.status === 'active').length}</p>
                        </div>
                        <div class="bg-light p-md rounded">
                            <i data-lucide="alert-triangle" class="text-danger"></i>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex-between">
                        <div>
                            <h3 class="text-lg">Reports Today</h3>
                            <p class="text-xl">${reports.length}</p>
                        </div>
                        <div class="bg-light p-md rounded">
                            <i data-lucide="clipboard" class="text-primary"></i>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex-between">
                        <div>
                            <h3 class="text-lg">Response Time</h3>
                            <p class="text-xl">8.4 min</p>
                        </div>
                        <div class="bg-light p-md rounded">
                            <i data-lucide="clock" class="text-warning"></i>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex-between">
                        <div>
                            <h3 class="text-lg">Prevented</h3>
                            <p class="text-xl">14</p>
                        </div>
                        <div class="bg-light p-md rounded">
                            <i data-lucide="shield-check" class="text-success"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg">Recent Activity</h3>
                    </div>
                    <div class="flex flex-col gap-md">
                        ${recentActivity.map(item => `
                            <div class="flex gap-md">
                                <div class="bg-light p-sm rounded">
                                    <i data-lucide="${getActivityIcon(item.type)}"></i>
                                </div>
                                <div>
                                    <h4 class="text-md">${item.location}</h4>
                                    <p class="text-sm">${item.message}</p>
                                    <span class="text-sm">${item.time}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg">Community Watch</h3>
                    </div>
                    <div class="flex flex-col gap-md">
                        ${watchGroups.map(group => `
                            <div class="flex-between">
                                <div>
                                    <h4 class="text-md">${group.name}</h4>
                                    <p class="text-sm">${group.members} members</p>
                                </div>
                                <span class="text-sm ${group.active ? 'text-success' : 'text-gray'}">
                                    ${group.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </main>
    `;
}

function renderReport() {
    return `
        <main class="container p-lg">
            <div class="card text-center">
                <h2 class="text-xl">Report an Incident</h2>
                <p class="text-gray">Help keep your community safe</p>
            </div>

            <div class="card">
                <div class="bg-danger text-white p-lg rounded">
                    <div class="flex gap-md">
                        <i data-lucide="alert-triangle"></i>
                        <h3 class="text-lg">Emergency Reporting</h3>
                    </div>
                    <p class="text-sm m-md">For immediate danger, call emergency services first</p>
                </div>

                <form id="reportForm" class="p-lg">
                    <div class="form-group">
                        <label class="form-label">Incident Type</label>
                        <select class="form-input" id="reportType" required>
                            <option value="">Select type</option>
                            <option value="suspicious">Suspicious Activity</option>
                            <option value="theft">Attempted Cable Theft</option>
                            <option value="vandalism">Vandalism</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <div class="flex gap-sm">
                            <input type="text" class="form-input" id="location" placeholder="Enter location" required>
                            <button type="button" class="btn" onclick="getCurrentLocation()">
                                <i data-lucide="map-pin"></i>Use My Location
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-input" id="description" rows="4" placeholder="Describe what you saw" required></textarea>
                    </div>

                    <button type="submit" class="btn btn-danger w-full">
                        <i data-lucide="send"></i>Submit Report
                    </button>
                </form>
            </div>

            ${reports.length > 0 ? `
                <div class="card">
                    <h3 class="text-lg">Your Recent Reports</h3>
                    <div class="flex flex-col gap-md">
                        ${reports.map(report => `
                            <div class="flex-between">
                                <div>
                                    <h4 class="text-md">${report.type}</h4>
                                    <p class="text-sm">${report.location}</p>
                                </div>
                                <span class="text-sm">${report.time}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </main>
    `;
}

function renderMap() {
    const activeReports = reports.filter(r => r.status === 'active');
    
    return `
        <main class="container p-lg">
            <div class="card">
                <h2 class="text-xl">Live Monitoring Map</h2>
                <p class="text-gray">Real-time view of incidents in your area</p>
            </div>

            <div class="card">
                <div class="flex-between">
                    <h3 class="text-lg">Tshwane Community Map</h3>
                    <div class="flex gap-sm">
                        <span class="bg-light p-sm rounded text-sm">Reports: ${reports.length}</span>
                        <span class="bg-light p-sm rounded text-sm">Active: ${activeReports.length}</span>
                    </div>
                </div>

                <div id="map" class="map-container"></div>

                <div class="grid grid-3">
                    <div class="text-center">
                        <div class="bg-light p-md rounded">
                            <i data-lucide="alert-circle" class="text-danger"></i>
                        </div>
                        <h4 class="text-md">Active Incidents</h4>
                        <p class="text-xl">${activeReports.length}</p>
                    </div>

                    <div class="text-center">
                        <div class="bg-light p-md rounded">
                            <i data-lucide="users" class="text-primary"></i>
                        </div>
                        <h4 class="text-md">Watch Groups</h4>
                        <p class="text-xl">${watchGroups.length}</p>
                    </div>

                    <div class="text-center">
                        <div class="bg-light p-md rounded">
                            <i data-lucide="shield" class="text-success"></i>
                        </div>
                        <h4 class="text-md">Prevented</h4>
                        <p class="text-xl">14</p>
                    </div>
                </div>
            </div>
        </main>
    `;
}

function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || map) return;

    map = L.map('map').setView([-25.7479, 28.2293], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add existing reports to map
    reports.forEach(report => {
        addMarkerToMap(report);
    });
}

function addMarkerToMap(report) {
    if (!map) return;

    // Generate random coordinates near Pretoria for demo
    const lat = -25.7479 + (Math.random() - 0.5) * 0.1;
    const lng = 28.2293 + (Math.random() - 0.5) * 0.1;

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`
        <strong>${report.type}</strong><br>
        ${report.location}<br>
        <small>${report.time}</small>
    `);
    
    markers.push(marker);
}

function getCurrentLocation() {
    const locationInput = document.getElementById('location');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lng = position.coords.longitude.toFixed(4);
                locationInput.value = `Nearby (${lat}, ${lng})`;
            },
            () => {
                locationInput.value = 'Hatfield, Pretoria'; // Fallback
            }
        );
    } else {
        locationInput.value = 'Hatfield, Pretoria'; // Fallback
    }
}

function handleReportSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const report = {
        type: document.getElementById('reportType').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        status: 'active',
        time: 'Just now',
        id: Date.now()
    };

    reports.unshift(report); // Add to beginning of array
    addMarkerToMap(report);
    
    // Show success message
    alert('Report submitted successfully!');
    event.target.reset();
    
    // Update dashboard if on home view
    if (activeView === 'home') {
        render();
    }
}

function getActivityIcon(type) {
    const icons = {
        sensor_alert: 'radio',
        community_report: 'users',
        prevention: 'shield-check'
    };
    return icons[type] || 'alert-circle';
}

function render() {
    const app = document.getElementById('app');
    app.innerHTML = renderHeader();
    
    switch(activeView) {
        case 'home':
            app.innerHTML += renderHome();
            break;
        case 'report':
            app.innerHTML += renderReport();
            setTimeout(() => {
                document.getElementById('reportForm').addEventListener('submit', handleReportSubmit);
            }, 100);
            break;
        case 'map':
            app.innerHTML += renderMap();
            setTimeout(initializeMap, 100);
            break;
        default:
            app.innerHTML += renderHome();
    }
    
    app.innerHTML += renderFooter();
    
    // Initialize icons
    if (window.lucide) {
        lucide.createIcons();
    }
}