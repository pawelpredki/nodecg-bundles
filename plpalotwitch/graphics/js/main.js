nodecg.Replicant('transparent').on('change', (newValue, oldValue) => {
  if (newValue) {
    $(".parent").css('background-color', 'transparent');
  } else {
    $(".parent").css('background-color', 'black');
  }
});

// Timer
nodecg.Replicant("timerActive").on('change', (newValue) => {
  if (newValue) {
    $("#ncg-split-iframe").show();
  } else {
    $("#ncg-split-iframe").hide();
  }
});

// Followers
let followerIndex = 0;
const followersReplicant = nodecg.Replicant('followers');
let followers = [];
followersReplicant.on("change", newValue => {
  followers = newValue;
});
function switchFollowers() {

  if (!followers || 0 === followers.length) {
    return;
  }
  $("#follower-img").fadeOut(500, function() {
    $("#follower-img").attr("src", followers[followerIndex].avatar);
    $(this).fadeIn(500);
  });

  $("#follower-name").fadeOut(500, function() {
    $("#follower-name").html(followers[followerIndex].name);
    $(this).fadeIn(500);
  });


  if (++followerIndex >= followers.length) {
    followerIndex = 0;
  }
}
switchFollowers();
setInterval(switchFollowers, 10000);

// Leaderboards
const playerMe = "pawelpredki";
let playerMeIndex = -1;
let loaded = false;
let topRuns = [];
let topRunsSetup = false;
let runs = [];
let runIndex = 0;
let topIndex = 2;
const leaderboardLoaded = nodecg.Replicant('leaderboardLoaded');
leaderboardLoaded.on("change", (newValue, oldValue) => {
  loaded = newValue;
  if (newValue && oldValue === false) {
    setupLeaderboards();
  }
});
const leaderboardRuns = nodecg.Replicant('leaderboardRuns');
leaderboardRuns.on("change", newValue => {
  runs = newValue;
  playerMeIndex = -1;
});
const leaderboardTopRuns = nodecg.Replicant('leaderboardTopRuns');
leaderboardTopRuns.on("change", newValue => {
  topRuns = newValue;
  topRunsSetup = false;
});

function setupLeaderboards() {
  if (-1 == playerMeIndex) {
    for (var i in runs) {
      if (runs[i].indexOf(playerMe) > -1) {
        playerMeIndex = i;
        break;
      }
    }
  }

  if (!topRunsSetup) {
    $("#top-time").hide();
    $("#second-div").hide();
    $("#third-div").hide();
    if (topRuns.length > 0) {
      $("#top-time").html(topRuns[0]);
      $("#top-time").show();
    }
    if (topRuns.length > 1) {
      $("#second-time").html(topRuns[1]);
    }
    if (topRuns.length > 2) {
      $("#third-time").html(topRuns[2]);
    }
    topRunsSetup = true;
  }
}
function animateResults() {
  if (!loaded) {
    return;
  }
  setupLeaderboards();

  var topCount = topRuns.length;
  var topNow = "#top-div";
  var topNext = "#second-div";
  if (1 == topIndex) {
    topNow = "#second-div";
    topNext = "#third-div";
    topIndex = 2;
  } else if (2 == topIndex) {
    topNow = "#third-div";
    topNext = "#top-div";
    topIndex = 0;
  } else {
    topIndex = 1;
  }
  if (topIndex >= topCount) {
    topIndex = 0;
  }

  if (topCount > 1) {
    $(topNow).fadeOut(500, function() {
      $(topNext).fadeIn(500);
    });
  }

  $("#runs").fadeOut(500, function() {
    $(this).text(runs[runIndex]).fadeIn(500);
    if (playerMeIndex == runIndex) {
      $(this).addClass('me');
    } else {
      $(this).removeClass('me');
    }
    if (++runIndex >= runs.length) {
      runIndex = 0;
    }
  });
}
animateResults();
setInterval(animateResults, 10000);

// Messages
const messageLineOne = nodecg.Replicant('messageLineOne');
messageLineOne.on("change", newValue => {
  $("#message-line-1").html(newValue);
});
const messageLineTwo = nodecg.Replicant('messageLineTwo');
messageLineTwo.on("change", newValue => {
  $("#message-line-2").html(newValue);
});

// Timer animations
const personalBestActive = nodecg.Replicant('personalBestActive');
nodecg.listenFor('timerInfo', message => {
  let type = message.type;
  switch (type) {
    case 'SEGMENT':
      // Ignore last segment - it will come in another type of message
      if (message.segmentNo < message.segmentTotal) {
        if (message.bestDelta < 0) {
          animateTimerImage('gold');
        } else if (message.runDelta < 0) {
          animateTimerImage('ok');
        } else if (message.runDelta > 0) {
          animateTimerImage('faster');
        }
      }
    break;

    case 'RUN_COMPLETED':
      if ((0 == message.runTime)  || (message.liveTime < message.runTime)) {
        personalBestActive.value = true;
      }
    break;

    case 'RUN_START':
      animateTimerImage('go');
    break;

    default:
    break;
  }
});

personalBestActive.on("change", newValue => {
  animatePersonalBestImage(newValue);
});

function animateTimerImage(type) {
  $("#timer-image").attr("src", "assets/"+type+".png");

  $("#timer-image").show().animate({
    width: '250px',
    height: '250px'
  }, 500, function() {
    setTimeout(() => $(this).animate({
      width: '0px',
      height: '0px'
    }, 500), 1000);
  });
}

function animatePersonalBestImage(show) {
  let endWidth = show ? '400px' : '0px';

  $("#personal-best-image").show().animate({
    width: endWidth,
  }, 500);
}
