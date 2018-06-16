function insertMediaTeaser(medialist, i) {
    var html = '';
    html += '<div class="media-teaser" id="mediaTeaser_' + i + '">';
    html += '<h3>' + dictionary.newmedia[language] + '</h3>';
    html += '<div class="media-header"></div>';
    html += '<div class="media-choice">';
    html += '<div class="media-choice-wrapper">';
    for (var j = 0; j < medialist.length; j++) {
        if (medialist[j].typ == 'pic') html += '<div class="media-choice-image" style="background-image:url(\'' + medialist[j].location + '\')"></div>';
        if (medialist[j].typ == 'vid') html += '<div class="media-choice-image" style="background-image:url(\'/media/vidplaceholder.svg\')"></div>';
        if (medialist[j].typ == 'ytvid') html += '<div class="media-choice-image" style="background-image:url(\'/media/ytplaceholder.svg\')"></div>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div class="media-controll">';
    html += '<span class="fa fa-comments-o"></span>';
    html += '</div>';
    html += '<div class="media-comments"></div>';
    html += '</div>';
    $('#page-content').append(html);
    $('#mediaTeaser_' + i + ' .media-controll').click(((index) => () => {
        $('#mediaTeaser_' + index + ' .media-comments').slideToggle();
    })(i));
    for (var j = 0; j < medialist.length; j++) {
        $('#mediaTeaser_' + i + ' .media-choice-image:nth-child(' + (j + 1) + ')').click((function (target, index) {
            return function () {
                if (!$(this).hasClass('active')) {
                    $('#mediaTeaser_' + target + ' .media-choice-image').removeClass('active');
                    $(this).addClass('active');
                    $('#mediaTeaser_' + target + ' .media-header').off();
                    $('#mediaTeaser_' + target + ' .media-comments *').off();
                    $('#mediaTeaser_' + target + ' .media-comments').slideUp(400, () => {
                        $('#mediaTeaser_' + target + ' .media-comments').html('');
                        launchComments(medialist[index].comments, 'media', medialist[index].id, '#mediaTeaser_' + target + ' .media-comments', 'media', medialist[index].id, true, false, false, false)
                    });
                    var html = '';
                    if (medialist[index].typ == 'pic') {
                        html += '<div class="media-header-blurbox"  style="background-image:url(\'' + medialist[index].location + '\')"></div>';
                        html += '<div class="media-header-content">';
                        html += '<div class="media-header-image" style="background-image:url(\'' + medialist[index].location + '\')"></div>';
                        html += '</div>';
                    } else if (medialist[index].typ == 'vid') {
                        html += '<div class="video-fitter">';
                        html += '<div class="video-base">';
                        html += '<video class="video-frame" src="' + medialist[index].location + '" preload="none" controls poster="/media/vidplaceholder.svg"></video>';
                        html += '</div>';
                        html += '</div>';
                    } else if (medialist[index].typ == 'ytvid') {
                        html += '<div class="video-fitter">';
                        html += '<div class="video-base">';
                        html += '<iframe src="https://www.youtube.com/embed/' + medialist[index].location + '" allowfullscreen></iframe>';
                        html += '</div>';
                        html += '</div>';
                    }
                    if (medialist[index].description != '') html += '<div class="media-header-description">' + medialist[index].description + '</div>';
                    $('#mediaTeaser_' + target + ' .media-header').html(html);
                    adjustMediaDescription();
                    if (medialist[index].typ == 'pic') $('#mediaTeaser_' + target + ' .media-header').click(((location) => () => {
                        window.open(location, '_blank');
                    })(medialist[index].location));
                }
            }
        })(i, j));
    }
    $('#mediaTeaser_' + i + ' .media-choice-image:nth-child(1)').click();
    if (medialist.length == 1) {
        $('#mediaTeaser_' + i + ' .media-choice').hide(0);
    }
}

function insertStatusUpdate(status) {
    var html = '';
    html += '<div class="status-wrapper" id="' + status.id + '">';
    html += '<div class="status-box">';
    html += '<div class="status-info">';
    html += '<div class="status-avatar">';
    html += '<span class="fa fa-user-circle"></span>';
    html += '</div>';
    html += '<div class="status-author">' + status.author.name + '</div>';
    html += '<div class="badge" style="background-color:' + globalranks[status.author.rank].c + '">' + globalranks[status.author.rank][language] + '</div>';
    html += '</div>';
    html += '<div class="status-content">';
    html += '<h3>Statusmeldung</h3>';
    html += '<i>' + renderTime(new Date(status.upload)) + '</i>';
    html += '<p>' + status.content.split('§§§').join('</p><p>') + '</p>';
    html += '</div>';
    html += '</div>';
    html += '<div class="media-controll">';
    html += '<span class="fa fa-comments-o"></span>';
    html += '</div>';
    html += '<div class="media-comments"></div>';
    html += '</div>';
    $('#page-content').append(html);
    launchComments(status.comments,'status',status.id,'#' + status.id + ' .media-comments','status',status.id,true,false,false,false);
    $('#' + status.id + ' .media-controll').click(() => {
        $('#' + status.id + ' .media-comments').slideToggle();
    });
}

function insertBlogEntry(blogentry, addHeader) {
    var html = '';
    html += '<div class="post" id="blogpost_' + blogentry.id + '">';
    if (addHeader) html += '<h3>' + dictionary.newarticle[language] + '</h3>';
    if (language == 'de') html += '<a href="/de-de/blog/' + blogentry.id + '/index.html">';
    if (language == 'en') html += '<a href="/en-us/blog/' + blogentry.id + '/index.html">';
    html += '<div class="article">';
    html += '<div class="article-teaser" style="background-image: url(\'' + blogentry.thumbnail + '\');"></div>';
    html += '<div class="article-content">';
    html += '<h4>' + blogentry.title + '</h4>';
    html += '<p>' + blogentry.intro + '</p>';
    html += '</div>';
    html += '</div>';
    html += '</a>';
    html += '</div>';
    $('#page-content').append(html);
    if (window.innerWidth <= 767) $('#blogpost_' + blogentry.id + ' .article')
        .css('background-image', $('#blogpost_' + blogentry.id + ' .article-teaser').css('background-image'));
}

function createDivider(ActivityDate) {
    var ActivityWeekday = dictionary.weekday[language][ActivityDate.getDay()];
    var ActivityDay = ActivityDate.getDate();
    var ActivityMonth = dictionary.month[language][ActivityDate.getMonth()];
    var ActivityYear = ActivityDate.getFullYear();
    if (ActivityDay.length == 1) ActivityDay = '0' + ActivityDay;
    if (ActivityMonth.length == 1) ActivityMonth = '0' + ActivityMonth;
    if (language == 'de') {
        var datestring = ActivityWeekday + ', ' + ActivityDay + '. ' + ActivityMonth + ' ' + ActivityYear;
    } else {
        var datestring = ActivityWeekday + ', ' + ActivityMonth + ' ' + ActivityDay + ', ' + ActivityYear;
    }
    html = '';
    html += '<div class="divider">';
    html += '<div class="baseline"></div>';
    html += '<div class="date"><div>' + datestring + '</div></div>';
    html += '</div>';
    return html;
}

function adjustBlogTeaser() {
    var postlist = document.getElementsByClassName('article');
    var linklist = document.getElementsByClassName('article-teaser');
    if (window.innerWidth > 767 && !aboveBorder) {
        aboveBorder = true;
        for (var i = 0; i < postlist.length; i++) {
            postlist[i].style.backgroundImage = 'none';
        }
    } else if (window.innerWidth <= 767 && aboveBorder) {
        aboveBorder = false;
        for (var i = 0; i < postlist.length; i++) {
            postlist[i].style.backgroundImage = linklist[i].style.backgroundImage;
        }
    }
}

function adjustMediaDescription() {
    if (window.innerWidth > 767) {
        $('.media-header').off().hover(function () {
            $(this).find('.media-header-description').fadeIn(300);
        }, function () {
            $(this).find('.media-header-description').fadeOut(300);
        });
    } else {
        $('.media-header').off('mouseon mouseout');
        $('.media-header-description').show();
    };
}

var aboveBorder = false;
if (window.innerWidth > 767) aboveBorder = true;
$(window).resize(() => {
    adjustBlogTeaser();
    adjustMediaDescription();
});