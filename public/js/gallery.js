function launchGallery(galleryQuery, data) {
    var gallery = document.querySelector(galleryQuery);
    gallery.innerHTML = '';
    var datastorage = {};
    var media;
    for (var i = 0; i < data.length; i++) {
        media = data[i];
        datastorage[media.id] = {
            typ: media.typ,
            location: media.location,
            comments: media.comments,
            description: media.description
        };
        var content = '';
        content += '<div class="gallery-row">';
        content += '<div class="gallery-column">';
        content += '<div class="gallery-image">';
        content += '</div>';
        content += '</div>';
        content += '</div>';
        gallery.innerHTML += content;
        var image = document.querySelector(galleryQuery + ' .gallery-row:last-child .gallery-image');
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
        content += '<span class="no-image-placeholder">' + dictionary.nothingthere[language] + '</span>';
        gallery.innerHTML += content;
    }
    var mediaList = document.querySelectorAll(galleryQuery + ' .gallery-image');
    var idlist = [];
    for (var i = 0; i < mediaList.length; i++) {
        idlist.push(mediaList[i].id);
    }
    for (var i = 0; i < mediaList.length; i++) {
        mediaList[i].addEventListener('click', openModal(i, idlist, datastorage));
    }
} 