$(function () {
  authenticater(true).then(() => { initMenu(getBlogData) });
});

function getBlogData() {
  var selectedyear = 2018;
  var selectedmonth;

  if ($('#menu-button-2019').hasClass('active')) selectedyear = 2019;

  for (var i = 0; i < 12; i++) {
    if ($('#month-choice-' + selectedyear + ' > .menu-button-' + i).hasClass('active')) selectedmonth = i;
  }

  $('#loading').show(0);

  firebase.auth().currentUser.getIdToken(true).then(idToken => {
    return fetch('/getBlogList', {
      idToken: idToken,
      lang: language,
      year: selectedyear,
      month: selectedmonth,
      offset: new Date().getTimezoneOffset()
    });
  }).then((data) => {
    buildBlogList(data);
    $('#loading').hide(0);
    $('#page-content').slideDown(400);
    $('#footer').slideDown();
  });
}

function buildBlogList(bloglist) {
  $('#page-content').html('');
  var date = { toDateString: () => '' };
  for (var i = 0; i < bloglist.length; i++) {
    if (date.toDateString() != new Date(bloglist[i].upload).toDateString()) {
      date = new Date(bloglist[i].upload);
      $('#page-content').append(createDivider(date));
    }
    insertBlogEntry(bloglist[i], false);
  }
  if (bloglist.length == 0) {
    var html = '';
    html += '<div class="placeholder-wrapper" style="display: flex;justify - content: center;">';
    html += '<span class="fa fa-search no-image-placeholder"></span>';
    html += '<span class="no-image-placeholder">' + dictionary.nothingthere[language] + '</span>';
    html += '</div>'; 
    $('#page-content').html(html);
  }
}