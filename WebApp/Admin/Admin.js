// Admin.js
import { supabase, subscribeToReports } from './supabaseClient.js';

// Configuration for admin alerts
const ALERT_CONFIG = {
    includeFields: ['id', 'reportType', 'location', 'created_at', 'status', 'priority'],
    priorityLevels: {
        emergency: { color: '#ff4444', sound: 'emergency' },
        high: { color: '#ff8800', sound: 'high' },
        normal: { color: '#007bff', sound: 'normal' },
        low: { color: '#28a745', sound: 'low' }
    },
    alertPreferences: {
        soundEnabled: true,
        desktopNotifications: true,
        emailNotifications: false,
        smsNotifications: false
    }
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
            excerpt: reportData.report?.substring(0, 100) + '...'
        },
        metadata: {
            source: 'web_form',
            userType: reportData.anon === 'yes' ? 'anonymous' : 'identified',
            hasContactInfo: !!(reportData.email || reportData.phone),
            urgencyScore: calculateUrgencyScore(reportData)
        },
        actions: [
            { action: 'view', label: 'View Full Report', url: `/admin/reports/${reportData.id}` },
            { action: 'assign', label: 'Assign to Team', endpoint: `/api/reports/${reportData.id}/assign` },
            { action: 'update', label: 'Update Status', endpoint: `/api/reports/${reportData.id}/status` }
        ],
        analytics: {
            similarReportsCount: 0, // Can be populated from database
            locationTrend: null,    // Can be populated from historical data
            typeFrequency: null     // Can be populated from historical data
        }
    };

    // Add optional fields if they exist
    if (reportData.name) alert.report.reporterName = reportData.name;
    if (reportData.email) alert.report.reporterEmail = reportData.email;
    if (reportData.phone) alert.report.reporterPhone = reportData.phone;
    if (reportData.iDNum) alert.report.reporterId = reportData.iDNum;

    return alert;
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
    let score = 50; // Base score
    
    // Adjust based on report type
    const typeScores = {
        emergency: 40,
        complaint: 30,
        incident: 25,
        feedback: -10,
        suggestion: -15
    };
    
    score += typeScores[reportData.reportType] || 0;
    
    // Adjust based on content length (longer reports might be more serious)
    if (reportData.report && reportData.report.length > 200) {
        score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
};

// Real-time alerts with JSON payload
export const listenForNewReportsWithAlerts = (callback, options = {}) => {
    return subscribeToReports(async (newReport) => {
        try {
            // Generate comprehensive alert JSON
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
            
            if (options.triggerSound) {
                playAlertSound(alertJson.priority);
            }
            
        } catch (error) {
            console.error('Error processing new report alert:', error);
        }
    });
};

// Trigger browser notification
const triggerDesktopNotification = (alertJson) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New ${alertJson.report.reportType} Report`, {
            body: `${alertJson.report.location} - ${alertJson.report.excerpt}`,
            icon: '/notification-icon.png',
            tag: `report-${alertJson.report.id}`,
            data: alertJson
        });
    }
};

// Play alert sound based on priority
const playAlertSound = (priority) => {
    const soundMap = {
        emergency: '/sounds/emergency-alert.mp3',
        high: '/sounds/high-priority.mp3',
        normal: '/sounds/new-report.mp3',
        low: '/sounds/low-priority.mp3'
    };
    
    const audio = new Audio(soundMap[priority] || soundMap.normal);
    audio.play().catch(() => console.log('Audio play failed - user may not have interacted with page'));
};

// Get analytics data for a report
const getReportAnalytics = async (report) => {
    try {
        const { data: similarReports } = await supabase
            .from('Database')
            .select('id')
            .eq('reportType', report.reportType)
            .eq('location', report.location)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const { data: locationTrend } = await supabase
            .from('Database')
            .select('created_at')
            .eq('location', report.location)
            .order('created_at', { ascending: false })
            .limit(10);

        return {
            similarReportsCount: similarReports?.length || 0,
            locationTrend: locationTrend?.map(item => item.created_at) || [],
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
    const { count } = await supabase
        .from('Database')
        .select('id', { count: 'exact' })
        .eq('reportType', reportType)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    return count || 0;
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
            analytics: {
                averageResponseTime: await calculateAverageResponseTime(),
                resolutionRate: await calculateResolutionRate(),
                trendAnalysis: await generateTrendAnalysis(reports)
            },
            detailedData: reports.map(report => ({
                ...report,
                adminUpdates: await getReportUpdates(report.id),
                timeline: await generateReportTimeline(report.id)
            }))
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

// Get updates for a specific report
const getReportUpdates = async (reportId) => {
    const { data } = await supabase
        .from('AdminUpdates')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });
    return data || [];
};

// Generate report timeline
const generateReportTimeline = async (reportId) => {
    const report = await supabase
        .from('Database')
        .select('created_at, status')
        .eq('id', reportId)
        .single();

    const updates = await getReportUpdates(reportId);

    return [
        {
            event: 'report_submitted',
            timestamp: report.data.created_at,
            status: report.data.status
        },
        ...updates.map(update => ({
            event: 'admin_update',
            timestamp: update.created_at,
            message: update.message,
            admin: update.admin_id
        }))
    ];
};

// Calculate average response time
const calculateAverageResponseTime = async () => {
    // This would require additional database structure for response tracking
    return "2.5 hours"; // Placeholder
};

// Calculate resolution rate
const calculateResolutionRate = async () => {
    const { count: total } = await supabase
        .from('Database')
        .select('id', { count: 'exact' });

    const { count: resolved } = await supabase
        .from('Database')
        .select('id', { count: 'exact' })
        .eq('status', 'resolved');

    return total > 0 ? (resolved / total * 100).toFixed(1) + '%' : '0%';
};

// Generate trend analysis
const generateTrendAnalysis = (reports) => {
    const dailyCounts = reports.reduce((acc, report) => {
        const date = new Date(report.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    return {
        dailyCounts,
        peakHours: calculatePeakHours(reports),
        commonLocations: Object.entries(dailyCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
    };
};

// Calculate peak hours
const calculatePeakHours = (reports) => {
    const hourCounts = reports.reduce((acc, report) => {
        const hour = new Date(report.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);
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

// ... Keep all the previous functions from the original adminDashboard.js