$(function () {
  authenticater().then(() => { initMenu(launchGallery) });
});

function launchGallery() {
  var selectedyear = 2018;
  var selectedmonth;

  if ($('#menu-button-2019').hasClass('active')) selectedyear = 2019;

  for (var i = 0; i < 12; i++) {
    if ($('#month-choice-' + selectedyear + ' > .menu-button-' + i).hasClass('active')) selectedmonth = i;
  }

  firebase.auth().currentUser.getIdToken(true)
    .then((idToken) => {
      return fetch('/getMediaList', {
        idToken: idToken,
        year: selectedyear,
        month: selectedmonth
      });
    })
    .then((data) => {
      var gallery = document.querySelector('.image-gallery');
      gallery.innerHTML = '';
      var datastorage = {};
      var media;
      for (var i = 0; i < data.length; i++) {
        media = data[i];
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
      }
      if (data.length == 0) {
        var content = '';
        content += '<span class="fa fa-search no-image-placeholder"></span>';
        content += '<span class="no-image-placeholder">Nothing there yet</span>';
        gallery.innerHTML += content;
      }
      $('#page-content').slideDown(400);
      var mediaList = document.getElementsByClassName('gallery-image');
      var idlist = [];
      for (var i = 0; i < mediaList.length; i++) {
        idlist.push(mediaList[i].id);
      }
      for (var i = 0; i < mediaList.length; i++) {
        mediaList[i].addEventListener('click', openModal(i, idlist, datastorage));
      }
    })
}
