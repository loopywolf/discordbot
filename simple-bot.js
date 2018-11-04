const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client.login('NDYzNTEyNzQ0MzEwNzM0ODQ4.DsCWkA.UxPU7TpEnfl2oM8FEEIatomGEUs');