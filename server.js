require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.static('public'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

let latestPresence = {
  status: 'offline',
  activity: null,
  username: '',
  avatar: ''
};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const member = await guild.members.fetch(process.env.USER_ID);

  updatePresence(member.presence, member);
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence) return;

  if (newPresence.userId === process.env.USER_ID) {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(process.env.USER_ID);

    updatePresence(newPresence, member);
  }
});

function updatePresence(presence, member) {
  const user = member.user;

  let activity = null;

  if (presence && presence.activities.length > 0) {
    const act = presence.activities[0];

    activity = {
      name: act.name,
      type: ActivityType[act.type]
    };
  }

  latestPresence = {
    status: presence?.status || 'offline',
    activity,
    username: user.username,
    avatar: user.displayAvatarURL({ dynamic: true, size: 512 })
  };

  io.emit('presenceUpdate', latestPresence);

  console.log('Presence Updated:', latestPresence);
}

app.get('/api/status', (req, res) => {
  res.json(latestPresence);
});

io.on('connection', (socket) => {
  console.log('Website Connected');

  socket.emit('presenceUpdate', latestPresence);
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});

client.login(process.env.TOKEN);
