const Discord = require('discord.js');
const util = require('util');
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

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function longest(arr) {
  var alenght = 0;
  var y=0;
  while(y<arr.length) {
	  if (arr[y].length > alenght) {
		  alenght = arr[y].length;
	  }
	  y++;
  } 
  return alenght;
}

function sheet(message,dbpool,s="") {
	var uid = message.author.id;
	var gid = message.channel.parent.id;
	var cid = "0";
	var pnick = "";
	var result = [];
	var skills = [];
	var combat = [];
	var roleplay = [];
	var other = [];
	var sp = [];
	var ip = [];
	var statagl = pad("-- AGL ",10,' ');
	var statbrn = pad("-- BRN ",10,' ');
	var statcrd = pad("-- CRD ",10,' ');
	var statovh = pad("-- OVH ",10,' ');
	var statpcn = pad("-- PCN ",10,' ');
	var statper = pad("-- PER ",10,' ');
	var statstr = pad("-- STR ",10,' ');
	var statwpr = pad("-- SPR ",10,' '); 
	var statluck = 0;
	var statxp = 0;
	var statName = "";
	var tally = "";
	var sql = "";
	var skills = [];

	sql = "SELECT nickname,char_id AS charid FROM discord_users WHERE category='"+gid+"' AND userid='"+uid+"'"
        dbpool.query(sql, function (err, result,fields) {
                if (err) throw err;
                if (Object.keys(result).length) {
                        pnick = result[0].nickname;
			cid = result[0].charid;
			sql = "SELECT * from dice_stats WHERE char_id = '"+cid+"'";
			console.log(pnick);
			console.log(cid);

			        result = {};
        console.log(sql);
        dbpool.query(sql, function (err, result ,fields) {
                if (err) throw err;
                if (Object.keys(result).length) {
                        console.log(sql);
                        var i=0; // result index
			var j=0; // skill index
			var k=0; // combat index
			var l=0; // other index
			var m=0; // rp index
			var n=0; // sp index
			var o=0; // ip index
			var z=0; // gp counter
			var r=0; // counter to switch row 
                        while(i<Object.keys(result).length) {
                                statName = result[i].statName;
				statValue = result[i].statValue;
				tally = result[i].tally;
                                switch (statName) {
                                        case "AGL":
                                                statagl = pad(result[i].statValue+" AGL ",10,' ');
                                                break;
                                        case "BRN":
                                                statbrn = pad(result[i].statValue+" BRN ",10,' ');
                                                break;
                                        case "CRD":
                                                statcrd = pad(result[i].statValue+" BRN ",10,' ');
                                                break;
                                        case "OVH":
                                                statovh = pad(result[i].statValue+" OVH ",10,' ');
                                                break;
                                        case "PCN":
                                                statpcn = pad(result[i].statValue+" PCN ",10,' ');
                                                break;
                                        case "PER":
                                                statper = pad(result[i].statValue+" PER ",10,' ');
                                                break;
                                        case "STR":
                                                statstr = pad(result[i].statValue+" STR ",10,' ');
                                                break;
                                        case "WPR":
                                                statwpr = pad(result[i].statValue+" WPR ",10,' ');
                                                break;
                                        case "LUCK":
                                                statluck = pad(result[i].statValue+" LUCK ",10,' ');
                                                break;
                                        case "XP":
                                                statxp = pad(result[i].statValue+" XP ",10,' ');
                                                break;
                                        default:
						console.log("statName: "+statName);
						console.log("tally: "+tally);
						if (tally.startsWith('BASE')) {
							skills[j] = pad(result[i].statValue,2,' ')+" "+statName;
							j++;
						} else if (tally.startsWith('BLAST') || tally.startsWith('DAM') || tally.startsWith('WPN') || 	tally.startsWith('ARMOR') || tally.startsWith('TFF') || tally.startsWith('H2H') ) {
							combat[k] = pad(result[i].statValue,3,' ')+" "+statName+" ["+tally+"]";
							k++;
						} else if (tally.startsWith('-')) {
							roleplay[m] = pad(result[i].statValue,2,' ')+" "+statName+" ["+tally+"]";
							m++;
						} else if (tally.startsWith('?')) {
							other[l] = pad(result[i].statValue,2,' ')+" "+statName+" ["+tally+"]";
							l++;
						} else if (statName.startsWith('IP-') || statName.startsWith('NIP-') || statName.startsWith('INCOME')) {
							//ip[o] = pad(result[i].statValue,2,' ')+" "+statName+" ["+tally+"]";
							//o++;
						} else if (!statName.startsWith('SD') && !statName.startsWith('BODY') && !statName.startsWith('DAMAGE') && !statName.startsWith('FREEB') && !statName.startsWith('SUSTAIN') && !statName.startsWith('LW') && !statName.startsWith('LB') && !statName.startsWith('INJURY') && !statName.startsWith('INIT') && !statName.startsWith('IO') && !statName.startsWith('PB') && !statName.startsWith('PW') && !statName.startsWith('FREEBIES') ) {
							sp[n] = pad(result[i].statValue,4,' ')+" "+statName+" ["+tally+"]";	
							n++;
						}


                               	}	
                                i++;
                        }

			var pcskill = "";
			z=0;
			r=0;
			var maxl=longest(skills);
			var maxr=2;
                        if (maxl > 20) {
                                maxr--;
                        }
                        if (maxl > 30) {
                                maxr--;
                        }
			while(z<j) {
				pcskill += "|"+pad(skills[z],maxl,' ')+" ";
				if(r<maxr && z+1<j) {
					r++;
				} else if (z+1==j) {
					pcskill += "|";
				} else {
					pcskill += "|\n  ";
					r=0;
				}
				z++;
			}

			var pccombat = "";
			z=0;
			r=0;
			maxl=longest(combat);
			maxr=2;
                        if (maxl > 20) {
                                maxr--;
                        }
                        if (maxl > 30) {
                                maxr--;
                        }
			while(z<k) {
				pccombat += "|"+pad(combat[z],maxl,' ')+" ";
				if(r<maxr && z+1<k) {
					r++;
				} else if (z+1==k) {
					pccombat += "|";
				} else {
					pccombat += "|\n  ";
					r=0;
				}
				z++;
			}

			var pcrp = "";
			z=0;
			r=0;
			maxl=longest(roleplay);
			maxr=2;
			if (maxl > 20) {
				maxr--;
			}
			while(z<m) {
				// console.log(z+" "+roleplay[z]);
				pcrp += "|"+pad(roleplay[z],maxl,' ')+" ";
				if(r<maxr && z+1<m) {
					r++;
				} else if (z+1==m) {
					pcrp += "|";
				} else {
					pcrp += "|\n  ";
					r=0;
				}
				z++;
			}

			var pcother = "";
			z=0;
			r=0;
			maxl=longest(other);
			maxr=2;
                        if (maxl > 20) {
                                maxr--;
                        }
                        if (maxl > 30) {
                                maxr--;
                        }

			while(z<l) {
                                console.log(z+" "+other[z]);
                                pcother += "|"+pad(other[z],maxl,' ')+" ";
                                if(r<maxr && z+1<l) {
                                        r++;
                                } else if (z+1==l) {
                                        pcother += "|";
                                } else {
                                        pcother += "|\n  ";
                                        r=0;
                                }
                                z++;
			}

			var pcsp = "";
			z=0;
			r=0;
			maxl=longest(sp);
			maxr=2;
			if (maxl > 20) {
				maxr--;
			}
			if (maxl > 30) {
				maxr--;
			}

			while(z<n) {
				console.log(z+" "+sp[z]);
				pcsp += "|"+pad(sp[z],maxl,' ')+" ";
				if(r<maxr && z+1<n) {
					r++;
				} else if (z+1==n) {
					pcsp += "|";
				} else {
					pcsp += "|\n  ";
					r=0;
				}
				z++;
			}

                        var pcip = "";
                        z=0;
                        r=0;
                        maxl=longest(ip);
                        maxr=2;
                        if (maxl > 20) {
                                maxr--;
                        }
                        if (maxl > 30) {
                                maxr--;
                        }

                        while(z<o) {
                                console.log(z+" "+ip[z]);
                                pcip += "|"+pad(ip[z],maxl,' ')+" ";
                                if(r<maxr && z+1<o) {
                                        r++;
                                } else if (z+1==o) {
                                        pcip += "|";
                                } else {
                                        pcip += "|\n  ";
                                        r=0;
                                }
                                z++;
                        }


                        var pcsheet = `
SHEET: ${pnick}

  #STATS
  |${statagl}|${statbrn}|${statcrd}|${statovh}|
  |${statpcn}|${statper}|${statstr}|${statwpr}|
  |${statluck}|${statxp}|

  #SKILLS
  ${pcskill}

  #COMBAT
  ${pccombat}

  #SPECIAL_ABILITIES
  ${pcsp}

  #INFLUENCE_POINTS
  ${pcip}

  #OTHER
  ${pcother}

  #ROLEPLAYS
  ${pcrp}

`;
                        console.log(pcsheet);
			var pcs = "```css"+pcsheet+"```" 
                        message.channel.send(pcs);
                }
        });
                } else {
			message.channel.send("sheet: not found");
                        return false;
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
	if(cmd.startsWith('mysheet')) {
		sheet(message,dbpool,s="");
	}
	if(cmd.startsWith('sheet')) {
		var s = cmd.substr(5+1);
		sheet(message,dbpool,s);
	}
});

client.login(settings.token);
