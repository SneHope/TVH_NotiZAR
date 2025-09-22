// EndUser.js
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
                status: 'submitted'
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

// Initialize form submission (for standalone use)
export const initializeUserForm = () => {
    document.getElementById("insert-btn").addEventListener("click", async () => {
        try {
            // Get form values
            const name = document.getElementById("name").value.trim() || null;
            const age = document.getElementById("age").value ? parseInt(document.getElementById("age").value) : null;
            const email = document.getElementById("email").value.trim() || null;
            const iDNum = document.getElementById("iDNum").value.trim() || null;
            const report = document.getElementById("report").value.trim();
            const reportType = document.getElementById("reportType").value.trim();
            const location = document.getElementById("location").value.trim();
            const anon = document.getElementById("anon").value.trim();

            // Validation
            if (!report || !reportType || !location || !anon) {
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
                document.getElementById("name").value = "";
                document.getElementById("age").value = "";
                document.getElementById("email").value = "";
                document.getElementById("iDNum").value = "";
                document.getElementById("report").value = "";
                document.getElementById("location").value = "";
            } else {
                document.getElementById("output").textContent = "Error: " + result.error;
                alert("Error submitting report: " + result.error);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            document.getElementById("output").textContent = "Unexpected error: " + error.message;
        }
    });
};

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    window.EndUser = { submitReport, getUserReports, getReportUpdates, listenForAdminUpdates, markUpdateAsRead, initializeUserForm };
}