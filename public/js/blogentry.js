$(function () {
  authenticater(true).then(main);
});

var blogid = window.location.href.split('/')[5];

function main() {
  firebase.auth().currentUser.getIdToken(true).then((idToken) => {
    fetch('/getBlogData', {
      idToken: idToken,
      lang: language,
      blogid: blogid
    }).then((data) => { buildBlogPage(data, idToken) });
  });
}

function buildBlogPage(content, idToken) {
  $('title').html(content.title);
  $('#header-teaser div').css('background-image', 'url("' + content.thumbnail + '")');
  $('#page-title h1').html(content.title);
  $('#page-title p').html(content.intro);
  var elements = content.content.split('§§§');
  var midlist = [];
  var galleryreference = {};
  var html = '';
  for (var i = 0; i < elements.length; i++) {
    var typ = elements[i].split('$$$')[0];
    var rawcontent = elements[i].split('$$$')[1];
    if (typ == 'p') {
      html += '<p>' + rawcontent + '</p>';
    } else if (typ == 'h') {
      html += '<h4>' + rawcontent + '</h4>';
    } else if (typ == 'm') {
      html += '<div id="mc_' + midlist.length + '" class="media-placeholder"></div>';
      midlist.push(rawcontent);
    } else if (typ == 'g') {
      var galleryid = 'gallery_' + i;
      html += '<div id="' + galleryid + '"></div>';
      var mediaentities = JSON.parse(rawcontent);
      galleryreference[galleryid] = mediaentities;
      for (var j = 0; j < mediaentities.length; j++) {
        midlist.push(mediaentities[j]);
      }
    }
  }
  $('#page-content').html(html);
  fetch('/getGalleryData', {
    idToken: idToken,
    lang: language,
    list: midlist
  }).then((data) => {
    var mediadata = {};
    for (var i = 0; i < data.length; i++) {
      mediadata[data[i].id] = data[i];
    }
    var mediacontainers = document.getElementsByClassName('media-placeholder');
    for (var i = 0; i < mediacontainers.length; i++) {
      var id = midlist[parseInt(mediacontainers[i].id.split('_')[1])];
      if (mediadata[id] != undefined) {
        if (mediadata[id].typ == 'pic') {
          launchImage('#' + mediacontainers[i].id,mediadata[id]);
        } else if (mediadata[id].typ == 'vid') {
          launchVideo('#' + mediacontainers[i].id, mediadata[id], false);
        } else if (mediadata[id].typ == 'ytvid') {
          launchVideo('#' + mediacontainers[i].id, mediadata[id], true);
        }
      }
    }
    for (var galleryid in galleryreference) {
      var entities = [];
      for (var i = 0; i < galleryreference[galleryid].length; i++) {
        var id = galleryreference[galleryid][i];
        if (mediadata[id] != undefined) {
          entities.push(mediadata[id]);
        }
      }
      if (entities.length > 0) {
        $('#' + galleryid).html('<div class="image-gallery"></div>');
        launchGallery('#' + galleryid + '>.image-gallery', entities);
      }
    }
    adjustBlogMediaDescription();
    $('#loading').hide(0);
    $('#header-teaser').fadeIn();
    $('#page-title').slideDown();
    $('#page-content').slideDown();
    launchComments(content.comments, 'blog', blogid, '#comments', 'blog', blogid, true, true, false, false)
    $('#comments').slideDown();
    $('#footer').slideDown();
  });
}

function launchImage(id, data) {
  var html = '';
  html += '<div class="img-container">';
  html += '<div class="img-container-blurbox"></div>';
  html += '<div class="img-container-content">';
  html += '<div class="img-container-image"></div>';
  html += '</div>';
  html += '<div class="media-description">' + data.description + '</div>';
  html += '</div>';
  $(id).html(html);
  var datastorage = {};
  datastorage[data.id] = data;
  $(id + ' .img-container-blurbox').css('background-image', 'url(' + data.location + ')');
  $(id + ' .img-container-image')
    .css('background-image', 'url(' + data.location + ')')
    .click(openModal(0, [data.id], datastorage));
}

function launchVideo(query,data,isYT) {
  var html = '';
  html += '<div class="video-border">';
  html += '<div class="video-container">';
  if (isYT) html += '<iframe class="video-frame"src="https://www.youtube.com/embed/' + data.location + '" allowfullscreen></iframe>';
  else html += '<video class="video-frame" src="' + data.location + '" preload="none" controls poster="/media/vidplaceholder.svg"></video>';
  html += '<div class="media-description">' + data.description + '</div>';
  html += '</div></div>';
  html += '<div class="media-controll">';
  html += '<span class="fa fa-comments-o"></span>';
  html += '</div>';
  html += '<div class="media-comments"></div>';
  $(query).html(html);
  launchComments(data.comments, 'media', data.id, query + ' .media-comments', 'media', data.id, true, false, false, false);
  $(query + ' .media-controll').click(() => {
    $(query + ' .media-comments').slideToggle();
  });
}

$(window).resize(adjustBlogMediaDescription);

function adjustBlogMediaDescription() {
  if (window.innerWidth > 767) {
    $('.video-container, .img-container').off().hover(function () {
      $(this).find('.media-description').fadeIn(300);
    }, function () {
      $(this).find('.media-description').fadeOut(300);
    });
  } else {
    $('.video-container, .img-container').off();
    $('.media-description').show();
  };
}