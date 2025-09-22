// EndUser.js - Enhanced version
import { supabase, subscribeToAdminUpdates } from './supabaseClient.js';

// Submit a new report
export const submitReport = async (reportData) => {
    try {
        const { data, error } = await supabase
            .from('Database')
            .insert([{
                name: reportData.name || null,
                age: reportData.age || null,
                email: reportData.email || null,
                iDNum: reportData.iDNum || null,
                report: reportData.report,
                reportType: reportData.reportType,
                location: reportData.location,
                anon: reportData.anon,
                status: 'submitted',
                user_id: reportData.userId || null
            }])
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error submitting report:', error);
        return { success: false, error: error.message };
    }
};

// Get user's previous reports
export const getUserReports = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('Database')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching user reports:', error);
        return { success: false, error: error.message };
    }
};

// Get admin updates for a specific report
export const getReportUpdates = async (reportId) => {
    try {
        const { data, error } = await supabase
            .from('AdminUpdates')
            .select('*')
            .eq('report_id', reportId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching report updates:', error);
        return { success: false, error: error.message };
    }
};

// Listen for real-time admin updates
export const listenForAdminUpdates = (userId, callback) => {
    return subscribeToAdminUpdates((update) => {
        if (update.user_id === userId) {
            callback(update);
            
            // Show browser notification for high priority updates
            if (update.priority === 'emergency' || update.priority === 'high') {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`NotiZAR Update - ${update.priority.toUpperCase()}`, {
                        body: update.message,
                        icon: '/logo.png',
                        tag: `update-${update.id}`
                    });
                }
            }
        }
    });
};

// Mark update as read
export const markUpdateAsRead = async (updateId) => {
    try {
        const { error } = await supabase
            .from('AdminUpdates')
            .update({ is_read: true })
            .eq('id', updateId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error marking update as read:', error);
        return { success: false, error: error.message };
    }
};

// Get user location for reports
export const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                }
            );
        }
    });
};

// Initialize form submission (for standalone use)
export const initializeUserForm = () => {
    const form = document.getElementById("reportForm");
    const locationBtn = document.getElementById("getLocationBtn");
    
    if (locationBtn) {
        locationBtn.addEventListener("click", async () => {
            try {
                const location = await getUserLocation();
                document.getElementById("location").value = `${location.lat}, ${location.lng}`;
                document.getElementById("output").textContent = "Location acquired successfully!";
            } catch (error) {
                document.getElementById("output").textContent = "Error getting location: " + error.message;
            }
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            try {
                // Get form values
                const name = document.getElementById("name").value.trim() || null;
                const age = document.getElementById("age").value ? parseInt(document.getElementById("age").value) : null;
                const email = document.getElementById("email").value.trim() || null;
                const iDNum = document.getElementById("iDNum").value.trim() || null;
                const report = document.getElementById("report").value.trim();
                const reportType = document.getElementById("reportType").value.trim();
                const location = document.getElementById("location").value.trim();
                const anon = document.querySelector('input[name="anon"]:checked')?.value || "no";

                // Validation
                if (!report || !reportType || !location) {
                    alert("Please fill in all required fields");
                    return;
                }

                const result = await submitReport({
                    name, age, email, iDNum, report, reportType, location, anon
                });

                if (result.success) {
                    document.getElementById("output").textContent = "Report submitted successfully!\n" + JSON.stringify(result.data, null, 2);
                    alert("Report submitted successfully!");
                    
                    // Clear form
                    form.reset();
                } else {
                    document.getElementById("output").textContent = "Error: " + result.error;
                    alert("Error submitting report: " + result.error);
                }
            } catch (error) {
                console.error("Unexpected error:", error);
                document.getElementById("output").textContent = "Unexpected error: " + error.message;
            }
        });
    }
};

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    window.EndUser = { 
        submitReport, 
        getUserReports, 
        getReportUpdates, 
        listenForAdminUpdates, 
        markUpdateAsRead, 
        initializeUserForm,
        getUserLocation
    };
    
    // Auto-initialize if user page
    if (window.location.pathname.includes('report') || window.location.pathname.includes('user')) {
        document.addEventListener('DOMContentLoaded', () => {
            initializeUserForm();
        });
    }
}
function renderMap() {
    const main = document.createElement('main');
    main.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';
    main.innerHTML = `
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900">Live Monitoring Map</h2>
            <p class="text-gray-600">Real-time view of sensors, incidents, and community watch activities</p>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 mb-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 class="text-xl font-semibold text-gray-900">Tshwane Infrastructure Map</h3>
                <div class="flex flex-wrap gap-2">
                    <button class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <div class="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                        Active Sensors
                    </button>
                    <button class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <div class="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                        Active Incidents
                    </button>
                    <button class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <div class="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                        Patrols
                    </button>
                    <button class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <div class="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                        Watch Groups
                    </button>
                </div>
            </div>

            <div id="map" class="rounded-lg mb-4"></div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <div class="bg-blue-600 p-2 rounded-lg mr-3">
                            <i data-lucide="radio" class="h-5 w-5 text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900">143 Sensors Active</h4>
                            <p class="text-sm text-gray-600">4 offline</p>
                        </div>
                    </div>
                </div>

                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <div class="bg-red-600 p-2 rounded-lg mr-3">
                            <i data-lucide="alert-triangle" class="h-5 w-5 text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900">2 Active Incidents</h4>
                            <p class="text-sm text-gray-600">Response in progress</p>
                        </div>
                    </div>
                </div>

                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <div class="bg-green-600 p-2 rounded-lg mr-3">
                            <i data-lucide="users" class="h-5 w-5 text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900">8 Active Patrols</h4>
                            <p class="text-sm text-gray-600">In your area</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- ... rest of the content ... -->
        </div>
    `;

    // Now, we'll initialize the map after the element is added to the DOM
    setTimeout(() => {
        const map = L.map('map').setView([-25.7459, 28.2372], 13); // Centered around Tshwane

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add markers for incidents
        incidents.forEach(incident => {
            const marker = L.marker([incident.lat, incident.lng]).addTo(map);
            marker.bindPopup(`
                <strong>${incident.description}</strong><br>
                Location: ${incident.location}<br>
                Type: ${incident.type}
            `);
        });

        // You can also add circle markers for sensors, etc.
    }, 0);

    return main;
}