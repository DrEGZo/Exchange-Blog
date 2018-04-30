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
  
  initMenu(launchGallery);

  // // // // // // // // // //
  // Launching the gallery   //
  // // // // // // // // // //

  function launchGallery() {
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
        url: '/getMediaList',
        contentType: 'application/json',
        data: '{ "year": ' + selectedyear + ', "month": ' + selectedmonth + ', "idToken": "' + idToken + '" }',
        error: () => {redirector(403)},
        success: (data) => {
          var gallery = document.querySelector('.image-gallery');
          gallery.innerHTML = '';
          data.forEach(media => {
            datastorage[media.id] = {
              typ: media.typ,
              location: media.location,
              comments: media.comments
            };
            var content = '';
            content += '<div class="gallery-row">';
            content += '<div class="gallery-column">';
            content += '<div class="gallery-image">';
            content += '</div>';
            content += '</div>';
            content += '</div>';
            gallery.innerHTML += content;
            var image = document.querySelector('.gallery-row:last-child .gallery-image');
            image.id = media.id;
            if (media.typ == 'pic') {
              image.style.backgroundImage = 'url("' + media.location + '")';
            } else if (media.typ == 'ytvid') {
              image.style.backgroundImage = 'url("/media/ytplaceholder.svg")';
              image.style.backgroundSize = 'cover';
            } else if (media.typ == 'vid') {
              image.style.backgroundImage = 'url("/media/vidplaceholder.svg")';
            }
          });
          if (data.length == 0) {
            var content = '';
            content += '<span class="fa fa-search no-image-placeholder"></span>';
            content += '<span class="no-image-placeholder">Nothing there yet</span>';
            gallery.innerHTML += content;
          }
          $('#page-content').slideDown(400);
          var mediaList = document.getElementsByClassName('gallery-image');
          for (var i = 0; i < mediaList.length; i++) {
            mediaList[i].addEventListener('click',openModal(i));
            // I hate closures....
          }
        }
      });
    });
  }

  launchGallery();


  // // // // // // // // // // // //
  // Setting up the modal window   //
  // // // // // // // // // // // //

  var datastorage = {};

  $('.media-modal').hide(0,() => {
    $('.media-modal').css('opacity','1');
  });

  function openModal(index) {
    return function () {
      $('.media-modal').fadeIn(400);
      $('html').css('height','100%');
      $('html').css('overflow','hidden');
      $('body').css('overflow','scroll');
      var galleryImage = $('.gallery-row:nth-child(' + (index + 1) + ') .gallery-image');
      var imageData = datastorage[galleryImage.attr('id')];
      $('.slider-image > *:not(.slider-image-comments)').remove();
      $('.slider-image').css('background-image','none');
      if (imageData.typ == 'pic') {
        $('.slider-image').css('background-image','url(' + imageData.location + ')');
      } else if (imageData.typ == 'vid') {
        var content = '';
        content += '<div class="video-wrapper">';
        content += '<div class="video-base">';
        content += '<video width="100%" height="100%" controls preload="none" poster="/media/vidplaceholder.svg">';
        content += '<source src="' + imageData.location + '" type="video/mp4">';
        content += '</video></div></div>';
        $('.slider-image').append(content);
      } else if (imageData.typ == 'ytvid') {
        var content = '';
        content += '<div class="video-wrapper">';
        content += '<div class="video-base">';
        content += '<iframe src="https://www.youtube.com/embed/' + imageData.location + '" width="100%" height="100%" allowfullscreen>';
        content += '</iframe></div></div>';
        $('.slider-image').append(content);
      }

      $('span.fa-close').off();
      $('span.fa-close').click(() => {
        $('.slider-image-comments').fadeOut(400);
        $('span.fa-comments-o').removeClass('active');
        $('span.fa-chevron-left').removeClass('disabled');
        $('span.fa-chevron-right').removeClass('disabled');
        $('.media-modal').fadeOut(400,() => {
          $('html').css('height','auto');
          $('html').css('overflow-x','auto');
          $('html').css('overflow-y','scroll');
          $('body').css('overflow','auto');
          $('.slider-image :not(.slider-image-comments)').remove();
        });
      });

      $('span.fa-expand').off();
      $('span.fa-expand').click(() => {
        if (imageData.typ != 'ytvid') {
          window.open(imageData.location,'_blank');
        } else {
          window.open('https://youtu.be/' + imageData.location,'_blank');
        }
      });

      $('span.fa-comments-o').off();
      $('span.fa-comments-o').click(() => {
        if ($('.slider-image-comments').css('display') == 'block') {
          $('.slider-image-comments').fadeOut(400);
          $('span.fa-comments-o').removeClass('active');
          if (index != 0) $('span.fa-chevron-left').removeClass('disabled');
          if (index + 1 < Object.keys(datastorage).length) $('span.fa-chevron-right').removeClass('disabled');
        } else {
          $('.slider-image-comments').html('');
          var content = '';
          content += '<div>';

          for (var i = 0; i < imageData.comments.length; i++) {
            var commentAuthor = imageData.comments[i].author.name;
            var commentRank = imageData.comments[i].author.rank;
            var commentText = imageData.comments[i].content;
            var commentDate = new Date(imageData.comments[i].time);
            var commentTimeDiff = new Date().getTime() - commentDate.getTime();
            var commentTime = '';
            if (commentTimeDiff < 60 * 1000) {
              commentTime = 'vor wenigen Sekunden';
            } else if (commentTimeDiff < 60 * 60 * 1000) {
              commentTime = 'vor ' + Math.floor(commentTimeDiff / (60 * 1000)) + ' Minute';
              if (Math.floor(commentTimeDiff / (60 * 1000)) > 1) commentTime += 'n';
            } else if (commentTimeDiff < 6 * 60 * 60 * 1000) {
              commentTime = 'vor ' + Math.floor(commentTimeDiff / (60 * 60 * 1000)) + ' Stunde';
              if (Math.floor(commentTimeDiff / (60 * 60 * 1000)) > 1) commentTime += 'n';
            } else {
              if (new Date().getDay() == commentDate.getDay() && new Date().getTime() - commentDate.getTime() < 24 * 60 * 60 * 1000) {
                commentTime += 'heute um ';
              } else if (new Date(new Date().getTime() - 24 * 60 * 60 * 1000).getDay() == commentDate.getDay() && new Date().getTime() - commentDate.getTime() < 48 * 60 * 60 * 1000) {
                commentTime += 'gestern um ';
              } else if (new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).getTime() < commentDate.getTime() && new Date().getDay() != commentDate.getDay()) {
                commentTime += 'letzten ' + new Array('Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag')[commentDate.getDay()] + ' um ';
              } else {
                var commentDayOfMonth = commentDate.getDate();
                var commentMonth = commentDate.getMonth() + 1;
                if (commentDayOfMonth < 10) commentDayOfMonth = '0' + commentDayOfMonth;
                if (commentMonth < 10) commentMonth = '0' + commentMonth;
                commentTime += commentDayOfMonth + '.' + commentMonth + '.' + commentDate.getFullYear() + ' ';
              }
              var commentHour = commentDate.getHours();
              var commentMinute = commentDate.getMinutes();
              if (commentHour < 10) commentHour = '0' + commentHour;
              if (commentMinute < 10) commentMinute = '0' + commentMinute;
              commentTime += commentHour + ':' + commentMinute + ' Uhr';
            }

            content += '<div class="comment">';
            content += '<div class="comment-content">';
            content += '<div class="comment-info clearfix">';
            content += '<div class="comment-avatar">';
            content += '<span class="fa fa-user-circle">';
            content += '</span></div>';
            content += '<div class="comment-author">';
            content += commentAuthor + '&nbsp';
            content += '<span class="badge">';
            content += commentRank
            content += '</span></div>';
            content += '<div class="comment-time">';
            content += commentTime;
            content += '</div></div>';
            content += '<div class="comment-text">';
            content += commentText;
            content += '</div>';
            content += '<div class="comment-controll">';
            content += '<a>Antworten</a>';
            content += '<a>Melden</a>';
            content += '<a>Löschen</a>';
            content += '</div></div></div>';
          }

          content += '<div class="comment-insert">';
          content += '<textarea placeholder="Schreibe einen Kommentar..."></textarea>';
          content += '<a>Veröffentlichen</a>';
          content += '</div></div>';
          $('.slider-image-comments').html(content);
          $('.slider-image-comments').fadeIn(400);
          $('span.fa-comments-o').addClass('active');
          $('span.fa-chevron-left').addClass('disabled');
          $('span.fa-chevron-right').addClass('disabled');

          //Refference: https://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize/25621277#25621277
          $('textarea').each(function () {
            this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
          }).off().on('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
          });
        }

      });

      if (index == 0) {
        $('span.fa-chevron-left').addClass('disabled');
      } else {
        $('span.fa-chevron-left').removeClass('disabled');
      }
      if (index + 1 == Object.keys(datastorage).length) {
        $('span.fa-chevron-right').addClass('disabled');
      } else {
        $('span.fa-chevron-right').removeClass('disabled');
      }
      
      $('span.fa-chevron-left').off();
      $('span.fa-chevron-left').click(function() {
        if (!$(this).hasClass('disabled')) openModal(index - 1)();
      });

      $('span.fa-chevron-right').off();
      $('span.fa-chevron-right').click(function() {
        if (!$(this).hasClass('disabled')) openModal(index + 1)();
      });
    }
  }
}
