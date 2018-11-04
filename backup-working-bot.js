const Discord = require('discord.js');
const sprintf = require('sprintf-js').sprintf;
const vsprintf = require('sprintf-js').vsprintf;
const client = new Discord.Client();
const settings = require('./settings.json');
const { spawn } = require( 'child_process' );

//https://discordapp.com/oauth2/authorize?&client_id=450390626534424586&scope=bot&permissions=0

// Subject + plot goal + inhibited by + romance interest

// The [boy_lead | girl_lead] [goal] but [block] and [romance] before he can succeed.

// EXAMPLE:
// The sultan tries to build his spaceship but is prevented by his fear of jazz music and must reconcile with his dog's love before he can succeed.

const boy_lead =[
"sultan",
"boy's father",
"hunter"
];

		// The [boy_lead | girl_lead] [goal] but [block] and [romance] before he can succeed.

const girl_lead =[
"princess",
"boy's mother",
"starship captain"
];

		// The [boy_lead | girl_lead] [goal] but [block] and [romance] before he can succeed.
// use he him his - it'll replace for a girl
const goal = [
"has to build his spaceship",
"has to carry on an enlightening conversation"
];

		// The [boy_lead | girl_lead] [goal] but [block] and [romance] before he can succeed.

const block = [
"is prevented by someone interrupting",
"is prevented by his fear of jazz music",
"lost everything he owns and must regain his life"
];

		// The [boy_lead | girl_lead] [goal] but [block] and [romance] before he can succeed.

// note, we might get same-gender romance going, which is fine.
const romance = [
"has to reconcile with his dog's love",
"has to find true love",
"has to purchase a lovebird and give it to his spouse"
];

const eyes_general = [
"large",
"small",
"narrow",
"hard"
];

const eyes_color = [
"chestnut",
"chocolate brown",
"cocoa brown",
"moss green"
];

const eyebrows = [
"arched eyebrows",
"thick eyelashes"
];

const skin_color = [
"amber",
"bronze",
"fawn"
];

const skin_general = [
"lined",
"wrinkled",
"tattooed"
];

const face_structure = [
"square",
"round",
"visible Adam’s apple"
];

const nose = [
"snub",
"dainty",
"narrow"
];

const mouth_lips = [
"thin lips",
"narrow lips",
"underbite"
];

const facial_hair = [
"clean-shaven",
"smooth-shaven",
"five o'clock shadow"
];

const hair_general = [
"long",
"short",
"pulled up/back"
];

const hair_color = [
"black",
"blue-black",
"jet black",
"platinum"
];

const body_general = [
"tall",
"average height",
"ropy"
];

const voice = [
"adenoidal",
"appealing",
"wheezy"
];

const traitPositive = [
"accessible",
"active",
"youthful"
];


const traitNeutral = [
"able",
"absentminded",
"wild"
];

const traitNegative = [
"abrasive",
"abrupt",
"wrong",
"zany"
];

const music = [
"2-step",
"2-tone reggae",
"zydeco world"
];

const hobby = [
"acro dance",
"acrobatics",
"zumba"
];

const phobia = [
"ablutophobia: fear of washing or bathing",
"acarophobia: fear of itching or of the insects that cause itching",
"xyrophobia-fear of razors."
];

const strengths = [
"accuracy",
"action oriented",
"writing"
];

const weaknesses = [
"absent-minded",
"abusive",
"zealous"
];

const profession_medieval = [
"ackerman",
"cowherd",
"vagabond"
];

const professions = [
"3d modeller",
"3d printing technician",
"zoo section leader"
];

const profession_future = [
"abstract writer",
"aerospace designer",
"weather modification police"
];



const power_awesome = [
"access to the astral plane",
"acid secretion",
"x-ray vision"
]; 


const power_rubbish = [
"air guitar player",
"banana levitating",
"yelling for Leo"
]; 

const colors = [
"apple green",
"aquamarine",
"yellowed orange"
];

const repeating_behaviors = [
"adjusting/readjusting clothes to feel just right (socks, sleeves)",
"ankle flexing",
"yelling or screaming"
];

const stuck = [
"What does your character see?",
"What are some of the risks in this scene?"
];


const excuses = [
"got bit by an otter",
"had to brush my hair",
"went to the beach"
];

function getNickname(myUser,myGuildID) {
	var nickname = client.guilds.find('id',myGuildID).members.find('id',myUser.id).nickname;
	if (nickname == null) { nickname = myUser.username; }
	return nickname;
}

client.on('ready',() => {
	console.log("online");
});

client.on('message', message => {
	if (message.author === client.user) return;
	if (!message.content.startsWith(".") || message.author.bot) return;

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
		var str = "";
			str += "Plot Device:\n";
			str += "  \.plot\n";
			str += "  \.person\n";
			str += "  \.stuck\n";
			str += "  \.said [search string]\n";

			str += "  \.author\n";

		message.channel.send(str);
	}

	if (cmd.startsWith('said')) {
		// https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options

		var regex = /^\.said ([A-Za-z\ ,]*$)/
		var str = message.content;
		var result = str.match(regex);
		var searchString = "";
		if (result) {
			searchString = result[1];
		} else {
			message.channel.send("Usage: \.said [search string]");
			return;
		}

		var cmdShell = spawn( '/home/cattai5/bot/botPlot/said.bash', [ searchString ] );

		/*
		searchString.replace(/\,/g,"");
		var searchArray = searchString.split(" ");
		if (searchArray && searchArray.length > 1) {
			// do each one
		}
		*/
		
		cmdShell.stdout.on( 'data', data => {
			//console.log( `stdout: ${data}` );
			var results = `${data}`;
			if(!results || results == "") {
				message.channel.send("No results.");
			} else {
				var resultsArray = results.split("\n");
				if (resultsArray) {
					resultsArray.forEach(function (row) {
						if (row.length > 0 && row != "") {
							message.channel.send("```" + row + "```");
						}
					});
				} else { message.channel.send("```" + results + "```"); }
			}
		} );
		
		cmdShell.stderr.on( 'data', data => {
			//message.channel.send("stderr");
			console.log( `stderr: ${data}` );
		} );
		
		cmdShell.on( 'close', code => {
			// console.log( `child process exited with code ${code}` );
		} );
	
	}

	if (cmd.startsWith('person')) {
		var roll = 0;
		var str = "";

		str += "Eyes: ";
			roll = Math.floor(Math.random() * eyes_color.length);
			str += eyes_color[roll];
			str += ", ";
			roll = Math.floor(Math.random() * eyes_general.length);
			str += eyes_general[roll];
			str += " with ";
			roll = Math.floor(Math.random() * eyebrows.length);
			str += eyebrows[roll];
			str += "\n";

		str += "Face: ";
			roll = Math.floor(Math.random() * face_structure.length);
			str += face_structure[roll];
			str += ", ";
			roll = Math.floor(Math.random() * nose.length);
			str += nose[roll];
			str += " nose, ";
			roll = Math.floor(Math.random() * mouth_lips.length);
			str += mouth_lips[roll];
			str += ", optional ";
			roll = Math.floor(Math.random() * facial_hair.length);
			str += facial_hair[roll];
			str += "\n";

		str += "Hair: ";
			roll = Math.floor(Math.random() * hair_color.length);
			str += hair_color[roll];
			str += ", ";
			roll = Math.floor(Math.random() * hair_general.length);
			str += hair_general[roll];
			str += "\n";

		str += "Body: ";
			roll = Math.floor(Math.random() * body_general.length);
			str += body_general[roll];
			str += ", ";
			roll = Math.floor(Math.random() * skin_color.length);
			str += skin_color[roll];
			str += ", ";
			roll = Math.floor(Math.random() * skin_general.length);
			str += skin_general[roll];
			str += " skin\n";

		str += "Voice: ";
			roll = Math.floor(Math.random() * voice.length);
			str += voice[roll];
			str += "\n";

		str += "Strengths: ";
			for (i = 0; i < 3; i++) {
				roll = Math.floor(Math.random() * strengths.length);
				str += strengths[roll];
				if (i != 2) { str += ", "; }
			}
			str += "\n";

		str += "Weaknesses: ";
			for (i = 0; i < 3; i++) {
				roll = Math.floor(Math.random() * strengths.length);
				str += strengths[roll];
				if (i != 2) { str += ", "; }
			}
			str += "\n";


		str += "Positive Traits: ";
			for (i = 0; i < 2; i++) {
				roll = Math.floor(Math.random() * traitPositive.length);
				str += traitPositive[roll];
				if (i != 1) { str += ", "; }
			}
			str += "\n";

		str += "Neutral Traits: ";
			for (i = 0; i < 3; i++) {
				roll = Math.floor(Math.random() * traitNeutral.length);
				str += traitNeutral[roll];
				if (i != 2) { str += ", "; }
			}
			str += "\n";

		str += "Negative Traits: ";
			for (i = 0; i < 2; i++) {
				roll = Math.floor(Math.random() * traitNegative.length);
				str += traitNegative[roll];
				if (i != 1) { str += ", "; }
			}
			str += "\n";

		str += "Favorite Color: ";
			roll = Math.floor(Math.random() * colors.length);
			str += colors[roll];
			str += "\n";

		str += "Favorite Music: ";
			for (i = 0; i < 2; i++) {
				roll = Math.floor(Math.random() * music.length);
				str += music[roll];
				if (i != 1) { str += ", "; }
			}
			str += "\n";

		str += "Hobbies: ";
			for (i = 0; i < 3; i++) {
				roll = Math.floor(Math.random() * hobby.length);
				str += hobby[roll];
				if (i != 2) { str += ", "; }
			}
			str += "\n";

		str += "Phobia: ";
			roll = Math.floor(Math.random() * phobia.length);
			str += phobia[roll];
			str += "\n";

		str += "Repeating/Unconscious Behavior: ";
			roll = Math.floor(Math.random() * repeating_behaviors.length);
			str += repeating_behaviors[roll];
			str += "\n";

		str += "Powers: ";
			roll = Math.floor(Math.random() * power_awesome.length);
			str += power_awesome[roll];
			str += ", ";
			roll = Math.floor(Math.random() * power_rubbish.length);
			str += power_rubbish[roll];
			str += "\n";

		str += "Possible Professions: ";
			roll = Math.floor(Math.random() * profession_medieval.length);
			str += profession_medieval[roll];
			str += ", ";
			roll = Math.floor(Math.random() * professions.length);
			str += professions[roll];
			str += ", ";
			roll = Math.floor(Math.random() * profession_future.length);
			str += profession_future[roll];
			str += "\n";


		message.channel.send(str);
	}

	if (cmd.startsWith('stuck')) {

		var roll = Math.floor(Math.random() * stuck.length);
		var str = stuck[roll];

		message.channel.send(str);

	}

	if (cmd.startsWith('excuse')) {

		var roll = Math.floor(Math.random() * excuses.length);
		var str = excuses[roll];

		message.channel.send(str);

	}

	if (cmd.startsWith('plot')) {

		var roll = 0;
		var str = "";
		var strLead = "Someone";
		var strGoal = "carries on an enlightening conversation";
		var strBlock = "is prevented by someone interrupting";
		var strRomance = "must get kissed by the end of the night";

		roll = Math.floor(Math.random() * block.length);
		strBlock = block[roll];

		roll = Math.floor(Math.random() * romance.length);
		strRomance = romance[roll];

		roll = Math.floor(Math.random() * goal.length);
		strGoal = goal[roll];

		str = strGoal + " but " + strBlock + " and " + strRomance + " before he can succeed.";

		roll = Math.floor(Math.random() * 2);
		var gender=["male","female"][roll];

		if (gender === "male") {
			roll = Math.floor(Math.random() * boy_lead.length);
			strLead = boy_lead[roll];
			str = "The " + strLead + " " + str;
		} else {
			roll = Math.floor(Math.random() * girl_lead.length);
			strLead = girl_lead[roll];
			str = "The " + strLead + " " + str;

			str = str.replace(/\ him /g, " her ");
			str = str.replace(/\ himself /g, " herself ");
			str = str.replace(/\ he /g, " she ");
			str = str.replace(/\ his /g, " her ");

		}

		// Subject + plot goal + inhibited by + romance interest

		// The [boy_lead | girl_lead] [goal] but [block] and [romance] before he can succeed.

		// EXAMPLE:
		// The sultan tries to build his spaceship but is prevented by his fear of jazz music and must reconcile with his dog's love before he can succeed.

		message.channel.send(str);

	}

	if (cmd.startsWith('author')) {
		var target = client.users.find('id','206757095280869377');
		str = "";
		if(!target) { str += "Slate, www.Cattail.Nu"; }

		var target2 = client.users.find('id','227556442515832832');
		str2 = "";
		if(!target2) { str2 += "xstar960, https://jakebarrettauthor.wordpress.com/"; }

		message.channel.send("Bot by " + target + str + "\nContent Assistance by " + target2 + str2);
	}
	
});

client.login(settings.token);
