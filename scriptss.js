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
    const fetchSidebar = fetch("sidebar.json").then(response => response.json());
    const fetchResearch = fetch("research.json").then(response => response.json()).catch(() => []);

    Promise.all([fetchSidebar, fetchResearch])
        .then(([data, researchItems]) => {
            const sidebar = document.getElementById("mySidebar");
            sidebar.innerHTML = ""; // Clear existing content

            // Add header
            if (data.header) {
                const header = document.createElement("header");
                header.innerHTML = `
                    <h1><a href="${data.header.link}">${data.header.title}</a></h1>
                    <p><a href="${data.header.subLink}">${data.header.subtitle}</a><br>${data.header.Email}</p>
                `;
                sidebar.appendChild(header);
            }

            // Add buttons/sections
            if (data.buttons) {
                // handle buttons as before
                data.buttons.forEach(button => {
                    const btn = document.createElement("button");
                    btn.textContent = button.label;
                    btn.className = "btn btn-link d-block pl-0 pt-0";
                    btn.style.color = "white";
                    if (button.icon) btn.innerHTML = `<i class="${button.icon}"></i> ${button.label}`;
                    if (button.type === "modal") { btn.setAttribute("data-toggle", "modal"); btn.setAttribute("data-target", button.action); }
                    if (button.type === "toggle") { btn.setAttribute("aria-controls", "nav"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("data-toggle", "collapse"); btn.setAttribute("data-target", button.target); }
                    sidebar.appendChild(btn);
                });
            }

            // Add other sections
            data.sections.forEach(section => {
                if (section.hr) sidebar.appendChild(document.createElement("hr"));
                if (section.links) {
                    section.links.forEach(link => {
                        const a = document.createElement("a");
                        a.href = link.url;
                        a.textContent = link.text;
                        a.className = "w3-bar-item w3-button";
                        if (link.class) a.className += ` ${link.class}`;
                        if (link.target) a.target = link.target;
                        sidebar.appendChild(a);

                        // If this is the Research link, auto-populate sub-links
                        if (link.text === "Research") {
                            researchItems.forEach(item => {
                                const subA = document.createElement("a");
                                subA.href = item.url;
                                subA.textContent = item.title;
                                subA.target = "_blank"; // Open in new tab
                                subA.className = "w3-bar-item w3-button sidebar-sublink";
                                sidebar.appendChild(subA);
                            });
                        }
                    });
                }
            });

            // Add footer to sidebar
            if (data.footer) {
                const footer = document.createElement("footer");
                footer.innerHTML = data.footer.text.replace("{year}", new Date().getFullYear());
                sidebar.appendChild(footer);
            }

            // Populate main footer
            const mainFooter = document.querySelector(".main-footer");
            if (mainFooter && data.footer) {
                mainFooter.innerHTML = `<p>${data.footer.text.replace("{year}", new Date().getFullYear())}</p>`;
            }

            // After sidebar, load page-specific content
            loadLatestUpdates();
            loadKnowledgeBase();
            loadResearchProjects();
        })
        .catch(error => console.error("Error loading sidebar:", error));
});

function loadResearchProjects() {
    const listContainer = document.getElementById("research-projects-list");
    if (!listContainer) return;

    fetch("research.json")
        .then(response => response.json())
        .then(data => {
            listContainer.innerHTML = data.map(item => `
                <li><a href="${item.url}" target="_blank">${item.title}</a> - ${item.description}</li>
                <hr>
            `).join('');
        })
        .catch(error => console.error("Error loading research items:", error));
}


function loadLatestUpdates() {
    const container = document.getElementById("latest-updates-container");
    if (!container) return;

    fetch("latest_updates.json")
        .then(response => response.json())
        .then(data => {
            // Sort by order ascending
            data.sort((a, b) => a.order - b.order);

            container.className = "latest-updates-grid";
            container.innerHTML = data.map(update => `
                <div class="update-item-card">
                    <div class="update-image-container">
                        <img src="${update.image}" alt="${update.title}">
                    </div>
                    <div class="update-content">
                        <h3>${update.title}</h3>
                        <div class="update-description">${update.description.replace(/\n/g, '<br><br>')}</div>
                        <button class="read-more-btn" onclick="toggleReadMore(this)">Read More</button>
                        ${update.link ? `<div class="update-link"><strong>Link:</strong> <a href="${update.link}" target="_blank" style="color: #009688;">Visit <i class="fa fa-external-link"></i></a></div>` : ''}
                    </div>
                </div>
            `).join('');
        })
        .catch(error => console.error("Error loading latest updates:", error));
}

function toggleReadMore(button) {
    const description = button.previousElementSibling;
    if (description.classList.contains('expanded')) {
        description.classList.remove('expanded');
        button.textContent = 'Read More';
    } else {
        description.classList.add('expanded');
        button.textContent = 'Read Less';
    }
}


function loadKnowledgeBase() {
    const container = document.getElementById("knowledge-base-container");
    if (!container) return;

    fetch("knowledge.json")
        .then(response => response.json())
        .then(data => {
            // Group items by category
            const categories = {};
            data.forEach(item => {
                if (!categories[item.category]) {
                    categories[item.category] = [];
                }
                categories[item.category].push(item);
            });

            // Generate HTML for each category
            let html = '';
            for (const [category, items] of Object.entries(categories)) {
                html += `<h3 class="knowledge-category-title">${category}</h3>`;
                html += `<div class="knowledge-grid">`;

                items.forEach(item => {
                    html += `
                        <div class="knowledge-item">
                            <div class="content-card">
                                <iframe src="${item.videoUrl}" allowfullscreen></iframe>
                                <div class="card-padding">
                                    <h3>${item.title}</h3>
                                    <p>${item.description}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += `</div>`;
            }

            container.innerHTML = html;
        })
        .catch(error => console.error("Error loading knowledge base:", error));
}

