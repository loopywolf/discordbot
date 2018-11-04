const Discord = require('discord.js');
const sprintf = require('sprintf-js').sprintf;
const vsprintf = require('sprintf-js').vsprintf;
const client = new Discord.Client();
const settings = require('./settings.json');
const { spawn } = require( 'child_process' );

//https://discordapp.com/oauth2/authorize?&client_id=450390626534424586&scope=bot&permissions=0

function getNickname(myUser,myGuildID) {
	var nickname = client.guilds.find('id',myGuildID).members.find('id',myUser.id).nickname;
	if (nickname == null) { nickname = myUser.username; }
	return nickname;
}

client.on('ready',() => {
	console.log("online");
});

client.on('message', message => {
	console.log( message.content );
	//if (message.author === client.user) return;
	//if (!message.content.startsWith(".") || message.author.bot) return;

console.log(message.author.id + ":" + message.author.username);
console.log(message.content);

	// parse command
	var regex = /^\.(.*)$/
	var string = message.content;
	var result = string.match(regex);
	if (!result) {
		return;
	}	
	cmd = result[1];
	
	if (cmd.startsWith('help')) {
		var str = "yes";
		message.channel.send(str);
	}
	
});

client.login(settings.token);
