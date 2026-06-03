document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message and activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML = details.participants.length
          ? details.participants.map(p =>
              `<li class="participant-item"><span class="participant-email">${p}</span>` +
              `<button class="participant-delete" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">×</button></li>`
            ).join("")
          : '<li class="participant-empty">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants (${details.participants.length})</h5>
            <ul class="participants-list">
              ${participantsHTML}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh activities from server to reflect the new participant
        await fetchActivities();
        signupForm.reset();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate delete clicks for participant removal
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.participant-delete');
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      if (response.ok) {
        await fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
      } else {
        messageDiv.textContent = result.detail || 'Failed to remove participant';
        messageDiv.className = 'error';
      }
    } catch (err) {
      messageDiv.textContent = 'Failed to remove participant';
      messageDiv.className = 'error';
      console.error('Error removing participant:', err);
    }

    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 4000);
  });

  // Initialize app
  fetchActivities();
});
