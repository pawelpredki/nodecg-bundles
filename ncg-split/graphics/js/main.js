nodecg.listenFor('ncgsplit-run-load', run => {
  $("#ncgsplit-game-title-id").text(run.title);
  $("#ncgsplit-game-category-id").text(run.category);
  $("#ncgsplit-game-attempts-id").text(run.attempts);

  let totalRunTime = 0;
  let sumOfBest = 0;
  for (var i = 0 ; i < run.segments.length ; i++) {
    let segment = run.segments[i];
    let row = $(".ncgsplit-segment-table tr:nth-child("+(i+1)+")");
    totalRunTime += segment.timePb
    sumOfBest += segment.timeGold;

    row.find('td:nth-child(2) span').text(segment.name);
    row.find('td:nth-child(3) span').text("");
    displayTime(row.find('td:nth-child(4) span'), totalRunTime);
  }

  if (0 == sumOfBest) {
      $(".ncgsplit-sob").hide();
    } else {
      displayTime($("#ncgsplit-sob-timer-id"), sumOfBest);
    }
  }
});

let startTime = 0;
nodecg.listenFor('ncgsplit-run-start', run => {
  startTime = run.startTime;
  var interval = setInterval(function() {
      var elapsedTime = Date.now() - startTime;
      displayTime($("#ncgsplit-main-timer-id"), elapsedTime);
  }, 50);
});

const displayTime = function(spanElement, time) {
  let formattedTime = formatTime(time, true);
  spanElement.text(formattedTime.minutes+":"+formattedTime.seconds + "." + formattedTime.tensOfSeconds);
}

const formatTime = function(time, pad) {
  time = Math.floor(time/100);
  let tensOfSeconds = time % 10;
  let seconds = Math.floor(time/10) % 60;
  let secondsStr = (pad && (seconds < 10)) ? ("0"+seconds) : seconds;
  let minutes = Math.floor(time/600) % 60;
  let minutesStr = (pad && (minutes < 10)) ? ("0"+minutes) : minutes;

  let formattedTime = {
    tensOfSeconds : tensOfSeconds,
    seconds : secondsStr,
    minutes : minutesStr
  }

  return formattedTime;
}
