// Initialize Firebase
var config = {
    apiKey: "AIzaSyDFm0hNUOwU1TjpA8eV5dosr1-D1SX1PbM",
    authDomain: "exchange-blog.firebaseapp.com",
    databaseURL: "https://exchange-blog.firebaseio.com",
    projectId: "exchange-blog",
    storageBucket: "exchange-blog.appspot.com",
    messagingSenderId: "977760272277"
};
firebase.initializeApp(config);

var logout = false;

function redirector(status) {
    if (logout) {
        //Redirect to Logout Page
        console.log('You got logged out.');
    } else if (status == 403) {
        window.location.replace("/de-de/accessdenied.html");
    }
}

$(function () {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                    $.ajax({
                        method: 'POST',
                        url: '/auth',
                        data: { "idToken": idToken },
                        success: main,
                        error: () => { redirector(403) }
                    });
                });
        } else {
            redirector(403);
        }
    });
});

var settings = {};

function main() {
    
    resetSettingsData().then(() => {
        //Alles vorausfüllen
        resetForm1();
        resetForm3();
        resetForm4();

        var user = firebase.auth().currentUser;
        //Actionlistener für jedes Form
        //Form 1
        $('#form1').submit((e) => { e.preventDefault() });
        $('#form1 button.save').click(() => {
            var credentials = firebase.auth.EmailAuthProvider.credential(user.email, $('#oldPasswordInput').val());
            user.reauthenticateAndRetrieveDataWithCredential(credentials)
                .then(() => {
                    user.updateEmail($('#emailInput').val())
                        .catch(() => {
                            //Invalid Email
                        })
                })
                .catch(() => {
                    //Wrong Password!
                });
                
        });
        $('#form1 button.reset').click(() => {
            resetForm1();
            $('#form1 div.reset').slideDown();
            setTimeout(() => { $('#form1 div.reset').slideUp() }, 5000);
        });
        //Form 2
        $('#form2').submit((e) => { e.preventDefault() });
        $('#form2 button.save').click(() => {
            if ($('#newPasswordInput').val() != $('#repeatPasswordInput').val()) {
                //pws are not equal
            } else {
                var credentials = firebase.auth.EmailAuthProvider.credential(user.email, $('#oldPasswordInput').val());
                user.reauthenticateAndRetrieveDataWithCredential(credentials)
                    .then(() => {
                        user.updatePassword($('#newPasswordInput').val())
                            .catch(() => {
                                //Weak Password
                            })
                    })
                    .catch(() => {
                        //Wrong Password!
                    });
            }
        });
        $('#form2 button.reset').click(() => {
            resetForm2();
            $('#form2 div.reset').slideDown();
            setTimeout(() => { $('#form2 div.reset').slideUp() }, 5000);
        });
        //Form 3
        $('#form3').submit((e) => { e.preventDefault() });
        $('#form3 button.save').click(() => {
            if ($('#nicknameInput').val().length < 4) {
                //too short!
            } else {
                firebase.auth().currentUser.getIdToken(true)
                    .then((idToken) => {
                        $.ajax({
                            method: 'POST',
                            url: '/changeNickname',
                            data: { "idToken": idToken, "nick": $('#nicknameInput').val() },
                            error: () => { redirector(403) },
                            success: () => {
                                resetSettingsData()
                                    .then(() => {
                                        resetForm3();
                                    });
                            }
                        });
                    })
            }
        });
        $('#form3 button.reset').click(() => {
            resetSettingsData()
                .then(() => {
                    resetForm3();
                    $('#form3 div.reset').slideDown();
                    setTimeout(() => { $('#form3 div.reset').slideUp() }, 5000);
                });
        });
        //Form 4
        $('#form4').submit((e) => { e.preventDefault() });
        $('#form4 button.save').click(() => {
            var p0 = document.getElementById('privacy0').checked;
            var p1 = document.getElementById('privacy1').checked;
            var p2 = document.getElementById('privacy2').checked;
            var n0 = document.getElementById('notblog').checked;
            var n1 = document.getElementById('notmedia').checked;
            var n2 = document.getElementById('notstatus').checked;
            var nf0 = document.getElementById('not0').checked;
            var nf1 = document.getElementById('not1').checked;
            var nf2 = document.getElementById('not2').checked;
            var privacy;
            var nots;
            var nofs;
            if (p0) {
                privacy = 'weak';
            } else if (p1) {
                privacy = 'medium';
            } else if (p2) {
                privacy = 'strong';
            } 
            nots = JSON.stringify({
                blog: n0,
                media: n1,
                status: n2
            });
            if (nf0) {
                nofs = 0;
            } else if (nf1) {
                nofs = 1;
            } else if (nf2) {
                nofs = 2;
            } 
            firebase.auth().currentUser.getIdToken(true)
                .then((idToken) => {
                    $.ajax({
                        method: 'POST',
                        url: '/changePrivaNoti',
                        data: { "idToken": idToken, "privacy": privacy, "notifications": nots, "notiFrequency": nofs },
                        error: () => { redirector(403) },
                        success: () => {
                            resetSettingsData()
                                .then(() => {
                                    resetForm4();
                                });
                        }
                    });
                })
        });
        $('#form4 button.reset').click(() => {
            resetSettingsData()
                .then(() => {
                    resetForm4();
                    $('#form4 div.reset').slideDown();
                    setTimeout(() => { $('#form4 div.reset').slideUp() }, 5000);
                });
        });
        //Seite anzeigen
        $('#page-content').slideDown();
    })

    /*$('#page-content form').submit((e) => { e.preventDefault(); $('#page-content button.reset').click() });
    resetInput().then(() => { $('#page-content').slideDown() });
    $('button.save').click(() => {
        //Reauthenticating...
        var user = firebase.auth().currentUser;
        var emailChanged = $('input[name="mail"]').val() != user.email;
        var passChanged = $('#pwnew').val() != '';
        if (emailChanged || passChanged) {
            var credentials = firebase.auth.EmailAuthProvider.credential(user.email, $('#pwold').val());
            user.reauthenticateAndRetrieveDataWithCredential(credentials)
                .then(() => {
                    if ((!passChanged) || ($('#pwnew').val() == $('#pwrepeater').val())) {
                        //go on
                    } else {
                        //do not equal
                    }
                }).catch(() => {
                    //wrong password
                })
        } else {
            //go on
        }  
    });
    $('button.reset').click(() => {
        resetInput().then(() => {
            $('div.reset').slideDown();
            setTimeout(() => { $('div.reset').slideUp() },5000);
        });
    })*/
}

function resetForm1() {
    $('#emailInput').val(firebase.auth().currentUser.email);
}

function resetForm2() {
    $('#oldPasswordInput').val('');
    $('#newPasswordInput').val('');
    $('#repeatPasswordInput').val('');
}

function resetForm3() {
    $('#nicknameInput').val(settings.nick);
}

function resetForm4() {
    if (settings.privacy == 'weak') $('#privacy0').prop('checked', true);
    if (settings.privacy == 'medium') $('#privacy1').prop('checked', true);
    if (settings.privacy == 'strong') $('#privacy2').prop('checked', true);
    for (key in settings.notifications) {
        $('#not' + key).prop('checked', settings.notifications[key])
    }
    $('#not' + settings.notiFrequency).prop('checked', true);
}

function resetSettingsData() {
    return new Promise ((resolve,reject) => {
        firebase.auth().currentUser.getIdToken(true)
            .then((idToken) => {
                $.ajax({
                    method: 'POST',
                    url: '/getUserSettings',
                    data: { "idToken": idToken },
                    error: () => { redirector(403) },
                    success: (data) => {
                        settings = data;
                        resolve();
                    }
                });
            });
    })
}