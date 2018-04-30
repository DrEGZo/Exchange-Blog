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
  if (logout) {
    //Redirect to Logout Page
    console.log('You got logged out.');
  } else if (status == 403) {
    window.location.replace("/de-de/accessdenied.html");
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
          error: () => { redirector(403) }
        });
      });
    } else {
      redirector(403);
    }
  });
});

function main() {
  initMenu(getBlogData);

  function getBlogData() {
    var selectedyear = 2018;
    var selectedmonth;

    if ($('#menu-button-2019').hasClass('active')) selectedyear = 2019;

    for (var i = 0; i < 12; i++) {
      if ($('#month-choice-' + selectedyear + ' > .menu-button-' + i).hasClass('active')) selectedmonth = i;
    }

    firebase.auth().currentUser.getIdToken(true)
      .then(idToken => {
        $.ajax({
          type: 'POST',
          url: '/getBlogList',
          contentType: 'application/json',
          data: '{ "year": ' + selectedyear + ', "month": ' + selectedmonth + ', "idToken": "' + idToken + '" }',
          error: () => { redirector(403) },
          success: (data) => {
            buildBlogList(data);
            $('#page-content').slideDown(400);
          }
        });
      });
  }

  getBlogData();

  function buildBlogList(bloglist) {
    var html = '';
    var date = { toDateString: () => ''};
    for (var i = 0; i < bloglist.length; i++) {
      if (date.toDateString() != new Date(bloglist[i].upload).toDateString()) {
        date = new Date(bloglist[i].upload);
        html += createDivider(date);
      }
      html += '<div class="post">';
      html += '<a href="/de-de/blog/' + bloglist[i].id + '/index.html">';
      html += '<div class="article">';
      html += '<div class="article-teaser" style="background-image: url(\'' + bloglist[i].thumbnail + '\');"></div>';
      html += '<div class="article-content">';
      html += '<h4>' + bloglist[i].title + '</h4>';
      html += '<p>' + bloglist[i].intro + '</p>';
      html += '</div>';
      html += '</div>';
      html += '</a>';
      html += '</div>';
    }
    if (bloglist.length == 0) {
      html += '<div class="placeholder-wrapper" style="display: flex;justify - content: center;">';
      html += '<span class="fa fa-search no-image-placeholder"></span>';
      html += '<span class="no-image-placeholder">Nothing there yet</span>';
      html += '</div>';
    }
    $('#page-content').html(html);
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
