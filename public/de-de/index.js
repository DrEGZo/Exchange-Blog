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

$(function () {

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log('logedin');
    } else {
      console.log('logedout');
      firebase.auth().signInWithEmailAndPassword('squamato77@gmail.com','abcdefg');
    }
  });
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);







  /*console.log(firebase.auth().currentUser);
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    return firebase.auth().signInWithEmailAndPassword('squamato77@gmail.com','abcdefg');
  })
  .then(() => {
    //console.log(firebase.auth().currentUser);
    return new Promise(resolve => setTimeout(resolve, 3000));
  }).then(() => {
    window.location = '/de-de/media';
  });

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log('signin');
    } else {
      console.log('signout');
    }
  });*/
});
