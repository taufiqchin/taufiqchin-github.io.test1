// Get the Sidebar
var mySidebar = document.getElementById("mySidebar");

// Get the DIV with overlay effect
var overlayBg = document.getElementById("myOverlay");

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


// sidebar JSON
document.addEventListener("DOMContentLoaded", function () {
    fetch("sidebar.json")
        .then(response => response.json())
        .then(data => {
            const sidebar = document.getElementById("mySidebar");
            sidebar.innerHTML = ""; // Clear existing content

            // Add header
            if (data.header) {
                const header = document.createElement("header");
                header.innerHTML = `
                    <h1><a href="${data.header.link}" style="color: white;">${data.header.title}</a></h1>
                    <p><a href="${data.header.subLink}" style="color: white;">${data.header.subtitle}</a><br>${data.header.session}</p>
                `;
                sidebar.appendChild(header);
            }

            // Add buttons
            data.buttons.forEach(button => {
                const btn = document.createElement("button");
                btn.textContent = button.label;
                btn.className = "btn btn-link d-block pl-0 pt-0";
                btn.style.color = "white";

                if (button.icon) {
                    btn.innerHTML = `<i class="${button.icon}"></i> ${button.label}`;
                }
                if (button.type === "modal") {
                    btn.setAttribute("data-toggle", "modal");
                    btn.setAttribute("data-target", button.action);
                }
                if (button.type === "toggle") {
                    btn.setAttribute("aria-controls", "nav");
                    btn.setAttribute("aria-expanded", "false");
                    btn.setAttribute("data-toggle", "collapse");
                    btn.setAttribute("data-target", button.target);
                }
                sidebar.appendChild(btn);
            });

            // Add local date and time section
            const dateTimeDiv = document.createElement("div");
            dateTimeDiv.innerHTML = `<span id="user-time"></span>`;
            sidebar.appendChild(dateTimeDiv);

            // Add other sections
            data.sections.forEach(section => {
                if (section.hr) {
                    sidebar.appendChild(document.createElement("hr"));
                }
                if (section.links) {
                    const ul = document.createElement("ul");
                    section.links.forEach(link => {
                        const li = document.createElement("li");
                        li.innerHTML = `<a href="${link.url}" style="color: white;">${link.text}</a>`;
                        ul.appendChild(li);
                    });
                    sidebar.appendChild(ul);
                }
            });

            // Add footer with dynamic year
            if (data.footer) {
                const footer = document.createElement("footer");
                footer.innerHTML = data.footer.text;
                sidebar.appendChild(footer);
            }

            // Function to update local date and time (12-hour format)
            function updateLocalTime() {
                let now = new Date();
                
                let formattedDate = now.toLocaleDateString("en-GB", {
                    weekday: "short",  // Short day name (e.g., Mon, Tue)
                    day: "2-digit",
                    month: "short",   // Short month name (e.g., Jan, Feb)
                    year: "numeric"
                });

                let formattedTime = now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                });

                document.getElementById("user-time").textContent = `${formattedDate} ${formattedTime}`;
            }

            // Update time every second
            setInterval(updateLocalTime, 1000);
            updateLocalTime(); // Initial call
        })
        .catch(error => console.error("Error loading sidebar:", error));
});
