$(function () {
    authenticater().then(main);
});

function main() {
    resetUserSettings().then(() => {
        $('form').submit((e) => { e.preventDefault() });
        $('button.reset').click(() => {
            resetUserSettings().then(() => {
                showMessage($('div.reset'));
            });
        });
        $('button.save').click(() => {
            $('input.error').removeClass('error');
            $('.formError').slideUp();
            var err = false;
            var mailChanged = $('#emailInput').val() != firebase.auth().currentUser.email;
            var passChanged = $('#newPasswordInput').val() != '';
            if ((mailChanged || passChanged) && $('#oldPasswordInput').val() == '') {
                err = true;
                showError($('#oldPasswordInput'),$('#errorPasswordRequired'));
            }
            if (passChanged && $('#newPasswordInput').val() != $('#repeatPasswordInput').val()) {
                err = true;
                showError($('#newPasswordInput, #repeatPasswordInput'),$('#errorPasswordNequal'));
            }
            if ($('#nicknameInput').val().length < 4) {
                err = true;
                showError($('#nicknameInput'),$('#errorNickname'));
            }
            if ((!document.getElementById('not0').checked) &&
                (!document.getElementById('not1').checked) &&
                (!document.getElementById('not2').checked)) {
                err = true;
                showError($('input[name="notification"]'),$('#errorNotiFrequency'));
            }
            if (!err) {
                var user = firebase.auth().currentUser;
                (() => new Promise((resolve,reject) => { resolve() }))().then(() => {
                    if (mailChanged || passChanged) {
                        var credentials = firebase.auth.EmailAuthProvider.credential(user.email, $('#oldPasswordInput').val());
                        return user.reauthenticateAndRetrieveDataWithCredential(credentials);
                    }
                }).catch(() => {
                    err = true;
                    showError($('#oldPasswordInput'),$('#errorWrongPassword'));
                }).then(() => {
                    if (mailChanged && (!err)) return user.updateEmail($('#emailInput').val());
                }).catch(() => {
                    err = true;
                    showError($('#emailInput'),$('#errorEmail'));
                }).then(() => {
                    if (passChanged && (!err)) return user.updatePassword($('#newPasswordInput').val());
                }).catch(() => {
                    err = true;
                    showError($('#newPasswordInput, #repeatPasswordInput'),$('#errorWeakPassword'));
                }).then(() => {
                    if (!err) return user.getIdToken(true);
                }).then((idToken) => {
                    if (!err) return fetch('/changeSettings',{
                        idToken: idToken,
                        nick: $('#nicknameInput').val(),
                        noti: {
                            blog: document.getElementById('notblog').checked,
                            media: document.getElementById('notmedia').checked,
                            status: document.getElementById('notstatus').checked
                        },
                        notifreq: (() => {
                            if (document.getElementById('not0').checked) return 0;
                            if (document.getElementById('not1').checked) return 1;
                            if (document.getElementById('not2').checked) return 2;
                        })()
                    });
                }).then(() => {
                    if (!err) resetUserSettings().then(() => { 
                        showMessage($('div.save'), true);
                        user.sendEmailVerification();
                    });
                });
            }
        });
        $('#page-content').slideDown();
    });
}

function resetUserSettings() {
    return firebase.auth().currentUser.getIdToken(true)
        .then((idToken) => {
            return fetch('/getUserSettings', {idToken: idToken});
        })
        .then((settings) => {
            $('#emailInput').val(firebase.auth().currentUser.email);
            $('#oldPasswordInput').val('');
            $('#newPasswordInput').val('');
            $('#repeatPasswordInput').val('');
            $('#nicknameInput').val(settings.nick);
            $('#notblog').prop('checked', settings.notifications.blog);
            $('#notmedia').prop('checked', settings.notifications.media);
            $('#notstatus').prop('checked', settings.notifications.status);
            $('#not' + settings.notiFrequency).prop('checked', true);
        });
}

function showMessage(query,disappear) {
    query.slideDown();
    if (disappear) {
        setTimeout(() => {
            query.slideUp();
        }, 5000);
    }
}

function showError(input,error) {
    input.addClass('error');
    showMessage(error,false);
}