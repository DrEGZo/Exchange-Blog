var config = {
    apiKey: "AIzaSyDFm0hNUOwU1TjpA8eV5dosr1-D1SX1PbM",
    authDomain: "exchange-blog.firebaseapp.com",
    databaseURL: "https://exchange-blog.firebaseio.com",
    projectId: "exchange-blog",
    storageBucket: "exchange-blog.appspot.com",
    messagingSenderId: "977760272277"
};
firebase.initializeApp(config);

var language = window.location.href.split('/')[3].split('-')[0];

$(() => {
    $('#lng-cnt-0 a').css('background-image', 'url("/media/' + language + '.svg")');
    var link = window.location.href.split('/');
    link[3] = 'de-de';
    $('#lng-cnt-1 a').attr('href',link.join('/'));
    link[3] = 'en-us';
    $('#lng-cnt-2 a').attr('href', link.join('/'));
    $('#lng-cnt-0 a').click(function(){
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            $(this).css('background-image', 'url("/media/' + language + '.svg")');
            $('#lng-cnt-1 a, #lng-cnt-2 a').css('opacity', '0');
            $('#lng-cnt-1, #lng-cnt-2').css({
                top: '0',
                bottom: '0',
                left: '0',
                right: '0'
            });
        } else {
            $(this).addClass('active');
            $('#lng-cnt-1 a, #lng-cnt-2 a').css('opacity', '1');
            if (window.innerWidth > 767) {
                $(this).css('background-image', 'url("/media/arr.svg")');
                $('#lng-cnt-1').css({ top: '100%', bottom: '-100%' });
                $('#lng-cnt-2').css({ top: '200%', bottom: '-200%' });
            } else {
                $(this).css('background-image', 'url("/media/arr2.svg")');
                $('#lng-cnt-1').css({ left: '150%', right: '-150%' });
                $('#lng-cnt-2').css({ left: '300%', right: '-300%' });
            }
        }
    });
});

$(window).resize(() => { if ($('#lng-cnt-0 a').hasClass('active')) $('#lng-cnt-0 a').click() });

function fetchCb(url, data, callback) {
    $.ajax({
        method: 'POST',
        url: '/api' + url,
        data: data,
        error: (jqxhr) => { redirector(jqxhr.status) },
        success: (data) => { callback(data) }
    });
}

function fetch(url, data) {
    return new Promise((resolve,reject) => {
        fetchCb(url, data, resolve);
    });
}

function redirector(status) {
    var lang; 
    if (language == 'de') lang = '/de-de';
    else lang = '/en-us';
    if (status == 401) {
        if (firebase.auth().currentUser) {
            window.location.replace(lang + "/alert/notVerified/");
        } else {
            window.location.replace(lang + "/alert/notLoggedIn/");
        }
    } else if (status == 403) {
        window.location.replace(lang + "/alert/forbidden/");
    } else if (status >= 500) {
        window.location.replace(lang + "/alert/serverError/");
    } else {
        window.location.replace(lang + "/alert/notFound/");
    }
}

function authenticater(verificationRequired) {
    return new Promise ((resolve, reject) => {
        firebase.auth().onAuthStateChanged((user) => {
            adjustAuthButton();
            $(window).resize(adjustAuthButton);
            if (user) {
                firebase.auth().currentUser.getIdToken(true).then((idToken) => {
                    return fetch('/auth',{idToken: idToken});
                }).then(() => {
                    if ((!verificationRequired) || firebase.auth().currentUser.emailVerified){
                        firebase.auth().currentUser.getIdToken().then((idToken) => {
                            return fetch('/getUserData', {idToken: idToken});
                        }).then((data) => {
                            $('#profile-info .profile-name').html(data.name);
                            $('#profile-info .profile-rank')
                                .html(globalranks[data.rank][language])
                                .css('background-color',globalranks[data.rank].c);
                            // $('#lng-cnt-0>a').css('background-image', '/media/' + language + '.svg');
                            resolve();
                        });
                    } else {
                        redirector(401);
                    }
                });
            } else {
                redirector(401);
            }
        });
    });
}

function adjustAuthButton() {
    var target = '#login-container';
    if (firebase.auth().currentUser) target = '#profile-info';
    if (window.innerWidth > 767) {
      $('#auth-button').off().click(() => { $(target).fadeToggle() });
    } else if (window.innerWidth <= 767) {
      $('#auth-button').off().click(() => { $(target).slideToggle() });
    }
}

const globalranks = {
    admin: {
        de: 'Administrator',
        en: 'Administrator',
        c: '#ffc107'
    },
    family: {
        de: 'Familie',
        en: 'Relative',
        c: '#3c4df7'
    },
    hostfamily: {
        de: 'Gastfamilie',
        en: 'Host Family',
        c: '#459e0b'
    },
    friend: {
        de: 'Freund',
        en: 'Friend',
        c: '#51bb0b'
    },
    schoolmate: {
        de: 'Mitschüler',
        en: 'Schoolmate',
        c: '#0098ff'
    },
    teacher: {
        de: 'Lehrer',
        en: 'Teacher',
        c: '#b200ff'
    },
    stepin: {
        de: 'Stepin',
        en: 'Stepin',
        c: '#ff0000'
    },
    ices: {
        de: 'ICES',
        en: 'ICES',
        c: '#ff9600'
    }
}

const dictionary = {
    nothingthere: {
        de: 'Noch nichts da...',
        en: 'Nothing there yet...'
    },
    newarticle: {
        de: 'Ein neuer Artikel ist verfügbar!',
        en: 'A new article is available!',
    },
    newmedia: {
        de: 'Neue Fotos sind verfügbar!',
        en: 'New photos are available!',
    },
    status: {
        de: 'Statusmeldung',
        en: 'Status update',
    },
    loadactivity: {
        de: 'Mehr Inhalte laden',
        en: 'Load more activity'
    },
    profile: {
        de: 'Profil',
        en: 'Profile'
    },
    readmore: {
        de: 'Weiterlesen',
        en: 'Read more'
    },
    weekday: {
        de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    month: {
        de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    reply: {
        de: 'Antworten',
        en: 'Reply'
    },
    replies: {
        de: 'Antworten',
        en: 'Replies'
    },
    report: {
        de: 'Melden',
        en: 'Report'
    },
    delete: {
        de: 'Löschen',
        en: 'Delete'
    },
    writecomment: {
        de: 'Schreibe einen Kommentar...',
        en: 'Write a comment...'
    },
    publish: {
        de: 'Veröffentlichen',
        en: 'Publish'
    },
    answertocomment: {
        de: 'Auf Kommentar antworten...',
        en: 'Answer to comment...'
    }
}