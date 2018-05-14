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
          error: () => { redirector(403) }
        });
      });
    } else {
      redirector(403);
    }
  });
});

function main() {
  var blogid = window.location.href.split('/')[5];
  firebase.auth().currentUser.getIdToken(true)
    .then(idToken => {
      $.ajax({
        type: 'POST',
        url: '/getBlogData',
        contentType: 'application/json',
        data: '{ "blogid": "' + blogid + '", "idToken": "' + idToken + '" }',
        error: (jqxhr) => { redirector(jqxhr.status) },
        success: (data) => { buildBlogPage(data,idToken) }
      });
    });
  
  function buildBlogPage(content,idToken) {
    $('#header-teaser div').css('background-image','url("' + content.thumbnail + '")');
    $('#header-teaser').fadeIn();
    $('#page-title h1').html(content.title);
    $('#page-title p').html(content.intro);
    $('#page-title').slideDown();
    $('#page-content').slideDown();
    var elements = content.content.split('§§§');
    for (var i = 0; i < elements.length; i++) {
      var typ = elements[i].split('$$$')[0];
      var rawcontent = elements[i].split('$$$')[1];
      var element = '';
      if (typ == 'p') {
        element += '<p>' + rawcontent + '</p>';
      } else if (typ == 'h') {
        element += '<h4>' + rawcontent + '</h4>';
      } else if (typ == 'yt') {
        element += '<div class="video-fitter">';
        element += '<div class="video-container">';
        element += '<iframe class="video-frame"src="https://www.youtube.com/embed/' + rawcontent + '" allowfullscreen></iframe>';
        element += '</div></div>';
      } else if (typ == 'vid') {
        element += '<div class="video-fitter">';
        element += '<div class="video-container">';
        element += '<video class="video-frame" src="' + rawcontent + '" preload="none" controls poster="/media/vidplaceholder.svg"></video>';
        element += '</div></div>';
      } else if (typ == 'gal') {
        var galleryid = 'gallery' + i;
        var mediaentities = JSON.parse(rawcontent);
        element += '<div class="image-gallery" id="' + galleryid + '">';
        for (var j = 0; j < mediaentities.length; j++) {
          element += '<div class="gallery-row">';
          element += '<div class="gallery-column">';
          element += '<div class="gallery-image">';
          element += '</div></div></div>';
        }
        element += '</div>';
        $.ajax({
          type: 'POST',
          url: '/getGalleryData',
          contentType: 'application/json',
          data: '{ "list": ' + JSON.stringify(mediaentities) + ', "idToken": "' + idToken + '" }',
          error: (jqxhr) => { redirector(jqxhr.status) },
          success: (data) => { launchGallery(galleryid,data) }
        });
      } else if (typ == 'img') {
        var imageid = 'image' + i;
        element += '<div class="img-container" id="' + imageid + '">';
        element += '<div class="img-container-blurbox"></div>';
        element += '<div class="img-container-content">';
        element += '<div class="img-container-border">';
        element += '<div class="img-container-image"></div>';
        element += '</div>';
        element += '<p></p>';
        element += '</div></div>';
        $.ajax({
          type: 'POST',
          url: '/getMediaData',
          contentType: 'application/json',
          data: '{ "mid": "' + rawcontent + '", "idToken": "' + idToken + '" }',
          error: (jqxhr) => { redirector(jqxhr.status) },
          success: (data) => { launchImage(imageid, data) }
        });
      }
      //...
      $('#page-content').append(element);
      if (typ != 'gal' && typ != 'img') $('#page-content > *:last-child').slideDown();
    }
    launchComments(content.comments,'blog',blogid,'#comments','blog',blogid,true,true,false,false)
    $('#comments').slideDown();
  }

  function launchGallery(galleryid, data) {
    var datastorage = {};
    for (var i = 0; i < data.length; i++) {
      $('#' + galleryid + ' .gallery-row:nth-child(' + (i + 1) + ') .gallery-image')
        .attr('id',data[i].id);
      if (data[i].typ == 'pic') {
        $('#' + galleryid + ' .gallery-row:nth-child(' + (i + 1) + ') .gallery-image')
          .css('background-image', 'url(' + data[i].location + ')');
      } else if (data[i].typ == 'vid') {
        $('#' + galleryid + ' .gallery-row:nth-child(' + (i + 1) + ') .gallery-image')
          .css('background-image', 'url(/media/vidplaceholder.svg)');
      } else if (data[i].typ == 'ytvid') {
        $('#' + galleryid + ' .gallery-row:nth-child(' + (i + 1) + ') .gallery-image')
          .css({
            backgroundImage: 'url(/media/ytplaceholder.svg',
            backgroundSize: 'contain',
            backgroundColor: '#cd201f'
          });
      }
      $('#' + data[i].id).click(openModal(i,galleryid));
      datastorage[data[i].id] = {
        typ: data[i].typ,
        location: data[i].location,
        comments: data[i].comments
      }
    }
    mediaDataStorage[galleryid] = datastorage;
    $('#' + galleryid).slideDown();
  }

  function launchImage(id,data) {
    mediaDataStorage[id] = {};
    mediaDataStorage[id][data.id] = {
      typ: data.typ,
      location: data.location,
      comments: data.comments
    }
    $('#' + id + ' .img-container-blurbox').css('background-image', 'url(' + data.location + ')');
    $('#' + id + ' .img-container-image')
      .css('background-image','url(' + data.location + ')')
      .attr('id',data.id)
      .click(openModal(0, id, $('#' + id + ' .img-container-image')));
    $('#' + id + ' p').html(data.description);
    $('#' + id).slideDown();
  }


  // // // // // // // // // // // //
  // Setting up the modal window   //
  // // // // // // // // // // // //

  var mediaDataStorage = {};

  $('.media-modal').hide(0, () => {
    $('.media-modal').css('opacity', '1');
  });

  function openModal(index,galleryid,galleryImage) {
    return function () {
      var datastorage = mediaDataStorage[galleryid];
      $('.media-modal').fadeIn(400);
      $('html').css('height', '100%');
      $('html').css('overflow', 'hidden');
      $('body').css('overflow', 'scroll');
      if (galleryImage == undefined) galleryImage = $('#' + galleryid + ' .gallery-row:nth-child(' + (index + 1) + ') .gallery-image');
      var imageData = datastorage[galleryImage.attr('id')];
      $('.slider-image > *:not(.slider-image-comments)').remove();
      $('.slider-image').css('background-image', 'none');
      if (imageData.typ == 'pic') {
        $('.slider-image').css('background-image', 'url(' + imageData.location + ')');
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
        $('.media-modal').fadeOut(400, () => {
          $('html').css('height', 'auto');
          $('html').css('overflow-x', 'auto');
          $('html').css('overflow-y', 'scroll');
          $('body').css('overflow', 'auto');
          $('.slider-image :not(.slider-image-comments)').remove();
        });
      });

      $('span.fa-expand').off();
      $('span.fa-expand').click(() => {
        if (imageData.typ != 'ytvid') {
          window.open(imageData.location, '_blank');
        } else {
          window.open('https://youtu.be/' + imageData.location, '_blank');
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
          $('.slider-image-comments').html('<div></div>');
          launchComments(imageData.comments,'media',galleryImage.attr('id'),'.slider-image-comments>div','media',galleryImage.attr('id'),true,false,false,false)
          $('.slider-image-comments').fadeIn(400);
          $('span.fa-comments-o').addClass('active');
          $('span.fa-chevron-left').addClass('disabled');
          $('span.fa-chevron-right').addClass('disabled');
          for (var i = 0; i < imageData.comments.length; i++) {
            var id = imageData.comments[i].id;
            $('.slider-image-comments .comment-insert a').click(() => {
              var content = $('.slider-image-comments textarea').val()
                .replace(/"/, '&quot;')
                .replace(/'/, '&#039;')
                .replace(/\\/g, '\\\\');
              firebase.auth().currentUser.getIdToken(true)
                .then(idToken => {
                  $.ajax({
                    type: 'POST',
                    url: '/addComment',
                    contentType: 'application/json',
                    data: '{ "content": "' + content + '", "typ": "media", "target": "' + galleryImage.attr('id') + '", "idToken": "' + idToken + '" }',
                    error: (jqxhr) => { redirector(jqxhr.status) }
                  });
                });
            });
            $('#' + id + ' .comment-controll > .comment-controll-report').click(((id, content) => () => {
              firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                  $.ajax({
                    type: 'POST',
                    url: '/reportComment',
                    contentType: 'application/json',
                    data: '{ "id": "' + id + '", "url": "' + window.location.href + '", "content": "' + content + '", "typ": "Comment", "idToken": "' + idToken + '" }',
                    error: (jqxhr) => { redirector(jqxhr.status) }
                  });
                });
            })(id, imageData.comments[i].content));
            $('#' + id + ' .comment-controll > .comment-controll-delete').click(((id) => () => {
              firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                  $.ajax({
                    type: 'POST',
                    url: '/deleteComment',
                    contentType: 'application/json',
                    data: '{ "id": "' + id + '", "typ": "media", "source": "' + galleryImage.attr('id') + '", "idToken": "' + idToken + '" }',
                    error: (jqxhr) => { redirector(jqxhr.status) }
                  });
                });
            })(id));
          }
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
      $('span.fa-chevron-left').click(function () {
        if (!$(this).hasClass('disabled')) openModal(index - 1,galleryid)();
      });

      $('span.fa-chevron-right').off();
      $('span.fa-chevron-right').click(function () {
        if (!$(this).hasClass('disabled')) openModal(index + 1,galleryid)();
      });
    }
  }

  //Reference: https://stackoverflow.com/a/25621277
  $('textarea').each(function () {
    this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
  }).on('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
}
