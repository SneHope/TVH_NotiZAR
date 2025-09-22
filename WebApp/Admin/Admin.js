// Admin.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js'

const SUPABASE_URL = "https://cnptukavcjqbczlzihjv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucHR1a2F2Y2pxYmN6bHppaGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTMzODIsImV4cCI6MjA3NDA2OTM4Mn0.1l_E9OI8pKZpIA4f7arbWIl0h0WnZXGFq71Fn_vyQ04";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration for admin alerts
const ALERT_CONFIG = {
    priorityLevels: {
        emergency: { color: '#ff4444', sound: 'emergency' },
        high: { color: '#ff8800', sound: 'high' },
        normal: { color: '#007bff', sound: 'normal' },
        low: { color: '#28a745', sound: 'low' }
    }
};

// Real-time subscription for reports
const subscribeToReports = (callback) => {
    return supabase
        .channel('reports-changes')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'Database' 
            }, 
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
};

// Get all reports with pagination
export const getAllReports = async (page = 1, pageSize = 10) => {
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('Database')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { success: true, data, totalCount: count };
    } catch (error) {
        console.error('Error fetching reports:', error);
        return { success: false, error: error.message };
    }
};

// Get reports by filters
export const getFilteredReports = async (filters = {}) => {
    try {
        let query = supabase
            .from('Database')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.reportType) {
            query = query.eq('reportType', filters.reportType);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }
        if (filters.startDate && filters.endDate) {
            query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching filtered reports:', error);
        return { success: false, error: error.message };
    }
};

// Send update to user
export const sendUserUpdate = async (updateData) => {
    try {
        const { data, error } = await supabase
            .from('AdminUpdates')
            .insert([{
                report_id: updateData.reportId,
                user_id: updateData.userId,
                admin_id: updateData.adminId,
                message: updateData.message,
                priority: updateData.priority || 'normal',
                update_type: updateData.updateType || 'status_update'
            }])
            .select();

        if (error) throw error;

        // Update report status if provided
        if (updateData.newStatus) {
            await updateReportStatus(updateData.reportId, updateData.newStatus);
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending update:', error);
        return { success: false, error: error.message };
    }
};

// Update report status
export const updateReportStatus = async (reportId, newStatus) => {
    try {
        const { error } = await supabase
            .from('Database')
            .update({ status: newStatus })
            .eq('id', reportId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating report status:', error);
        return { success: false, error: error.message };
    }
};

// Get dashboard statistics
export const getDashboardStats = async () => {
    try {
        // Total reports count
        const { count: totalReports, error: error1 } = await supabase
            .from('Database')
            .select('*', { count: 'exact' });

        // Reports by type
        const { data: reportsByType, error: error2 } = await supabase
            .from('Database')
            .select('reportType')
            .group('reportType');

        // Reports by status
        const { data: reportsByStatus, error: error3 } = await supabase
            .from('Database')
            .select('status')
            .group('status');

        // Recent reports
        const { data: recentReports, error: error4 } = await supabase
            .from('Database')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error1 || error2 || error3 || error4) {
            throw error1 || error2 || error3 || error4;
        }

        return {
            success: true,
            stats: {
                totalReports: totalReports || 0,
                reportsByType: reportsByType || [],
                reportsByStatus: reportsByStatus || [],
                recentReports: recentReports || []
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return { success: false, error: error.message };
    }
};

// Calculate priority based on report content
const calculatePriority = (reportData) => {
    const emergencyKeywords = ['emergency', 'urgent', 'danger', 'critical', 'accident', 'fire', 'medical'];
    const highPriorityKeywords = ['complaint', 'issue', 'problem', 'broken', 'not working'];
    
    const content = (reportData.report || '').toLowerCase();
    const reportType = (reportData.reportType || '').toLowerCase();

    if (emergencyKeywords.some(keyword => content.includes(keyword) || reportType.includes(keyword))) {
        return 'emergency';
    }
    if (highPriorityKeywords.some(keyword => content.includes(keyword) || reportType.includes(keyword))) {
        return 'high';
    }
    if (reportType === 'complaint') {
        return 'high';
    }
    return 'normal';
};

// Calculate urgency score (0-100)
const calculateUrgencyScore = (reportData) => {
    let score = 50;
    const typeScores = { 
        emergency: 40, 
        complaint: 30, 
        incident: 25, 
        feedback: -10, 
        suggestion: -15 
    };
    
    score += typeScores[reportData.reportType] || 0;
    
    if (reportData.report && reportData.report.length > 200) {
        score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
};

// Generate comprehensive JSON alert for new reports
export const generateReportAlert = (reportData) => {
    const alert = {
        type: 'new_report',
        timestamp: new Date().toISOString(),
        priority: calculatePriority(reportData),
        report: {
            id: reportData.id,
            reportType: reportData.reportType,
            location: reportData.location,
            createdAt: reportData.created_at,
            status: reportData.status || 'submitted',
            excerpt: reportData.report?.substring(0, 100) + (reportData.report?.length > 100 ? '...' : '')
        },
        metadata: {
            source: 'web_form',
            userType: reportData.anon === 'yes' ? 'anonymous' : 'identified',
            hasContactInfo: !!(reportData.email || reportData.phone),
            urgencyScore: calculateUrgencyScore(reportData)
        },
        actions: [
            { action: 'view', label: 'View Full Report', url: `#report-${reportData.id}` },
            { action: 'update', label: 'Update Status', endpoint: `#update-${reportData.id}` }
        ]
    };

    // Add optional fields if they exist
    if (reportData.name) alert.report.reporterName = reportData.name;
    if (reportData.email) alert.report.reporterEmail = reportData.email;
    if (reportData.iDNum) alert.report.reporterId = reportData.iDNum;

    return alert;
};

// Real-time alerts with JSON payload
export const listenForNewReportsWithAlerts = (callback, options = {}) => {
    return subscribeToReports(async (newReport) => {
        try {
            const alertJson = generateReportAlert(newReport);
            
            // Enhance with additional data if needed
            if (options.includeAnalytics) {
                alertJson.analytics = await getReportAnalytics(newReport);
            }
            
            // Send the JSON alert to callback
            callback(alertJson);
            
            // Optional: Trigger additional alert mechanisms
            if (options.triggerDesktopNotification) {
                triggerDesktopNotification(alertJson);
            }
            
        } catch (error) {
            console.error('Error processing new report alert:', error);
        }
    });
};

// Get analytics data for a report
const getReportAnalytics = async (report) => {
    try {
        // Get similar reports count
        const { count: similarReports } = await supabase
            .from('Database')
            .select('*', { count: 'exact' })
            .eq('reportType', report.reportType)
            .eq('location', report.location)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        return {
            similarReportsCount: similarReports || 0,
            locationTrend: [],
            typeFrequency: await getReportTypeFrequency(report.reportType)
        };
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return {
            similarReportsCount: 0,
            locationTrend: [],
            typeFrequency: 0
        };
    }
};

// Get report type frequency
const getReportTypeFrequency = async (reportType) => {
    try {
        const { count } = await supabase
            .from('Database')
            .select('*', { count: 'exact' })
            .eq('reportType', reportType)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        return count || 0;
    } catch (error) {
        return 0;
    }
};

// Trigger browser notification
const triggerDesktopNotification = (alertJson) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New ${alertJson.report.reportType} Report`, {
            body: `${alertJson.report.location} - ${alertJson.report.excerpt}`,
            icon: '/notification-icon.png',
            tag: `report-${alertJson.report.id}`
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(`New ${alertJson.report.reportType} Report`, {
                    body: `${alertJson.report.location} - ${alertJson.report.excerpt}`
                });
            }
        });
    }
};

// Export comprehensive JSON report for admin
export const exportComprehensiveReport = async (options = {}) => {
    try {
        let query = supabase
            .from('Database')
            .select('*')
            .order('created_at', { ascending: false });

        if (options.startDate && options.endDate) {
            query = query.gte('created_at', options.startDate).lte('created_at', options.endDate);
        }
        if (options.reportType) {
            query = query.eq('reportType', options.reportType);
        }
        if (options.location) {
            query = query.ilike('location', `%${options.location}%`);
        }

        const { data: reports, error } = await query;

        if (error) throw error;

        const comprehensiveReport = {
            exportDate: new Date().toISOString(),
            timeframe: {
                start: options.startDate || 'all',
                end: options.endDate || 'current'
            },
            summary: {
                totalReports: reports.length,
                reportsByType: reports.reduce((acc, report) => {
                    acc[report.reportType] = (acc[report.reportType] || 0) + 1;
                    return acc;
                }, {}),
                reportsByStatus: reports.reduce((acc, report) => {
                    acc[report.status] = (acc[report.status] || 0) + 1;
                    return acc;
                }, {}),
                reportsByLocation: reports.reduce((acc, report) => {
                    acc[report.location] = (acc[report.location] || 0) + 1;
                    return acc;
                }, {})
            },
            reports: reports
        };

        return { 
            success: true, 
            data: comprehensiveReport,
            filename: `reports-export-${new Date().toISOString().split('T')[0]}.json`
        };

    } catch (error) {
        console.error('Error exporting comprehensive report:', error);
        return { success: false, error: error.message };
    }
};

// Download JSON file
export const downloadJsonFile = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Initialize admin dashboard
export const initializeAdminDashboard = async () => {
    try {
        // Load initial stats
        const stats = await getDashboardStats();
        if (stats.success) {
            updateDashboardUI(stats.stats);
        }

        // Set up real-time alerts
        listenForNewReportsWithAlerts((alert) => {
            displayNewReportAlert(alert);
        }, {
            triggerDesktopNotification: true,
            includeAnalytics: true
        });

        console.log('Admin dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
    }
};

// UI update functions (to be implemented in frontend)
const updateDashboardUI = (stats) => {
    console.log('Dashboard stats:', stats);
    // Implement UI update logic here
};

const displayNewReportAlert = (alert) => {
    console.log('New report alert:', alert);
    // Implement alert display logic here
};

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    window.Admin = { 
        getAllReports, 
        getFilteredReports, 
        sendUserUpdate, 
        updateReportStatus, 
        getDashboardStats,
        generateReportAlert,
        listenForNewReportsWithAlerts,
        exportComprehensiveReport,
        downloadJsonFile,
        initializeAdminDashboard
    };
    
    // Auto-initialize if admin page
    if (window.location.pathname.includes('admin')) {
        initializeAdminDashboard();
    }
}