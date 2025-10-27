import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://hkoeybomxchssinxmlma.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrb2V5Ym9teGNoc3NpbnhtbG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzY4NTQsImV4cCI6MjA3NzE1Mjg1NH0.78Ev-V0DAvFVwaQei5H7jE3jujmhjF7d0qKYuQB4mA4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function submitIncident(incidentData) {
    try {
        const { data, error } = await supabase
            .from('incidents')
            .insert([{
                incident_type: incidentData.type,
                location: incidentData.location,
                description: incidentData.description,
                reporter_name: incidentData.reporterName || null,
                reporter_contact: incidentData.reporterContact || null,
                is_anonymous: incidentData.isAnonymous || false,
                image_url: incidentData.imageUrl || null,
                latitude: incidentData.latitude || null,
                longitude: incidentData.longitude || null,
                status: 'active',
                priority: incidentData.priority || 'medium'
            }])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error submitting incident:', error);
        return { success: false, error: error.message };
    }
}

export async function uploadIncidentImage(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('incident-images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('incident-images')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
    }
}

export async function getActiveIncidents() {
    try {
        const { data, error } = await supabase
            .from('incidents')
            .select('*')
            .in('status', ['active', 'investigating'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching incidents:', error);
        return { success: false, error: error.message };
    }
}

export async function getIncidentById(id) {
    try {
        const { data, error } = await supabase
            .from('incidents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching incident:', error);
        return { success: false, error: error.message };
    }
}

export async function updateIncidentStatus(id, status, resolvedAt = null) {
    try {
        const updateData = { status };
        if (status === 'resolved' && resolvedAt) {
            updateData.resolved_at = resolvedAt;
        }

        const { data, error } = await supabase
            .from('incidents')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating incident:', error);
        return { success: false, error: error.message };
    }
}

export function subscribeToIncidents(callback) {
    const channel = supabase
        .channel('incidents-changes')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'incidents'
            },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();

    return channel;
}

export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}
