const fs = require('fs');

let runObject = {
  state : "UNLOADED"
};

listRunFiles();

function listRunFiles() {
  let files = fs.readdirSync('../runs/');

  var output = [];
  $.each(files, function(i, v) {
    output.push('<option value="'+ v.name +'">'+ v.name +'</option>');
  });
  $('#run-search-list').html(output.join(''));
}

function loadRun() {
  let file = $('#run-search-list').find(":selected").text();
  runObject = JSON.parse(fs.readFileSync(file, 'utf8'));
  runObject.state = "READY";
  nodecg.sendMessage('ncgsplit-run-load', runObject);
}

function saveRun() {

}

function timerStart() {
  let startTime = Date.now();
  if ("READY" === runObject.state) {
    runObject.state = "RUNNING";
    runObject.currentSegment = 0;
    runObject.startTime = startTime;
    runObject.totalTime = 0;
    nodecg.sendMessage('ncgsplit-run-start', runObject);
  }
}


function timerSplit() {
  let splitTime = Date.now();
  if ("RUNNING" == runObject.state) {
    if (runObject.currentSegment < runObject.segments.length) {
      runObject.segments[runObject.currentSegment].timeLive = splitTime - runObject.startTime - runObject.totalTime;
      runObject.totalTime += runObject.segments[runObject.currentSegment].timeLive;
      runObject.currentSegment++;
      if (runObject.currentSegment == runObject.segments.length) {
        nodecg.sendMessage('ncgsplit-run-finish', runObject);
      } else {
        nodecg.sendMessage('ncgsplit-run-split', runObject);
      }
    }
  }
}
