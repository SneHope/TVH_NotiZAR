//EndUser.js

const SUPABASE_URL = "https://cnptukavcjqbczlzihjv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucHR1a2F2Y2pxYmN6bHppaGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTMzODIsImV4cCI6MjA3NDA2OTM4Mn0.1l_E9OI8pKZpIA4f7arbWIl0h0WnZXGFq71Fn_vyQ04";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById("insert-btn").addEventListener("click", async () => {
    try {
        // Get form values
        const name = document.getElementById("name").value.trim() || null;
        const age = parseInt(document.getElementById("age").value);
        const email = document.getElementById("email").value.trim()|| null;
        const iDNum = document.getElementById("iDNum").value.trim()|| null;
        const report = document.getElementById("report").value.trim();
        const reportType = document.getElementById("reportType").value.trim();
        const location = document.getElementById("location").value.trim();
        const anon = document.getElementById("anon").value.trim();

        // Validation
        if (!report || !reportType || !location || !anon) {
            alert("Please fill in all fields");
            return;
        }

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