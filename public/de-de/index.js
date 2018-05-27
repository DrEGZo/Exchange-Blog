$(main);

function main() {
  firebase.auth().onAuthStateChanged((user) => {
    adjustAuthButton();
    if (user) {
      $('#auth-button a').html('Profile');
      $('#auth-button').addClass('loggedin').fadeIn(200);
    } else {
      $('#auth-button a').html('Login');
      $('#auth-button').fadeIn(200);
    }
  });

  $(window).resize(adjustAuthButton);

  $('#login-container button').click(() => {
    var user = $('#login-container input[type="text"]').val();
    var pass = $('#login-container input[type="password"]').val();
    var keepSession = document.querySelector('#login-container input[type="checkbox"]').checked;
    var sessionState = firebase.auth.Auth.Persistence.SESSION;
    if (keepSession) sessionState = firebase.auth.Auth.Persistence.LOCAL;
    firebase.auth().setPersistence(sessionState)
      .then(function () {
        return firebase.auth().signInWithEmailAndPassword(user, pass);
      })
      .then(function () {
        if (window.innerWidth > 767) $('#login-container').fadeOut();
        if (window.innerWidth <= 767) $('#login-container').slideUp();
      })
      .catch(function (error) {
        $('#login-failed').slideDown();
        $('#login-container input[type="password"]').val('');
        setTimeout(() => { $('#login-failed').slideUp() }, 5000);
      });
  });

  $('#login-container form').submit((e) => { e.preventDefault(); $('#login-container button').click() });
  
  $('#login-container a').click(() => {
    var mail = $('#login-container input[type="text"]').val();
    if (mail == '') {
      $('#pwResetMail').slideDown();
      setTimeout(() => { $('#pwResetMail').slideUp() }, 5000);
    } else {
      firebase.auth().sendPasswordResetEmail(mail)
        .then(() => {
          $('#pwResetConfirm').slideDown();
          setTimeout(() => { $('#pwResetConfirm').slideUp() }, 5000);
        })
        .catch(() => {
          $('#login-failed').slideDown();
          setTimeout(() => { $('#login-failed').slideUp() }, 5000);
        });
    }
  });
  
  $.ajax({
    method: 'GET',
    url: '/getHomeContent',
    success: (data) => {launchCarousel(data)}
  });
}

function adjustAuthButton() {
  var target = '#login-container';
  if (firebase.auth().currentUser) target = '#profile-info';
  if (window.innerWidth > 767) {
    $('#auth-button').off().click(() => { $(target).fadeToggle() });
  } else if (window.innerWidth <= 767) {
    $('#auth-button').off().click(() => { $(target).slideToggle() });
  }
}

function launchCarousel(data) {
  for (var i = 0; i < data.length; i++) {
    $('.carousel-indicators').append('<li data-target="#header_carousel" data-slide-to="' + i + '"></li>');
    var html = '';
    html += '<div class="carousel-item">';
    html += '<img src="' + data[i].location + '">';
    html += '<a class=".carousel-link" href="/de-de/blog/' + data[i].id + '/index.html">';
    html += '<div class="carousel-caption">';
    html += '<h1 class="display-2 carousel-header">' + data[i].title + '</h1>';
    html += '<p>' + data[i].intro + '</p>';
    html += '<span class="badge badge-light">Read more</span>';
    html += '</div>';
    html += '</a>';
    html += '</div>';
    $('.carousel-inner').append(html);
    if (i == 0) $('.carousel-indicators li:first-child').addClass('active');
    if (i == 0) $('.carousel-item:first-child').addClass('active');
  }
  $('#header-carousel').slideDown();
  $('#page-title').slideDown();
  $('#page-content').slideDown();
}