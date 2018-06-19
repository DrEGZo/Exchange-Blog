$(() => {
    $('.media-modal').css('opacity', '0').css('display', 'flex').hide().css('opacity', '1');
})

function openModal(index,idList,datastorage) {
    var id = idList[index];
    return function () {
        $('.media-modal').fadeIn();
        $('html').css('height', '100%');
        $('html').css('overflow', 'hidden');
        $('body').css('overflow', 'scroll');
        var imageData = datastorage[id];
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
        if (imageData.description != '') $('.slider-image').append('<div class="slider-image-description">' + imageData.description + '</div>');
        adjustImageDescription();

        $('.media-modal span.fa-close').off();
        $('.media-modal span.fa-close').click(() => {
            $('.slider-image-comments').fadeOut(400);
            $('.media-modal span.fa-comments-o').removeClass('active');
            $('.media-modal span.fa-chevron-left').removeClass('disabled');
            $('.media-modal span.fa-chevron-right').removeClass('disabled');
            $('.media-modal').fadeOut(400, () => {
                $('html').css('height', 'auto');
                $('html').css('overflow-x', 'auto');
                $('html').css('overflow-y', 'scroll');
                $('body').css('overflow', 'auto');
                //$('.slider-image :not(.slider-image-comments)').remove();
            });
        });

        $('.media-modal span.fa-expand').off();
        $('.media-modal span.fa-expand').click(() => {
            if (imageData.typ != 'ytvid') {
                window.open(imageData.location, '_blank');
            } else {
                window.open('https://youtu.be/' + imageData.location, '_blank');
            }
        });

        $('.media-modal span.fa-comments-o').off();
        $('.slider-image-comments').html('<div></div>');
        if (id in globalCommentData) {
            launchComments(globalCommentData[id], 'media', id, '.slider-image-comments>div', 'media', id, true, false, false, false);
        } else {
            launchComments(imageData.comments, 'media', id, '.slider-image-comments>div', 'media', id, true, false, false, false);
        }
        $('.media-modal span.fa-comments-o').click(() => {
            if ($('.slider-image-comments').css('display') == 'block') {
                $('.slider-image-comments').fadeOut(400);
                $('span.fa-comments-o').removeClass('active');
                if (index != 0) $('span.fa-chevron-left').removeClass('disabled');
                if (index < idList.length - 1) $('span.fa-chevron-right').removeClass('disabled');
            } else {
                $('.slider-image-comments').fadeIn(400);
                $('.media-modal span.fa-comments-o').addClass('active');
                $('.media-modal span.fa-chevron-left').addClass('disabled');
                $('.media-modal span.fa-chevron-right').addClass('disabled');
            }
        });

        if (index == 0) {
            $('.media-modal span.fa-chevron-left').addClass('disabled');
        } else {
            $('.media-modal span.fa-chevron-left').removeClass('disabled');
        }
        if (index + 1 == Object.keys(datastorage).length) {
            $('.media-modal span.fa-chevron-right').addClass('disabled');
        } else {
            $('.media-modal span.fa-chevron-right').removeClass('disabled');
        }

        
        $('.media-modal span.fa-chevron-left').off();
        $('.media-modal span.fa-chevron-left').click(function () {
            if (!$(this).hasClass('disabled')) {
                unsubscribeFunctions[id]();
                openModal(index - 1,idList,datastorage)();
            }
        });

        $('.media-modal span.fa-chevron-right').off();
        $('.media-modal span.fa-chevron-right').click(function () {
            if (!$(this).hasClass('disabled')) {
                unsubscribeFunctions[id]();
                openModal(index + 1,idList,datastorage)();
            }
        });
    }
}

$(window).resize(adjustImageDescription);

function adjustImageDescription() {
    if (window.innerWidth > 767) {
        $('.slider-image').off().hover(() => {
            $('.slider-image-description').fadeIn();
        }, () => {
            $('.slider-image-description').fadeOut();
        });
    } else {
        $('.slider-image').off();
        $('.slider-image-description').show();
    };
}