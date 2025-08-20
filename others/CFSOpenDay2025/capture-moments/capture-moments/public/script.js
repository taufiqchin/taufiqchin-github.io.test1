const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const feed = document.getElementById("moment-feed");

// Start camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    return video.play(); // ensure it starts
  })
  .catch(err => console.error("Camera access error:", err));

// Capture a moment from the live feed
async function captureMoment() {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert("Camera not ready yet. Please wait a second.");
    return;
  }

  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw video frame onto canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert canvas to base64 PNG
  const imageData = canvas.toDataURL("image/png");

  // Send to backend
  const response = await fetch("/save-moment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData })
  });

  const savedMoment = await response.json();

  // Show in feed
  const img = document.createElement("img");
  img.src = savedMoment.path;
  img.width = 200;

  const caption = document.createElement("p");
  caption.textContent = new Date(savedMoment.date).toLocaleString();

  feed.prepend(caption);
  feed.prepend(img);
}

// Load saved moments on page load
async function loadMoments() {
  const response = await fetch("/moments");
  const moments = await response.json();
  feed.innerHTML = "";

  moments.reverse().forEach(moment => {
    const img = document.createElement("img");
    img.src = moment.path;
    img.width = 200;

    const caption = document.createElement("p");
    caption.textContent = new Date(moment.date).toLocaleString();

    feed.appendChild(img);
    feed.appendChild(caption);
  });
}

window.onload = loadMoments;
