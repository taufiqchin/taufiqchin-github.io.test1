// Get the Sidebar
var mySidebar = document.getElementById("mySidebar");

// Get the DIV with overlay effect
var overlayBg = document.getElementById("myOverlay");

// Toggle sidebar on mobile/tablet, always open on desktop
function w3_open() {
    const isMobile = window.innerWidth <= 992;
    if (isMobile) {
        mySidebar.classList.toggle("show");
        const openBtn = document.getElementById("openBtn");
        if (mySidebar.classList.contains("show")) {
            overlayBg.classList.add("show");
            overlayBg.style.display = "block";
            if (openBtn) openBtn.style.opacity = "0";
        } else {
            overlayBg.classList.remove("show");
            overlayBg.style.display = "none";
            if (openBtn) openBtn.style.opacity = "1";
        }
    }
}

// Close the sidebar on mobile/tablet
function w3_close() {
    const isMobile = window.innerWidth <= 992;
    if (isMobile) {
        mySidebar.classList.remove("show");
        overlayBg.classList.remove("show");
        overlayBg.style.display = "none";
        const openBtn = document.getElementById("openBtn");
        if (openBtn) openBtn.style.opacity = "1";
    }
}

// Handle window resize: reset sidebar state when switching between mobile and desktop
window.addEventListener("resize", function () {
    const isMobile = window.innerWidth <= 992;
    if (!isMobile) {
        // If resizing to desktop, show sidebar
        mySidebar.classList.remove("show");
        overlayBg.style.display = "none";
        const openBtn = document.getElementById("openBtn");
        if (openBtn) openBtn.style.opacity = "1";
    }
});



// sidebar JSON
document.addEventListener("DOMContentLoaded", function () {
    fetch("sidebar.json")
        .then(response => response.json())
        .then(data => {
            const sidebar = document.getElementById("mySidebar");


            // Add header
            if (data.header) {
                const header = document.createElement("header");
                header.innerHTML = `
                    <h1><a href="${data.header.link}">${data.header.title}</a></h1>
                    <p><a href="${data.header.subLink}">${data.header.subtitle}</a><br>${data.header.Email}</p>
                `;
                sidebar.appendChild(header);
            }

            // Add other sections
            data.sections.forEach(section => {

                if (section.links) {
                    section.links.forEach(link => {
                        const a = document.createElement("a");
                        a.href = link.url;
                        a.textContent = link.text;
                        a.className = "w3-bar-item w3-button";

                        if (link.class) {
                            a.className += ` ${link.class}`;
                        }
                        if (link.target) {
                            a.target = link.target;
                        }

                        sidebar.appendChild(a);
                    });
                }
            });

            // Add footer with dynamic year to sidebar
            if (data.footer) {
                const footer = document.createElement("footer");
                const currentYear = new Date().getFullYear();
                footer.innerHTML = data.footer.text.replace("{year}", currentYear);
                sidebar.appendChild(footer);
            }

            // Also populate main footer
            const mainFooter = document.querySelector(".main-footer");
            if (mainFooter && data.footer) {
                const currentYear = new Date().getFullYear();
                const footerText = data.footer.text.replace("{year}", currentYear);
                mainFooter.innerHTML = `<p>${footerText}</p>`;
            }
        })
        .catch(error => console.error("Error loading sidebar:", error));

    // Load Portfolio Content from index.json
    loadPortfolioContent();

    // Load Profile from infoSidebar.json
    loadProfileCard();
});

function loadPortfolioContent() {
    fetch("index.json")
        .then(response => response.json())
        .then(data => {
            // Load Teaching Philosophy
            if (data.education_teaching_philosophy) {
                const container = document.getElementById("teaching-content");
                let html = `<p>${data.education_teaching_philosophy.description}</p>`;

                if (data.education_teaching_philosophy.pillars) {
                    data.education_teaching_philosophy.pillars.forEach((pillar, index) => {
                        html += `<h3>${pillar.title}</h3>`;
                        html += `<ul class="teaching-bullets">`;
                        pillar.points.forEach(point => {
                            html += `<li>👉 ${point}</li>`;
                        });
                        html += `</ul>`;

                        if (pillar.images) {
                            html += `<div class="w3-row">`;
                            pillar.images.forEach(img => {
                                html += `<div class="w3-half w3-container"><img src="picture/${img}" alt="Teaching" onclick="openImageModal(this.src)" style="width:100%; margin-bottom:10px; cursor:pointer;"></div>`;
                            });
                            html += `</div>`;
                        }
                    });
                }
                container.innerHTML = html;
            }

            // Load Innovation in Teaching
            if (data.innovation_teaching) {
                const container = document.getElementById("innovation-content");
                let html = `
                    <p class="w3-large w3-text-grey">${data.innovation_teaching.description}</p>
                    <div class="w3-row-padding" style="margin: 0 -16px;">
                `;

                if (data.innovation_teaching.subjects) {
                    data.innovation_teaching.subjects.forEach(subject => {
                        html += `
                            <div class="w3-col l6 m12 s12 w3-margin-bottom">
                                <div class="w3-card-4 w3-round-large w3-white">
                                    <header class="w3-container w3-theme-black w3-round-top-large" style="padding: 15px;">
                                        <h3><i class="fa ${subject.icon}"></i> ${subject.name}</h3>
                                    </header>
                                    <div class="w3-container" style="padding: 20px;">
                                        <p>${subject.description}</p>
                        `;

                        // Render Tech Stack Badge for Web Tech
                        if (subject.tech_stack) {
                            html += `<div style="margin-bottom: 15px;">`;
                            subject.tech_stack.forEach(tech => {
                                html += `<span class="w3-tag w3-teal w3-round w3-small" style="margin-right: 5px; margin-bottom: 5px;">${tech}</span>`;
                            });
                            html += `</div>`;
                        }

                        // Render Subject-specific Videos
                        if (subject.videos) {
                            html += `<p><strong>Tutorial Videos:</strong></p>`;
                            html += `<div class="w3-row">`;
                            subject.videos.forEach(video => {
                                html += `
                                    <div class="w3-half w3-container w3-margin-bottom" style="padding: 2px;">
                                        <h4 style="font-size: 11px; min-height: 25px; margin: 5px 0;">${video.title}</h4>
                                        <iframe width="100%" height="225" src="${video.url}" frameborder="0" allowfullscreen style="border-radius: 4px;"></iframe>
                                    </div>`;
                            });
                            html += `</div>`;
                        }

                        // Render Case Studies
                        if (subject.case_study) {
                            html += `<hr style="margin: 10px 0;">`;
                            html += `<p><strong>Innovation Highlight:</strong> ${subject.case_study.overview}</p>`;

                            if (subject.case_study.samples) {
                                html += `<fieldset style="border: 1px solid #ccc; border-radius: 4px; padding: 10px; margin: 10px 0;">`;
                                html += `<legend style="font-weight: bold; padding: 0 5px;">Sample Student Reports</legend>`;
                                html += `<details>`;
                                html += `<summary style="cursor: pointer; font-size: small;">Click to view sample reports</summary>`;
                                html += `<div class="w3-bar-block w3-light-grey w3-round" style="max-height: 150px; overflow-y: auto; padding: 10px; margin-top: 10px;">`;
                                subject.case_study.samples.forEach(study => {
                                    html += `<a href="${study.file}" target="_blank" class="w3-bar-item w3-button w3-small"><i class="fa fa-file-pdf-o w3-text-red"></i> ${study.title}</a>`;
                                });
                                html += `</div>`;
                                html += `</details>`;
                                html += `</fieldset>`;
                            }
                        }

                        // Render images inside card if they exist
                        if (subject.images) {
                            html += `<hr style="margin: 10px 0;">`;
                            html += `<fieldset style="border: 1px solid #ccc; border-radius: 4px; padding: 10px; margin: 10px 0;">`;
                            html += `<legend style="font-weight: bold; padding: 0 5px;">Artifacts</legend>`;
                            html += `<details>`;
                            html += `<summary style="cursor: pointer; font-size: small;">Click to view artifacts</summary>`;
                            html += `<div class="w3-row" style="margin-top: 10px;">`;
                            subject.images.forEach(img => {
                                html += `<div class="w3-quarter w3-container" style="padding: 2px;"><img src="picture/${img}" alt="Artifact" onclick="openImageModal(this.src)" style="width:100%; cursor:pointer;" class="w3-hover-opacity w3-round"></div>`;
                            });
                            html += `</div>`;
                            html += `</details>`;
                            html += `</fieldset>`;
                        }

                        html += `
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }

                html += `</div>`; // Close row-padding
                container.innerHTML = html;
            }

            // Load Student Engagement
            if (data.student_engagement) {
                const container = document.getElementById("engagement-content");
                let html = ``;

                if (data.student_engagement.criteria) {
                    data.student_engagement.criteria.forEach((criterion, index) => {
                        html += `<h3>${criterion.title}</h3>`;
                        criterion.content.forEach(text => {
                            html += `<p>${text}</p>`;
                        });
                    });
                }
                container.innerHTML = html;
            }

            // Load Teaching Responsibilities
            if (data.teaching_responsibilities) {
                const container = document.getElementById("responsibilities-content");
                let html = `
                    <div class="w3-responsive">
                    <table class="w3-table w3-bordered w3-white w3-card-4">
                        <tr class="w3-theme-black">
                            <th>Course Name</th>
                            <th>Academic Years</th>
                        </tr>
                `;

                data.teaching_responsibilities.courses.forEach(course => {
                    html += `
                        <tr>
                            <td><strong>${course.name}</strong></td>
                            <td>${course.years.join(" &nbsp; ")}</td>
                        </tr>
                    `;
                });

                html += `</table></div>`;
                container.innerHTML = html;
            }

            // Load Class Gallery
            if (data.class_gallery) {
                const container = document.getElementById("gallery-content");
                let html = `<div class="w3-row">`;

                if (data.class_gallery.images) {
                    data.class_gallery.images.forEach(img => {
                        html += `<div class="w3-third w3-container"><img src="picture/${img}" alt="Class" class="clickable-image" onclick="openImageModal(this.src)" style="width:100%; margin-bottom:10px; cursor:pointer;"></div>`;
                    });
                }
                html += `</div>`;
                container.innerHTML = html;
            }

            // Load Research
            if (data.research) {
                const container = document.getElementById("research-content");
                let html = `<p>${data.research.description}</p>`;

                if (data.research.areas) {
                    html += `<h3>Research Areas</h3><ul>`;
                    data.research.areas.forEach(area => {
                        html += `<li>${area}</li>`;
                    });
                    html += `</ul>`;
                }
                container.innerHTML = html;
            }

            // Load Publications
            if (data.publications) {
                const container = document.getElementById("publications-content");
                let html = ``;

                if (data.publications.journals && data.publications.journals.length > 0) {
                    html += `<h3>Journal Publications</h3><ul>`;
                    data.publications.journals.forEach(pub => {
                        html += `<li>${pub}</li>`;
                    });
                    html += `</ul>`;
                }

                if (data.publications.conferences && data.publications.conferences.length > 0) {
                    html += `<h3>Conference Publications</h3><ul>`;
                    data.publications.conferences.forEach(pub => {
                        html += `<li>${pub}</li>`;
                    });
                    html += `</ul>`;
                }
                container.innerHTML = html;
            }

            // Load Achievements
            if (data.achievements) {
                const container = document.getElementById("achievements-content");
                let html = `
                    <div class="w3-responsive">
                    <table class="w3-table w3-bordered w3-white w3-card-4">
                        <tr class="w3-theme-black">
                            <th>Date</th>
                            <th>Award & Recognition</th>
                            <th>Level</th>
                        </tr>
                `;

                if (data.achievements.awards) {
                    data.achievements.awards.forEach(item => {
                        html += `
                            <tr>
                                <td>${item.date}</td>
                                <td><strong>${item.title}</strong><br><small>${item.institution}</small></td>
                                <td><span class="w3-tag w3-teal">${item.level}</span></td>
                            </tr>
                        `;
                    });
                }

                html += `</table></div>`;
                container.innerHTML = html;
            }

            // Load Skills
            if (data.skills) {
                const container = document.getElementById("skills-content");
                let html = `<div class="w3-row">`;

                if (data.skills.items) {
                    data.skills.items.forEach(skill => {
                        html += `<div class="w3-quarter w3-container"><div class="w3-card w3-padding" style="background-color: #f1f1f1; text-align: center; margin-bottom: 10px;"><p><strong>${skill}</strong></p></div></div>`;
                    });
                }
                html += `</div>`;
                container.innerHTML = html;
            }
        })
        .catch(error => console.error("Error loading portfolio content:", error));
}

function loadProfileCard() {
    fetch("infoSidebar.json")
        .then(response => response.json())
        .then(data => {
            const profileCard = document.getElementById("profile-card");
            if (!data.profile) return;

            const profile = data.profile;

            let html = `
                <div style="text-align: center;">
                    <!-- Profile Image -->
                    <img src="${profile.image}" alt="${profile.name}" onclick="openImageModal(this.src)" style="width: 50%; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); cursor:pointer;">
                    
                    <!-- Profile Name -->
                    <h3 style="margin: 15px 0 5px 0; color: #2c3e50; font-size: 18px; font-weight: 700;">
                        ${profile.name}
                    </h3>
                    
                    <!-- Position -->
                    <p style="margin: 5px 0; color: #009688; font-weight: 600; font-size: 14px;">
                        ${profile.position}
                    </p>
                    
                    <!-- Department -->
                    <p style="margin: 5px 0; color: #555; font-size: 13px;">
                        ${profile.department}
                    </p>
                    
                    <!-- Quote -->
                    <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #009688; border-radius: 4px;">
                        <p style="font-style: italic; color: #666; margin: 0; font-size: 13px;">
                            "${profile.quote}"
                        </p>
                    </div>
                    
                    <!-- Employment Details -->
                    <div style="text-align: left; background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <p style="margin: 8px 0; font-size: 13px;">
                            <strong style="color: #2c3e50;">Date Joined:</strong><br>
                            <span style="color: #666;">${profile.dateJoin}</span>
                        </p>
                        <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
                        <p style="margin: 8px 0; font-size: 13px;">
                            <strong style="color: #2c3e50;">Confirmation Date:</strong><br>
                            <span style="color: #666;">${profile.confirmationDate}</span>
                        </p>
                        <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
                        <p style="margin: 8px 0; font-size: 13px;">
                            <strong style="color: #2c3e50;">Expertise:</strong><br>
                            <span style="color: #666;">${profile.expertise}</span>
                        </p>
                    </div>
                    
                    <!-- Additional Images -->
                    <div style="margin-top: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            ${profile.image1 ? `<img src="${profile.image1}" alt="Additional" onclick="openImageModal(this.src)" style="width: 100%; border-radius: 6px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); cursor:pointer;">` : ''}
                            ${profile.image2 ? `<img src="${profile.image2}" alt="Additional" onclick="openImageModal(this.src)" style="width: 100%; border-radius: 6px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); cursor:pointer;">` : ''}
                        </div>
                    </div>
                </div>
            `;

            profileCard.innerHTML = html;
        })
        .catch(error => console.error("Error loading profile card:", error));
}

function openImageModal(src) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("imgFull");
    if (modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = src;
    }
}
