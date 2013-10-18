var http     = require('http');
var express  = require('express');
var passport = require('passport');
var Salesforce = require('./lib/salesforce');

require('./lib/setup_passport');

var app      = express();

app.configure(function () {
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');

  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
});

// Auth0 callback handler
app.get('/callback',
  passport.authenticate('auth0'),
  function(req, res) {
    res.redirect("/");
  });

app.get('/', function (req, res) {
  res.render('index', {
    user: req.user,
    env:  process.env
  });
});

app.post('/chatter', function (req, res) {
  if (!req.user || req.user.identities[0].provider !== 'salesforce') {
    return res.redirect('/');
  }

  var access_token = req.user.identities[0].access_token;
  var urls = req.user._json.urls;
  var salesforce_client = new Salesforce(access_token, urls);

  salesforce_client.getGroups(function (err, groups) {
    if (err) return res.send(500);
    salesforce_client.postToCompany({
      group:   groups[0],
      message: req.body.message
    }, function (err) {
      if (err) return res.send(500);
      res.redirect('/');
    });
  });
});

var port = process.env.PORT || 5000;

http.createServer(app).listen(port, function () {
  console.log('listening in http://localhost:' + port);
});