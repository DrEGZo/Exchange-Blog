$(function () {
  authenticater(true).then(main);
});

var activity = [];
var nextActivity = [];
var activityDate = new Date();
var mediaTeasers = 0;

function main() {
  refreshData(Date.now())
    .then(addStatusContent)
    .then(() => { $('#page-content').slideDown() });
}

function refreshData(time) {
  return firebase.auth().currentUser.getIdToken(true)
    .then((idToken) => {
      return fetch('/getActivityFeed', {
        idToken: idToken,
        lang: language,
        time: time
      });
    })
    .then((data) => {
      nextActivity = data;
    });
}

function addStatusContent() {
  activity = activity.concat(nextActivity);
  addActivity(nextActivity);
  var time;
  if (Array.isArray(activity[activity.length - 1])) {
    var medialist = activity[activity.length - 1];
    time = medialist[medialist.length - 1].upload;
  } else {
    time = activity[activity.length - 1].upload;
  }
  return refreshData(new Date(time).getTime())
    .then(() => {
      if (nextActivity.length != 0) $('#page-content').append('<a class="activity-load">' + dictionary.loadactivity[language] + '</a>');
      $('.activity-load').click(function () {
        $(this).off().fadeOut(400, addStatusContent);
      });
    });
}

function addActivity(content) {
  for (var i = 0; i < content.length; i++) {
    if (Array.isArray(content[i])) {
      if (activityDate.toDateString() != new Date(content[i][0].upload).toDateString()) {
        activityDate = new Date(content[i][0].upload);
        $('#page-content').append(createDivider(activityDate));
      }
      insertMediaTeaser(content[i], mediaTeasers);
      mediaTeasers++;
    } else {
      if (activityDate.toDateString() != new Date(content[i].upload).toDateString()) {
        activityDate = new Date(content[i].upload);
        $('#page-content').append(createDivider(activityDate));
      }
      if (content[i].author != undefined) {
        insertStatusUpdate(content[i]);
      } else if (content[i].title != undefined) {
        insertBlogEntry(content[i], true);
      }
    }
  }
}