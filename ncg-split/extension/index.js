'use strict';

const fs = require('fs');

module.exports = nodecg => {

	const runList = nodecg.Replicant("ncgsplit-run-list");

	nodecg.listenFor('ncgsplit-load-run-list', () => 	{
		let files = fs.readdirSync(__dirname + '/runs/');
		runList.value = files;
	});

	nodecg.listenFor('ncgsplit-load-run', (file) => 	{
		let json = JSON.parse(fs.readFileSync(__dirname + '/runs/' + file, 'utf8'));
		json.fileName = file;
		nodecg.sendMessage('ncgsplit-run-loaded', json);
		console.log(json);
	});

	nodecg.listenFor('ncgsplit-run-save', (json) => {
		console.log("Write: " + JSON.stringify(json));
		fs.writeFileSync(__dirname + '/runs/' + json.fileName, JSON.stringify(json), 'utf8');
	});

}
