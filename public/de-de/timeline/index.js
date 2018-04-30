// Initialize Firebase
var config = {
  apiKey: "AIzaSyDFm0hNUOwU1TjpA8eV5dosr1-D1SX1PbM",
  authDomain: "exchange-blog.firebaseapp.com",
  databaseURL: "https://exchange-blog.firebaseio.com",
  projectId: "exchange-blog",
  storageBucket: "exchange-blog.appspot.com",
  messagingSenderId: "977760272277"
};
firebase.initializeApp(config);

var logout = false;

function redirector(status) {
  if (status == 403) {
    if (logout) {
      //redirect to logout
      console.log('logged out');
    } else {
      window.location.replace("/de-de/accessdenied.html");
    }
  } else if (status == 404) {
    console.log('404 error')
  }
}

$(function () {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      firebase.auth().currentUser.getIdToken(true)
        .then((idToken) => {
          $.ajax({
            method: 'POST',
            url: '/auth',
            data: {"idToken": idToken},
            success: main,
            error: () => {redirector(403)}
          });
        });
    } else {
      redirector(403);
    }
  });
});

function main() {

  var activity = [];
  var nextActivity = [];
  var date = new Date();

  function refreshData(time) {
    return new Promise((resolve,reject) => {
      firebase.auth().currentUser.getIdToken(true)
        .then(idToken => {
          $.ajax({
            type: 'POST',
            url: '/getActivityFeed',
            contentType: 'application/json',
            data: '{ "time": ' + time + ', "idToken": "' + idToken + '" }',
            error: (jqxhr) => { redirector(jqxhr.status) },
            success: (data) => {
              nextActivity = data;
              resolve();
            }
          });
        });
    });
  }

  refreshData(Date.now())
    .then(addStatusContent)
    .then(() => { $('#page-content').slideDown() });
  
  function addStatusContent() {
    return new Promise((resolve, reject) => {
      activity = activity.concat(nextActivity);
      addActivity(nextActivity);
      var time;
      if (Array.isArray(activity[activity.length - 1])) {
        var medialist = activity[activity.length - 1];
        time = medialist[medialist.length - 1].upload;
      } else {
        time = activity[activity.length - 1].upload;
      }
      refreshData(new Date(time).getTime())
        .then(() => {
          if (nextActivity.length != 0) $('#page-content').append('<a class="activity-load">Load more activity</a>');
          $('.activity-load').click(function () {
            $(this).off().fadeOut(400, addStatusContent);
          });
          resolve();
        });
    });
  }

  function addActivity(content) {
    for (var i = 0; i < content.length; i++) {
      if (Array.isArray(content[i])) {
        var html = '';
        if (date.toDateString() != new Date(content[i][0].upload).toDateString()) {
          date = new Date(content[i][0].upload);
          html += createDivider(date);
        }
        html += '<div class="media-teaser" id="mediaTeaser_' + i + '">';
        html += '<h3>New photos are available!</h3>';
        html += '<div class="media-header">';
        if (content[i][0].typ == 'pic') {
          html += '<div class="media-header-blurbox"  style="background-image:url(\'' + content[i][0].location + '\')"></div>';
          html += '<div class="media-header-content">';
          html += '<div class="media-header-image" style="background-image:url(\'' + content[i][0].location + '\')"></div>';
          html += '</div>';
        } else if (content[i][0].typ == 'vid') {
          html += '<div class="video-fitter">';
          html += '<div class="video-base">';
          html += '<video class="video-frame" src="' + content[i][0].location + '" preload="none" controls poster="/media/vidplaceholder.svg"></video>';
          html += '</div>';
          html += '</div>';
        } else if (content[i][0].typ == 'ytvid') {
          html += '<div class="video-fitter">';
          html += '<div class="video-base">';
          html += '<iframe src="https://www.youtube.com/embed/' + content[i][0].location + '" allowfullscreen></iframe>';
          html += '</div>';
          html += '</div>';
        }
        html += '</div>';
        if (content[i].length > 1) {
          html += '<div class="media-choice">';
          html += '<div class="media-choice-wrapper">';
          for (var j = 0; j < content[i].length; j++) {
            if (content[i][j].typ == 'pic') html += '<div class="media-choice-image" style="background-image:url(\'' + content[i][j].location + '\')"></div>';
            if (content[i][j].typ == 'vid') html += '<div class="media-choice-image" style="background-image:url(\'/media/vidplaceholder.svg\')"></div>';
            if (content[i][j].typ == 'ytvid') html += '<div class="media-choice-image" style="background-image:url(\'/media/ytplaceholder.svg\')"></div>';
          }
          html += '</div>';
          html += '</div>';
        }
        html += '<div class="media-controll">';
        html += '<span class="fa fa-comments-o"></span>';
        html += '</div>';   
        html += '<div class="media-comments"></div>';     
        html += '</div>';
        $('#page-content').append(html);
        if (content[i][0].typ == 'pic') $('#mediaTeaser_' + i +' .media-header').click(((location) => () => {
          window.open(location, '_blank');
        })(content[i][0].location));
        $('#mediaTeaser_' + i +' .media-comments').html(stringifyComments(content[i][0].comments,false,false));
        addCommentListeners(content[i][0].comments, content[i][0].id, '#mediaTeaser_' + i + ' .media-comments', 'media', false, false);
        $('#mediaTeaser_' + i + ' .media-controll').click(((index) => () => {
          $('#mediaTeaser_' + index + ' .media-comments').slideToggle();
        })(i));
        $('#mediaTeaser_' + i + ' .media-choice-image:nth-child(1)').addClass('active');
        for (var j = 0; j < content[i].length; j++) {
          $('#mediaTeaser_' + i + ' .media-choice-image:nth-child(' + (j + 1) + ')').click((function(target,index){return function(){
            if(!$(this).hasClass('active')) {
              $('#mediaTeaser_' + target + ' .media-choice-image').removeClass('active');
              $(this).addClass('active');
              $('#mediaTeaser_' + target + ' .media-header').off();
              $('#mediaTeaser_' + target + ' .media-comments div').off();
              $('#mediaTeaser_' + target + ' .media-comments').slideUp(400,() => {
                $('#mediaTeaser_' + target + ' .media-comments').html(stringifyComments(content[target][index].comments, false, false));
                addCommentListeners(content[target][index].comments, content[target][index].id, '#mediaTeaser_' + target + ' .media-comments', 'media', false, false);
              });
              var html = '';
              if (content[target][index].typ == 'pic') {
                html += '<div class="media-header-blurbox"  style="background-image:url(\'' + content[target][index].location + '\')"></div>';
                html += '<div class="media-header-content">';
                html += '<div class="media-header-image" style="background-image:url(\'' + content[target][index].location + '\')"></div>';
                html += '</div>';
              } else if (content[target][index].typ == 'vid') {
                html += '<div class="video-fitter">';
                html += '<div class="video-base">';
                html += '<video class="video-frame" src="' + content[target][index].location + '" preload="none" controls poster="/media/vidplaceholder.svg"></video>';
                html += '</div>';
                html += '</div>';
              } else if (content[target][index].typ == 'ytvid') {
                html += '<div class="video-fitter">';
                html += '<div class="video-base">';
                html += '<iframe src="https://www.youtube.com/embed/' + content[target][index].location + '" allowfullscreen></iframe>';
                html += '</div>';
                html += '</div>';
              }
              $('#mediaTeaser_' + target + ' .media-header').html(html);
              if (content[target][index].typ == 'pic') $('#mediaTeaser_' + target + ' .media-header').click(((location) => () => {
                window.open(location, '_blank');
              })(content[target][index].location));
            }
          }})(i,j));
        }
      } else if (content[i].author != undefined) {
        var html = '';
        if (date.toDateString() != new Date(content[i].upload).toDateString()) {
          date = new Date(content[i].upload);
          html += createDivider(date);
        }
        html += '<div class="status-wrapper" id="' + content[i].id + '">';
        html += '<div class="status-box">';
        html += '<div class="status-info">';
        html += '<div class="status-avatar">';
        html += '<span class="fa fa-user-circle"></span>';
        html += '</div>';
        html += '<div class="status-author">' + content[i].author.name + '</div>';
        html += '<div class="badge">' + content[i].author.rank + '</div>';
        html += '</div>';
        html += '<div class="status-content">';
        html += '<h3>Statusmeldung</h3>';
        html += '<i>' + renderTime(new Date(content[i].upload)) + '</i>';
        html += '<p>' + content[i].content.split('§§§').join('</p><p>') + '</p>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        $('#page-content').append(html);
      } else if (content[i].title != undefined) {
        var html = '';
        if (date.toDateString() != new Date(content[i].upload).toDateString()) {
          date = new Date(content[i].upload);
          html += createDivider(date);
        }
        html += '<div class="post" id="blogpost_' + content[i].id + '">';
        html += '<h3>A new article is available!</h3>';
        html += '<a href="/de-de/blog/' + content[i].id + '/index.html">';
        html += '<div class="article">';
        html += '<div class="article-teaser" style="background-image: url(\'' + content[i].thumbnail + '\');"></div>';
        html += '<div class="article-content">';
        html += '<h4>' + content[i].title + '</h4>';
        html += '<p>' + content[i].intro + '</p>';
        html += '</div>';
        html += '</div>';
        html += '</a>';
        html += '</div>';
        $('#page-content').append(html);
        if (window.innerWidth <= 767) $('#blogpost_' + content[i].id + ' .article')
          .css('background-image', $('#blogpost_' + content[i].id + ' .article-teaser').css('background-image'));
      }
    }
  }

  function createDivider(ActivityDate) {
    var ActivityWeekday = new Array('Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag')[ActivityDate.getDay()];
    var ActivityDay = ActivityDate.getDate();
    var ActivityMonth = new Array('Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember')[ActivityDate.getMonth()];
    var ActivityYear = ActivityDate.getFullYear();
    if (ActivityDay.length == 1) ActivityDay = '0' + ActivityDay;
    if (ActivityMonth.length == 1) ActivityMonth = '0' + ActivityMonth;
    var datestring = ActivityWeekday + ', ' + ActivityDay + '. ' + ActivityMonth + ' ' + ActivityYear;
    html = '';
    html += '<div class="divider">';
    html += '<div class="baseline"></div>';
    html += '<div class="date"><div>' + datestring + '</div></div>';
    html += '</div>';
    return html;
  }

  function adjustBlogTeaser() {
    var postlist = document.getElementsByClassName('article');
    var linklist = document.getElementsByClassName('article-teaser');
    if (window.innerWidth > 767 && !aboveBorder) {
      aboveBorder = true;
      for (var i = 0; i < postlist.length; i++) {
        postlist[i].style.backgroundImage = 'none';
      }
    } else if (window.innerWidth <= 767 && aboveBorder) {
      aboveBorder = false;
      for (var i = 0; i < postlist.length; i++) {
        postlist[i].style.backgroundImage = linklist[i].style.backgroundImage;
      }
    }
  }

  var aboveBorder = false;
  if (window.innerWidth > 767) aboveBorder = true;
  $(window).resize(adjustBlogTeaser);
}
