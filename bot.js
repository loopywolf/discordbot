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

//https://discordapp.com/oauth2/authorize?&client_id=450390626534424586&scope=bot&permissions=0 //3072?

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

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}
function gm(message) {
    console.log('gm?');
    if(!message.member.roles.cache.find(r=>["@gm"].includes(r.name)))
        return false;
    else
        return true;
}

function groupinjury(message,dbpool,s) {
        if(!gm(message)) {
                message.channel.send("I am sorry.  You are not allowed to do this");
        } else {
		s = mysql_real_escape_string(s);
		var parameters = s.split(" ");
		if(parameters.length != 1) {
			message.channel.send("groupinjury: expecting 1 parameter (groupinjury <game>)");
			return 0;
		}
	}
}

function injury(message,dbpool,s="") {
    var uid = message.author.id;
    var gid = message.channel.parent.id;
    var i=0;
    var pcbody=0;
    var pcwound=0;

    if ( s == "" ) {
            sql = "SELECT nickname,char_id AS charid FROM discord_users WHERE category='"+gid+"' AND userid='"+uid+"'";
    } else {
	    s = mysql_real_escape_string(s);s = mysql_real_escape_string(s);
	    var parameters = s.split(" ");
	    if(parameters.length != 1) {
		    message.channel.send("injury: expecting 1 parameter (groupinjury <character>)");
		    return 0;
	    }
            sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+s+"'";
    }

    dbpool.query(sql, function (err, result,fields) {
        if (err) throw err;
        if (Object.keys(result).length) {
            pnick = result[0].nickname;
            cid = result[0].charid;
            sql = "SELECT statName,statValue from dice_stats WHERE char_id = '"+cid+"' AND (statName = 'PW' OR statName = 'PB')" ;
            result = {};
            dbpool.query(sql, function (err, result,fields) {
                    if (err) throw err;
                    if (Object.keys(result).length) {
							while(i<Object.keys(result).length) {
								if (result[i].statName == 'PW') {
									pcwound = result[i].statValue;
								} else if (result[i].statName == 'PB') {
									pcbody = result[i].statValue;
								}
								i++;
							}
			    				if (pcwound >= 100) {
								message.channel.send("injury: "+pnick+" has "+pcwound+"% wounds and is dying.");
							} else if ((pcwound+pcbody)>= 100 ) {
								message.channel.send("injury: "+pnick+" has "+pcwound+"% wounds, "+pcbody+"% body and is incapacitated.");
							} else if (pcwound > 0 ) {
                                                                message.channel.send("injury: "+pnick+" has "+pcwound+"% wounds and is injured.");
                                                        } else if (pcbody > 0) {
								message.channel.send("injury: "+pnick+" has "+pcbody+"% body and is bruised.");
							} else {
								message.channel.send("injury: "+pnick+" does not have any injuries.");
							}
                    } else {
						message.channel.send("injury: "+pnick+" does not have any injuries.");
                    }
            })
        } else {
            message.channel.send("injury: Sorry, I could not find your character.");
            return;
        }
   })
}

function luck(message,dbpool,s) {
	s = mysql_real_escape_string(s);
	var cid = 0;
	var pnick = '';
	var charluck = 0;

	if(!gm(message)) {
		message.channel.send("I am sorry.  You are not allowed to do this");
	} else {
		var parameters = s.split(" ");
		if(parameters.length != 2) {
			message.channel.send("luck: expecting 2 parameters (luck <character> <amount>)");
			return false;
		}
		charluck = Number(parameters[1]);
		pnick = parameters[0];
		if(isNaN(charluck)){
			message.channel.send("luck: expecting numerical value for luck (luck <character> <amount>)");
			return false;
		}
		sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+pnick+"'";
		dbpool.query(sql, function (err, result,fields) {
			if (err) throw err;
			if (Object.keys(result).length) {
				pnick = result[0].nickname;
				cid = result[0].charid;
				sql = "UPDATE dice_stats SET statValue = statValue + '"+charluck+"' WHERE dice_stats.char_id = '"+cid+"' AND dice_stats.statName = 'LUCK'";
				result = {};
				dbpool.query(sql, function (err, result,fields) {
					if (err) throw err;
					//message.channel.send("Done - "+pnick+" received "+charluck+" luck.");
					message.channel.send("Luck: "+pnick+" received "+charluck+" luck.");
				})
			} else {
				message.channel.send("luck: can't find character "+pnick);
			}
		})
	}
}

function setvalue(message,dbpool,s) {	//updated to .setvalue Adept BRN = 6
        s = mysql_real_escape_string(s);
        var cid = 0;
        var pnick = '';
        var value = 0;
		var statName = '';

        //console.log("SV"); //is a message at this point
        //console.log(message);
        if(!gm(message)) {
                message.channel.send("I am sorry.  You are not allowed to do this");
        } else {
                var parameters = s.split(" ");
                if(parameters.length != 4) {
                    message.channel.send("setvalue: expecting 4 parameters (setvalue <character> <stat> = <value>)");
                    return false;
                }
                if(parameters[2]!="=") {
                	message.channel.send("setvalue: expecting 3rd parameter to be =");
                	return false;
                }
				statName = parameters[1];
                value = Number(parameters[3]);
                pnick = parameters[0];
                if(isNaN(value)){
                        message.channel.send("setvalue: expecting numerical value for value (setvalue <character> <stat> <value>)");
                        return false;
                }
                sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+pnick+"'";
                dbpool.query(sql, function (err, result,fields) {
                        if (err) throw err;
                        if (Object.keys(result).length) {
                                cid = result[0].charid;
				sql = "INSERT INTO dice_stats (char_id, statName, statValue, tally) VALUES ('"+cid+"','"+statName+"',"+value+",'') ON DUPLICATE KEY UPDATE statValue = "+value;
                //console.log("sql="+sql);
				sanity={};
				dbpool.query(sql, function (err,sanity,fields) {
					if (err) throw err;
				})
                                pnick = result[0].nickname;
                                sql = "UPDATE dice_stats SET statValue = '"+value+"' WHERE dice_stats.char_id = '"+cid+"' AND dice_stats.statName = '"+statName+"'";
                                //console.log("sql="+sql);
                                result = {};
                                dbpool.query(sql, function (err, result,fields) {
                                        if (err) throw err;
                                        message.channel.send("setvalue: "+statName+" set to "+value+" for "+pnick);
                                })
                        } else {
                                message.channel.send("setvalue: can't find character "+pnick);
                        }
                })
        }
}

function xp(message,dbpool,s) {
        s = mysql_real_escape_string(s);
        var cid = 0;
        var pnick = '';
        var charxp = 0;

        if(!gm(message)) {
                message.channel.send("I am sorry.  You are not allowed to do this");
        } else {
                var parameters = s.split(" ");
                if(parameters.length != 2) {
                        message.channel.send("xp: expecting 2 parameters (luck <character> <amount>)");
                        return false;
                }
                charxp = Number(parameters[1]);
                pnick = parameters[0];
                if(isNaN(charxp)){
                        message.channel.send("xp: expecting numerical value for luck (luck <character> <amount>)");
                        return false;
                }
                sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+pnick+"'";
                dbpool.query(sql, function (err, result,fields) {
                        if (err) throw err;
                        if (Object.keys(result).length) {
                                pnick = result[0].nickname;
                                cid = result[0].charid;
                                sql = "UPDATE dice_stats SET statValue = statValue + '"+charxp+"' WHERE dice_stats.char_id = '"+cid+"' AND dice_stats.statName = 'XP'";
                                result = {};
                                dbpool.query(sql, function (err, result,fields) {
                                        if (err) throw err;
                                        message.channel.send("xp: "+pnick+" received "+charxp+" xp.");
                                })
                        } else {
                                message.channel.send("xp: can't find character "+pnick);
                        }
                })
        }
}

function bonus(message,dbpool,s) {
        s = mysql_real_escape_string(s);
        var cid = 0;
        var pnick = '';
        var charbonus = 0;

        if(!gm(message)) {
                message.channel.send("I am sorry.  You are not allowed to do this");
        } else {
                var parameters = s.split(" ");
                if(parameters.length != 2) {
                        message.channel.send("bonus: expecting 2 parameters (bonus <character> <amount>)");
                        return false;
                }
                charbonus = Number(parameters[1]);
                pnick = parameters[0];
                if(isNaN(charbonus)){
                        message.channel.send("bonus: expecting numerical value for bonus (bonus <character> <amount>)");
                        return false;
                }
                sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+pnick+"'";
                dbpool.query(sql, function (err, result,fields) {
                        if (err) throw err;
                        if (Object.keys(result).length) {
                                pnick = result[0].nickname;
                                cid = result[0].charid;
                                sql = "UPDATE dice_stats SET statValue = statValue + '"+charbonus+"' WHERE dice_stats.char_id = '"+cid+"' AND dice_stats.statName = 'BONUS'";
                                result = {};
                                dbpool.query(sql, function (err, result,fields) {
                                        if (err) throw err;
                                        message.channel.send("bonus: "+pnick+" received "+charbonus+" points.");
                                })
                        } else {
                                message.channel.send("bonus: can't find character "+pnick);
                        }
                })
        }
}

function registercharacter(message,s,dbpool) {
	var game = ""
	var gameid = 0;
	var nickname = "";

	if(!gm(message)) {
		message.channel.send("I am sorry.  You are not allowed to do this");
	} else {
		var parameters = s.split(" ");
		//add <character> in <game>
		if(parameters.length != 3) {
			message.channel.send("add: expecting 3 parameters (add <character> in <game>)");
			return false;
		} 
		if(parameters[1] != "in") {
			message.channel.send("add: expecting 3 parameters (add <character> in <game>)");
			return false;
		}
		nickname = parameters[0];
		game = parameters[2];
		var sql = "SELECT id FROM dice_games WHERE gameName = '"+game+"'";
		dbpool.query(sql, function (err, result,fields) {
			if (err) throw err;
			if (Object.keys(result).length) {
				gameid=result[0].id;
				result = {};
				sql = "INSERT INTO dice_characters (name,game_id,aspects,image_path,map_x,map_y) VALUES ('"+nickname+"','"+gameid+"','','','','')";
				//sql = "INSERT INTO dice_characters (name,game_id,aspects,image_path,map_x,map_y) SELECT '"+nickname+"','"+gameid+"',''.'','','' FROM DUAL WHERE NOT EXISTS (SELECT name FROM dice_characters WHERE name='"+nickname+"')";
				console.log(sql);
				dbpool.query(sql, function (err, result, fields) {
					if (err) throw err;
					sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+nickname+"'";
dbpool.query(sql, function (err, result,fields) {
	if (err) throw err;
	cid = result[0].charid;
	result = {};
	sql="INSERT INTO dice_stats(char_id, statName, statValue, tally) VALUES ('"+cid+"','LUCK',5,'');"
    dbpool.query(sql, function (err, result,fields) { if (err) throw err; });
	result = {};
	sql="INSERT INTO dice_stats(char_id, statName, statValue, tally) VALUES ('"+cid+"','XP',0,'');"
	dbpool.query(sql, function (err, result,fields) { if (err) throw err; });
	result = {};
	sql="INSERT INTO dice_stats(char_id, statName, statValue, tally) VALUES ('"+cid+"','BONUS',0,'???');"
	dbpool.query(sql, function (err, result,fields) { if (err) throw err; });
	result = {};
        sql="INSERT INTO dice_stats(char_id, statName, statValue, tally) VALUES ('"+cid+"','PB',0,'');"
        dbpool.query(sql, function (err, result,fields) { if (err) throw err; });
	result = {};
        sql="INSERT INTO dice_stats(char_id, statName, statValue, tally) VALUES ('"+cid+"','PW',0,'');"
	q
        dbpool.query(sql, function (err, result,fields) { if (err) throw err; });
});
					message.channel.send("Okay added "+nickname+" to "+game);
				});


			} else {
				message.channel.send("Game "+game+" was not found.");
			}
		});
	}
}

function iam(message,s,dbpool) {
	var uid = message.author.id;
	var gid = message.channel.parent.id;
	s = mysql_real_escape_string(s);
	console.log('iam: '+s);
	// message.channel.send("myid: "+user+" checked self-id "+id);
	var sql1 = "SELECT id AS charid FROM dice_characters WHERE name ='"+s+"'";
        dbpool.query(sql1, function (err, result,fields) {
                if (err) throw err;
                if (Object.keys(result).length) {
			cid = result[0].charid;
			result = {};
			var sql2 = "SELECT nickname, char_id AS charid FROM discord_users WHERE category='"+gid+"' AND userid='"+uid+"'";
			dbpool.query(sql2, function (err, result,fields) {
				if (err) throw err;
				if (Object.keys(result).length && result[0].nickname == s ) {
					message.channel.send("Hi "+s+"!  Glad to see you again!");
				} else if (Object.keys(result).length && result[0].nickname != s) {
					message.channel.send("Are you sure you're "+s+"?  I think you are "+result[0].nickname+".");
				} else {
					var sql3="INSERT INTO discord_users (category,userid,char_id,nickname) VALUES ('"+gid+"','"+uid+"','"+cid+"','"+s+"')";
					dbpool.query(sql3, function (err, result,fields) {
						if (err) throw err;
						message.channel.send("Hi "+s+"! Nice to meet you.");
					});
				}
			});
		} else {
			message.channel.send("Hi "+s+"! I am sorry, but LoopyWolf said not to talk to strangers!")
		}
	});
}

function sheet(message,dbpool,s="",mobile=0) {
	s = mysql_real_escape_string(s);
	console.log("s: "+s);
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

	if ( s == "" ) {
		sql = "SELECT nickname,char_id AS charid FROM discord_users WHERE category='"+gid+"' AND userid='"+uid+"'";
	} else {
		sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+s+"'";
	}
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
							ip[o] = pad(result[i].statValue,2,' ')+" "+statName+" ["+tally+"]";
							o++;
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
			if (mobile == 1) {
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
			if (mobile == 1) {
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
			if (maxl > 30) {
				maxr--;
			}
			if (mobile == 1) {
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
			if (mobile == 1) {
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
			if (mobile == 1) {
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
			if (mobile == 1) {
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

`
			var stats = "";
			if (mobile == 0) {

stats = `  #STATS
  |${statagl}|${statbrn}|${statcrd}|${statovh}|
  |${statpcn}|${statper}|${statstr}|${statwpr}|

  #SCORES
  |${statluck}|${statxp}|
`;
			} else {
stats = `  #STATS
  |${statagl}|${statbrn}|
  |${statcrd}|${statovh}|
  |${statpcn}|${statper}|
  |${statstr}|${statwpr}|

  #SCORES
  |${statluck}|${statxp}|
`;
			}

pcsheet += stats + `
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
			message.channel.send("https://monfur.ca/dstory/sheet.php?name="+pnick);
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

function diceroll(message) {
	var percentile = Math.random();
	var reportPercentile = Math.round(100 * percentile);
	message.channel.send("diceroll: "+reportPercentile);
	return;
}

function callten(message,dbpool) {
    var uid = message.author.id;
    var gid = message.channel.parent.id;
    sql = "SELECT nickname,char_id AS charid FROM discord_users WHERE category='"+gid+"' AND userid='"+uid+"'";
    dbpool.query(sql, function (err, result,fields) {
        if (err) throw err;
        if (Object.keys(result).length) {
            pnick = result[0].nickname;
            cid = result[0].charid;
            sql = "SELECT statValue from dice_stats WHERE char_id = '"+cid+"' AND statName = 'LUCK'";
            console.log(pnick);
            console.log(cid);
            result = {};
	    dbpool.query(sql, function (err, result,fields) {
		    if (err) throw err;
		    if (Object.keys(result).length) {
			    luck = result[0].statValue;
			    if (luck > 0) {
				    luck = luck - 1;
				    sql = "UPDATE dice_stats SET statValue = '"+luck+"' WHERE dice_stats.char_id = '"+cid+"' AND dice_stats.statName = 'LUCK'";
			            result = {};
				    dbpool.query(sql, function (err, result,fields) {
					    if (err) throw err;
					    message.channel.send("call10: "+pnick+" now has luck "+luck);
					    return;
				    })
			    } else {
				    message.channel.send("call10: "+pnick+" does not have enough luck.");
			    }
		    }
	    })
        } else {
	    message.channel.send("call10: Sorry, I could not find your character.");
	    return;
	}
   })
}

function reroll(message,dbpool) {
    var uid = message.author.id;
    var gid = message.channel.parent.id;
    sql = "SELECT nickname,char_id AS charid FROM discord_users WHERE category='"+gid+"' AND userid='"+uid+"'";
    dbpool.query(sql, function (err, result,fields) {
        if (err) throw err;
        if (Object.keys(result).length) {
            pnick = result[0].nickname;
            cid = result[0].charid;
            sql = "SELECT statValue from dice_stats WHERE char_id = '"+cid+"' AND statName = 'LUCK'";
            console.log(pnick);
            console.log(cid);
            result = {};
            dbpool.query(sql, function (err, result,fields) {
                    if (err) throw err;
                    if (Object.keys(result).length) {
                            luck = result[0].statValue;
                            if (luck > 1) {
                                    luck = luck - 2;
                                    sql = "UPDATE dice_stats SET statValue = '"+luck+"' WHERE dice_stats.char_id = '"+cid+"' AND dice_stats.statName = 'LUCK'";
                                    result = {};
                                    dbpool.query(sql, function (err, result,fields) {
                                            if (err) throw err;
                                            message.channel.send("reroll: "+pnick+" now has luck "+luck);
                                            return;
                                    })
                            } else {
                                    message.channel.send("reroll: "+pnick+" does not have enough luck.");
                            }
                    }
            })
        } else {
            message.channel.send("reroll: Sorry, I could not find your character.");
            return;
        }
   })
}

function roll(message,s,crit=0,crittrue=0,previous="",version="v1") {
	var user = message.author.username;
	var uid = message.author.id;
	var finalresult = 0;
	console.log("roll cmd="+s);
	//quick function that takes roll 8 vs 5
	
	s = s.replace(/\s+/g, '');
	var parameters = s.split(/(vs|v)/i);
        var pl = parameters.length;
        console.log(parameters);

	if(parameters.length!=3) {
		message.channel.send("roll: I'm expecting 2 parameters like <roll 8 vs 5>");
		return;
	}
	
	/*
	var parameters = s.split(" ");
	if(parameters.length!=3) {
		message.channel.send("roll: I'm expecting 2 parameters like <roll 8 vs 5>");
		return;
	}
	if( parameters[1]!="v" && parameters[1]!="vs") {
		message.channel.send("roll: I'm expecting a 'vs' as 2nd parameter, like <roll 8 vs 5>, but I got "+parameters[1]);
		return;
	}
	*/
	
	/* UPDATE 2022 FEB - before sending down the chain, figure out if there is a "+x" on the left and a "+y" on the right and if so,
	                     calculate it, and send it down the chain to the sub-functions 
	var bonus = stripPlusOff(parameters[0]);
	var penalty = stripPlusOff(parameters[2]);
	if(bonus>=0) {
		//strip off the "+"
		parameters[0] = parameters[0].substr( 
			parameters[0].length - bonus.toString().length - 1,
			bonus.toString().length + 1);	//e.g. if it's STR+4, strlen is 1, 5 - 1 = 4
		console.log("without bonus("+bonus+"), parameter is "+parameters[0]);
		//can make this a function call?
	}
	if(penalty>=0) {
		//strip off the "+"
		parameters[2] = parameters[2].substr( 
			parameters[2].length - penalty.toString().length - 1,
			penalty.toString().length + 1);	//e.g. if it's STR+4, strlen is 1, 5 - 1 = 4
		console.log("without penalty("+penalty+"), parameter is "+parameters[2]);
	} */

	var dice = parseInt(parameters[0]);
	if( isNaN(dice)) {
        rollWithStat( message,s,crit=0,crittrue=0,previous="",version); //this has to be made into an async call of its own :(
        return;
	}
	var difficulty = parseInt(parameters[2]);
	if( isNaN(difficulty)) {
		message.channel.send("roll: "+parameters[2]+" isn't a number.");
		return;
	}
	if(version=="v2")
		sendRollResultV2(message,s,dice);
	else
		sendRollResult(message,s,dice);
}

function sendRollResult(message,s,dice,crit=0,crittrue=0,previous=""){
	// var parameters = s.split(" ");
	var parameters = s.split(/(vs|v)/i);

	var diffparse = parameters[2].split("+");
        var difficulty = 0;
        diffparse.forEach(function (item, index) {
                if(isNaN(item)) {
                        message.channel.send("roll: "+parameters[2]+" isn't a number.");
                        return;
                }
                difficulty = difficulty+parseInt(item);
        });
	/*
	var difficulty = parseInt(parameters[2]);
	if( isNaN(difficulty)) {
		message.channel.send("roll: "+parameters[2]+" isn't a number.");
		return;
	}
	*/

	console.log("dice="+dice+" difficulty="+difficulty);
	var percentile = Math.random();
	var reportPercentile = Math.round(100 * percentile);
	var result = Math.round(percentile * (dice+difficulty)) - difficulty;
	console.log("percentile="+percentile+" dice="+dice+" difficulty="+difficulty+" result="+result);
	// message.channel.send("roll: "+user+" rolled "+s+" and got "+reportPercentile+"% = "+result);
	//palindrome(message, reportPercentile, s, result, crit, dice, crittrue, previous);
    if(percentile>0.95) {
        //new critical rolls - 1 level only for now
        //percentile = Math.random();
        //result = Math.round((1.0+percentile) * (dice+difficulty)) - difficulty;
        reportPercentile = reportPercentile + " Critical!! Roll again and add 100";
        console.log("critical "+percentile);
        //see 20200701 for original code (uh above)
    }//if

    var cm = combatModifier(result);
    message.channel.send("roll: "+message.author.username+" rolled "+s+" and got "+reportPercentile+"/100 = "+result+cm);
}//F sendRollResult

function palindrome(message, number , s, result, crit=0, dice, crittrue=0, previous="") { //33 is the same backwards - I'm retiring this
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
	if(final==temp && temp>10 && false) { //number is the same backwards as forwards - shorted out for time being
		newcrit = crit + dice;
		crittrue++;
		previous += temp + "% *(doubles)* + ";
		console.log("doubles 10x"+final+" 1x"+temp);
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
		message.channel.send("roll: "+user+" rolled "+s+" and got "+temp+"/100 = "+result);
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

function rollWithStat(message,s,crit=0,crittrue=0,previous="",version="v1") {
    var user = message.author.username;
    var uid = message.author.id;
    var finalresult = 0;
    console.log("rollWithStat cmd="+s);
    //quick function that takes roll 8 vs 5
    // var parameters = s.split(" ");
    var parameters = s.split(/(vs|v)/i);

    var statparse = parameters[0].split("+");
    var dice = 0;
    var tempdice = 0;
    var bonus = 0;

    statparse.forEach(function (item, index) {
      if(isNaN(item)) {
        // console.log("rollWithStat: trying username "+user+" as chr for "+statName);
	console.log("rollWithStat: trying username "+user+" as chr for "+item);
        sql =
            'SELECT ds.statValue '+
            'FROM dice_characters dc INNER JOIN dice_stats ds ON (ds.char_id = dc.id) '+
            'WHERE dc.name = "'+user+'" '+
            'AND ds.statName = "'+item+'"';

        console.log('query ='+sql);
        dbpool.query(sql, function (err, result,fields) {
            if (err) throw err;
            console.log('queried.');
            if (Object.keys(result).length) {
                dice = dice + parseInt(result[0].statValue);
		console.log("dice="+dice.toString()+" value="+result[0].statValue);
		tempdice = tempdice + parseInt(result[0].statValue);
		console.log("Found First DB Pass")
		message.channel.send(user+"'s "+statName+" is "+result[0].statValue);
            } else {
        	console.log("rollWithStat: nothing found in dB");
		    //simple stupid brute-force way to fix this
		    console.log("rollWithStat: trying discord user "+uid+" as chr for "+item);
		    sql = 
            'select statName,statValue,nickname'+
            ' from discord_users du INNER JOIN dice_stats ds ON (du.char_id = ds.char_id)'+
            ' WHERE du.userid = '+uid+ //217438047803932672
            ' AND category = '+message.channel.parent+
            ' AND statName = "'+item+'"';

		    dbpool.query(sql, function (err, result,fields) {
		        if (err) throw err;
		        if (Object.keys(result).length) {
			    dice = dice + parseInt(result[0].statValue);
			    console.log("Found in 2nd DB Pass");
			    console.log("dice="+dice.toString()+" value="+result[0].statValue);
			    tempdice = tempdice + parseInt(result[0].statValue);
		            //dice = result[0].statValue;
		            iam = result[0].nickname;
			    //console.log("rollWithStat2: "+statName+" = "+dice);
		            console.log("rollWithStat2: "+item+" = "+result[0].statValue);  
	                    console.log("category is "+message.channel.parent);
			    message.channel.send(user+"'s "+item+" = "+result[0].statValue);
		        } else {
		          console.log("rollWithStat: nothing found for discord.");
                          message.channel.send("Nothing found for "+item);
			  return;
		        }
                     });

                 }
            });
        } else {
            dice = dice + parseInt(item);
	    bonus = bonus + parseInt(item);
      }
    })
    // message.channel.send(user+"'s "+parameters[0]+" is "+tempdice.toString()+"+"+bonus.toString()); 
    if(version=="v2") {
      sendRollResultV2(message,s,dice);
    } else {
      sendRollResult(message,s,dice);
    }
    return;
}//F

function sendStatResult(dice,difficulty,message,reportPercentile,s,result,crit,dice,crit,previous) {
    //var dice = getStat( statName, user, uid );

    //var difficulty = parseInt(parameters[2]);
    if( isNaN(difficulty)) {
        message.channel.send("sendStatResult: "+parameters[2]+" isn't a number.");
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

function combatModifier(n) {
	//gives the combat modifier
	if(n>=10) return " [double]";
	if(n>=7.5) return " [1.5x]";
	if(n>=5) return " [full]";
	if(n>=2.5) return " [half]";
	if(n>=1) return " [10%]";
	return "";
}

function stripPlusOff(s) {
	// tries to strip off a "+x" from this string and returns that value or -1 if not possible
	console.log("stripPlusOff..."+s);
	var parameters = s.split("+");
	console.log("stripPlusOff..l="+parameters.length);
	if(parameters.length!=2) return -1;
	console.log("stripPlusOff: "+parameters);
	//var number = parameters[1].parseInt();
	//if( isNaN(number)) return -1;

	return parameters[1];
}

function sendRollResultV2(message,s,dice,crit=0,crittrue=0,previous=""){
        // var parameters = s.split(" ");
        var parameters = s.split(/(vs|v)/i);	
	var diffparse = parameters[2].split("+");
	var difficulty = 0;
	diffparse.forEach(function (item, index) {
		if(isNaN(item)) {
			message.channel.send("rollv2: "+parameters[2]+" isn't a number.");
			return;
		}
		difficulty = difficulty+parseInt(item);
	});

	//var difficulty = parseInt(parameters[2]);
	/*	
	if( isNaN(difficulty)) {
		message.channel.send("rollv2: "+parameters[2]+" isn't a number.");
		return;
	}
	*/
	/*
	if(difficulty<=1 || dice<=1) {
		message.channel.send("rollv2: dice and difficulty must be larger than 1 for this to work.");
		return;
	}
	*/
	console.log("dice="+dice+" difficulty="+difficulty);
	
	// var dDice = 1 + Math.round( Math.random() * (dice-1) );
	// var dTarget = 1 + Math.round( Math.random() * (difficulty-1) );

	var dDice = Math.floor(Math.random() * (dice+1));
	var dTarget =  Math.floor(Math.random() * (difficulty+1));


	var maxMessage = "";
	/*
	if(dTarget==difficulty) {
		maxMessage = difficulty+" so ";
		dTarget = 0;
	}
	*/
	var total = dDice + dTarget;
	var margin = dDice + dTarget - difficulty;
	var successOrFail = "**success** (margin is +"+margin+")";
	if(margin<0) 
		successOrFail = "**failure** (margin is "+margin+")";
	if(margin==0)
		successOrFail = "?";
	console.log("dDice="+dDice+" dTarget="+dTarget+" margin="+margin+" successOrFail="+successOrFail);
	// message.channel.send("roll: "+user+" rolled "+s+" and got "+reportPercentile+"% = "+result);
	//palindrome(message, reportPercentile, s, result, crit, dice, crittrue, previous);
	//critical

    var cm = combatModifier(margin);
    message.channel.send("rollv2: "+message.author.username+" rolled (d"+dice+",d"+difficulty+") and got ["+dDice+"]["+maxMessage+dTarget+"] (total "+total+
    	") is a "+successOrFail+cm
    );
}//F sendRollResultV2

function weeklyXp(message,dbpool,s) {
        s = mysql_real_escape_string(s);
        //week dubois in-game=2 doom=4 risk=1
        //dubois in-game=2 doom=4 risk=1

        if(!gm(message)) {
                message.channel.send("I am sorry.  You are not allowed to do this");
        } else {
                var parameters = s.split(" ");
                var charName = parameters[0];
	        var weeklyXp = 0;
                //xp in-game=3 risk=2 doom=4
                for(var i=1;i<parameters.length;i++) {	//starting after name
                	var breakdown = parameters[i].split("=");
                        if(breakdown.length != 2) {
	                        message.channel.send("weeklyxp: expecting 2 parameters (e.g. in-game=2)");
	                        return false;
	                } 	
                	var cat = breakdown[0];
                	var award = Number(breakdown[1]);
	                if(isNaN(award)){
	                        message.channel.send("weeklyxp: expecting numerical value for xp (e.g. in-game=2)");
	                        return false;
	                }
	                weeklyXp += award;
                }//for
                console.log("weeklyxp: char="+charName+" total="+weeklyXp);

                sql = "SELECT name AS nickname, id AS charid FROM dice_characters WHERE name ='"+charName+"'";
                dbpool.query(sql, function (err, result,fields) {
                        if (err) throw err;
                        if (Object.keys(result).length) {
                                pnick = result[0].nickname;
                                cid = result[0].charid;
                                sql = "UPDATE dice_stats SET statValue = statValue + '"+weeklyXp+"' WHERE dice_stats.char_id = '"+cid+"' AND dice_stats.statName = 'XP'";
                                result = {};
                                dbpool.query(sql, function (err, result,fields) {
                                        if (err) throw err;
                                        message.channel.send("weeklyxp: "+pnick+" received "+weeklyXp+" xp.");
                                })
                        } else {
                                message.channel.send("weeklyxp: can't find character "+pnick);
                        }
                })
        }
}//F

/* ---------------------------------------------------------------------------
     CCCC  OOO  DDDD  EEEEE
    C     O   O D   D E
    C     O   O D   D EEE
    C     O   O D   D E
     CCCC  OOO  DDDD  EEEEE

------------------------------------------------------------------------------ */

client.on('ready',() => {
    console.log("online");
});

client.on('message', message => {
    console.log( message.content );
    //if (message.author === client.user) return;
    //if (!message.content.startsWith(".") || message.author.bot) return;

console.log(message.author.id + ":" + message.author.username);
console.log(message.content);
//console.log(message);   //DEBUG

    // parse command
    var regex = /^\.(.*)$/
    var string = message.content;
    var result = string.match(regex);
    if (!result) {
        return;
    }   
    cmd = result[1];
    
    if (cmd.startsWith('help')) {
        var help = `
[General Commands]:
  .icanplay <game> <dates>
  .diceroll
  .roll <level> vs <difficulty>
  .calc <level> vs <difficulty> with <roll>
  .sheet <character>
  .mobilesheet <character>
  .injury <character>

[Player Commands]
  .I am <character>
  .mysheet
  .mymobilesheet
  .call10
  .reroll

[GM Commands]
  .add <character> in <game>
  .bonus <character> <amount>
  .xp <character> <amount>
  .luck <character> <amount>
  .setvalue <character> <stat> <amount>
`;
        message.channel.send("```css\n"+help+"```");
    } else
    if(cmd.startsWith('icanplay')) {
        canplay(message,cmd.substr(8+1));
    } else
    if(cmd.startsWith('roll')) {
        var s = cmd.substr(4+1);
        console.log("s="+s);
        roll(message,s);
    } 

    if(cmd.startsWith('v2roll')) {
        var s = cmd.substr(6+1);
        console.log("s="+s);
        roll(message,s,0,0,"","v2");
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
    if(cmd.startsWith('mymobilesheet')) {
        sheet(message,dbpool,s="",1);
    }
    if(cmd.startsWith('mobilesheet')) {
        var s = cmd.substr(11+1);
        sheet(message,dbpool,s,1);
    }
    if(cmd.startsWith('I am')||cmd.startsWith('i am')) {
        var s = cmd.substr(4+1);
        iam(message,s,dbpool);
    }
    if(cmd.startsWith('add')) {
        var s = cmd.substr(3+1);
        registercharacter(message,s,dbpool);
    }
    if(cmd.startsWith('diceroll')) {
        diceroll(message);
    }
    if(cmd.startsWith('call10')) {
        callten(message,dbpool);
    }

    if(cmd.startsWith('reroll')) {
        reroll(message,dbpool);
    }

        if(cmd.startsWith('injury')) {
        var s = cmd.substr(6+1);
                injury(message,dbpool,s);
        }

    if(cmd.startsWith('luck')) {
        var s = cmd.substr(4+1);
                luck(message,dbpool,s);
        }

    if(cmd.startsWith('week')) {
        var s = cmd.substr(4+1);
                weeklyXp(message,dbpool,s);
        }

    if(cmd.startsWith('xp')) {
        var s = cmd.substr(2+1);
                xp(message,dbpool,s);
    }

        if(cmd.startsWith('setvalue')) {
                var s = cmd.substr(8+1);
                //console.log("AB message:"); //is still a amessage at this point
                //console.log(message);
                setvalue(message,dbpool,s);
        }

        if(cmd.startsWith('initvalue')) {
                var s = cmd.substr(8+1);
                settally(message,dbpool,s);
        }

    if(cmd.startsWith('bonus')) {
                var s = cmd.substr(5+1);
                bonus(message,dbpool,s);
        }
});

client.login(settings.token);
//client.on("debug", console.log);
//client.on("warn", console.log);
