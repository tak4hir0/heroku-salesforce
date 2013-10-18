var request = require('request');

function Salesforce (access_token, urls, options) {
  this._access_token = access_token;
  this._urls = urls;
  this._options = options || { version: '29.0' };
  for (var key in this._urls) {
    this._urls[key] = this._urls[key].replace(/\{version\}/ig, this._options.version);
  }
}

Salesforce.prototype.getGroups = function (callback) {
  request.get(this._urls.groups, {
    headers: {
      Authorization: 'Bearer ' + this._access_token
    }
  }, function (err, resp, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).groups);
  });
};

Salesforce.prototype.postToCompany = function (options, callback) {
  var url = this._urls.feeds + '/record/' + options.group.id + '/feed-items';
  var body = {
    "body" : {
      "messageSegments" : [ {
        "type": "Text",
        "text": options.message
      } ]
    }
  };
  request.post(url, {
    headers: {
      Authorization: 'Bearer ' + this._access_token
    },
    json: body
  }, function (err, resp, body) {
    if (err) return callback(err);
    if (resp.statusCode !== 201) return callback(new Error(body));
    callback();
  });
};

module.exports = Salesforce;