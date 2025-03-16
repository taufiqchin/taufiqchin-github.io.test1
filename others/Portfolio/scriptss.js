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
                        philosophyContent += `<img src="picture/Class/${image}" alt="${pillar.title}" class="clickable-image" style="width: 30%; border-radius: 10px; cursor: pointer;">`;
                    });
                    philosophyContent += `</div>`;
                }
            });

            philosophyContainer.innerHTML = philosophyContent;

            // Innovation in Teaching
            const innovationContainer = document.getElementById("innovation-content");
            let innovationContent = ``;
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

            // Case Study PDFs
            if (data.innovation_teaching.case_study.case_studies && data.innovation_teaching.case_study.case_studies.length > 0) {
                innovationContent += `<h4>Download Case Studies:</h4><ul>`;
                data.innovation_teaching.case_study.case_studies.forEach(pdf => {
                    innovationContent += `<li><a href="${pdf.file}" target="_blank">${pdf.title}</a></li>`;
                });
                innovationContent += `</ul>`;
            } else {
                innovationContent += `<p>No case studies available.</p>`;
            }


            

            // Image Gallery
            innovationContent += `<h3>Case Study Report to Canva</h3><div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
            data.innovation_teaching.images.forEach(image => {
                innovationContent += `<img src="picture/case/${image}" alt="Innovation Teaching" class="clickable-image" style="width: 30%; border-radius: 10px; cursor: pointer;">`;
            });
            innovationContent += `</div>`;

            innovationContainer.innerHTML = innovationContent;

            // Student Engagement & Instructional Competencies
            const engagementContainer = document.getElementById("student-engagement");
            let engagementContent = ``;
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
            let galleryContent = ``;

            data.class_gallery.images.forEach(image => {
                galleryContent += `<img src="picture/Class/${image}" alt="Class Gallery Image" class="clickable-image" style="width: 30%; border-radius: 10px; cursor: pointer;">`;
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

