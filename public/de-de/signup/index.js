$(main);

function main() {
    var uid = window.location.pathname.split('/')[3];
    $('#page-content').slideDown();
    $('form').submit((e) => { e.preventDefault() });
    $('button.save').click(() => {
        var err = false;
        $('.formError').slideUp();
        if ($('#newPasswordInput').val() != $('#repeatPasswordInput').val()) {
            err = true;
            $('#errorPasswordNequal').slideDown();
        }
        if ($('#nameInput').val().length < 4) {
            err = true;
            $('#errorName').slideDown();
        }
        if ($('#nameInput').val().length < 4) {
            err = true;
            $('#errorNickname').slideDown();
        }
        if (!(document.getElementById('not0').checked) &&
            !(document.getElementById('not1').checked) &&
            !(document.getElementById('not2').checked)) {
            err = true;
            $('#errorNotiFrequency').slideDown();
        }
        if (!(document.getElementById('policy').checked)) {
            err = true;
            $('#errorPolicy').slideDown();
        }
        if (!err) {
            fetch('/signUp', {
                uid: uid,
                mail: $('#emailInput').val(),
                pass: $('#newPasswordInput').val(),
                name: $('#nameInput').val(),
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
            }).then((data) => {
                if (!data.success) {
                    if (data.error.code == 'auth/invalid-email') {
                        $('#errorEmail').slideDown();
                    } else if (data.error.code == 'auth/invalid-password') {
                        $('#errorWeakPassword').slideDown();
                    } else {
                        alert(data.error.message);
                    }
                } else {
                    firebase.auth().signInWithEmailAndPassword($('#emailInput').val(), $('#newPasswordInput').val())
                        .then(() => {
                            return firebase.auth().currentUser.sendEmailVerification()
                        })
                        .then(() => {
                            window.location.replace('/de-de/signedup.html')
                        });
                }
            })
        }
    });
}