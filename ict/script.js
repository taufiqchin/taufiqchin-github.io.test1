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


// button copy link
    function copyToClipboard() {
      // Get the text content of the link
      var linkText = document.getElementById("map-link").innerText;

      // Create a temporary input element
      var tempInput = document.createElement("input");
      tempInput.setAttribute("value", linkText);

      // Append the input element to the document
      document.body.appendChild(tempInput);

      // Select the text content of the input element
      tempInput.select();
      tempInput.setSelectionRange(0, 99999); // For mobile devices

      // Copy the selected text to the clipboard
      document.execCommand("copy");

      // Remove the temporary input element
      document.body.removeChild(tempInput);

      // Provide feedback (you can customize this)
      //alert("Link copied to clipboard: " + linkText);
    }



