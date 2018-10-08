const EDITOR_SEGMENT_ROW = '<tr><td scope="col"><div class="form-group editor-segment-form"><input class="form-control" placeholder=""></div></td><td scope="col"><div class="form-group editor-segment-form"><input class="form-control" placeholder=""></div></td><td scope="col"><div class="form-group editor-segment-form"><input class="form-control" placeholder=""></div></td><td scope="col"><span class="fas fa-minus-square minus-square editor-remove"></span></td></tr>';

const KEYSTROKE_START_SPLIT = " ".charCodeAt(0);
const KEYSTROKE_RESET = "z".charCodeAt(0);
const KEYSTROKE_SCROLL_UP = "q".charCodeAt(0);
const KEYSTROKE_SCROLL_DOWN = "a".charCodeAt(0);

let runObject = {
  state : "UNLOADED"
};

const runState = nodecg.Replicant("ncgsplit-run-state");
runState.on("change", newValue => {
  if ("READY" === newValue) {
    toggleButtonEnable("btn-timer-start", "enable");
    toggleButtonEnable("btn-scroll-up", "enable");
    toggleButtonEnable("btn-scroll-down", "enable");
    toggleButtonEnable("btn-timer-split", "disable");
    toggleButtonEnable("btn-timer-reset", "disable");
    toggleButtonEnable("btn-save", "enable");
    toggleButtonEnable("btn-save-new", "enable");
    toggleButtonEnable("btn-delete", "enable", "btn-danger");
  } else if ("RUNNING" === newValue) {
    toggleButtonEnable("btn-timer-start", "disable");
    toggleButtonEnable("btn-timer-split", "enable");
    toggleButtonEnable("btn-timer-reset", "enable");
    toggleButtonEnable("btn-scroll-up", "disable");
    toggleButtonEnable("btn-scroll-down", "disable");
    toggleButtonEnable("btn-save", "disable");
    toggleButtonEnable("btn-save-new", "disable");
    toggleButtonEnable("btn-delete", "disable", "btn-danger");
    $("#editor-header-hide").trigger("click");
  } else if ("FINISHED" === newValue) {
    toggleButtonEnable("btn-timer-start", "disable");
    toggleButtonEnable("btn-timer-split", "enable");
    toggleButtonEnable("btn-timer-reset", "enable");
    toggleButtonEnable("btn-scroll-up", "enable");
    toggleButtonEnable("btn-scroll-down", "enable");
    toggleButtonEnable("btn-save", "enable");
    toggleButtonEnable("btn-save-new", "enable");
    toggleButtonEnable("btn-delete", "enable", "btn-danger");
  } else if ("UNLOADED" === newValue) {
    toggleButtonEnable("btn-timer-start", "disable");
    toggleButtonEnable("btn-timer-split", "disable");
    toggleButtonEnable("btn-timer-reset", "disable");
    toggleButtonEnable("btn-scroll-up", "disable");
    toggleButtonEnable("btn-scroll-down", "disable");
    toggleButtonEnable("btn-save", "disable");
    toggleButtonEnable("btn-save-new", "enable");
    toggleButtonEnable("btn-delete", "disable", "btn-danger");
  }
});

const runList = nodecg.Replicant("ncgsplit-run-list");
runList.on("change", newValue => {
  var output = [];
  for (var i in newValue) {
    output.push('<option value="'+ newValue[i] +'">'+ newValue[i] +'</option>');
  }
  $('#run-search-list').html(output.join(''));
  runObject.state = "UNLOADED";
  runState.value = runObject.state;
});

function loadRunList() {
  nodecg.sendMessage('ncgsplit-load-run-list');
}

function loadRun() {
  let file = $('#run-search-list').find(":selected").text();
  nodecg.sendMessage('ncgsplit-load-run', file);
}

function initializeRun(updateEditor) {
  runObject.state = "READY";
  runState.value = runObject.state;
  nodecg.sendMessage('ncgsplit-run-ready', runObject);

  if (updateEditor) {
    $("#editor-name").val(runObject.title);
    $("#editor-category").val(runObject.category);
    $("#split-start-offset").val(runObject.startOffset ? timeToString(runObject.startOffset) : "0:00.0");

    let tbodySelector = $("#split-editor-table tbody");
    $(tbodySelector).html("");
    let totalSegments = runObject.segments.length;
    let totalRunTime = 0;
    for (var i = 0; i < totalSegments; i++) {
      let segment = runObject.segments[i];
      $(tbodySelector).append(EDITOR_SEGMENT_ROW);
      let row = tbodySelector.find("tr:nth-child("+(i+1)+")");
      row.find('td:nth-child(1) input').val(segment.name);
      totalRunTime += segment.timePb;
      row.find('td:nth-child(2) input').val(timeToString(totalRunTime));
      row.find('td:nth-child(3) input').val(timeToString(segment.timeGold));
      row.find('td:nth-child(4) span').attr('onclick', 'removeEditorRow(this)');
    }
  }
}

nodecg.listenFor("ncgsplit-run-loaded", runData => {
  runObject = runData;
  initializeRun(true)
});

function deleteRun() {
  if (!runObject.state === "READY") {
    return;
  }
  nodecg.sendMessage("ncgsplit-run-delete", runObject.fileName);
}

function saveRun(asNew) {
  if (!runObject.state === "READY") {
    return;
  }

  let tempRunObject = validateEditor(asNew);
  if (!tempRunObject) {
    return;
  }
  console.log(tempRunObject);
  runObject.title = tempRunObject.title;
  runObject.category = tempRunObject.category;
  runObject.startOffset = tempRunObject.startOffset;
  runObject.segments = [];
  for (var i in tempRunObject.segments) {
    runObject.segments.push(tempRunObject.segments[i]);
  }
  runObject.totalTimePb = tempRunObject.totalTimePb;

  if (asNew) {
    runObject.fileName = tempRunObject.fileName + ".ncgrun";
    runObject.attempts = 0;
    runObject.completedAttempts = 0;
  }
  nodecg.sendMessage('ncgsplit-run-save', runObject);
  initializeRun(false);
}

function validateEditor(asNew) {
  let tempRunObject = {
    "title" : "",
    "category" : "",
    "startOffset" : 0,
    "segments" : [],
  }

  // verify file name if the run is to be stored as a new file
  if (asNew) {
    let fileName = $("#input-save-new").val();
    let nameRegexp = /^[a-zA-Z0-9]+$/
    if (!fileName.match(nameRegexp)) {
      $("#input-save-new").addClass("editor-error");
    return;
    }
    tempRunObject.fileName = fileName;
    $("#input-save-new").removeClass("editor-error");
  }

  // verify name and category
  let title = $("#editor-name").val();
  if (!title) {
    $("#editor-name").addClass("editor-error");
    return undefined;
  }
  $("#editor-name").removeClass("editor-error");
  tempRunObject.title = title;

  let category = $("#editor-category").val();
  if (!category) {
    $("#editor-category").addClass("editor-error");
    return undefined;
  }
  $("#editor-category").removeClass("editor-error");
  tempRunObject.category = category;

  // verify start offset
  $("#split-start-offset").removeClass("editor-error")
  let startOffsetStr = $("#split-start-offset").val();
  let startOffset = stringToTime(startOffsetStr);
  if (startOffset < 0) {
    $("#split-start-offset").addClass("editor-error");
  } else {
    tempRunObject.startOffset = startOffset;
  }

  // verify each row
  let trsSelector = $("#split-editor-table tbody tr");
  let timePbPrev = 0;
  let totalTimePb = 0;
  $(trsSelector).each(function(i, row) {
    let nameTd = $(row).find('td:nth-child(1) input');
    let name = nameTd.val();
    if (!name) {
      nameTd.addClass("editor-error");
      return undefined;
    }
    let timePbTd = $(row).find('td:nth-child(2) input');
    let timePb = stringToTime(timePbTd.val());
    totalTimePb = timePb;
    if (timePb < 0) {
      timePbTd.addClass("editor-error");
      return undefined;
    }
    let timePbDelta = timePb - timePbPrev;
    if (timePbDelta < 0) {
      timePbTd.addClass("editor-error");
      return undefined;
    }
    timePbPrev = timePb;
    let timeGoldTd = $(row).find('td:nth-child(3) input');
    let timeGold = stringToTime(timeGoldTd.val());
    if (timeGold < 0 || (timeGold > timePbDelta)) {
      timeGoldTd.addClass("editor-error");
      return undefined;
    }

    nameTd.removeClass("editor-error");
    timePbTd.removeClass("editor-error");
    timeGoldTd.removeClass("editor-error");

    tempRunObject.segments.push({
      name : name,
      timePb : timePbDelta,
      timeGold : timeGold,
      timeLive : 0
    });
  });
  tempRunObject.totalTimePb = totalTimePb;
  return tempRunObject;
}

function timeToString(time) {
  if (0 == time) {
    return "";
  }
  time = Math.floor(time/100);
  let tensOfSeconds = time % 10;
  let seconds = Math.floor(time/10) % 60;
  let secondsStr = (seconds < 10) ? ("0"+seconds) : seconds;
  let minutes = Math.floor(time/600) % 60;
  let minutesStr = (minutes < 10) ? ("0"+minutes) : minutes;

  return minutesStr+":"+secondsStr+"."+tensOfSeconds;
}

function stringToTime(timeString) {
  if (timeString === "") {
    return 0;
  }
  let timeRegexp = /^(\d+):(\d+)\.(\d)$/;
  let isMatch = timeString.match(timeRegexp);
  if (!isMatch) {
    return -1;
  }
  let minutes = isMatch[1] * 60*1000;
  let seconds = isMatch[2] * 1000;
  if (seconds > 59000) {
    return -1;
  }
  let tens = isMatch[3] * 100;
  if (tens > 900) {
    return -1;
  }
  return tens + seconds + minutes;
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

    runState.value = runObject.state;
  }
}

function timerReset() {
  if ("RUNNING" === runObject.state || "FINISHED" == runObject.state) {
    let currentState = runObject.state;
    let totalTimeLiveTemp = runObject.totalTimeLive;
    let currentSegmentTemp = runObject.currentSegment;
    runObject.state = "READY";
    runObject.currentSegment = 0;
    runObject.startTime = 0;
    runObject.totalTimeLive = 0;
    runObject.attempts = runObject.attempts + 1;
    if ($("#chk-save-gold").is(":checked")) {
      for (var i = 0; i < currentSegmentTemp; i++) {
        if ((0 == runObject.segments[i].timeGold) || (runObject.segments[i].timeLive < runObject.segments[i].timeGold)) {
          console.log("Update gold for segment <" + i + ">");
          runObject.segments[i].timeGold = runObject.segments[i].timeLive;
        }
      }
    }
    if ("FINISHED" == currentState) {
      runObject.completedAttempts = runObject.completedAttempts + 1;
      if ($("#chk-save-pb").is(":checked")) {
        if ((0 == runObject.totalTimePb) || (totalTimeLiveTemp < runObject.totalTimePb)) {
          runObject.totalTimePb = totalTimeLiveTemp;
          for (var i in runObject.segments) {
            console.log("Update PB time for segment <" + i + ">");
            runObject.segments[i].timePb = runObject.segments[i].timeLive;
          }
        }
      }
    }
    nodecg.sendMessage('ncgsplit-run-save', runObject);
    nodecg.sendMessage('ncgsplit-run-ready', runObject);

    runState.value = runObject.state;
  }
}

function timerSplit() {
  let splitTime = Date.now();
  if ("RUNNING" == runObject.state) {
    if (runObject.currentSegment < runObject.segments.length) {
      runObject.segments[runObject.currentSegment].timeLive = splitTime - runObject.startTime - runObject.totalTimeLive - (runObject.startOffset ? runObject.startOffset : 0);
      runObject.totalTimeLive += runObject.segments[runObject.currentSegment].timeLive;
      runObject.currentSegment++;
      if (runObject.currentSegment == runObject.segments.length) {
        runObject.state = "FINISHED";
        runState.value = runObject.state;
        nodecg.sendMessageToBundle('timerInfo', 'plpalotwitch', {"type":"RUN_COMPLETED", "liveTime":runObject.totalTimeLive, "runTime":runObject.totalTimePb});
        nodecg.sendMessage('ncgsplit-run-finish', runObject);
      } else {
        let message = {
          "type" : "SEGMENT",
          "segmentNo" : runObject.currentSegment,
          "segmentTotal" : runObject.segments.length,
          "bestDelta" : (0 == runObject.segments[runObject.currentSegment-1].timeGold) ? -1 : (runObject.segments[runObject.currentSegment-1].timeLive - runObject.segments[runObject.currentSegment-1].timeGold),
          "runDelta" : (0 == runObject.segments[runObject.currentSegment-1].timePb) ? -1 : (runObject.segments[runObject.currentSegment-1].timeLive - runObject.segments[runObject.currentSegment-1].timePb)
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

function toggleButtonEnable(button, state, customClass) {
  if (!customClass) {
    customClass = "btn-primary";
  }
  if ("enable" === state) {
      $("#"+button).attr("disabled", false);
      $("#"+button).addClass(customClass);
  } else {
      $("#"+button).attr("disabled", true);
      $("#"+button).removeClass(customClass);
  }
}

function toggleEditor(show) {
  if (show) {
    $(".editor").css("display", "inline-block");
    $("#editor-header-hide").show();
    $("#editor-header-show").hide();
  } else {
    $(".editor").hide();
    $("#editor-header-hide").hide();
    $("#editor-header-show").show();
  }
}

function addEditorRow() {
  let tbodySelector = $("#split-editor-table tbody");
  $(tbodySelector).append(EDITOR_SEGMENT_ROW);

  let rowCount = $("#split-editor-table tbody tr").length;

  let row = tbodySelector.find("tr:nth-child("+(rowCount)+")");
  row.find('td:nth-child(4) span').attr('onclick', 'removeEditorRow(this)');
}

function removeEditorRow(elem) {
  let parent = $(elem).parents("tr");
  parent.remove();
}

nodecg.listenFor('ncgsplit-ext-split', () => {
	jQuery.event.trigger({type : 'keypress', which : KEYSTROKE_START_SPLIT});
});

nodecg.listenFor('ncgsplit-ext-reset', () => {
	jQuery.event.trigger({type : 'keypress', which : KEYSTROKE_RESET});
});

$(document).on("keypress", function (e) {
    // Ignore keypresses when editor is open
    if ($(".editor").is(":visible")) {
      return;
    }
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

$(document).ready(function() {
  loadRunList();
});
