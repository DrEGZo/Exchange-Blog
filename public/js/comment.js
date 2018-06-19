const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true})

var unsubscribeFunctions = {};
var globalCommentData = {};

function launchComments(commentData,containerTyp,containerId,containerQuery,mainTyp,mainId,addInserter,searchForReplies,isReplyData,slide) {
    if (addInserter) globalCommentData[containerId] = commentData;
    var content = stringifyComments(commentData,addInserter,searchForReplies,isReplyData,slide);
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

    //Reference: https://stackoverflow.com/a/25621277
    $('textarea').each(function () {
        this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
    }).on('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

function stringifyComments(commentData, addReplyHeader, searchforReplies, isReplyData, hidden) {
    var content = '';
    var replymark = '';
    if (isReplyData) replymark += '-reply';
    if (commentData.length > 0 && isReplyData && addReplyHeader) content += '<h6>' + dictionary.replies[language] + ':</h6>';
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
        content += '<span class="badge" style="background-color:' + globalranks[commentRank].c + '">';
        content += globalranks[commentRank][language];
        content += '</span></div>';
        content += '<div class="comment' + replymark + '-time">';
        content += commentTime;
        content += '</div></div>';
        content += '<div class="comment' + replymark + '-text">';
        content += commentText;
        content += '</div>';
        content += '<div class="comment' + replymark + '-controll">';
        if (searchforReplies) content += '<button class="comment-controll-reply">' + dictionary.replies[language] + '</button>';
        content += '<button class="comment-controll-report">' + dictionary.report[language] + '</button>';
        if (commentData[i].author.id == firebase.auth().currentUser.uid) content += '<button class="comment-controll-delete">' + dictionary.delete[language] + '</button>';
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
        content += '<textarea placeholder="' + dictionary.writecomment[language] + '"></textarea>';
        content += '<button>' + dictionary.publish[language] + '</button>';
    } else {
        content += '<div class="comment-reply-insert">';
        content += '<textarea placeholder="' + dictionary.answertocomment[language] + '"></textarea>';
        content += '<button>' + dictionary.reply[language] + '</button>';
    }
    content += '</div>';
    return content;
}

function renderTime(timestring) {
    var commentDate = new Date(timestring);
    var commentTimeDiff = new Date().getTime() - commentDate.getTime();
    var commentTime = '';
    if (language == 'de') {
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
                commentTime += 'letzten ' + dictionary.weekday.de[commentDate.getDay()] + ' um ';
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
    } else {
        if (commentTimeDiff < 60 * 1000) {
            commentTime = 'a few seconds ago';
        } else if (commentTimeDiff < 60 * 60 * 1000) {
            commentTime = Math.floor(commentTimeDiff / (60 * 1000)) + ' minute';
            if (Math.floor(commentTimeDiff / (60 * 1000)) > 1) commentTime += 's';
            commentTime += ' ago';
        } else if (commentTimeDiff < 6 * 60 * 60 * 1000) {
            commentTime = Math.floor(commentTimeDiff / (60 * 60 * 1000)) + ' hour';
            if (Math.floor(commentTimeDiff / (60 * 60 * 1000)) > 1) commentTime += 's';
            commentTime += ' ago';
        } else {
            if (new Date().getDay() == commentDate.getDay() && new Date().getTime() - commentDate.getTime() < 24 * 60 * 60 * 1000) {
                commentTime += 'today at ';
            } else if (new Date(new Date().getTime() - 24 * 60 * 60 * 1000).getDay() == commentDate.getDay() && new Date().getTime() - commentDate.getTime() < 48 * 60 * 60 * 1000) {
                commentTime += 'yesterday at ';
            } else if (new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).getTime() < commentDate.getTime() && new Date().getDay() != commentDate.getDay()) {
                commentTime += 'last ' + dictionary.weekday.en[commentDate.getDay()] + ' at ';
            } else {
                var commentDayOfMonth = commentDate.getDate();
                var commentMonth = dictionary.month.en[commentDate.getMonth()];
                if (commentDayOfMonth < 10) commentDayOfMonth = '0' + commentDayOfMonth;
                commentTime += commentMonth + ' ' + commentDayOfMonth + ' ' + commentDate.getFullYear() + ' ';
            } 
            var commentHour = commentDate.getHours() % 12;
            var commentMinute = commentDate.getMinutes();
            if (commentHour < 10) commentHour = '0' + commentHour;
            if (commentMinute < 10) commentMinute = '0' + commentMinute;
            commentTime += commentHour + ':' + commentMinute + ' ';
            if (commentDate.getHours() < 12) {
                commentTime += 'a.m.';
            } else {
                commentTime += 'p.m.';
            }
        }
    }
    
    return commentTime;
}

function addCommentListeners(commentData,containerTyp,containerId,containerQuery,mainTyp,mainId,includeSubmit,searchForReplies,isReplyData) {
    var replymark = '';
    if (isReplyData) replymark = '-reply';
    if (includeSubmit) {
        $(containerQuery + ' .comment' + replymark + '-insert button').click(((textQuery) => () => {
            if ($(textQuery).attr('disabled') != 'disabled') {
                $(textQuery).attr('disabled', 'disabled');
                var content = $(textQuery).val()
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
                    .replace(/\\/g, '\\\\');
                firebase.auth().currentUser.getIdToken(true)
                    .then(idToken => {
                        fetch('/addComment', {
                            idToken: idToken,
                            content: content,
                            containerTyp: containerTyp,
                            containerId: containerId,
                            mainTyp: mainTyp,
                            mainId: mainId
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
                    fetch('/reportComment', {
                        idToken: idToken,
                        commentId: id,
                        containerTyp: containerTyp,
                        containerId: containerId,
                        mainTyp: mainTyp,
                        mainId: mainId,
                        link: window.location.href
                    });
                    alert('Report sent.');
                });
            $('#' + id + ' .comment' + replymark + '-controll>.comment-controll-report').off();
        })(commentData[i].id));
        $('#' + commentData[i].id + ' .comment' + replymark + '-controll>.comment-controll-delete').click(((id) => () => {
            $('#' + id + ' .comment' + replymark + '-controll button').off();
            firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                    if (searchForReplies) {
                        (unsubscribeFunctions[id])();
                    }
                    fetch('/deleteComment',{
                        idToken: idToken,
                        id: id,
                        typ: containerTyp,
                        source: containerId
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
    unsubscribeFunctions[containerId] = db.collection(reference).doc(containerId).onSnapshot((doc) => {
        var globalcomments;
        if (containerTyp != 'comment') {
            globalcomments = doc.data().Comments;
        } else {
            globalcomments = doc.data().replies;
        }
        for (var i = 0; i < globalcomments.length; i++) {
            if (document.getElementById(globalcomments[i]) == null) {
                firebase.auth().currentUser.getIdToken(true).then(((id) => (idToken) => {
                    fetch('/getCommentData',{
                        idToken: idToken,
                        commentId: id,
                        containerTyp: containerTyp,
                        mainTyp: mainTyp,
                        mainId: mainId
                    }).then((data) => {
                        launchComments([data], containerTyp, containerId, containerQuery, mainTyp, mainId, false, searchForReplies, isReplyData, true);
                        globalCommentData[containerId].push(data);
                        if ($(containerQuery + '>div>textarea').attr('disabled') == 'disabled') {
                            $(containerQuery + '>div>textarea').val('').removeAttr('disabled');
                        }
                    });
                })(globalcomments[i]));
            }
        }
        var localcomments = document.querySelector(containerQuery).childNodes;
        for (var i = 0; i < localcomments.length; i++) {
            if (localcomments[i].id != '' && globalcomments.indexOf(localcomments[i].id) == -1) {
                for (var j = 0; j < globalCommentData[containerId].length; j++) {
                    if (globalCommentData[containerId][j].id == localcomments[i].id) {
                        globalCommentData[containerId].splice(j,1);
                        break;
                    }
                }
                $('#' + localcomments[i].id).slideUp(400,function(){ $(this).remove() });
            }
        }
    });
}