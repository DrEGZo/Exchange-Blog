$(function () {



  //Refference: https://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize/25621277#25621277
  $('textarea').each(function () {
    this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
  });

});

$(function () {
  $('textarea').on('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  });
});
