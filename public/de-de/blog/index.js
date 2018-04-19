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

function redirector() {
  if (logout) {
    //Redirect to Logout Page
    console.log('You got logged out.');
  } else {
    //Redirect to Access-Denied Page
    console.log('ACCESS DENIED!!!');
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
          data: {"idToken": idToken},
          success: main,
          error: () => { redirector(403) }
        });
      });
    } else {
      redirector(403);
    }
  });
});

function main() {

}
