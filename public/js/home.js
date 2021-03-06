$(main);

function main() {
  $('#language-choice>button').css('background-image', 'url("/media/' + language + '.svg")');
  firebase.auth().onAuthStateChanged((user) => {
    adjustAuthButton();
    $(window).resize(adjustAuthButton);
    if (user) {
      firebase.auth().currentUser.getIdToken().then((idToken) => {
        fetch('/getUserData', { idToken: idToken }).then((data) => {
          $('#profile-info .profile-name').html(data.name);
          $('#profile-info .profile-rank')
            .html(globalranks[data.rank][language])
            .css('background-color', globalranks[data.rank].c);
          $('#auth-button a').html(dictionary.profile[language]);
          $('#auth-button').addClass('loggedin').css('visibility', 'visible');
          $('#language-choice').css('visibility', 'visible');
          return fetch('/getHomeContent', { lang: language, idToken: idToken });
        }).then((data) => {
          launchCarousel(data);
        });
      });
    } else {
      $('#auth-button a').html('Login');
      $('#auth-button').css('visibility', 'visible');
      $('#language-choice').css('visibility','visible');
      $('#cookie-info').show(400);
      fetch('/getHomeContent', { lang: language }).then((data) => launchCarousel(data));
    }
  });

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

  $('#cookie-info button').click(() => {
    $('#cookie-info').hide(400);
  });
}

function launchCarousel(data) {
  var html = '';
  var html2 = '';
  for (var i = 0; i < data.length; i++) {
    html2 += '<li data-target="#header_carousel" data-slide-to="' + i + '"></li>';
    html += '<div class="carousel-item">';
    html += '<img src="' + data[i].location + '">';
    if (language == 'de') html += '<a class=".carousel-link" href="/de-de/blog/' + data[i].id + '/index.html">';
    else html += '<a class=".carousel-link" href="/en-us/blog/' + data[i].id + '/index.html">';
    html += '<div class="carousel-caption">';
    html += '<h1 class="display-2 carousel-header">' + data[i].title + '</h1>';
    html += '<p>' + data[i].intro + '</p>';
    html += '<span class="badge badge-light">' + dictionary.readmore[language] + '</span>';
    html += '</div>';
    html += '</a>';
    html += '</div>';
  } 
  $('.carousel-indicators').html(html2);
  $('.carousel-inner').html(html);
  $('.carousel-indicators li:first-child').addClass('active');
  $('.carousel-item:first-child').addClass('active');
  $('#loading').hide(0);
  $('#header-carousel').fadeIn();
  $('#page-title').slideDown();
  $('#page-content').slideDown();
  $('#footer').slideDown();
}