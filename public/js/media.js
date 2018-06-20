$(function () {
  authenticater(true).then(() => { initMenu(initGallery) });
});

function initGallery() {
  var selectedyear = 2018;
  var selectedmonth;

  if ($('#menu-button-2019').hasClass('active')) selectedyear = 2019;

  for (var i = 0; i < 12; i++) {
    if ($('#month-choice-' + selectedyear + ' > .menu-button-' + i).hasClass('active')) selectedmonth = i;
  }

  $('#loading').show(0);

  firebase.auth().currentUser.getIdToken(true).then((idToken) => {
    return fetch('/getMediaList', {
      idToken: idToken,
      lang: language,
      year: selectedyear,
      month: selectedmonth
    });
  }).then((data) => {
    launchGallery('.image-gallery',data);
    $('#loading').hide(0);
    $('#page-content').slideDown(400);
    $('#footer').slideDown();
  });
}