const util = require('util');

// dumbtest

n = 1000000000;
var result = [];

for (let i = 1; i < 101; i++) {
	result[i] = 0;
}

for (let i = 0; i < n; i++) {
	let rand = Math.random()*100;
	rand = Math.floor(rand) + 1;
	result[rand]++;
}

console.table(result);
