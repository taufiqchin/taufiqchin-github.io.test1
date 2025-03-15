// Toggle between showing and hiding the sidebar, and add overlay effect
function w3_open() {
  if (mySidebar.style.display === 'block') {
    mySidebar.style.display = 'none';
    overlayBg.style.display = "none";
  } else {
    mySidebar.style.display = 'block';
    overlayBg.style.display = "block";
  }
}

// Close the sidebar with the close button
function w3_close() {
  mySidebar.style.display = "none";
  overlayBg.style.display = "none";
}


// Navbar JSON
document.addEventListener("DOMContentLoaded", function() {
    fetch("navbar.json")
        .then(response => response.json())
        .then(data => {
            const navbar = document.getElementById("navbar");

            data.navigation.forEach(item => {
                const link = document.createElement("a");
                link.href = item.link;
                link.textContent = item.name;
                link.className = `w3-bar-item w3-button ${item.class}`;
                
                if (item.target) {
                    link.target = item.target;
                }

                navbar.appendChild(link);
            });
        })
        .catch(error => console.error("Error loading navbar:", error));
});




// Sidebar infoSidebar.json for Portfolio

document.addEventListener("DOMContentLoaded", function () {
    fetch("infoSidebar.json")
        .then(response => response.json())
        .then(data => {
            const profile = data.profile;
            const profileInfo = document.getElementById("profile-info");

            profileInfo.innerHTML = `
                
                <p style="color: white; font-size: 22px; margin: 3px 0;"> <strong>${profile.name}</strong></p>
                <p style="color: white; font-size: 14px; margin: 3px 0;"><strong>Position:</strong> ${profile.position}</p>
                <p style="color: white; font-size: 14px; margin: 3px 0;"><strong>Department:</strong> ${profile.department}</p>
                <p style="color: white; font-size: 14px; margin: 3px 0;"><strong>Date Joined:</strong> ${profile.dateJoin}</p>
                <p style="color: white; font-size: 14px; margin: 3px 0;"><strong>Confirmation Date:</strong> ${profile.confirmationDate}</p>
                <p style="color: white; font-size: 14px; margin: 3px 0;"><strong>Expertise:</strong> ${profile.expertise}</p>
                <p style="color: white; font-size: 14px; margin: 3px 0;"><strong>Quote:</strong> <i>"${profile.quote}"</i></p>
            `;
        })
        .catch(error => console.error("Error loading profile data:", error));
});


// main content for personal info
document.addEventListener("DOMContentLoaded", function () {
    fetch("infoSidebar.json")
        .then(response => response.json())
        .then(data => {
            const profile = data.profile;
            const profileSection = document.getElementById("profile-section");

            profileSection.innerHTML = `
                <img src="${profile.image}" alt="Profile Picture" style="width:100px; border-radius:50%; display:block; margin-bottom:10px;">
                <p style="color: black; font-size: 22px; margin: 3px 0;"> <strong>${profile.name}</strong></p>
                <p style="color: black; font-size: 14px; margin: 3px 0;"><strong>Position:</strong> ${profile.position}</p>
                <p style="color: black; font-size: 14px; margin: 3px 0;"><strong>Department:</strong> ${profile.department}</p>
                <p style="color: black; font-size: 14px; margin: 3px 0;"><strong>Date Joined:</strong> ${profile.dateJoin}</p>
                <p style="color: black; font-size: 14px; margin: 3px 0;"><strong>Confirmation Date:</strong> ${profile.confirmationDate}</p>
                <p style="color: black; font-size: 14px; margin: 3px 0;"><strong>Expertise:</strong> ${profile.expertise}</p>
                <p style="color: black; font-size: 14px; margin: 3px 0;"><strong>Quote:</strong> <i>"${profile.quote}"</i></p>
            `;
        })
        .catch(error => console.error("Error loading profile data:", error));
});


// Main content - Education & Teaching Philosophy
document.addEventListener("DOMContentLoaded", function () {
    fetch("index.json")
        .then(response => response.json())
        .then(data => {
            const philosophy = data.education_teaching_philosophy;
            const container = document.getElementById("teaching-philosophy");

            let content = `
                <p>${philosophy.description}</p>
            `;

            philosophy.pillars.forEach(pillar => {
                content += `<h3>${pillar.title}</h3><ul>`;
                pillar.points.forEach(point => {
                    content += `<li>${point}</li>`;
                });
                content += `</ul>`;
            });

            container.innerHTML = content;
        })
        .catch(error => console.error("Error loading JSON data:", error));
});


// Main Content - Innovation JS
document.addEventListener("DOMContentLoaded", function () {
    fetch("index.json")
        .then(response => response.json())
        .then(data => {
            const contentContainer = document.getElementById("innovation-content");

            // Title and Description
            let html = `<h2 style="color: black;">${data.title}</h2>`;
            html += `<p style="color: black;">${data.description}</p>`;

            // Video Section (Side by Side)
            html += `<h3 style="color: black;">Video Resources</h3>`;
            html += `<div style="display: flex; gap: 15px; flex-wrap: wrap;">`;
            data.videos.forEach(video => {
                html += `
                    <div style="flex: 1; min-width: 300px;">
                        <p style="color: black;"><strong>${video.title}</strong></p>
                        <iframe width="100%" height="200" src="${video.url}" frameborder="0" allowfullscreen></iframe>
                    </div>
                `;
            });
            html += `</div>`;

            // Case Study Section
            html += `<h3 style="color: black;">Case Study</h3>`;
            html += `<p style="color: black;">${data.case_study.overview}</p>`;
            html += `<ul style="color: black;">`;
            data.case_study.content.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul>`;
            html += `<p style="color: black;"><strong>Poster Creation:</strong> ${data.case_study.poster_tool}</p>`;

            // Image Gallery
            html += `<h3 style="color: black;">Gallery</h3>`;
            html += `<div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
            data.images.forEach(image => {
                html += `<img src="${image}" alt="Student Work" style="width: 150px; border-radius: 10px;">`;
            });
            html += `</div>`;

            contentContainer.innerHTML = html;
        })
        .catch(error => console.error("Error loading innovation data:", error));
});





