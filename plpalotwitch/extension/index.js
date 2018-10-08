'use strict';

const request = require('request');
const restHandler = require('rest-handler').create();
const server = require('http').createServer();

module.exports = nodecg => {

	const PHPROOT = "http://192.168.0.108/srcom/php/";

  // Routes
  restHandler.addRoute({
      path: '/llanfair',
      method: 'POST',
      description: 'Got split',

      handler: function(rest) {
  			rest.getParsedBody(function(err, body) {
          console.log(body);
          nodecg.sendMessage("timerInfo", body);
  				rest.res.setHeader('content-type', 'application/json');
  				rest.send({parsed : true});
  			});
      }
  });

  // Server part
  server.on('request', function(req, res) {
      // Handle normal GET, POST, etc. requests
      restHandler.handle(req, res);
  });

  server.on('upgrade', function(req, socket, head) {
      // Handle web sockets
      restHandler.handleUpgrade(req, socket, head);
  });

  console.log("Start server")
  // Listen on port 8080
  server.listen(8080);

	const getRunText = (run, withPlace) => {
	  var retVal =  run.time.min + "m " + run.time.sec + "s ";
	  if (run.time.ms) {
	    retVal += run.time.ms +"ms ";
	  }
	  retVal += "by " + run.player;
	  if (withPlace) {
	    retVal = "#" + run.place +": " + retVal;
	  }
	  return retVal;
	}

	const setupLeaderboards = () => {
		const leaderboardLoaded = nodecg.Replicant('leaderboardLoaded');
		leaderboardLoaded.value = false;
	  const leaderboardGame = nodecg.Replicant('leaderboardGame', {defaultValue: 'smb1'});
		const leaderboardCategory = nodecg.Replicant('leaderboardCategory', {defaultValue: 'Any%'});
		const leaderboardRuns = nodecg.Replicant('leaderboardRuns', {defaultValue: []});
		const leaderboardTopRuns = nodecg.Replicant('leaderboardTopRuns', {defaultValue: []});

		console.log("Updating leaderboards: " + leaderboardGame.value + " | " + leaderboardCategory.value);

	  const requestUri = encodeURI(PHPROOT + "proxy.php?game="+leaderboardGame.value+"&category="+leaderboardCategory.value);
		request( requestUri, {json: true}, (err, res, data) => {
			if (err) {
				console.log("Leaderboards API error");
			} else {
				let topCount = 0;
				leaderboardTopRuns.value = [];
	    	for (var i = 0; i < 3; i++) {
	      	if (1 == data[i].place) {
						leaderboardTopRuns.value[0] = getRunText(data[i]);
						topCount++;
	      	} else if (2 == data[i].place) {
	        	leaderboardTopRuns.value[1] = getRunText(data[i]);
						topCount++;
	      	} else if (3 == data[i].place) {
	        	leaderboardTopRuns.value[2] = getRunText(data[i]);
						topCount++;
	      	}
	    	}
				nodecg.Replicant('leaderboardTopCount').value = topCount;
	    	for (var i = 0; i < 3; i++) {
	      	data.splice(0, 1);
	    	}
				leaderboardRuns.value = [];
				for (var i in data) {
					leaderboardRuns.value.push(getRunText(data[i], true));
				}
				setTimeout(function () {
  				leaderboardLoaded.value = true;
				}, 1000);

			}
	  });
	};

	nodecg.listenFor('updateLeaderboards', setupLeaderboards);

	const twitchUsername = nodecg.Replicant('twitchUsername', {defaultValue: 'pawelpredki'});
	const loadFollowers = () => {
  	const requestUri = encodeURI(PHPROOT + "followers.php?user="+twitchUsername.value);
  	request( requestUri, {json: true}, (err, res, body) => {
			if (err) {
				console.log("Followers API error");
			} else {
    		nodecg.Replicant('followers').value = body;
			}
  	});
	};

	nodecg.listenFor('updateFollowers', loadFollowers);

  // Search games and categories
  const gameSearchTerm = nodecg.Replicant('gameSearchTerm');
  gameSearchTerm.on("change", newValue => {
    console.log("Search: " + newValue);
    const requestUri = encodeURI(PHPROOT + "search.php?game="+newValue+"&count=3");
  	request( requestUri, {json: true}, (err, res, body) => {
			if (err) {
				console.log("Search API error");
			} else {
    		nodecg.Replicant('games').value = body;
			}
  	});
  });

	// First load
	loadFollowers();
	setInterval(loadFollowers, 30000);
	setupLeaderboards();

}
