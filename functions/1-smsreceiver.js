var AWS = require('aws-sdk');
var moment = require('moment');
var s3 = new AWS.S3();
var resp = require('aws-lambda-response');
var querystring = require('querystring');

function run(event, context, callback) {
  const utc = moment().format()
  var data = querystring.parse(event.body)
  var key = "transactions/" + data.From + "/" + moment().year() + "/" + (moment().month()+1) + "/" + utc + ".json"
  // run will read data from the twilio webhook.
  var transaction_body = {};
  var msg = data.Body
  var arr = msg.match(/(\d+\.\d\d)(\s(.*))?/)
  var price = ""
  var description = ""
  if (arr.length == 4) {
    if (arr[1].length == 0) {
      return context.fail(new Error("Invalid format"))
    }
    price = arr[1];
    // Ignore 2, it's just 3 but with the optional
    if (arr[3]) {
      description = arr[3]
    }
  } else {
    return context.fail(new Error("Invalid format of body: " + arr.length + ": " + msg))
  }
  transaction_body = {price:price, description:description}
  var params = {Bucket: 'greenbacktransactions', Key: key, Body: JSON.stringify(transaction_body)};
  s3.upload(params, function(err, event) {
    if (err) console.log(err);
    else context.succeed();
  });
}

exports.handler = function(event, context, callback) {
  if (!event.body) {
    return callback(new Error("No body submitted."));
  }
  run(event, context, callback);
};
