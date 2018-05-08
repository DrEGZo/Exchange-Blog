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

$(() => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      $('.navbar-nav:not(.mr-auto) .nav-item').addClass('logout');
    } else {
      $('.navbar-nav:not(.mr-auto) .nav-item').addClass('login');
    }
  });
  main();
});

function main() {
  $.ajax({
    method: 'GET',
    url: '/getHomeContent',
    success: (data) => {launchCarousel(data)},
    error: () => { redirector(403) }
  });
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