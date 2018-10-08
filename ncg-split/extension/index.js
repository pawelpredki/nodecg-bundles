'use strict';

const fs = require('fs');
const Gpio = require('onoff').Gpio;

module.exports = nodecg => {

	// pull-down must be configured manually
	if (Gpio.accessible) {
		const splitButton = new Gpio(2, 'in', 'rising', {debounceTimeout:10});
		splitButton.watch((err, value) => {
			console.log("press 2");
			if (err) {
				return;
			}
			nodecg.sendMessage('ncgsplit-ext-split');
		});
	
		const resetButton = new Gpio(3, 'in', 'rising', {debounceTimeout:10});
		resetButton.watch((err, value) => {
			console.log("press 3");
			if (err) {
				return;
			}
			nodecg.sendMessage('ncgsplit-ext-reset');
		});
	} else {
		console.log("Gpio not available on this system");
	}

	const runList = nodecg.Replicant("ncgsplit-run-list");

	nodecg.listenFor('ncgsplit-load-run-list', () => 	{
		loadRunList();
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

	nodecg.listenFor('ncgsplit-run-delete', (file) => {
		console.log("Delete: " + file);
		fs.unlinkSync(__dirname + '/runs/' + file);
		loadRunList();
	});

	const loadRunList = function() {
		let files = fs.readdirSync(__dirname + '/runs/');
		runList.value = files;
	}

}
