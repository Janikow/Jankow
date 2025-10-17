// chat.js
const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

// When the form is submitted
form.addEventListener("submit", function(e) {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

// When a chat message is received
socket.on("chat message", function(msg) {
  const item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight; // Auto-scroll
});
