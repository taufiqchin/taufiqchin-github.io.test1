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
                <img src="${profile.image1}" alt="Profile Image 1" style="width: 100%; height: auto; display: block; margin-top: 10px;"> <br>
                <img src="${profile.image2}" alt="Profile Image 2" style="width: 100%; height: auto; display: block; margin-bottom: 10px;">
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
            // Education & Teaching Philosophy
            const philosophyContainer = document.getElementById("teaching-philosophy");
            let philosophyContent = `<p>${data.education_teaching_philosophy.description}</p>`;

            data.education_teaching_philosophy.pillars.forEach(pillar => {
                philosophyContent += `<h3>${pillar.title}</h3><ul>`;
                pillar.points.forEach(point => {
                    philosophyContent += `<li>${point}</li>`;
                });
                philosophyContent += `</ul>`;

                if (pillar.images) {
                    philosophyContent += `<div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
                    pillar.images.forEach(image => {
                        philosophyContent += `<img src="image/Class/${image}" alt="${pillar.title}" class="clickable-image" style="width: 30%; border-radius: 10px; cursor: pointer;">`;
                    });
                    philosophyContent += `</div>`;
                }
            });

            philosophyContainer.innerHTML = philosophyContent;

            // Innovation in Teaching
            const innovationContainer = document.getElementById("innovation-content");
            let innovationContent = `<h2>${data.innovation_teaching.title}</h2>`;
            innovationContent += `<p>${data.innovation_teaching.description}</p>`;

            // Video Resources
            innovationContent += `<h3>Video Resources</h3><div style="display: flex; gap: 15px; flex-wrap: wrap;">`;
            data.innovation_teaching.videos.forEach(video => {
                innovationContent += `
                    <div style="flex: 1; min-width: 300px;">
                        <p><strong>${video.title}</strong></p>
                        <iframe width="100%" height="200" src="${video.url}" frameborder="0" allowfullscreen></iframe>
                    </div>`;
            });
            innovationContent += `</div>`;

            // Case Study
            innovationContent += `<h3>Case Study</h3>`;
            innovationContent += `<p>${data.innovation_teaching.case_study.overview}</p><ul>`;
            data.innovation_teaching.case_study.content.forEach(item => {
                innovationContent += `<li>${item}</li>`;
            });
            innovationContent += `</ul>`;
            innovationContent += `<p><strong>Poster Creation:</strong> ${data.innovation_teaching.case_study.poster_tool}</p>`;

            // Image Gallery
            innovationContent += `<h3>Gallery</h3><div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
            data.innovation_teaching.images.forEach(image => {
                innovationContent += `<img src="image/${image}" alt="Innovation Teaching" class="clickable-image" style="width: 30%; border-radius: 10px; cursor: pointer;">`;
            });
            innovationContent += `</div>`;

            innovationContainer.innerHTML = innovationContent;

            // Student Engagement & Instructional Competencies
            const engagementContainer = document.getElementById("student-engagement");
            let engagementContent = `<h2>${data.student_engagement.title}</h2>`;
            data.student_engagement.criteria.forEach(section => {
                engagementContent += `<h3>${section.title}</h3><ul>`;
                section.content.forEach(point => {
                    engagementContent += `<li>${point}</li>`;
                });
                engagementContent += `</ul>`;
            });

            engagementContainer.innerHTML = engagementContent;

            // Class Gallery
            const galleryContainer = document.getElementById("class-gallery");
            let galleryContent = `<h2>${data.class_gallery.title}</h2><div style="display: flex; flex-wrap: wrap; gap: 10px;">`;

            data.class_gallery.images.forEach(image => {
                galleryContent += `<img src="image/Class/${image}" alt="Class Gallery Image" class="clickable-image" style="width: 30%; border-radius: 10px; cursor: pointer;">`;
            });

            galleryContent += `</div>`;
            galleryContainer.innerHTML = galleryContent;

            // 🔥 Fix: Ensure Click Events Attach After Content is Loaded
            setTimeout(() => {
                const modal = document.getElementById("imageModal");
                const modalImg = document.getElementById("fullImage");
                const closeModal = document.querySelector(".close");

                document.querySelectorAll(".clickable-image").forEach(img => {
                    img.addEventListener("click", function () {
                        modal.style.display = "block";
                        modalImg.src = this.src;
                    });
                });

                closeModal.addEventListener("click", function () {
                    modal.style.display = "none";
                });

                modal.addEventListener("click", function (event) {
                    if (event.target === modal) {
                        modal.style.display = "none";
                    }
                });
            }, 500); // Delay to ensure images are in the DOM
        })
        .catch(error => console.error("Error loading JSON data:", error));
});



        /*
        // Image Gallery (With Clickable Modal)
            html += `<h3 style="color: black;">Gallery</h3>`;
            html += `<div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
            data.images.forEach(image => {
                html += `
                    <img src="image/${image}" alt="Student Work" class="clickable-image" style="width: 30%; border-radius: 10px; cursor: pointer;">
                `;
            });
            html += `</div>`;

            // Modal for Full-Screen Image
            html += `
                <div id="imageModal" class="modal">
                    <span class="close">&times;</span>
                    <img class="modal-content" id="fullImage">
                </div>
            `;

            contentContainer.innerHTML = html;

            // Handle Image Click Event
            const images = document.querySelectorAll(".clickable-image");
            const modal = document.getElementById("imageModal");
            const modalImg = document.getElementById("fullImage");
            const closeModal = document.querySelector(".close");

            images.forEach(img => {
                img.addEventListener("click", function () {
                    modal.style.display = "block";
                    modalImg.src = this.src;
                });
            });

            // Close the Modal When Clicking the Close Button
            closeModal.addEventListener("click", function () {
                modal.style.display = "none";
            });

            // Close Modal When Clicking Outside the Image
            modal.addEventListener("click", function (event) {
                if (event.target === modal) {
                    modal.style.display = "none";
                }
            });

        })
        .catch(error => console.error("Error loading innovation data:", error));




        */
        

