const Discord = require('discord.js');
const sprintf = require('sprintf-js').sprintf;
const vsprintf = require('sprintf-js').vsprintf;
const client = new Discord.Client();
const settings = require('./settings.json');
const { spawn } = require( 'child_process' );
// added for MySQL connection
const mysql = require('mysql');
const dbconfig = require('./dbconfig.json');
const dbpool = mysql.createPool(dbconfig);

//https://discordapp.com/oauth2/authorize?&client_id=450390626534424586&scope=bot&permissions=0

function getNickname(myUser,myGuildID) {
	var nickname = client.guilds.find('id',myGuildID).members.find('id',myUser.id).nickname;
	if (nickname == null) { nickname = myUser.username; }
	return nickname;
}

function sheet(message,dbpool,s="") {
	var uid = message.author.id;
	var gid = message.channel.parent.id;
	var sql = "SELECT nickname FROM discord_users WHERE category='"+gid+"' AND userid='"+uid+"'";
	console.log(sql);
	message.channel.send("sheet: "+sql);
	dbpool.query(sql, function (err, result,fields) {
		if (err) throw err;
		if (result) {
			var nickname = result[0].nickname;
			message.channel.send("sheet: "+nickname);
		} else {
			message.channel.send("sheet: not found");
		}
	});
}

function canplay(message,s) {
	console.log("cmd="+cmd);
	//expecting:    game bunch-of-dates
	var user = message.author.username;
	var parameters = cmd.split(" ");
	if(parameters.length<2) { 
		message.channel.send("icanplay: too few parameters");
		return;
	}
	var gameName = parameters[0];
	//the rest are possible dates
	//for(var i=1;i<parameters.length;i++) {
	//	gameDates[] = "2018-01-01";
	//}
	console.log("user="+user+" gameName="+gameName);
	//addYourDates( user, gameName, gameDates );
}//F

function roll(message,s,crit=0,crittrue=0,previous="") {
	var user = message.author.username;
	var finalresult = 0;
	console.log("roll cmd="+s);
	//quick function that takes roll 8 vs 5
	var parameters = s.split(" ");
	if(parameters.length!=3) {
		message.channel.send("roll: I'm expecting 2 parameters like <roll 8 vs 5>");
		return;
	}
	if( parameters[1]!="v" && parameters[1]!="vs") {
		message.channel.send("roll: I'm expecting a 'vs' as 2nd parameter, like <roll 8 vs 5>, but I got "+parameters[1]);
		return;
	}
	var dice = parseInt(parameters[0]);
	if( isNaN(dice)) {
		message.channel.send("roll: "+parameters[0]+" isn't a number.");
		return;
	}
	var difficulty = parseInt(parameters[2]);
	if( isNaN(difficulty)) {
		message.channel.send("roll: "+parameters[2]+" isn't a number.");
		return;
	}
	console.log("dice="+dice+" difficulty="+difficulty);
	var percentile = Math.random();
	var reportPercentile = Math.round(100 * percentile);
	var result = Math.round(percentile * (dice+difficulty)) - difficulty;
	console.log("percentile="+percentile+" dice="+dice+" difficulty="+difficulty+" result="+result);
	// message.channel.send("roll: "+user+" rolled "+s+" and got "+reportPercentile+"% = "+result);
	palindrome(message, reportPercentile, s, result, crit, dice, crittrue, previous); 
}

function palindrome(message, number , s, result, crit=0, dice, crittrue=0, previous="") {
	var rem, temp, final = 0;
	var finalresult = 0;
	var i = 0;
	var user = message.author.username;
	temp = number;
	while(number>0) {
		rem = number%10;
		number = parseInt(number/10);
		final = final*10+rem;
	}
	if(final==temp && temp>10) {
		newcrit = crit + dice;
		crittrue++;
		previous += temp + "% *(doubles)* + ";
		roll(message,s,newcrit,crittrue,previous);
	} else if (crittrue>0 && final!=temp) {
		finalresult = crit + result;
		previous += temp + "%";
		previousresult = "";
		previousdice = dice + " + ";
		while(i<crittrue) {
			previousresult += previousdice;
			i++;
		}
		previousresult += result + " = ";
		message.channel.send("roll: "+user+" rolled "+s+" and got "+previous+" = "+previousresult+finalresult);
	} else {
		message.channel.send("roll: "+user+" rolled "+s+" and got "+temp+"% = "+result);
	}
}

function calc(message,s) {
	var user = message.author.username;
	console.log("calc cmd="+s);
	//quick function that takes roll 8 vs 5 with 80
	var parameters = s.split(" ");
	if(parameters.length!=5) {
		message.channel.send("roll: I'm expecting 3 parameters like <roll 8 vs 5 with 80>");
		return;
	}
	if( parameters[1]!="v" && parameters[1]!="vs") {
		message.channel.send("roll: I'm expecting a 'vs' as 2nd parameter, like <roll 8 vs 5 with 80>, but I got "+parameters[1]);
		return;
	}
	if( parameters[3]!="w" && parameters[3]!="with") {
		message.channel.send("roll: I'm expecting a 'vs' as 2nd parameter, like <roll 8 vs 5 with 80>, but I got "+parameters[1]);
		return;
	}
	var dice = parseInt(parameters[0]);
	if( isNaN(dice)) {
		message.channel.send("roll: "+parameters[0]+" isn't a number.");
		return;
	}
	var difficulty = parseInt(parameters[2]);
	if( isNaN(difficulty)) {
		message.channel.send("roll: "+parameters[2]+" isn't a number.");
		return;
	}
	var newroll = parseInt(parameters[4]);
	if( isNaN(newroll)) {
		message.channel.send("roll: "+parameters[4]+" isn't a number.");
		return;
	}
	console.log("dice="+dice+" difficulty="+difficulty+" roll="+newroll);
	var diceroll = newroll / 100;
	var result = Math.round( diceroll * (dice+difficulty)) - difficulty;
	console.log("percentile="+diceroll+" dice="+dice+" difficulty="+difficulty+" result="+result);
	message.channel.send("calc: "+user+" calculated "+s+"% = "+result);
}

function catid(message) {
	var channel = message.channel;
	var user = message.author.username;
	var id = message.channel.parent.id;
	message.channel.send("catid: "+user+" checked "+channel+" with parent "+id);
}

function myid(message) {
	var user = message.author.username;
	var id = message.author.id;
	message.channel.send("myid: "+user+" checked self-id "+id);
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
		message.channel.send("try:");
		message.channel.send(" icanplay <game> <dates>");
		message.channel.send(" roll <level> vs <difficulty>");
		message.channel.send(" calc <level> vs <difficulty> with <roll>");
	} else
	if(cmd.startsWith('icanplay')) {
		canplay(message,cmd.substr(8+1));
	} else
	if(cmd.startsWith('roll')) {
		var s = cmd.substr(4+1);
		console.log("s="+s);
		roll(message,s);
	}
	if(cmd.startsWith('calc')) {
		var s = cmd.substr(4+1);
		console.log("s="+s);
		calc(message,s);
	}

	if(cmd.startsWith('catid')) {
		catid(message);
	}

	if(cmd.startsWith('myid')) {
		myid(message);
	}
	if(cmd.startsWith('sheet')) {
		sheet(message,dbpool,s="");
	}
});

client.login(settings.token);
