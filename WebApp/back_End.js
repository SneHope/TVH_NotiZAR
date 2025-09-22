    const SUPABASE_URL = "https://cnptukavcjqbczlzihjv.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucHR1a2F2Y2pxYmN6bHppaGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTMzODIsImV4cCI6MjA3NDA2OTM4Mn0.1l_E9OI8pKZpIA4f7arbWIl0h0WnZXGFq71Fn_vyQ04GciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreWx6YWZpa2Vsb2toc2VmYXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDU4ODgsImV4cCI6MjA3MDQ4MTg4OH0.VK6AP-U6a-qFdDqsWM445L6NG39XlZlDlfIdQlZndg0";

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    document.getElementById("insert-btn").addEventListener("click", async () => {

      const name = document.getElementById("name").value.trim();
      const age = parseInt(document.getElementById("age").value);
	  const email = document.getElementById("email").value.trim();
      const report = document.getElementById("report").value.trim();
      const reportType = document.getElementById("reportType").value.trim();
      const location = parseInt(document.getElementById("location").value);
      const anon = document.getElementById("anon").value.trim();


      const { data, error } = await supabase
        .from("TablePractice")
        .insert([{ name: name, age: age, email: email }]);

    document.getElementById("fetch-btn").addEventListener("click", async () => {
      const { data, error } = await supabase
        .from("TablePractice")
        .select("*");

      if (error) {
        document.getElementById("output").textContent = "Error: " + error.message;
      } else {
        document.getElementById("output").textContent = JSON.stringify(data, null, 2);
      }
    });