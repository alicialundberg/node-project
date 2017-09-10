//Skapar moduler som installerats via npm
var PouchDB = require("pouchdb");
var bodyParser = require("body-parser")
var Express = require("express");
var path = require("path");

var app = Express();

//Här skapas den lokala databasen, mapp localpouchdb
var database = new PouchDB('localpouchdb');

//Här skapas en remote CouchDB databas som ska synkas mot den lokala databasen
var remoteDB = 'http://localhost:5984/tvshows/'

sync();

//Synkar den lokala PouchDB databasen med CouchDB
function sync() {
    var opts = {live: true};
    database.replicate.to(remoteDB, opts);
    database.replicate.from(remoteDB, opts);

  }
//json tolkare och urlencoded tolkare
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Initierar CORS för att servern och browsern ska kunna interagera
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Route till servern
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname+'/tvshows.html'));
});

//Route som hämtar alla dokument från databasen
app.get("/tvshows", function (req, res, next) {
  database.allDocs({include_docs: true}).then(function(result) {
          res.send(result.rows.map(function(item) {
              return item.doc;
          }));
      }, function(error) {
          res.status(400).send(error);
      });
  });

//Route som postar ny data till tvshows-databasen
app.post("/tvshows", function (req, res) {
  database.post(req.body).then(function(result) {
    res.sendFile(path.join(__dirname+'/tvshows.html'));
  });
});

//Uppdaterar specifik data och returnerar den befintliga datan i databasen
app.put("/tvshows/:id", function(req, res) {
  database.get(req.params.id).then(function(result) {
          result.title = req.body.title;
          result.seasons = req.body.seasons;
          result.genre = req.body.genre;
          result.ranking = req.body.ranking;
          result.episodelength = req.body.episodelength;
          database.put(result);//update the doc in db
          res.send(result);

      }, function(error) {
          res.status(400).send(error);
      });
  });

//Raderar specifik data och returnerar all befintlig data från databasen
app.delete("/tvshows/:id", function(req, res) {
  database.get(req.body.id).then(function(result) {
      return database.remove(result);
  }).then(function(result) {
        res.send(result);
  });
});

app.listen(3000)
