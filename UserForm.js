// UserForm.js - For simple form submission without module structure
const SUPABASE_URL = "https://cnptukavcjqbczlzihjv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucHR1a2F2Y2pxYmN6bHppaGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTMzODIsImV4cCI6MjA3NDA2OTM4Mn0.1l_E9OI8pKZpIA4f7arbWIl0h0WnZXGFq71Fn_vyQ04";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

        // Insert data
        const { data, error } = await supabase
            .from("Database")
            .insert([{ 
                name: name, 
                age: age, 
                email: email, 
                iDNum: iDNum, 
                report: report, 
                reportType: reportType, 
                location: location, 
                anon: anon,
                status: 'submitted'
            }])
            .select();

        if (error) {
            console.error("Supabase error:", error);
            document.getElementById("output").textContent = "Error: " + error.message;
            alert("Error submitting report: " + error.message);
        } else {
            document.getElementById("output").textContent = "Report submitted successfully!\n" + JSON.stringify(data, null, 2);
            alert("Report submitted successfully!");
            
            // Clear form but keep dropdown selections
            document.getElementById("name").value = "";
            document.getElementById("age").value = "";
            document.getElementById("email").value = "";
            document.getElementById("iDNum").value = "";
            document.getElementById("report").value = "";
            document.getElementById("location").value = "";
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        document.getElementById("output").textContent = "Unexpected error: " + error.message;
    }
});

document.getElementById("fetch-btn").addEventListener("click", async () => {
    try {
        const { data, error } = await supabase
            .from("Database")
            .select("*")
            .order('created_at', { ascending: false });

        if (error) {
            document.getElementById("output").textContent = "Error: " + error.message;
        } else {
            // Format data for better display
            const formattedData = data.map(item => `
                <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
                    <strong>${item.reportType}</strong> - ${item.location}<br>
                    ${item.report}<br>
                    <small>${new Date(item.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
            
            document.getElementById("output").innerHTML = formattedData || "No reports found";
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        document.getElementById("output").textContent = "Unexpected error: " + error.message;
    }
});