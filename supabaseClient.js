// supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js'

const SUPABASE_URL = "https://cnptukavcjqbczlzihjv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucHR1a2F2Y2pxYmN6bHppaGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTMzODIsImV4cCI6MjA3NDA2OTM4Mn0.1l_E9OI8pKZpIA4f7arbWIl0h0WnZXGFq71Fn_vyQ04";

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Real-time subscription for reports
export const subscribeToReports = (callback) => {
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

// Real-time subscription for admin updates
export const subscribeToAdminUpdates = (callback) => {
    return supabase
        .channel('updates-changes')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'AdminUpdates' 
            }, 
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
};

// Utility functions
export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};