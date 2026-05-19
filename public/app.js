const socket = io();

socket.on('presenceUpdate', (data) => {
  document.getElementById('avatar').src = data.avatar;
  document.getElementById('username').textContent = data.username;

  const status = document.getElementById('status');

  status.className = 'status-dot ' + data.status;

  if (data.activity) {
    document.getElementById('activity').textContent = `${data.activity.type}: ${data.activity.name}`;
  } else {
    document.getElementById('activity').textContent = 'No activity';
  }
});
