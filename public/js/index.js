var config = {
    apiKey: "AIzaSyDFm0hNUOwU1TjpA8eV5dosr1-D1SX1PbM",
    authDomain: "exchange-blog.firebaseapp.com",
    databaseURL: "https://exchange-blog.firebaseio.com",
    projectId: "exchange-blog",
    storageBucket: "exchange-blog.appspot.com",
    messagingSenderId: "977760272277"
};
firebase.initializeApp(config);

function fetchCb(url, data, callback) {
    $.ajax({
        method: 'POST',
        url: url,
        data: data,
        //error: (jqxhr) => { redirector(jqxhr.status) },
        success: (data) => { callback(data) }
    });
}

function fetch(url, data) {
    return new Promise((resolve,reject) => {
        fetchCb(url, data, resolve);
    });
}

function redirector(status) {
    if (status == 401) {
        if (firebase.auth().currentUser) {
            window.location.replace("/de-de/alert/notVerified/");
        } else {
            window.location.replace("/de-de/alert/notLoggedIn/");
        }
    } else if (status == 403) {
        window.location.replace("/de-de/alert/forbidden/");
    } else if (status == 500) {
        window.location.replace("/de-de/alert/serverError/");
    } else {
        window.location.replace("/de-de/alert/notFound/");
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
                            $('#profile-info .profile-rank').html(data.rank);
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