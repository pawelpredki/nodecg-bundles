const KEYSTROKE_START_SPLIT = " ".charCodeAt(0);
const KEYSTROKE_RESET = "z".charCodeAt(0);
const KEYSTROKE_SCROLL_UP = "q".charCodeAt(0);
const KEYSTROKE_SCROLL_DOWN = "a".charCodeAt(0);

let runObject = {
  state : "UNLOADED"
};


const runList = nodecg.Replicant("ncgsplit-run-list");
runList.on("change", newValue => {
  var output = [];
  for (var i in newValue) {
    output.push('<option value="'+ newValue[i] +'">'+ newValue[i] +'</option>');
  }
  $('#run-search-list').html(output.join(''));
});

function loadRunList() {
  nodecg.sendMessage('ncgsplit-load-run-list');
}

nodecg.listenFor("ncgsplit-run-loaded", runData => {
  runObject = runData;
  runObject.state = "READY";
  nodecg.sendMessage('ncgsplit-run-ready', runObject);
});

function loadRun() {
  let file = $('#run-search-list').find(":selected").text();
  nodecg.sendMessage('ncgsplit-load-run', file);
}

function timerStart() {
  let startTime = Date.now();
  if ("READY" === runObject.state) {
    runObject.state = "RUNNING";
    runObject.currentSegment = 0;
    runObject.startTime = startTime;
    runObject.totalTimeLive = 0;
    nodecg.sendMessage('ncgsplit-run-start', runObject);
    nodecg.sendMessageToBundle('timerInfo', 'plpalotwitch', {"type":"RUN_START"});
  }
}

function timerReset() {
  if ("RUNNING" === runObject.state || "FINISHED" == runObject.state) {
    let currentState = runObject.state;
    runObject.state = "READY";
    runObject.currentSegment = 0;
    runObject.startTime = 0;
    let totalTimeLiveTemp = runObject.totalTimeLive;
    runObject.totalTimeLive = 0;
    runObject.attempts = runObject.attempts + 1;
    if ("FINISHED" == currentState) {
      runObject.completedAttempts = runObject.completedAttempts + 1;
      if ($("#chk-save-gold").is(":checked")) {
        for (var i in runObject.segments) {
          if (runObject.segments[i].timeLive < runObject.segments[i].timeGold) {
            console.log("Update gold for segment <" + i + ">");
            runObject.segments[i].timeGold = runObject.segments[i].timeLive;
          }
        }
      }
      if ($("#chk-save-pb").is(":checked")) {
        if (totalTimeLiveTemp < runObject.totalTimePb) {
          runObject.totalTimePb = totalTimeLiveTemp;
          for (var i in runObject.segments) {
            console.log("Update PB time for segment <" + i + ">");
            runObject.segments[i].timePb = runObject.segments[i].timeLive;
          }
        }
      }
      nodecg.sendMessage('ncgsplit-run-save', runObject);
    }
    nodecg.sendMessage('ncgsplit-run-ready', runObject);
  }
}

function timerSplit() {
  let splitTime = Date.now();
  if ("RUNNING" == runObject.state) {
    if (runObject.currentSegment < runObject.segments.length) {
      runObject.segments[runObject.currentSegment].timeLive = splitTime - runObject.startTime - runObject.totalTimeLive;
      runObject.totalTimeLive += runObject.segments[runObject.currentSegment].timeLive;
      runObject.currentSegment++;
      if (runObject.currentSegment == runObject.segments.length) {
        runObject.state = "FINISHED";
        nodecg.sendMessageToBundle('timerInfo', 'plpalotwitch', {"type":"RUN_COMPLETED", "liveTime":runObject.totalTimeLive, "runTime":runObject.totalTimePb});
        nodecg.sendMessage('ncgsplit-run-finish', runObject);
      } else {
        let message = {
          "type" : "SEGMENT",
          "segmentNo" : runObject.currentSegment+1,
          "segmentTotal" : runObject.segments.length,
          "bestDelta" : runObject.segments[runObject.currentSegment-1].timeLive - runObject.segments[runObject.currentSegment-1].timeGold,
          "runDelta" : runObject.segments[runObject.currentSegment-1].timeLive - runObject.segments[runObject.currentSegment-1].timePb
        }
        nodecg.sendMessageToBundle('timerInfo', 'plpalotwitch', message);
        nodecg.sendMessage('ncgsplit-run-split', runObject);
      }
    }
  }
}

function scrollSegmentList(dir) {
  nodecg.sendMessage('ncgsplit-scroll-segment', dir);
}

$(document).on("keypress", function (e) {
    switch (e.which) {
      case KEYSTROKE_START_SPLIT :
        if (runObject.state === "READY") {
          timerStart();
        } else if (runObject.state === "RUNNING") {
          timerSplit();
        }
        break;
      case KEYSTROKE_RESET:
        timerReset();
        break;
      case KEYSTROKE_SCROLL_UP:
        scrollSegmentList('up');
        break;
      case KEYSTROKE_SCROLL_DOWN:
        scrollSegmentList('down');
        break;
    }
});
