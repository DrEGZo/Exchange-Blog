const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require("./adminsdk.json");
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const url = require('url');
const nodemailer = require('nodemailer');

const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://exchange-blog.firebaseio.com"
});

const db = admin.firestore();

app.use(bodyParser.json());

var dbUser = {};
var dbMedia = {};
var dbComments = {};
var dbCommentReplies = {};
var dbBlogentries = {};
var dbStatusUpdates = {};
var dbMailsettings = {};
var dbRegistryCodes = {};

function updateDatabaseContent(list) {
  return Promise.all([
    new Promise((rs, rj) => {
      if (list.indexOf('user') == -1) rs();
      else db.collection('User').get().then((snapshot) => {
        dbUser = {}; 
        snapshot.forEach((doc) => { dbUser[doc.id] = doc.data(); }); rs();
      });
    }),
    new Promise((rs, rj) => {
      if (list.indexOf('mail') == -1) rs();
      else db.collection('Mailsettings').get().then((snapshot) => {
        dbMailsettings = {}; 
        snapshot.forEach((doc) => { dbMailsettings[doc.id] = doc.data(); }); rs();
      });
    }),
    new Promise((rs, rj) => {
      if (list.indexOf('media') == -1) rs();
      else db.collection('Media').get().then((snapshot) => {
        dbMedia = {};
        snapshot.forEach((doc) => { dbMedia[doc.id] = doc.data(); }); rs();
      });
    }),
    new Promise((rs, rj) => {
      if (list.indexOf('blog') == -1) rs();
      else db.collection('Blogentries').get().then((snapshot) => {
        dbBlogentries = {};
        snapshot.forEach((doc) => { dbBlogentries[doc.id] = doc.data(); }); rs();
      });
    }),
    new Promise((rs, rj) => {
      if (list.indexOf('status') == -1) rs();
      else db.collection('StatusUpdates').get().then((snapshot) => {
        dbStatusUpdates = {};
        snapshot.forEach((doc) => { dbStatusUpdates[doc.id] = doc.data(); }); rs();
      });
    }),
    new Promise((rs, rj) => {
      if (list.indexOf('comment') == -1) rs();
      else db.collection('Comments').get().then((snapshot) => {
        dbComments = {};
        snapshot.forEach((doc) => { dbComments[doc.id] = doc.data(); }); rs();
      });
    }),
    new Promise((rs, rj) => {
      if (list.indexOf('commentreply') == -1) rs();
      else db.collection('CommentReplies').get().then((snapshot) => {
        dbCommentReplies = {};
        snapshot.forEach((doc) => { dbCommentReplies[doc.id] = doc.data(); }); rs();
      });
    }),
    new Promise((rs, rj) => {
      if (list.indexOf('registry') == -1) rs();
      else db.collection('RegistryCodes').get().then((snapshot) => {
        dbRegistryCodes = {};
        snapshot.forEach((doc) => { dbRegistryCodes[doc.id] = doc.data(); }); rs();
      });
    })
  ]).catch((err) => { console.log(err) });
}

app.get('/api/lorem', (req,res) => {
  res.send('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.');
});

app.post('/api/getHomeContent', (req,res) => {
  updateDatabaseContent(['user','blog','media']).then(() => {
    if (req.body.idToken != undefined) return auth(req.body.idToken);
    else return new Promise((resolve, reject) => { resolve(undefined) });
  }).then((uid) => {
    var bloglist = [];
    var result = [];
    for (var blogkey in dbBlogentries) {
      var hasPermission = dbBlogentries[blogkey].Visibility.length == 9;
      if (uid != undefined) hasPermission = dbBlogentries[blogkey].Visibility.indexOf(dbUser[uid].Rank) != -1;
      if (hasPermission) bloglist.push({
        id: blogkey,
        title: dbBlogentries[blogkey]['Title_' + req.body.lang],
        intro: dbBlogentries[blogkey]['Intro_' + req.body.lang],
        location: dbMedia[dbBlogentries[blogkey].Thumbnail].Location,
        upload: dbBlogentries[blogkey].Upload.true
      });
    }
    bloglist.sort((a, b) => {
      if (a.upload > b.upload) return -1;
      if (a.upload < b.upload) return 1;
      return 0;
    });
    for (var i = 0; i < 3 && i < bloglist.length; i++) {
      result.push(bloglist[i]);
    }
    res.json(result);
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getBlogList', (req,res) => {
  updateDatabaseContent(['user', 'blog', 'media']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    var rank = dbUser[uid].Rank;
    var idlist = [];
    for (var blogkey in dbBlogentries) {
      var hasPermission = dbBlogentries[blogkey].Visibility.indexOf(rank) != -1;
      var isShown = Date.now() > new Date(dbBlogentries[blogkey].Upload.release).getTime();
      var yearMatches = new Date(dbBlogentries[blogkey].Upload.true.getTime() - req.body.offset * 60 * 1000).getUTCFullYear() == req.body.year;
      var monthMatches = new Date(dbBlogentries[blogkey].Upload.true.getTime() - req.body.offset * 60 * 1000).getUTCMonth() == req.body.month;
      if (hasPermission && isShown && yearMatches && monthMatches) idlist.push(blogkey);
    }
    idlist.sort((a, b) => {
      if (dbBlogentries[a].Upload.true.getTime() < dbBlogentries[b].Upload.true.getTime()) return 1;
      if (dbBlogentries[a].Upload.true.getTime() > dbBlogentries[b].Upload.true.getTime()) return -1;
      return 0;
    });
    var result = [];
    for (var i = 0; i < idlist.length; i++) {
      if (dbBlogentries[idlist[i]].Visibility.indexOf(dbUser[uid].Rank) != -1) result.push({
        id: idlist[i],
        thumbnail: dbMedia[dbBlogentries[idlist[i]].Thumbnail].Location,
        title: dbBlogentries[idlist[i]]['Title_' + req.body.lang],
        intro: dbBlogentries[idlist[i]]['Intro_' + req.body.lang],
        upload: dbBlogentries[idlist[i]].Upload.release
      });
    }
    res.json(result);
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getMediaList', (req,res) => {
  updateDatabaseContent(['user', 'media', 'comment']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    var rank = dbUser[uid].Rank;
    var idlist = [];
    for (var mediakey in dbMedia) {
      var hasPermission = dbMedia[mediakey].Visibility.indexOf(rank) != -1;
      var isShown = Date.now() > new Date(dbMedia[mediakey].Upload.release).getTime();
      var yearMatches = new Date(dbMedia[mediakey].Upload.true.getTime() - req.body.offset * 60 * 1000).getUTCFullYear() == req.body.year;
      var monthMatches = new Date(dbMedia[mediakey].Upload.true.getTime() - req.body.offset * 60 * 1000).getUTCMonth() == req.body.month;
      if (hasPermission && isShown && yearMatches && monthMatches) idlist.push(mediakey);
    }
    res.json(evaluateIdList(idlist,uid,req.body.lang));
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getGalleryData', (req,res) => {
  updateDatabaseContent(['user', 'media', 'comment']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    if (req.body.list != undefined) res.json(evaluateIdList(req.body.list, uid, req.body.lang));
    else res.json({});
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getMediaData', (req,res) => {
  updateDatabaseContent(['user','media','comment']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    if (dbMedia[req.body.mid].Visibility.indexOf(dbUser[uid].Rank) != -1) {
      result = getMetadata('media', req.body.mid, uid);
      result.description = dbMedia[req.body.mid]['Description_' + req.body.lang];
      res.json(result);
    } else {
      res.status(403).end();
    }
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
})

app.post('/api/getBlogData', (req, res) => {
  var blogid = req.body.blogid;
  updateDatabaseContent(['user','blog','comment','commentreply','media']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    if (blogid in dbBlogentries) {
      var hasPermission = dbBlogentries[blogid].Visibility.indexOf(dbUser[uid].Rank) != -1;
      var isShown = new Date().getTime() > new Date(dbBlogentries[blogid].Upload.release).getTime();
      if (hasPermission && isShown) {
        res.json(getMetadata('blogpost',blogid,uid,req.body.lang));
      } else if (isShown) {
        res.status(403).end();
      } else {
        res.status(404).end();
      }
    } else {
      res.status(404).end();
    }
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/auth', (req,res) => {
  auth(req.body.idToken).then(() => {
    res.end();
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/addComment', (req, res) => {
  updateDatabaseContent(['user',req.body.mainTyp,'comment','commentreply']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
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
    var mainTyp = req.body.mainTyp;
    var mainId = req.body.mainId;
    if ((() => {
      if (mainTyp == 'blog') {
        return dbBlogentries[mainId].Visibility.indexOf(dbUser[uid].Rank) == -1;
      } else if (mainTyp == 'media') {
        return dbMedia[mainId].Visibility.indexOf(dbUser[uid].Rank) == -1;
      } else if (mainTyp == 'status') {
        return dbStatusUpdates[mainId].Visibility.indexOf(dbUser[uid].Rank) == -1;
      } else { return true }
    })()) {
      res.status(403).end();
    } else {
      (() => new Promise((resolve,reject) => { resolve() }))().then(() => {
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
      }).then(() => {
        var containerId = req.body.containerId;
        if (req.body.containerTyp == 'comment') {
          dbComments[containerId].replies.push(databaseKey);
          db.collection('Comments').doc(containerId).update({
            replies: dbComments[containerId].replies
          }).catch((err) => { console.log(err) });
        } else if (req.body.containerTyp == 'media') {
          dbMedia[containerId].Comments.push(databaseKey);
          db.collection('Media').doc(containerId).update({
            Comments: dbMedia[containerId].Comments
          }).catch((err) => { console.log(err) });
        } else if (req.body.containerTyp == 'blog') {
          dbBlogentries[containerId].Comments.push(databaseKey);
          db.collection('Blogentries').doc(containerId).update({
            Comments: dbBlogentries[containerId].Comments
          }).catch((err) => { console.log(err) });
        } else if (req.body.containerTyp == 'status') {
          dbStatusUpdates[containerId].Comments.push(databaseKey);
          db.collection('StatusUpdates').doc(containerId).update({
            Comments: dbStatusUpdates[containerId].Comments
          }).catch((err) => { console.log(err) });
        }
        res.end();
      });
    }
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/deleteComment', (req, res) => {
  var typ = req.body.typ;
  if (typ == 'comment') typ = 'commentreply';
  updateDatabaseContent(['user','comment',typ]).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    var id = req.body.id;
    typ = req.body.typ;
    var source = req.body.source;
    if (typ == 'blog') {
      if (dbComments[id].author == uid || dbUser[uid].Rank == 'admin') {
        var index = dbBlogentries[source].Comments.indexOf(id);
        var replies = dbComments[id].replies;
        dbBlogentries[source].Comments.splice(index, 1);
        db.collection('Blogentries').doc(source).update({
          Comments: dbBlogentries[source].Comments
        }).catch((err) => { console.log(err) });
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
      if (dbComments[id].author == uid || dbUser[uid].Rank == 'admin') {
        var index = dbMedia[source].Comments.indexOf(id);
        var replies = dbComments[id].replies;
        dbMedia[source].Comments.splice(index, 1);
        db.collection('Media').doc(source).update({
          Comments: dbMedia[source].Comments
        }).catch((err) => { console.log(err) });
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
      if (dbCommentReplies[id].author == uid || dbUser[uid].Rank == 'admin') {
        var index = dbComments[source].replies.indexOf(id);
        dbComments[source].replies.splice(index, 1);
        db.collection('Comments').doc(source).update({
          replies: dbComments[source].replies
        }).catch((err) => { console.log(err) });
        delete dbCommentReplies[id];
        db.collection('CommentReplies').doc(id).delete();
        res.end();
      } else {
        res.status(403).end();
      }
    } else if (typ == 'status') {
      if (dbComments[id].author == uid || dbUser[uid].Rank == 'admin') {
        var index = dbStatusUpdates[source].Comments.indexOf(id);
        var replies = dbComments[id].replies;
        dbStatusUpdates[source].Comments.splice(index, 1);
        db.collection('StatusUpdates').doc(source).update({
          Comments: dbStatusUpdates[source].Comments
        }).catch((err) => { console.log(err) });
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
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/reportComment', (req,res) => {
  updateDatabaseContent(['user','mail','comment','commentreply']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
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
        user: dbMailsettings.Options.User,
        pass: dbMailsettings.Options.Pass
      }
    });
    var mailOptions = {
      from: 'Exchange Blog',
      to: dbMailsettings.Options.Receiver,
      subject: 'EB Comment Report Alert',
      text: text
    };
    transporter.sendMail(mailOptions);
    res.end();
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getCommentData', (req,res) => {
  var commentId = req.body.commentId;
  var containerTyp = req.body.containerTyp;
  var mainTyp = req.body.mainTyp;
  var mainId = req.body.mainId;
  updateDatabaseContent([mainTyp,'user','comment','commentreply']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
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
        replies: datasource[commentId].replies,
        author: {
          id: datasource[commentId].author,
          name: dbUser[datasource[commentId].author].Nick,
          rank: dbUser[datasource[commentId].author].Rank
        }
      };
      res.json(result);
    } else {
      res.status(403).end();
    }
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getActivityFeed', (req,res) => {
  updateDatabaseContent(['user','blog','media','status','comment']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    var time = req.body.time;
    var contentList = [];
    for (key in dbBlogentries) {
      if (dbBlogentries[key].Visibility.indexOf(dbUser[uid].Rank) != -1) contentList.push({
        typ: 'blog',
        key: key,
        upload: dbBlogentries[key].Upload.release,
        trueUpload: dbBlogentries[key].Upload.true
      });
    }
    for (key in dbMedia) {
      if (dbMedia[key].Visibility.indexOf(dbUser[uid].Rank) != -1) contentList.push({
        typ: 'media',
        key: key,
        upload: dbMedia[key].Upload.release,
        trueUpload: dbMedia[key].Upload.true
      });
    }
    for (key in dbStatusUpdates) {
      if (dbStatusUpdates[key].Visibility.indexOf(dbUser[uid].Rank) != -1) contentList.push({
        typ: 'status',
        key: key,
        upload: dbStatusUpdates[key].Upload.release,
        trueUpload: dbStatusUpdates[key].Upload.true
      });
    }
    contentList.sort((a,b) => {
      if (a.upload.getTime() < b.upload.getTime()) return 1;
      if (a.upload.getTime() > b.upload.getTime()) return -1;
      if (a.trueUpload.getTime() < b.trueUpload.getTime()) return -1;
      if (a.trueUpload.getTime() > b.trueUpload.getTime()) return 1;
      return 0;
    });
    var result = [];
    for (var i = 0; i < contentList.length; i++) {
      if (result.length == 5) break;
      if (contentList[i].typ == 'blog') {
        if (dbBlogentries[contentList[i].key].Visibility.indexOf(dbUser[uid].Rank) != -1 && contentList[i].upload < time) {
          result.push({
            id: contentList[i].key,
            thumbnail: dbMedia[dbBlogentries[contentList[i].key].Thumbnail].Location,
            title: dbBlogentries[contentList[i].key]['Title_' + req.body.lang],
            intro: dbBlogentries[contentList[i].key]['Intro_' + req.body.lang],
            upload: contentList[i].upload
          });
        }
      } else if (contentList[i].typ == 'media') {
        var medialist = [];
        var date = new Date(contentList[i].upload.getTime() - req.body.offset * 60 * 1000);
        date.setUTCMilliseconds(0);
        date.setUTCSeconds(0);
        date.setUTCMinutes(0);
        date.setUTCHours(0);
        var lowerBorder = date.getTime() + req.body.offset * 60 * 1000;
        var upperBorder = lowerBorder + 24 * 60 * 60 * 1000;
        while (i < contentList.length && contentList[i].typ == 'media' && contentList[i].upload.getTime() >= lowerBorder && contentList[i].upload.getTime() < upperBorder) {
          if (dbMedia[contentList[i].key].Visibility.indexOf(dbUser[uid].Rank) != -1 && contentList[i].upload < time) {
            medialist.push(getMetadata('media', contentList[i].key, uid, req.body.lang));
          }
          i++;
        }
        i--;
        if (medialist.length != 0) result.push(medialist);
      } else if (contentList[i].typ == 'status') {
        if (dbStatusUpdates[contentList[i].key].Visibility.indexOf(dbUser[uid].Rank) != -1 && contentList[i].upload < time) {
          result.push({
            id: contentList[i].key,
            author: {
              name: dbUser[dbStatusUpdates[contentList[i].key].Author].Nick,
              rank: dbUser[dbStatusUpdates[contentList[i].key].Author].Rank
            },
            content: dbStatusUpdates[contentList[i].key]['Content_' + req.body.lang],
            upload: contentList[i].upload,
            comments: dbStatusUpdates[contentList[i].key].Comments
          });
        }
      }
    }
    res.json(result);
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getUserSettings', (req,res) => {
  updateDatabaseContent(['user']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    res.json({
      nick: dbUser[uid].Nick,
      privacy: dbUser[uid].Privacy,
      notifications: dbUser[uid].Notifications,
      notiFrequency: dbUser[uid].NotiFrequency
    });
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/signUp', (req,res) => {
  updateDatabaseContent(['user', 'registry']).then(() => {
    if (req.body.code in dbRegistryCodes) {
      admin.auth().createUser({
        email: req.body.mail,
        password: req.body.pass
      }).then((record) => {
        noti = req.body.noti;
        for (key in noti) {
          noti[key] = noti[key] === 'true';
        }
        return db.collection('User').doc(record.uid).set({
          Rank: dbRegistryCodes[req.body.code].Rank,
          Name: req.body.name,
          Nick: req.body.nick,
          Notifications: noti,
          NotiFrequency: parseInt(req.body.notifreq),
          Language: dbRegistryCodes[req.body.code].Language,
          UserNote: dbRegistryCodes[req.body.code].UserNote
        });
      }).then(() => {
        return db.collection('RegistryCodes').doc(req.body.code).delete();
      }).then(() => {
        res.json({ success: true });
      }).catch((err) => {
        res.json({ success: false, error: err });
      });
    } else {
      res.status(403).end();
    }
  }).catch((err) => { res.json({ success: false, error: err }) });
});

app.post('/api/changeSettings', (req,res) => {
  auth(req.body.idToken).then((uid) => {
    noti = req.body.noti;
    for (key in noti) {
      noti[key] = noti[key] === 'true';
    }
    return db.collection('User').doc(uid).update({ 
      Nick: req.body.nick,
      Notifications: noti,
      NotiFrequency: parseInt(req.body.notifreq)
    }).catch((err) => { console.log(err) });
  }).then(() => {
    res.end();
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.post('/api/getUserData',(req,res) => {
  updateDatabaseContent(['user']).then(() => {
    return auth(req.body.idToken);
  }).then((uid) => {
    res.json({
      name: dbUser[uid].Nick,
      rank: dbUser[uid].Rank
    });
  }).catch((err) => {
    res.status(500);
    console.log(err);
    admin.auth().verifyIdToken(req.body.idToken).catch(() => {
      res.status(401);
    }).then(() => auth(req.body.idToken)).catch(() => {
      res.status(403);
    }).then(() => { res.end(); });
  });
});

app.get('/api/triggermail', (req, res) => {
  updateDatabaseContent(['user', 'mail']).then(() => {
    for (uid in dbUser) {
      if (dbUser[uid].NotiFrequency == 2) mailTrigger(uid, 'ImdNoti');
    }
    for (content in dbMailsettings.ImdNoti) {
      if (dbMailsettings.ImdNoti[content].release < Date.now()) delete dbMailsettings.ImdNoti[content];
    }
    return db.collection('Mailsettings').doc('ImdNoti').set(dbMailsettings.ImdNoti);
  }).catch((err) => { console.log(err) }).then(() => { res.end() });
});

app.get('/api/triggerdailymail', (req, res) => {
  updateDatabaseContent(['user', 'mail']).then(() => {
    for (uid in dbUser) {
      if (dbUser[uid].NotiFrequency == 1) mailTrigger(uid, 'DailyNoti');
    }
    for (content in dbMailsettings.DailyNoti) {
      if (dbMailsettings.DailyNoti[content].release < Date.now()) delete dbMailsettings.DailyNoti[content];
    }
    return db.collection('Mailsettings').doc('DailyNoti').set(dbMailsettings.DailyNoti);
  }).catch((err) => { console.log(err) }).then(() => { res.end() });
});

// FUNCTIONS

function auth(idToken) {
  return new Promise((resolve,reject) => {
    var uid;
    admin.auth().verifyIdToken(idToken).then((decodedToken) => {
      uid = decodedToken.uid;
      return db.collection('User').doc(uid).get();
      }).then((doc) => {
      if (doc.exists) {
        resolve(uid);
      } else {
        console.log('Invalid User Account: ' + uid + ' -> Disabling Account.');
        admin.auth().updateUser(uid, {
          disabled: true
        }).then((userRecord) => {
          console.log('User Account has been disabled.');
          reject();
        });
      }
    }).catch(function(error) {
      console.log('Token is invalid. Error occured: ', error);
      reject();
    });
  });

}

function evaluateIdList(mediaidlist,uid,lang) {
  mediaidlist.sort((a, b) => {
    if (dbMedia[a].Upload.true.getTime() < dbMedia[b].Upload.true.getTime()) return 1;
    if (dbMedia[a].Upload.true.getTime() > dbMedia[b].Upload.true.getTime()) return -1;
    return 0;
  });
  var medialist = [];
  for (var i = 0; i < mediaidlist.length; i++) {
    if (dbMedia[mediaidlist[i]].Visibility.indexOf(dbUser[uid].Rank) != -1 && new Date(dbMedia[mediaidlist[i]].Upload.release).getTime() < Date.now()) 
      medialist.push(getMetadata('media',mediaidlist[i],uid,lang));
  }
  return medialist;
}

function getMetadata(typ,mid,uid,lang) {
  var socialobject = {};
  if (typ == 'media') {
    socialobject.typ = dbMedia[mid].Typ;
    socialobject.id = mid;
    socialobject.upload = dbMedia[mid].Upload.release;
    socialobject.location = dbMedia[mid].Location;
    socialobject.description = dbMedia[mid]['Description_' + lang];
    socialobject.comments = getComments(dbMedia[mid].Comments, dbComments, false, uid);
  } else if (typ == 'blogpost') {
    socialobject.title = dbBlogentries[mid]['Title_' + lang];
    socialobject.thumbnail = dbMedia[dbBlogentries[mid].Thumbnail].Location;
    socialobject.intro = dbBlogentries[mid]['Intro_' + lang];
    socialobject.content = dbBlogentries[mid]['Content_' + lang];
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
    newcomment.author = {
      id: authorkey,
      name: dbUser[authorkey].Nick,
      rank: dbUser[authorkey].Rank
    };
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
  var map = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var id = '';
  do {
    id += map.substr(Math.floor(Math.random() * 52),1);
    for (var i = 0; i < 19; i++) {
      id += map.substr(Math.floor(Math.random() * 62), 1);
    }
  } while(
    (id in dbBlogentries) ||
    (id in dbMedia) ||
    (id in dbStatusUpdates) ||
    (id in dbComments) ||
    (id in dbCommentReplies)
  );
  return id;
}

function mailTrigger(uid, target) {
  var list = [];
  for (content in dbMailsettings[target]) list.push(dbMailsettings[target][content]);
  list = list.sort((a, b) => {
    if (a.release < b.release) return -1;
    if (a.release > b.release) return 1;
    return 0;
  });
  var mailingList = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].release > Date.now()) break;
    if (dbUser[uid].Notifications[list[i].typ] && list[i].visibility.indexOf(dbUser[uid].Rank) != -1)
      mailingList.push(list[i]);
  }
  if (mailingList.length == 0) return;
  mailingList = mailingList.sort((a,b) => {
    if (a.typ == 'blog' && a.typ != b.typ) return -1;
    if (a.typ == 'media' && a.typ != b.typ) return 1;
    if (a.release < b.release) return -1;
    if (a.release > b.release) return 1;
    if (a.upload < b.upload) return -1;
    if (a.upload > b.upload) return 1;
    return 0;
  });
  var mediatypes = [];
  var lang;
  var mailtext;
  var transporter;
  for (var i = 0; i < mailingList.length; i++) mediatypes.push(mailingList[i].typ);
  updateDatabaseContent(mediatypes).then(() => {
    mailtext = '';
    lang = dbUser[uid].Language;
    if (dbUser[uid].NotiFrequency == 1) mailtext += dbMailsettings[lang].introDaily.replace('%NAME%', dbUser[uid].Name);
    else mailtext += dbMailsettings[lang].introImd.replace('%NAME%', dbUser[uid].Name);
    mailtext += '\n\n';
    var mediacount = 0;
    for (var i = 0; i < mailingList.length; i++) {
      if (mailingList[i].typ == 'blog') {
        mailtext += dbMailsettings[lang].newBlog
          .replace('%TITLE%', dbBlogentries[mailingList[i].id]['Title_' + lang])
          .replace('%LINK%', 'https://exchange-blog.com/' + dbMailsettings[lang].link + '/blog/' + mailingList[i].id + '/');
        mailtext += '\n\n';
      } else if (mailingList[i].typ == 'status') {
        var date = new Date(mailingList[i].release);
        var datestring = '';
        if (lang == 'de') {
          datestring += date.getUTCDate() + '.' + date.getUTCMonth() + '.' + date.getUTCFullYear() + ' ';
          if (date.getUTCHours() < 10) datestring += '0';
          datestring += date.getUTCHours() + ':';
          if (date.getUTCMinutes() < 10) datestring += '0';
          datestring += date.getUTCMinutes() + ' (UTC)';
        } else {
          datestring += date.getUTCMonth() + '/' + date.getUTCDate() + '/' + date.getUTCFullYear() + ' ';
          datestring += (date.getUTCHours() % 12) + ':' + date.getUTCMinutes() + ' ';
          if (date.getUTCHours() < 12) datestring += 'a.m. (UTC)'; else datestring += 'p.m. (UTC)';
        }
        var textlist = dbStatusUpdates[mailingList[i].id]['Content_' + lang].replace('$$$',' ').split(' ');
        var text = '';
        for (var j = 0; j < textlist.length && j < 20; j++) text += textlist[j] + ' ';
        if (textlist.length > 20) text += '[...]';
        mailtext += dbMailsettings[lang].newStatus
          .replace('%AUTHOR%', dbUser[dbStatusUpdates[mailingList[i].id].Author].Nick)
          .replace('%TIME%', datestring)
          .replace('%TEXT%', text)
          .replace('%LINK%', 'https://exchange-blog.com/' + dbMailsettings[lang].link + '/timeline/');
        mailtext += '\n\n';
      } else if (mailingList[i].typ == 'media') mediacount++;
    }
    if (mediacount > 0) {
      mailtext += dbMailsettings[lang].newMedia
        .replace('%COUNT%', '' + mediacount)
        .replace('%LINK1%', 'https://exchange-blog.com/' + dbMailsettings[lang].link + '/timeline/')
        .replace('%LINK2%', 'https://exchange-blog.com/' + dbMailsettings[lang].link + '/media/');
      mailtext += '\n\n';
    }
    mailtext += dbMailsettings[lang].outro;
    mailtext = mailtext.replace(/%BR%/g, '\n');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: dbMailsettings.Options.User,
        pass: dbMailsettings.Options.Pass
      }
    });
    return admin.auth().getUser(uid);
  }).then(record => {
    var subject = { de: 'Benachrichtigung', en: 'Notification' };
    var mailOptions = {
      from: 'Exchange Blog',
      to: record.email,
      subject: 'Exchange Blog ' + subject[lang],
      text: mailtext
    };
    transporter.sendMail(mailOptions);
  }).catch((err) => { console.log(err) });
}

function addNonreleasedContent(typ, snapshot) {
  snapshot.forEach(doc => {
    if (doc.data().Upload.release.getTime() > Date.now()) {
      var newContent = {
        typ: typ,
        id: doc.id,
        release: doc.data().Upload.release.getTime(),
        upload: doc.data().Upload.true.getTime(),
        visibility: doc.data().Visibility
      };
      dbMailsettings.ImdNoti[doc.id] = newContent;
      dbMailsettings.DailyNoti[doc.id] = newContent;
    }
  });
}

app.use(function (req, res) {
  res.status(404).end();
});

exports.expressapp = functions.https.onRequest(app);
