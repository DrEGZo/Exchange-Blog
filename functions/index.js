const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const url = require('url');
const nodemailer = require('nodemailer');

const app = express();

admin.initializeApp();

const db = admin.firestore();

app.use(bodyParser.json());

var dbUser = {};
var dbMedia = {};
var dbComments = {};
var dbCommentReplies = {};
var dbBlogentries = {};
var dbStatusUpdates = {};

db.collection('User').onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    dbUser[doc.id] = doc.data();
  });
});
db.collection('Media').onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    dbMedia[doc.id] = doc.data();
  });
});
db.collection('Comments').onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    dbComments[doc.id] = doc.data();
  });
});
db.collection('CommentReplies').onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    dbCommentReplies[doc.id] = doc.data();
  });
});
db.collection('Blogentries').onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    dbBlogentries[doc.id] = doc.data();
  });
});
db.collection('StatusUpdates').onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    dbStatusUpdates[doc.id] = doc.data();
  });
});


app.get('/lorem', (req,res) => {
  res.send('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.');
});

app.get('/getHomeContent', (req,res) => {
  var bloglist = [];
  for (var blogkey in dbBlogentries) {
    bloglist.push({
      id: blogkey,
      title: dbBlogentries[blogkey].Title,
      intro: dbBlogentries[blogkey].Intro,
      location: dbMedia[dbBlogentries[blogkey].Thumbnail].Location,
      upload: dbBlogentries[blogkey].Upload.true
    })
  }
  bloglist.sort((a,b) => {
    if (a.upload > b.upload) return 1;
    if (a.upload < b.upload) return -1;
    return 0;
  });
  var result = [];
  for (var i = 0; i < 3 && i < bloglist.length; i++) {
    result.push(bloglist[i]);
  }
  res.json(result);
})

app.post('/getBlogList', (req,res) => {
  auth(req.body.idToken)
    .then((uid) => {
      var rank = dbUser[uid].Rank;
      var idlist = [];
      for (var blogkey in dbBlogentries) {
        var hasPermission = dbBlogentries[blogkey].Visibility.indexOf(rank) != -1;
        var isShown = new Date().getTime() > new Date(dbBlogentries[blogkey].Upload.release).getTime();
        var yearMatches = new Date(dbBlogentries[blogkey].Upload.true).getFullYear() == req.body.year;
        var monthMatches = new Date(dbBlogentries[blogkey].Upload.true).getMonth() == req.body.month;
        if (hasPermission && isShown && yearMatches && monthMatches) idlist.push(blogkey);
      }
      idlist.sort((a, b) => {
        if (dbBlogentries[a].Upload.true.getTime() < dbBlogentries[b].Upload.true.getTime()) return 1;
        if (dbBlogentries[a].Upload.true.getTime() > dbBlogentries[b].Upload.true.getTime()) return -1;
        return 0;
      });
      var result = [];
      for (var i = 0; i < idlist.length; i++) {
        result.push({
          id: idlist[i],
          thumbnail: dbMedia[dbBlogentries[idlist[i]].Thumbnail].Location,
          title: dbBlogentries[idlist[i]].Title,
          intro: dbBlogentries[idlist[i]].Intro,
          upload: dbBlogentries[idlist[i]].Upload.release
        });
      }
      res.json(result);
    }).catch(() => {
      res.status(403).end();
    });
});

app.post('/getMediaList', (req,res) => {
  auth(req.body.idToken)
    .then((uid) => {
      var rank = dbUser[uid].Rank;
      var idlist = [];
      for (var mediakey in dbMedia) {
        var hasPermission = dbMedia[mediakey].Visibility.indexOf(rank) != -1;
        var isShown = new Date().getTime() > new Date(dbMedia[mediakey].Upload.release).getTime();
        var yearMatches = new Date(dbMedia[mediakey].Upload.true).getFullYear() == req.body.year;
        var monthMatches = new Date(dbMedia[mediakey].Upload.true).getMonth() == req.body.month;
        if (hasPermission && isShown && yearMatches && monthMatches) idlist.push(mediakey);
      }
      res.json(evaluateIdList(idlist,uid));
    }).catch(() => {
      res.status(403).end();
    });
});

app.post('/getGalleryData', (req,res) => {
  auth(req.body.idToken)
    .then((uid) => {
      res.json(evaluateIdList(req.body.list, uid));
    }).catch((err) => {
      console.log(err);
      res.status(403).end();
    });
});

app.post('/getMediaData', (req,res) => {
  auth(req.body.idToken)
    .then((uid) => {
      result = getMetadata('media', req.body.mid, uid);
      result.description = dbMedia[req.body.mid].Description;
      res.json(result);
    }).catch(() => {
      res.status(403).end();
    });
})

app.post('/getBlogData', (req, res) => {
  var blogid = req.body.blogid;
  auth(req.body.idToken)
    .then((uid) => {
      if (blogid in dbBlogentries) {
        var hasPermission = dbBlogentries[blogid].Visibility.indexOf(dbUser[uid].Rank) != -1;
        var isShown = new Date().getTime() > new Date(dbBlogentries[blogid].Upload.release).getTime();
        if (hasPermission && isShown) {
          res.json(getMetadata('blogpost',blogid,uid));
        } else if (isShown) {
          res.status(403).end();
        } else {
          res.status(404).end();
        }
      } else {
        res.status(404).end();
      }
    }).catch((err) => {
      console.log(err)
      res.status(403).end();
    });
});

app.post('/auth', (req,res) => {
  auth(req.body.idToken)
    .then(() => {
      res.send('valid');
    }).catch(() => {
      res.status(403).end();
    })
});

app.post('/addComment', (req, res) => {
  //idToken, mainTyp+Id, containerTyp+Id, content
  var reference;
  if (req.body.containerTyp == 'blog') {
    reference = 'Blogentries';
  } else if (req.body.containerTyp == 'media') {
    reference = 'Media';
  } else if (req.body.containerTyp == 'status') {
    reference = 'StatusUpdates';
  } else if (req.body.containerTyp == 'comment') {
    reference = 'Comments';
  }
  var databaseKey = createNewDatabaseKey();
  auth(req.body.idToken)
    .then((uid) => {
      var mainTyp = req.body.mainTyp;
      var mainId = req.body.mainId;
      if (mainTyp == 'blog') {
        if (dbBlogentries[mainId].Visibility.indexOf(dbUser[uid].Rank) == -1) reject();
      } else if (mainTyp == 'media') {
        if (dbMedia[mainId].Visibility.indexOf(dbUser[uid].Rank) == -1) reject();
      } else if (mainTyp == 'status') {
        if (dbStatusUpdates[mainId].Visibility.indexOf(dbUser[uid].Rank) == -1) reject();
      }
      if (req.body.containerTyp == 'comment') {
        return db.collection('CommentReplies').doc(databaseKey).set({
          author: uid,
          content: escapeHtml(req.body.content),
          time: new Date(),
          source: { typ: reference, id: req.body.containerId }
        });
      } else {
        return db.collection('Comments').doc(databaseKey).set({
          author: uid,
          content: escapeHtml(req.body.content),
          replies: [],
          time: new Date(),
          source: { typ: reference, id: req.body.containerId }
        });
      }
      res.status(403).end();
    }).then(() => {
      var containerId = req.body.containerId;
      if (req.body.containerTyp == 'comment') {
        dbComments[containerId].replies.push(databaseKey);
        db.collection('Comments').doc(containerId).update({
          replies: dbComments[containerId].replies
        });
      } else if (req.body.containerTyp == 'media') {
        dbMedia[containerId].Comments.push(databaseKey);
        db.collection('Media').doc(containerId).update({
          Comments: dbMedia[containerId].Comments
        });
      } else if (req.body.containerTyp == 'blog') {
        dbBlogentries[containerId].Comments.push(databaseKey);
        db.collection('Blogentries').doc(containerId).update({
          Comments: dbBlogentries[containerId].Comments
        });
      } else if (req.body.containerTyp == 'status') {
        dbStatusUpdates[containerId].Comments.push(databaseKey);
        db.collection('StatusUpdates').doc(containerId).update({
          Comments: dbStatusUpdates[containerId].Comments
        });
      }
      res.end();
    }).catch((err) => {
      console.log(err)
      res.status(403).end();
    });
});

/*app.post('/replyToComment', (req,res) => {
  auth(req.body.idToken)
    .then((uid) => {
      return new Promise((resolve, reject) => {
        var directory;
        var coll;
        if (req.body.typ == 'media') {
          directory = dbMedia;
        } else if (req.body.typ == 'blog') {
          directory = dbBlogentries;
        }
        if (uid in dbUser && req.body.target in directory) {
          if (directory[req.body.target].Visibility.indexOf(dbUser[uid].Rank) != -1) {
            resolve(uid);
            return;
          }
        }
        reject();
      });
    }).then((uid) => {
      return db.collection('CommentReplies').add({
        author: uid,
        content: escapeHtml(req.body.content),
        time: new Date()
      });
    }).then((id) => {
      id = id.id;
      dbComments[req.body.comtarget].replies.push(id);
      db.collection('Comments').doc(req.body.comtarget).update({
        replies: dbComments[req.body.comtarget].replies
      });
      res.end();
    }).catch(() => {
      res.status(403).end();
    });
});*/

app.post('/deleteComment', (req, res) => {
  auth(req.body.idToken)
    .then((uid) => {
      var id = req.body.id;
      var typ = req.body.typ;
      var source = req.body.source;
      if (typ == 'blog') {
        if (dbComments[id].author == uid || dbUser[uid].Rank == 'Administrator') {
          var index = dbBlogentries[source].Comments.indexOf(id);
          var replies = dbComments[id].replies;
          dbBlogentries[source].Comments.splice(index, 1);
          db.collection('Blogentries').doc(source).update({
            Comments: dbBlogentries[source].Comments
          });
          delete dbComments[id];
          db.collection('Comments').doc(id).delete();
          for (var i = 0; i < replies.length; i++) {
            delete dbCommentReplies[replies[i]];
            db.collection('CommentReplies').doc(replies[i]).delete();
          }
          res.end();
        } else {
          res.status(403).end();
        }
      } else if (typ == 'media') {
        if (dbComments[id].author == uid || dbUser[uid].Rank == 'Administrator') {
          var index = dbMedia[source].Comments.indexOf(id);
          var replies = dbComments[id].replies;
          dbMedia[source].Comments.splice(index, 1);
          db.collection('Media').doc(source).update({
            Comments: dbMedia[source].Comments
          });
          delete dbComments[id];
          db.collection('Comments').doc(id).delete();
          for (var i = 0; i < replies.length; i++) {
            delete dbCommentReplies[replies[i]];
            db.collection('CommentReplies').doc(replies[i]).delete();
          }
          res.end();
        } else {
          res.status(403).end();
        }
      } else if (typ == 'comment') {
        if (dbCommentReplies[id].author == uid || dbUser[uid].Rank == 'Administrator') {
          var index = dbComments[source].replies.indexOf(id);
          dbComments[source].replies.splice(index, 1);
          db.collection('Comments').doc(source).update({
            replies: dbComments[source].replies
          });
          delete dbCommentReplies[id];
          db.collection('CommentReplies').doc(id).delete();
          res.end();
        } else {
          res.status(403).end();
        }
      } else if (typ == 'status') {
        if (dbComments[id].author == uid || dbUser[uid].Rank == 'Administrator') {
          var index = dbStatusUpdates[source].Comments.indexOf(id);
          var replies = dbComments[id].replies;
          dbStatusUpdates[source].Comments.splice(index, 1);
          db.collection('StatusUpdates').doc(source).update({
            Comments: dbStatusUpdates[source].Comments
          });
          delete dbComments[id];
          db.collection('Comments').doc(id).delete();
          for (var i = 0; i < replies.length; i++) {
            delete dbCommentReplies[replies[i]];
            db.collection('CommentReplies').doc(replies[i]).delete();
          }
          res.end();
        } else {
          res.status(403).end();
        }
      }
    }).catch((err) => {
      console.log(err);
      res.status(403).end();
    });
});

app.post('/reportComment', (req,res) => {
  auth(req.body.idToken)
    .then((uid) => {
      var commentId = req.body.commentId;
      var containerTyp = req.body.containerTyp;
      var containerId = req.body.containerId;
      var mainTyp = req.body.mainTyp;
      var mainId = req.body.mainId;
      var link = req.body.link;
      var author = '';
      var content = '';
      var commentTyp = '';;
      if (containerTyp == 'comment') {
        author = dbCommentReplies[commentId].author;
        content = dbCommentReplies[commentId].content;
        commentTyp = 'Comment Reply';
      } else {
        author = dbComments[commentId].author;
        content = dbComments[commentId].content;
        commentTyp = 'Comment';
      }
      var text = 'Somebody reported a comment on your blog.\n\n';
      text += 'Reporter: \t\t' + dbUser[uid].Name + ' (' + uid + ')\n\n';
      text += 'Author: \t\t' + dbUser[author].Name + ' (' + author + ')\n';
      text += 'Content: \t\t' + content + '\n\n';
      text += 'ContainerID: \t' + containerId + '\n';
      text += 'CommentTyp: \t' + commentTyp + '\n';
      text += 'CommentID: \t' + commentId + '\n\n';
      text += 'ParentTyp: \t' + mainTyp + '\n';
      text += 'ParentID: \t\t' + mainId + '\n\n';
      text += 'Link: \t\t' + link + '\n';
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'noreply.exchangeblog@gmail.com',
          pass: 'U6LJ0omuqEBO6NqxBK82'
        }
      });
      var mailOptions = {
        from: 'Exchange Blog',
        to: 'squamato77@gmail.com',
        subject: 'EB Comment Report Alert',
        text: text
      };
      transporter.sendMail(mailOptions);
      res.end();
    }).catch(() => {
      res.status(403).end();
    });
});

app.post('/getCommentData', (req,res) => {
  var commentId = req.body.commentId;
  var containerTyp = req.body.containerTyp;
  var mainTyp = req.body.mainTyp;
  var mainId = req.body.mainId;
  auth(req.body.idToken)
    .then((uid) => {
      if ((() => {
        if (mainTyp == 'blog') {
          return dbBlogentries[mainId].Visibility.indexOf(dbUser[uid].Rank) != -1;
        } else if (mainTyp == 'media') {
          return dbMedia[mainId].Visibility.indexOf(dbUser[uid].Rank) != -1;
        } else if (mainTyp == 'status') {
          return dbStatusUpdates[mainId].Visibility.indexOf(dbUser[uid].Rank) != -1;
        } else { return false }
      })()) {
        var datasource;
        if (containerTyp == 'comment') {
          datasource = dbCommentReplies;
        } else {
          datasource = dbComments;
        }
        var result = {
          id: commentId,
          content: datasource[commentId].content,
          time: datasource[commentId].time,
          replies: datasource[commentId].replies
        };
        var authorkey = datasource[commentId].author;
        if (dbUser[uid].canSeeClearNames) {
          result.author = {
            name: dbUser[authorkey].Name,
            rank: dbUser[authorkey].Rank
          };
        } else {
          result.author = {
            name: dbUser[authorkey].Nick,
            rank: dbUser[authorkey].Rank
          };
        }
        res.json(result);
      } else {
        res.status(403).end();
      }
    }).catch((err) => {
      res.status(403).end();
    });
});

app.post('/getActivityFeed', (req,res) => {
  auth(req.body.idToken)
    .then((uid) => {
      var time = req.body.time;
      var contentList = [];
      for (key in dbBlogentries) {
        contentList.push({
          typ: 'blog',
          key: key,
          upload: dbBlogentries[key].Upload.release
        });
      }
      for (key in dbMedia) {
        contentList.push({
          typ: 'media',
          key: key,
          upload: dbMedia[key].Upload.release
        });
      }
      for (key in dbStatusUpdates) {
        contentList.push({
          typ: 'status',
          key: key,
          upload: dbStatusUpdates[key].Upload.release
        });
      }
      contentList.sort((a,b) => {
        if (a.upload.getTime() < b.upload.getTime()) return 1;
        if (a.upload.getTime() > b.upload.getTime()) return -1;
        return 0;
      });
      var result = [];
      for (var i = 0; i < contentList.length; i++) {
        if (result.length == 10) break;
        if (contentList[i].typ == 'blog') {
          if (dbBlogentries[contentList[i].key].Visibility.indexOf(dbUser[uid].Rank) != -1 && contentList[i].upload < time) {
            result.push({
              id: contentList[i].key,
              thumbnail: dbMedia[dbBlogentries[contentList[i].key].Thumbnail].Location,
              title: dbBlogentries[contentList[i].key].Title,
              intro: dbBlogentries[contentList[i].key].Intro,
              upload: contentList[i].upload
            });
          }
        } else if (contentList[i].typ == 'media') {
          var medialist = [];
          var date = contentList[i].upload.toLocaleDateString();
          while (i < contentList.length && contentList[i].typ == 'media' && date == contentList[i].upload.toLocaleDateString()) {
            if (dbMedia[contentList[i].key].Visibility.indexOf(dbUser[uid].Rank) != -1 && contentList[i].upload < time) {
              medialist.push(getMetadata('media', contentList[i].key, uid));
            }
            i++;
          }
          i--;
          if (medialist.length != 0) result.push(medialist);
        } else if (contentList[i].typ == 'status') {
          if (dbStatusUpdates[contentList[i].key].Visibility.indexOf(dbUser[uid].Rank) != -1 && contentList[i].upload < time) {
            var author;
            var authorkey = dbStatusUpdates[contentList[i].key].Author;
            if (dbUser[uid].canSeeClearNames) {
              author = {
                name: dbUser[authorkey].Name,
                rank: dbUser[authorkey].Rank
              };
            } else {
              author = {
                name: dbUser[authorkey].Nick,
                rank: dbUser[authorkey].Rank
              };
            }
            result.push({
              id: contentList[i].key,
              author: author,
              content: dbStatusUpdates[contentList[i].key].Content,
              upload: contentList[i].upload
            });
          }
        }
      }
      res.json(result);
    }).catch(() => {
      res.status(403).end();
    });
});

function auth(idToken) {
  return new Promise((resolve,reject) => {
    admin.auth().verifyIdToken(idToken)
    .then(function(decodedToken) {
      var uid = decodedToken.uid;
      if (dbUser[uid] == undefined) {
        db.collection('User').doc(uid).get()
        .then(doc => {
          if (doc.exists) {
            resolve(uid);
          } else {
            console.log('Invalid User Account: ' + uid + ' -> Disabling Account.');
            admin.auth().updateUser(uid, {
              disabled: true
            })
              .then(function (userRecord) {
                console.log('User Account has been disabled.');
                reject();
              });
          }
        });
      } else {
        resolve(uid);
      }
    }).catch(function(error) {
      console.log('Token is invalid. Error occured: ', error);
      reject();
    });
  });

}

function evaluateIdList(mediaidlist,uid) {
  mediaidlist.sort((a, b) => {
    if (dbMedia[a].Upload.true.getTime() < dbMedia[b].Upload.true.getTime()) return 1;
    if (dbMedia[a].Upload.true.getTime() > dbMedia[b].Upload.true.getTime()) return -1;
    return 0;
  });
  var medialist = [];
  for (var i = 0; i < mediaidlist.length; i++) {
    medialist.push(getMetadata('media',mediaidlist[i],uid));
  }
  return medialist;
}

function getMetadata(typ,mid,uid) {
  var socialobject = {};
  if (typ == 'media') {
    socialobject.typ = dbMedia[mid].Typ;
    socialobject.id = mid;
    socialobject.upload = dbMedia[mid].Upload.release;
    socialobject.location = dbMedia[mid].Location;
    socialobject.comments = getComments(dbMedia[mid].Comments, dbComments, false, uid);
  } else if (typ == 'blogpost') {
    socialobject.title = dbBlogentries[mid].Title;
    socialobject.thumbnail = dbMedia[dbBlogentries[mid].Thumbnail].Location;
    socialobject.intro = dbBlogentries[mid].Intro;
    socialobject.content = dbBlogentries[mid].Content;
    socialobject.upload = dbBlogentries[mid].Upload.release;
    socialobject.comments = getComments(dbBlogentries[mid].Comments, dbComments, true, uid);
  }
  return socialobject;
}

function getComments(commentlist,reference,searchReplies,uid) {
  var comments = [];
  for (var i = 0; i < commentlist.length; i++) {
    var newcomment = {};
    var commentkey = commentlist[i];
    newcomment.content = reference[commentkey].content;
    newcomment.time = reference[commentkey].time;
    newcomment.id = commentkey;
    var authorkey = reference[commentkey].author;
    var canSeeClearNames = false;
    if (dbUser[uid].canSeeClearNames) canSeeClearNames = true;
    if (canSeeClearNames) {
      newcomment.author = {
        name: dbUser[authorkey].Name,
        rank: dbUser[authorkey].Rank
      };
    } else {
      newcomment.author = {
        name: dbUser[authorkey].Nick,
        rank: dbUser[authorkey].Rank
      };
    }
    if (searchReplies) newcomment.replies = getComments(reference[commentkey].replies, dbCommentReplies, false, uid);
    comments.push(newcomment);
  }
  return comments;
}

//Reference: https://stackoverflow.com/a/4835406
function escapeHtml(text) {
  var map = {
    '<': '&lt;',
    '>': '&gt;'
  };
  return '<p>' + text
    .replace(/[<>]/g, function (m) { return map[m]; })
    .split(/\\n/)
    .join('</p><p>') + '</p>';
}

function createNewDatabaseKey() {
  var map = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var id;
  do {
    id += map.substr(Math.floor(Math.random() * 26),1);
    for (var i = 0; i < 29; i++) {
      id += map.substr(Math.floor(Math.random() * 36), 1);
    }

  } while(
    !(id in dbBlogentries) &&
    !(id in dbMedia) &&
    !(id in dbStatusUpdates) &&
    !(id in dbComments) &&
    !(id in dbCommentReplies)
  )
  return id;
}


exports.expressapp = functions.https.onRequest(app);
