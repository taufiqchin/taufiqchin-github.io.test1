const LocalStorageAPI = {
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getItem(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  clear() {
    localStorage.clear();
  },
};

document.getElementById("saveBtn").addEventListener("click", () => {
  const username = prompt("Enter your username:");
  if (username) {
    LocalStorageAPI.setItem("username", username);
    alert("Username saved!");
  }
});

document.getElementById("loadBtn").addEventListener("click", () => {
  const saved = LocalStorageAPI.getItem("username");
  alert(saved ? "Saved username: " + saved : "No username saved.");
});

document.getElementById("clearBtn").addEventListener("click", () => {
  LocalStorageAPI.clear();
  alert("Local storage cleared.");
});
