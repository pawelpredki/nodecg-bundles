let startTime = 0;
let timerInterval = -1;

nodecg.listenFor('ncgsplit-run-ready', run => {
  console.log(run);
  if (timerInterval > -1) {
    clearInterval(timerInterval);
    displayTime($("#ncgsplit-main-timer-id"), 0);
  }
  $("#ncgsplit-game-title-id").text(run.title);
  $("#ncgsplit-game-category-id").text(run.category);
  $("#ncgsplit-game-attempts-id").text(run.completedAttempts + "/" + run.attempts);

  let totalRunTime = 0;
  let sumOfBest = 0;
  for (var i = 0 ; i < run.segments.length ; i++) {
    let segment = run.segments[i];
    let row = $(".ncgsplit-segment-table tr:nth-child("+(i+1)+")");
    totalRunTime += segment.timePb;
    sumOfBest += segment.timeGold;

    row.find('td:nth-child(2) span').text(segment.name);
    row.find('td:nth-child(3) span').text("");
    row.find('td:nth-child(3) span').removeClass();
    displayTime(row.find('td:nth-child(4) span'), totalRunTime);
    row.find('td:nth-child(4) span').removeClass();
  }

  if (0 == sumOfBest) {
    $(".ncgsplit-sob").hide();
  } else {
    displayTime($("#ncgsplit-sob-timer-id"), sumOfBest);
  }
});

nodecg.listenFor('ncgsplit-run-start', run => {
  startTime = run.startTime;
  timerInterval = setInterval(function() {
      var elapsedTime = Date.now() - startTime;
      displayTime($("#ncgsplit-main-timer-id"), elapsedTime);
  }, 50);
});

nodecg.listenFor('ncgsplit-run-split', run => {
  splitSegment(run);
});

nodecg.listenFor('ncgsplit-run-finish', run => {
  splitSegment(run);
  clearInterval(timerInterval);
});

const splitSegment = function(run) {
  let finishedSegment = run.currentSegment-1;
  let segment = run.segments[finishedSegment];
  let row = $(".ncgsplit-segment-table tr:nth-child("+(finishedSegment+1)+")");
  let totalRunTime = run.totalTimeLive;
  let timeLive = segment.timeLive;
  let timePb = segment.timePb;
  let timeGold = segment.timeGold;
  let style = (timeLive < timeGold) ? "gold" : ((timeLive < timePb) ? "blue" : "red");

  displayTime(row.find('td:nth-child(3) span'), timeLive - timePb);
  row.find('td:nth-child(3) span').addClass(style);
  displayTime(row.find('td:nth-child(4) span'), totalRunTime);
  row.find('td:nth-child(4) span').addClass(style);
}

const displayTime = function(spanElement, time) {
  let formattedTime = formatTime(time, true);
  spanElement.text(formattedTime.sign + formattedTime.minutes+":"+formattedTime.seconds + "." + formattedTime.tensOfSeconds);
}

const formatTime = function(time, pad) {
  let sign = "";
  if (time < 0) {
    sign = "-";
    time = Math.abs(time);
  }
  time = Math.floor(time/100);
  let tensOfSeconds = time % 10;
  let seconds = Math.floor(time/10) % 60;
  let secondsStr = (pad && (seconds < 10)) ? ("0"+seconds) : seconds;
  let minutes = Math.floor(time/600) % 60;
  let minutesStr = (pad && (minutes < 10)) ? ("0"+minutes) : minutes;

  let formattedTime = {
    sign : sign,
    tensOfSeconds : tensOfSeconds,
    seconds : secondsStr,
    minutes : minutesStr
  }

  return formattedTime;
}
