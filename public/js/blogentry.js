$(function () {
  authenticater(true).then(main);
});

var blogid = window.location.href.split('/')[5];

function main() {
  firebase.auth().currentUser.getIdToken(true)
    .then((idToken) => {
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
  $('#header-teaser').fadeIn();
  $('#page-title h1').html(content.title);
  $('#page-title p').html(content.intro);
  $('#page-title').slideDown();
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
          launchVideo('#' + mediacontainers[i].id, mediadata[id].id, mediadata[id].location, false);
        } else if (mediadata[id].typ == 'ytvid') {
          launchVideo('#' + mediacontainers[i].id, mediadata[id].id, mediadata[id].location, true);
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
    $('#page-content').slideDown();
    launchComments(content.comments, 'blog', blogid, '#comments', 'blog', blogid, true, true, false, false)
    $('#comments').slideDown();
  });
}

function launchImage(id, data) {
  var html = '';
  html += '<div class="img-container">';
  html += '<div class="img-container-blurbox"></div>';
  html += '<div class="img-container-content">';
  html += '<div class="img-container-border">';
  html += '<div class="img-container-image"></div>';
  html += '</div>';
  html += '<p></p>';
  html += '</div></div>';
  $(id).html(html);
  var datastorage = {};
  datastorage[data.id] = data;
  $(id + ' .img-container-blurbox').css('background-image', 'url(' + data.location + ')');
  $(id + ' .img-container-image')
    .css('background-image', 'url(' + data.location + ')')
    .click(openModal(0, [data.id], datastorage));
  $(id + ' p').html(data.description);
}

function launchVideo(query,id,reference,isYT) {
  var html = '';
  html += '<div class="video-border">';
  html += '<div class="video-container">';
  if (isYT) html += '<iframe class="video-frame"src="https://www.youtube.com/embed/' + reference + '" allowfullscreen></iframe>';
  else html += '<video class="video-frame" src="' + reference + '" preload="none" controls poster="/media/vidplaceholder.svg"></video>';
  html += '</div></div>';
  html += '<div class="media-controll">';
  html += '<span class="fa fa-comments-o"></span>';
  html += '</div>';
  html += '<div class="media-comments"></div>';
  $(query).html(html);
  firebase.auth().currentUser.getIdToken(true).then((idToken) => {
    return fetch('/getMediaData', {
      idToken: idToken,
      lang: language,
      mid: id
    });
  }).then((data) => {
    launchComments(data.comments,'media',id,query + ' .media-comments','media',id,true,false,false,false);
    $(query + ' .media-controll').click(() => {
      $(query + ' .media-comments').slideToggle();
    });
  });
}

function launchYTVideo(query,reference) {
  var html = '';
  html += '<div class="video-border">';
  html += '<div class="video-container">';
  html += '<iframe class="video-frame"src="https://www.youtube.com/embed/' + reference + '" allowfullscreen></iframe>';
  html += '</div></div>';
  html += '<div class="media-controll">';
  html += '<span class="fa fa-comments-o"></span>';
  html += '</div>';
  html += '<div class="media-comments"></div>';
  $(query).html(html);
}