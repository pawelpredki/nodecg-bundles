const MAX_ROWS = 8;
const ROWS_KEEP = 4;
const SPLIT_ROW = '<tr><td class="ncgsplit-segment-table-icon"><img src=""/></td><td class="ncgsplit-segment-table-name"><span></span></td><td class="ncgsplit-segment-table-split"><span></span></td><td class="ncgsplit-segment-table-time"><span></span></td></tr>';

let startTime = 0;
let timerInterval = -1;

nodecg.listenFor('ncgsplit-run-ready', run => {
  console.log(run);
  if (timerInterval > -1) {
    clearInterval(timerInterval);
    displayTime($("#ncgsplit-main-timer-id"), run.startOffset ? -1*run.startOffset : 0);
  }
  $("#ncgsplit-game-title-id").text(run.title);
  $("#ncgsplit-game-category-id").text(run.category);
  $("#ncgsplit-game-attempts-id").text(run.completedAttempts + "/" + run.attempts);

  let totalRunTime = 0;
  let sumOfBest = 0;
  let showSumOfBest = true;
  let totalSegments = run.segments.length;
  $("#ncgsplit-segment-table-id").html("");
  for (var i = 0 ; i < totalSegments ; i++) {
    $("#ncgsplit-segment-table-id").append(SPLIT_ROW);
    let segment = run.segments[i];
    let row = $(".ncgsplit-segment-table tr:nth-child("+(i+1)+")");
    totalRunTime += segment.timePb;
    if (showSumOfBest) {
      if (segment.timeGold > 0) {
        sumOfBest += segment.timeGold;
      } else {
        showSumOfBest = false;
      }
    }

    row.find('td:nth-child(2) span').text(segment.name);
    row.find('td:nth-child(3) span').text("");
    row.find('td:nth-child(3) span').removeClass();
    displayTime(row.find('td:nth-child(4) span'), totalRunTime);
    row.find('td:nth-child(4) span').removeClass();
    if (i >= MAX_ROWS) {
      row.hide();
    }
  }
  for (var i = totalSegments; i < MAX_ROWS; i++) {
    $("#ncgsplit-segment-table-id").append(SPLIT_ROW);
  }

  if (!showSumOfBest) {
    $("#ncgsplit-sob-timer-id").text("--:--");
  } else {
    displayTime($("#ncgsplit-sob-timer-id"), sumOfBest);
  }
});

nodecg.listenFor('ncgsplit-run-start', run => {
  startTime = run.startTime;
  startOffset = run.startOffset ? run.startOffset : 0;
  timerInterval = setInterval(function() {
      var elapsedTime = Date.now() - startTime - startOffset;
      displayTime($("#ncgsplit-main-timer-id"), elapsedTime);
  }, 50);
});

nodecg.listenFor('ncgsplit-run-split', run => {
  splitSegment(run);
});

nodecg.listenFor('ncgsplit-run-finish', run => {
  clearInterval(timerInterval);
  splitSegment(run);
});

const splitSegment = function(run) {
  let finishedSegment = run.currentSegment-1;
  let segment = run.segments[finishedSegment];
  let row = $(".ncgsplit-segment-table tr:nth-child("+(finishedSegment+1)+")");
  let totalRunTime = run.totalTimeLive;
  let totalTimePb = 0;
  for (var i = 0; i < run.currentSegment; i++) {
    totalTimePb += run.segments[i].timePb;
  }
  let timeLive = segment.timeLive;
  let timePb = segment.timePb;
  let timeGold = segment.timeGold;

  let goldDiff = timeLive - timeGold;
  let segmentDiff = timeLive - timePb;
  let totalDiff = totalRunTime - totalTimePb;
  let style = "";
  if (timeGold == 0 || goldDiff < 0) {
    style = "gold";
  } else if (totalDiff == 0 || totalDiff < 0) {
    if (timePb == 0 || segmentDiff < 0) {
      style = "blue";
    } else {
      style = "badblue";
    }
  } else {
    if (timePb == 0 || segmentDiff < 0) {
      style = "goodred";
    } else {
      style = "red";
    }
  }

  displayTime(row.find('td:nth-child(3) span'), totalDiff);
  row.find('td:nth-child(3) span').addClass(style);
  displayTime(row.find('td:nth-child(4) span'), totalRunTime);
  row.find('td:nth-child(4) span').addClass(style);

  // Check if we need to scroll segment list
  let totalSegments = run.segments.length;
  if (finishedSegment > ROWS_KEEP && finishedSegment <= (totalSegments - (MAX_ROWS-ROWS_KEEP))) {
    scrollSegmentList('down');
  }

  if (finishedSegment == totalSegments-1) {
    displayTime($("#ncgsplit-main-timer-id"), totalRunTime);
  }
}

nodecg.listenFor('ncgsplit-scroll-segment', dir => {
  scrollSegmentList(dir);
})

const scrollSegmentList = function (dir) {
  let firstVisible = $(".ncgsplit-segment-table tr:visible:first");
  let lastVisible = $(".ncgsplit-segment-table tr:visible:last");
  if ('down' === dir) {
    let nextVisible = $(lastVisible).next();
    if (nextVisible.length > 0) {
      $(firstVisible).hide();
      $(nextVisible).show();
    }
  } else {
    let prevVisible = $(firstVisible).prev();
    if (prevVisible.length > 0) {
      $(prevVisible).show();
      $(lastVisible).hide();
    }
  }
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
