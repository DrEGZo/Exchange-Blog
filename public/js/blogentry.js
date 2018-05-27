$(function () {
  authenticater().then(main);
});

var blogid = window.location.href.split('/')[5];

function main() {
  firebase.auth().currentUser.getIdToken(true)
    .then((idToken) => {
      fetch('/getBlogData', {
        idToken: idToken,
        blogid: blogid
      }).then((data) => { buildBlogPage(data, idToken) });
    });
}

function buildBlogPage(content, idToken) {
  $('#header-teaser div').css('background-image', 'url("' + content.thumbnail + '")');
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
      element += '<div class="image-gallery" id="' + galleryid + '"></div>';
      $('#page-content').append(element);
      fetch('/getGalleryData', {
        idToken: idToken,
        list: mediaentities
      }).then((data) => {
        launchGallery('#' + galleryid, data);
        $('#' + galleryid).slideDown();
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
      $('#page-content').append(element);
      fetch('/getMediaData', {
        idToken: idToken,
        mid: rawcontent
      }).then((data) => { launchImage(imageid, data) });
    }
    if (typ != 'gal' && typ != 'img') {
      $('#page-content').append(element);
      $('#page-content > *:last-child').slideDown();
    }
  }
  launchComments(content.comments, 'blog', blogid, '#comments', 'blog', blogid, true, true, false, false)
  $('#comments').slideDown();
}

function launchImage(id, data) {
  var datastorage = {};
  datastorage[data.id] = data;
  $('#' + id + ' .img-container-blurbox').css('background-image', 'url(' + data.location + ')');
  $('#' + id + ' .img-container-image')
    .css('background-image', 'url(' + data.location + ')')
    .click(openModal(0, [data.id], datastorage));
  $('#' + id + ' p').html(data.description);
  $('#' + id).slideDown();
}