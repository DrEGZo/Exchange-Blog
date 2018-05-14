const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true})

function launchComments(commentData,containerTyp,containerId,containerQuery,mainTyp,mainId,addInserter,searchForReplies,isReplyData,slide) {
    content = stringifyComments(commentData,addInserter,searchForReplies,isReplyData,slide);
    if (addInserter) content += stringifyCommentInserter(isReplyData);
    if (addInserter) {
        $(containerQuery).append(content);
    } else if (!isReplyData) {
        $(containerQuery + ' .comment-insert').before(content);
    } else {
        $(containerQuery + ' .comment-reply-insert').before(content);
    }
    addCommentListeners(commentData,containerTyp,containerId,containerQuery,mainTyp,mainId,addInserter,searchForReplies,isReplyData);
    if (addInserter) {
        addRealtimeCommentListeners(containerTyp, containerId, containerQuery, mainTyp, mainId, searchForReplies, isReplyData);
    }
    if (searchForReplies) {
        for (var i = 0; i < commentData.length; i++) {
            addRealtimeCommentListeners('comment', commentData[i].id, '#' + commentData[i].id + ' .comment-replies', mainTyp, mainId, false, true);
        }
    }
    if (slide) {
        for (var i = 0; i < commentData.length; i++) {
            $('#' + commentData[i].id).slideDown(400, function(){ $(this).removeClass('hidden') });
        }
    }
}

function stringifyComments(commentData, addReplyHeader, searchforReplies, isReplyData, hidden) {
    var content = '';
    var replymark = '';
    if (isReplyData) replymark += '-reply';
    if (commentData.length > 0 && isReplyData && addReplyHeader) content += '<h6>Antworten:</h6>';
    for (var i = 0; i < commentData.length; i++) {
        var commentAuthor = commentData[i].author.name;
        var commentRank = commentData[i].author.rank;
        var commentText = commentData[i].content;
        var commentTime = renderTime(commentData[i].time);
        if (!hidden) content += '<div class="comment' + replymark + '" id="' + commentData[i].id + '">';
        if (hidden) content += '<div class="comment' + replymark + ' hidden" id="' + commentData[i].id + '">';
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
            content += stringifyComments(commentData[i].replies, false, false, true, false) + stringifyCommentInserter(true);
            content += '</div>';
        }
        if (!isReplyData) content += '</div>';
        content += '</div>';
    }
    return content;
}

function stringifyCommentInserter(isReplyData) {
    var content = '';
    if (!isReplyData) {
        content += '<div class="comment-insert">';
        content += '<textarea placeholder="Schreibe einen Kommentar..."></textarea>';
        content += '<a>Veröffentlichen</a>';
    } else {
        content += '<div class="comment-reply-insert">';
        content += '<textarea placeholder="Auf Kommentar antworten..."></textarea>';
        content += '<a>Antworten</a>';
    }
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

function addCommentListeners(commentData,containerTyp,containerId,containerQuery,mainTyp,mainId,includeSubmit,searchForReplies,isReplyData) {
    var replymark = '';
    if (isReplyData) replymark = '-reply';
    if (includeSubmit) {
        $(containerQuery + ' .comment' + replymark + '-insert a').click(((textQuery) => () => {
            if ($(textQuery).attr('disabled') != 'disabled') {
                $(textQuery).attr('disabled', 'disabled');
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
                            data: '{ "idToken": "' + idToken + '", "content": "' + content + '", "containerTyp": "' + containerTyp + '", "containerId": "' + containerId + '", "mainTyp": "' + mainTyp + '", "mainId": "' + mainId + '" }',
                            //error: (jqxhr) => { redirector(jqxhr.status) }
                        });
                    });
            }
        })(containerQuery + ' .comment' + replymark + '-insert textarea'));
    }
    for (var i = 0; i < commentData.length; i++) {
        if (searchForReplies) $('#' + commentData[i].id + ' .comment' + replymark + '-controll-reply').click(((id) => () => {
            $('#' + id + ' .comment-reply-insert').slideToggle();
        })(commentData[i].id));
        $('#' + commentData[i].id + ' .comment' + replymark + '-controll>.comment-controll-report').click(((id) => () => {
            firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                    $.ajax({
                        type: 'POST',
                        url: '/reportComment',
                        contentType: 'application/json',
                        data: '{ "idToken": "' + idToken + '", "commentId": "' + id + '", "containerTyp": "' + containerTyp + '", "containerId": "' + containerId + '", "mainTyp": "' + mainTyp + '", "mainId": "' + mainId + '", "link": "' + window.location.href + '" }',
                        error: (jqxhr) => { redirector(jqxhr.status) }
                    });
                    alert('Report sent.');
                });
            $('#' + id + ' .comment' + replymark + '-controll>.comment-controll-report').off();
        })(commentData[i].id));
        $('#' + commentData[i].id + ' .comment' + replymark + '-controll>.comment-controll-delete').click(((id) => () => {
            $('#' + id + ' .comment' + replymark + '-controll a').off();
            firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                    $.ajax({
                        type: 'POST',
                        url: '/deleteComment',
                        contentType: 'application/json',
                        data: '{ "id": "' + id + '", "typ": "' + containerTyp + '", "source": "' + containerId + '", "idToken": "' + idToken + '" }',
                        error: (jqxhr) => { redirector(jqxhr.status) }
                    });
                });
        })(commentData[i].id));
        if (searchForReplies) addCommentListeners(commentData[i].replies, 'comment', commentData[i].id, '#' + commentData[i].id, mainTyp, mainId, true, false, true);
    }
}

function addRealtimeCommentListeners(containerTyp, containerId, containerQuery, mainTyp, mainId, searchForReplies, isReplyData) {
    var reference;
    if (containerTyp == 'blog') {
        reference = 'Blogentries';
    } else if (containerTyp == 'media') {
        reference = 'Media';
    } else if (containerTyp == 'status') {
        reference = 'StatusUpdates';
    } else if (containerTyp == 'comment') {
        reference = 'Comments';
    }
    db.collection(reference).doc(containerId).onSnapshot((doc) => {
        var globalcomments;
        if (containerTyp != 'comment') {
            globalcomments = doc.data().Comments;
        } else {
            globalcomments = doc.data().replies;
        }
        for (var i = 0; i < globalcomments.length; i++) {
            if (document.getElementById(globalcomments[i]) == null) {
                firebase.auth().currentUser.getIdToken(true)
                    .then(((id) => (idToken) => {
                        $.ajax({
                            type: 'POST',
                            url: '/getCommentData',
                            contentType: 'application/json',
                            data: '{ "idToken": "' + idToken + '", "commentId": "' + id + '", "containerTyp": "' + containerTyp + '", "mainTyp": "' + mainTyp + '", "mainId": "' + mainId + '" }',
                            error: (jqxhr) => { redirector(jqxhr.status) },
                            success: (data) => {
                                launchComments([data],containerTyp,containerId,containerQuery,mainTyp,mainId,false,searchForReplies,isReplyData,true);
                                if ($(containerQuery + '>div>textarea').attr('disabled') == 'disabled') {
                                    $(containerQuery + '>div>textarea').val('').removeAttr('disabled');
                                }
                            }
                        });
                    })(globalcomments[i]));
            }
        }
        var localcomments = document.querySelector(containerQuery).childNodes;
        for (var i = 0; i < localcomments.length; i++) {
            if (localcomments[i].id != '' && globalcomments.indexOf(localcomments[i].id) == -1) {
                $('#' + localcomments[i].id).slideUp(400,function(){ $(this).remove() });
            }
        }
    });
}