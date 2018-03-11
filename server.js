var http = require("http");
var fs = require("fs");
var url = require("url");

var port = process.env.PORT || 8080;

var contentTypes = {
  html: "text/html",
  css: "text/css",
  js: "text/js",
  png: "image/png",
  jpg: "image/jpeg",
}

http.createServer((req, res)=>{
  if (req.url == "/" || req.url == "/de-de/") {
    res.writeHead(302,  {Location: "http://" + req.headers.host + "/de-de/index.html"});
    res.end();
  } else if (req.url == "/en-us/") {
    res.writeHead(302,  {Location: "http://" + req.headers.host + "/en-us/index.html"});
    res.end();
  } else {
    fs.readFile("."+req.url, (err,data)=>{
      if (err) {
        fs.readFile("."+req.url+"index.html", (err,data)=>{
          if (err) {
            res.writeHead(404);
            res.end("ERROR 404: FILE NOT FOUND");
          } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
          }
        });
      } else {
        var parts = req.url.split("/");
        var extension = parts[parts.length-1].split(".")[1];
        res.writeHead(200, {'Content-Type': contentTypes[extension]});
        res.end(data);
      }
    });
  }
}).listen(port);
