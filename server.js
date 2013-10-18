var http     = require('http');
var express  = require('express');
var passport = require('passport');
var request  = require('request');

require('./lib/setup_passport');

var app      = express();

app.configure(function () {
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');

  app.use(express.cookieParser());
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

//Get users from salesforce
app.get('/users', function (req, res) {
  if (!req.user || req.user.identities[0].provider !== 'salesforce') {
    return res.send(401);
  }
  var salesforce_access_token = req.user.identities[0].access_token;
  var url = req.user._json.urls.users.replace(/\{version\}/ig, '29.0');
  request.get(url, {
    headers: {
      Authorization: 'Bearer ' + salesforce_access_token
    }
  }, function (err, resp, body) {
    if (err) return res.send(500);
    res.json(JSON.parse(body));
  });
});

var port = process.env.PORT || 5000;

http.createServer(app).listen(port, function () {
  console.log('listening in http://localhost:' + port);
});