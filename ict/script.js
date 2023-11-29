function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
}


// image

window.onload = function() {
  var container = document.querySelector('.image-container');
  var image = document.getElementById('image');
  var containerHeight = container.clientHeight;
  var imageHeight = containerHeight * 0.6; // Set the image height to 60% of the container's height
  image.style.height = imageHeight + 'px';
};
