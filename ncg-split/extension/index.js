'use strict';

const fs = require('fs');
const Gpio = require('onoff').Gpio;
process.env["NODE_CONFIG_DIR"] = "./bundles/ncg-split/config/";
const config = require('config');
const OBSWebSocket = require('obs-websocket-js');

// Default connection settings.
var settings = {
	address: config.get('obsConnection.address')
}

// If there is a password in the config, use it.
if (config.has('obsConnection.password') && config.get('obsConnection.password') !== '')
	settings.password = config.get('obsConnection.password');

// Do the startup stuff.
console.log('Started up.');
const obs = new OBSWebSocket();
connect();
function connect() {
	obs.connect(settings).then(() => {
		console.log('OBS connection successful.');
	}).catch((err) => {});
}

// We need to try and reconnect if the connection is closed.
// This also fires if we can't successfully connect in the first place.
obs.on('ConnectionClosed', data => {
	console.log('OBS connection lost, retrying in 5 seconds.');
	setTimeout(connect, 5000);
});

// Error catching.
obs.on('error', err => {
	console.log('OBS connection error:', err);
	// I don't know if we need to reconnect here?
	// I don't think so, an error doesn't always mean a disconnect.
});

module.exports = obs;

module.exports = nodecg => {

	let lastSplit = Date.now();

	// pull-down must be configured manually
	if (Gpio.accessible) {
		const splitButton = new Gpio(2, 'in', 'rising', {debounceTimeout:10});
		splitButton.watch((err, value) => {
			let nowSplit = Date.now();
			if ((nowSplit - lastSplit) < 2000) {
				console.log("soft debounce");
				return;
			}
			lastSplit = nowSplit;
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


		const ledOne = new Gpio(17, 'out');
		ledOne.writeSync(0);
		const ledTwo = new Gpio(27, 'out');
		ledTwo.writeSync(0);
		const ledThree = new Gpio(22, 'out');
		ledThree.writeSync(0);

		const muteButton = new Gpio(4, 'in', 'rising', {debounceTimeout:10});
		muteButton.watch((err, value) => {
			console.log("Toggle mute");
			const micSource = config.get('obsConnection.micSource');
			obs.send('GetMute', {'source':micSource}, (err, data) => {
				if (!err) {
					const muted = data.muted;
					obs.send('ToggleMute', {'source':micSource}, (err,data) => {
						ledThree.writeSync(muted ? 1 : 0);
					});
				} else {
					console.log("OBS Error: " + err);
				}
			});
		});

		obs.on('ConnectionOpened', (data) => {
			const micSource = config.get('obsConnection.micSource');
			obs.send('GetMute', {'source':micSource}, (err, data) => {
				if (!err) {
					const muted = data.muted;
					ledThree.writeSync(muted ? 0 : 1);
				} else {
					console.log("OBS Error: " + err);
				}
			});
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
