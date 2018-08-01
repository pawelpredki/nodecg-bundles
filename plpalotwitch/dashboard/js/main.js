const transparent = nodecg.Replicant('transparent', {defaultValue: false});
transparent.on("change", newValue => {
  if (newValue) {
    $("#transparent-off").removeClass("disabled");
    $("#transparent-on").addClass("disabled");
  } else {
    $("#transparent-on").removeClass("disabled");
    $("#transparent-off").addClass("disabled");
  }
});

function switchTransparent(onOff) {
  transparent.value = onOff;
};

function updateFollowers() {
  nodecg.sendMessage('updateFollowers');
}

const messageLineOne = nodecg.Replicant('messageLineOne');
messageLineOne.on("change", newValue => {
  $("#message-line-1").val(newValue);
});
const messageLineTwo = nodecg.Replicant('messageLineTwo');
messageLineTwo.on("change", newValue => {
  $("#message-line-2").val(newValue);
});
function changeMessages() {
  messageLineOne.value = $("#message-line-1").val();
  messageLineTwo.value = $("#message-line-2").val();
}

const personalBestActive = nodecg.Replicant('personalBestActive', {defaultValue : false});
personalBestActive.on("change", newValue => {
  if (newValue) {
    $("#personal-best-off").removeClass("disabled");
    $("#personal-best-on").addClass("disabled");
  } else {
    $("#personal-best-on").removeClass("disabled");
    $("#personal-best-off").addClass("disabled");
  }
});
function switchPersonalBestImage(show) {
  personalBestActive.value = show;
}

const timerActive = nodecg.Replicant('timerActive', {defaultValue : false});
timerActive.on("change", newValue => {
  if (newValue) {
      $("#timer-off").removeClass("disabled");
      $("#timer-on").addClass("disabled");
  } else {
      $("#timer-on").removeClass("disabled");
      $("#timer-off").addClass("disabled");
  }
});
function switchTimer(show) {
  timerActive.value = show;
}

// Search games and categories
const gameSearchTerm = nodecg.Replicant('gameSearchTerm', {defaultValue : 'Contra'});
gameSearchTerm.on("change", newValue => {
  $("#game-name").val(newValue);
});
function searchGame() {
  let searchTerm = $("#game-name").val();
  gameSearchTerm.value = searchTerm;
}

const gameResult = nodecg.Replicant('games');
let gameResultLocal = [];
gameResult.on("change", newValue => {
  gameResultLocal = newValue;
  var output = [];
  $.each(newValue, function(i, v)
  {
    output.push('<option value="'+ v.abbreviation +'">'+ v.name +'</option>');
  });
  $('#game-name-search-result').html(output.join(''));
  if (gameResultLocal.length > 0) {
    setCategories(gameResultLocal[0].categories);
  }
});

const leaderboardGame = nodecg.Replicant('leaderboardGame');
leaderboardGame.on("change", newValue => {
  $("#game-name-search-result").val(newValue);
});
const leaderboardCategory = nodecg.Replicant('leaderboardCategory');
leaderboardCategory.on("change", newValue => {
  $("#game-category-search-result").val(newValue);
});

function gameSelected() {
  let gameName = $('#game-name-search-result').find(":selected").text();
  let categories = [];
  for (var i in gameResultLocal) {
    if (gameResultLocal[i].name === gameName) {
      categories = gameResultLocal[i].categories;
      break;
    }
  }
  setCategories(categories);
}

function setCategories(categories) {
  var output = [];
  $.each(categories, function(i, v)
  {
    output.push('<option value="'+ v.name +'">'+ v.name +'</option>');
  });
  $('#game-category-search-result').html(output.join(''));
}

function changeGame() {
  leaderboardCategory.value = $("#game-category-search-result").val();
  leaderboardGame.value = $("#game-name-search-result").val();
  setTimeout(() => nodecg.sendMessage('updateLeaderboards'), 500);
}
