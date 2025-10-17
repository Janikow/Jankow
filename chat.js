const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const usernameInput = document.getElementById('username');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const message = input.value.trim();

  if (username.length < 2 || username.length > 10) {
    alert("Username must be 2-10 characters!");
    return;
  }
  if (message.length === 0 || message.length > 100) {
    alert("Message must be 1-100 characters!");
    return;
  }

  socket.emit('chat message', { username, message });
  input.value = '';
  input.focus();
});

socket.on('chat message', function(msg) {
  const item = document.createElement('li');
  item.textContent = `${msg.username}: ${msg.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
