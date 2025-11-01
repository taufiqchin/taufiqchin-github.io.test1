// Sidebar toggle helpers
var mySidebar = document.getElementById("mySidebar");
var overlayBg = document.getElementById("myOverlay");

function w3_open() {
  if (!mySidebar || !overlayBg) return;
  if (mySidebar.style.display === 'block') {
    mySidebar.style.display = 'none';
    overlayBg.style.display = "none";
  } else {
    mySidebar.style.display = 'block';
    overlayBg.style.display = "block";
  }
}

function w3_close() {
  if (!mySidebar || !overlayBg) return;
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

// Fallback loader for gallery images: try Class/, then root, then lowercase extension
function handleImageFallback(img) {
  try {
    var original = img.getAttribute('data-image') || '';
    var idxStr = img.getAttribute('data-fallback-idx') || '1';
    var idx = parseInt(idxStr, 10);
    var candidates = [];

    // Try the two base paths with original name
    candidates.push('picture/Class/' + original);
    candidates.push('picture/' + original);

    // Also try lowercase extension variants
    var lowered = original.replace(/\.(JPEG|JPG|PNG)$/i, function(m){ return m.toLowerCase(); });
    if (lowered !== original) {
      candidates.push('picture/Class/' + lowered);
      candidates.push('picture/' + lowered);
    }

    if (idx >= candidates.length) {
      img.onerror = null;
      return;
    }

    img.src = candidates[idx];
    img.setAttribute('data-fallback-idx', String(idx + 1));
  } catch (e) {
    try { img.onerror = null; } catch(_) {}
  }
}



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
                <p style="color: black; font-size: 18px; margin: 3px 0;"><strong>Position:</strong> ${profile.position}</p>
                <p style="color: black; font-size: 18px; margin: 3px 0;"><strong>Department:</strong> ${profile.department}</p>
                <p style="color: black; font-size: 18px; margin: 3px 0;"><strong>Date Joined:</strong> ${profile.dateJoin}</p>
                <p style="color: black; font-size: 18px; margin: 3px 0;"><strong>Confirmation Date:</strong> ${profile.confirmationDate}</p>
                <p style="color: black; font-size: 18px; margin: 3px 0;"><strong>Expertise:</strong> ${profile.expertise}</p>
                <p style="color: black; font-size: 18px; margin: 3px 0;"><strong>Quote:</strong> <i>"${profile.quote}"</i></p>
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
                innovationContent += `<h4>View Students Case Studies Report:</h4><ul>`;
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
                innovationContent += `<img src="picture/case/${image}" alt="Innovation Teaching" class="clickable-image" style="width: 12%; border-radius: 10px; cursor: pointer;">`;
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
                galleryContent += `<img data-image="${image}" data-fallback-idx="1" src="picture/Class/${image}" alt="Class Gallery Image" class="clickable-image" onerror="handleImageFallback(this)" style="width: 30%; border-radius: 10px; cursor: pointer;">`;
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

            // Research
            const researchContainer = document.getElementById("research-content");
            if (researchContainer && data.research) {
                let researchHtml = ``;
                if (data.research.description) researchHtml += `<p>${data.research.description}</p>`;
                if (data.research.areas && data.research.areas.length) {
                    researchHtml += `<h3>Areas</h3><ul>`;
                    data.research.areas.forEach(area => { researchHtml += `<li>${area}</li>`; });
                    researchHtml += `</ul>`;
                }
                if (data.research.featured && data.research.featured.length) {
                    researchHtml += `<h3>Featured Projects</h3><ul>`;
                    data.research.featured.forEach(item => {
                        researchHtml += `<li>${item.title}${item.link ? ` - <a href="${item.link}" target="_blank">Link</a>` : ''}</li>`;
                    });
                    researchHtml += `</ul>`;
                }
                researchContainer.innerHTML = researchHtml || `<p>To be updated.</p>`;
            }

            // Publications
            const publicationsContainer = document.getElementById("publications-content");
            if (publicationsContainer && data.publications) {
                let publicationsHtml = ``;
                ["journals","conferences","books"].forEach(cat => {
                    const list = data.publications[cat];
                    if (list && list.length) {
                        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                        publicationsHtml += `<h3>${label}</h3><ol>`;
                        list.forEach(p => { publicationsHtml += `<li>${p}</li>`; });
                        publicationsHtml += `</ol>`;
                    }
                });
                publicationsContainer.innerHTML = publicationsHtml || `<p>To be updated.</p>`;
            }

            // Achievements
            const achievementsContainer = document.getElementById("achievements-content");
            if (achievementsContainer && data.achievements) {
                let html = ``;
                if (data.achievements.awards && data.achievements.awards.length) {
                    html += `<ul>`;
                    data.achievements.awards.forEach(a => { html += `<li>${a}</li>`; });
                    html += `</ul>`;
                }
                achievementsContainer.innerHTML = html || `<p>To be updated.</p>`;
            }

            // Grants & Projects
            const grantsContainer = document.getElementById("grants-content");
            if (grantsContainer && data.grants_projects) {
                let html = ``;
                if (data.grants_projects.items && data.grants_projects.items.length) {
                    html += `<ul>`;
                    data.grants_projects.items.forEach(g => { html += `<li>${g.title} (${g.role}, ${g.year})</li>`; });
                    html += `</ul>`;
                }
                grantsContainer.innerHTML = html || `<p>To be updated.</p>`;
            }

            // Supervision
            const supervisionContainer = document.getElementById("supervision-content");
            if (supervisionContainer && data.supervision) {
                let html = ``;
                if (data.supervision.students && data.supervision.students.length) {
                    html += `<ul>`;
                    data.supervision.students.forEach(s => { html += `<li>${s.name} - ${s.level}</li>`; });
                    html += `</ul>`;
                }
                supervisionContainer.innerHTML = html || `<p>To be updated.</p>`;
            }

            // Service & Leadership
            const serviceContainer = document.getElementById("service-content");
            if (serviceContainer && data.service_leadership) {
                let html = ``;
                if (data.service_leadership.roles && data.service_leadership.roles.length) {
                    html += `<ul>`;
                    data.service_leadership.roles.forEach(r => { html += `<li>${r}</li>`; });
                    html += `</ul>`;
                }
                serviceContainer.innerHTML = html || `<p>To be updated.</p>`;
            }

            // Certifications
            const certsContainer = document.getElementById("certifications-content");
            if (certsContainer && data.certifications) {
                let html = ``;
                if (data.certifications.items && data.certifications.items.length) {
                    html += `<ul>`;
                    data.certifications.items.forEach(c => { html += `<li>${c}</li>`; });
                    html += `</ul>`;
                }
                certsContainer.innerHTML = html || `<p>To be updated.</p>`;
            }

            // Skills
            const skillsContainer = document.getElementById("skills-content");
            if (skillsContainer && data.skills) {
                let html = ``;
                if (data.skills.items && data.skills.items.length) {
                    html += `<ul>`;
                    data.skills.items.forEach(s => { html += `<li>${s}</li>`; });
                    html += `</ul>`;
                }
                skillsContainer.innerHTML = html || `<p>To be updated.</p>`;
            }

            // Outreach
            const outreachContainer = document.getElementById("outreach-content");
            if (outreachContainer && data.outreach) {
                let html = ``;
                if (data.outreach.activities && data.outreach.activities.length) {
                    html += `<ul>`;
                    data.outreach.activities.forEach(o => { html += `<li>${o}</li>`; });
                    html += `</ul>`;
                }
                outreachContainer.innerHTML = html || `<p>To be updated.</p>`;
            }

            // Appendices (reuse case studies)
            const appendicesContainer = document.getElementById("appendices-content");
            if (appendicesContainer && data.innovation_teaching && data.innovation_teaching.case_study && data.innovation_teaching.case_study.case_studies) {
                const list = data.innovation_teaching.case_study.case_studies;
                let html = `<h3>Case Studies</h3>`;
                if (list.length) {
                    html += `<ul>`;
                    list.forEach(pdf => { html += `<li><a href="${pdf.file}" target="_blank">${pdf.title}</a></li>`; });
                    html += `</ul>`;
                }
                appendicesContainer.innerHTML = html;
            }
        })
        .catch(error => console.error("Error loading JSON data:", error));
});

// Smooth scroll and active sidebar link
document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll('.sidebar-link[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const sections = Array.from(links).map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      const navLink = document.querySelector(`.sidebar-link[href="#${id}"]`);
      if (navLink) {
        if (entry.isIntersecting) {
          document.querySelectorAll('.sidebar-link.active').forEach(el => el.classList.remove('active'));
          navLink.classList.add('active');
        }
      }
    });
  }, { rootMargin: '0px 0px -70% 0px', threshold: 0.2 });

  sections.forEach(sec => observer.observe(sec));
});

