function stringifyComments(commentData, searchforReplies, isReplyData) {
    var content = '';
    var replymark = '';
    if (isReplyData) replymark += '-reply';
    if (commentData.length > 0 && isReplyData) content += '<h6>Antworten:</h6>';
    for (var i = 0; i < commentData.length; i++) {
        var commentAuthor = commentData[i].author.name;
        var commentRank = commentData[i].author.rank;
        var commentText = commentData[i].content;
        var commentTime = renderTime(commentData[i].time);
        content += '<div class="comment' + replymark + '"';
        if (!isReplyData) content += ' id="' + commentData[i].id + '"';
        content += '>';
        if (!isReplyData) content += '<div class="comment-content">';
        content += '<div class="comment' + replymark + '-info clearfix">';
        content += '<div class="comment' + replymark + '-avatar">';
        content += '<span class="fa fa-user-circle">';
        content += '</span></div>';
        content += '<div class="comment' + replymark + '-author">';
        content += commentAuthor + '&nbsp';
        content += '<span class="badge">';
        content += commentRank
        content += '</span></div>';
        content += '<div class="comment' + replymark + '-time">';
        content += commentTime;
        content += '</div></div>';
        content += '<div class="comment' + replymark + '-text">';
        content += commentText;
        content += '</div>';
        content += '<div class="comment' + replymark + '-controll">';
        if (searchforReplies) content += '<a class="comment-controll-reply">Antworten</a>';
        content += '<a class="comment-controll-report">Melden</a>';
        content += '<a class="comment-controll-delete">Löschen</a>';
        content += '</div>';
        if (searchforReplies) {
            content += '<div class="comment-replies">';
            content += stringifyComments(commentData[i].replies, false, true);
            content += '</div>';
        }
        if (!isReplyData) content += '</div>';
        content += '</div>';
    }

    content += '<div class="comment' + replymark + '-insert">';
    if (!isReplyData) content += '<textarea placeholder="Schreibe einen Kommentar..."></textarea>';
    if (isReplyData) content += '<textarea placeholder="Auf Kommentar antworten..."></textarea>';
    if (!isReplyData) content += '<a>Veröffentlichen</a>';
    if (isReplyData) content += '<a>Antworten</a>';
    content += '</div>';
    return content;
}

function renderTime(timestring) {
    var commentDate = new Date(timestring);
    var commentTimeDiff = new Date().getTime() - commentDate.getTime();
    var commentTime = '';
    if (commentTimeDiff < 60 * 1000) {
        commentTime = 'vor wenigen Sekunden';
    } else if (commentTimeDiff < 60 * 60 * 1000) {
        commentTime = 'vor ' + Math.floor(commentTimeDiff / (60 * 1000)) + ' Minute';
        if (Math.floor(commentTimeDiff / (60 * 1000)) > 1) commentTime += 'n';
    } else if (commentTimeDiff < 6 * 60 * 60 * 1000) {
        commentTime = 'vor ' + Math.floor(commentTimeDiff / (60 * 60 * 1000)) + ' Stunde';
        if (Math.floor(commentTimeDiff / (60 * 60 * 1000)) > 1) commentTime += 'n';
    } else {
        if (new Date().getDay() == commentDate.getDay() && new Date().getTime() - commentDate.getTime() < 24 * 60 * 60 * 1000) {
            commentTime += 'heute um ';
        } else if (new Date(new Date().getTime() - 24 * 60 * 60 * 1000).getDay() == commentDate.getDay() && new Date().getTime() - commentDate.getTime() < 48 * 60 * 60 * 1000) {
            commentTime += 'gestern um ';
        } else if (new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).getTime() < commentDate.getTime() && new Date().getDay() != commentDate.getDay()) {
            commentTime += 'letzten ' + new Array('Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag')[commentDate.getDay()] + ' um ';
        } else {
            var commentDayOfMonth = commentDate.getDate();
            var commentMonth = commentDate.getMonth() + 1;
            if (commentDayOfMonth < 10) commentDayOfMonth = '0' + commentDayOfMonth;
            if (commentMonth < 10) commentMonth = '0' + commentMonth;
            commentTime += commentDayOfMonth + '.' + commentMonth + '.' + commentDate.getFullYear() + ' ';
        }
        var commentHour = commentDate.getHours();
        var commentMinute = commentDate.getMinutes();
        if (commentHour < 10) commentHour = '0' + commentHour;
        if (commentMinute < 10) commentMinute = '0' + commentMinute;
        commentTime += commentHour + ':' + commentMinute + ' Uhr';
    }
    return commentTime;
}

function addCommentListeners(comments, containerId, containerQuery,containerTyp,mindReplies,isReplyData) {
    var replymark = '';
    if (isReplyData) replymark = '-reply';
    $(containerQuery + ' .comment' + replymark + '-insert a').click(((textQuery) => () => {
        var content = $(textQuery).val()
            .replace(/"/, '&quot;')
            .replace(/'/, '&#039;')
            .replace(/\\/g, '\\\\');
        firebase.auth().currentUser.getIdToken(true)
            .then(idToken => {
                $.ajax({
                    type: 'POST',
                    url: '/addComment',
                    contentType: 'application/json',
                    data: '{ "content": "' + content + '", "typ": "' + containerTyp + '", "target": "' + containerId + '", "idToken": "' + idToken + '" }',
                    error: (jqxhr) => { redirector(jqxhr.status) }
                });
            });
    })(containerQuery + ' .comment' + replymark + '-insert textarea'));
    for (var i = 0; i < comments.length; i++) {
        if (mindReplies) $('#' + comments[i].id + ' .comment' + replymark + '-controll-reply').click(((id) => () => {
            $('#' + id + ' .comment-reply-insert').slideToggle();
        })(comments[i].id));
        $('#' + comments[i].id + ' .comment' + replymark + '-controll-report').click(((id,content) => () => {
            firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                    $.ajax({
                        type: 'POST',
                        url: '/reportComment',
                        contentType: 'application/json',
                        data: '{ "id": "' + id + '", "url": "' + window.location.href + '", "content": "' + content + '", "idToken": "' + idToken + '" }',
                        error: (jqxhr) => { redirector(jqxhr.status) }
                    });
                });
        })(comments[i].id,comments[i].content));
        $('#' + comments[i].id + ' .comment' + replymark + '-controll-delete').click(((id,typ,source) => () => {
            firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                    $.ajax({
                        type: 'POST',
                        url: '/deleteComment',
                        contentType: 'application/json',
                        data: '{ "id": "' + id + '", "typ": "' + typ + '", "source": "' + source + '", "idToken": "' + idToken + '" }',
                        error: (jqxhr) => { redirector(jqxhr.status) }
                    });
                });
        })(comments[i].id,containerTyp,containerId));
        if (mindReplies) addCommentListeners(comments[i].replies, comments[i].id, '#' + comments[i].id, 'comment', false, true);
    }
}