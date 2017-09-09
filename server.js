var PouchDB = require("pouchdb");
var bodyParser = require("body-parser")
var Express = require("express");
var path = require("path");

var app = Express();

//Skapar en databas variabel med koppling till port 5984
var database = new PouchDB('http://127.0.0.1:5984/tvshows');

//Skapar den lokala databasen
var localDB = new PouchDB('localpouchdb')

//Skapar en remote CouchDB databas som synkas mot PouchDB (lokala databasen)
var remoteDB = ('http://127.0.0.1:5984/tvshows')
sync();

//Funktion för att synka databaserna
function sync() {
  var opts = {live:true};
  localDB.replicate.to(remoteDB, opts);
  database.replicate.from(remoteDB, opts);
};

//json tolkare och urlencoded tolkare
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//skickar en till tvshows.html
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname+'/tvshows.html'));
});

//Hämtar all data från databasen
app.get("/tvshows", function (req, res) {
  database.allDocs({include_docs: true}).then(function(result) {
          res.send(result.rows.map(function(item) {
              return item.doc;
          }));
      }, function(error) {
          res.status(400).send(error);
      });
  });

//Postar ny data till databasen
app.post("/tvshows", function (req, res) {
  database.post(req.body).then(function(result) {
    res.send(result);
  });
});

//Uppdaterar specifik data och skickar tillbaka all befintlig data från databasem igen
app.put("/tvshows/:id", (req, res) {
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

//Raderar specifik data från databasen och skickar sedan all befintlig data från databasen igen
app.delete("/tvshows/:id", function(req, res) {
  database.get(req.body.id).then(function(result) {
      return database.remove(result);
  }).then(function(result) {
        res.send(result);
})

app.listen(3000)
