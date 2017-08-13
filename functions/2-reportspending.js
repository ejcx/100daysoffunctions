var AWS = require('aws-sdk');
var moment = require('moment');
var s3 = new AWS.S3();


function listObjs(params) {
  return new Promise((resolve, reject) => {
    s3.listObjects(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function getTransaction(f) {
  var params = {
    Bucket: 'greenbacktransactions',
    Key: f
  }
  return new Promise((resolve, reject) => {
    s3.getObject(
      params,
      function(err, data) {
        if (err) {
          console.error(err)
          reject(err);
        } else {
          var transaction = JSON.parse(data.Body.toString("ascii"))
          var pieces = f.split(/\//)
          var time = pieces[pieces.length-1]
          transaction["time"] = time
          resolve(transaction);
        }
      }
    )
  });
}

function getMonthsTransactions(number, year, month) {
  var params = {
    Bucket: 'greenbacktransactions',
    Delimiter: '/',
    Prefix: number + year + '/' + month + "/"
  };
  return new Promise((resolve, reject) => {
    listObjs(params).then((data) => {
      resolve(data.Contents);
    }).catch((err) => {
      console.error(err)
      reject(err);
    });
  });
}

function aggregate(transactions) {
  var totalMonth = 0;
  for (var j=0; j<transactions.length; j++) {
    if (transactions.price) {
      continue
    }
    totalMonth = (parseFloat(totalMonth) + parseFloat(transactions[j].price)).toFixed(1)
  }
  return total;
}

function report(transactions) {
  return new Promise((resolve, reject) => {
    var fullTransactions = []
    for (var j=0; j<transactions.length; j++){ 
      getTransaction(transactions[j].Key).then((t) => {
        fullTransactions.push(t)
        if (transactions.length == fullTransactions.length) {
          var monthlySum = aggregate(fullTransactions)
          resolve(monthlySum)
        }
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    }
  });
}
function run(event, context, callback) {
  // We want to fetch and list all folders in the s3 bucket.
  var params = {
    Bucket: 'greenbacktransactions',
    Delimiter: '/',
    Prefix: 'transactions/'
  };
  listObjs(params).then((data) => {
    // We want to run a report
    var numbers = []
    for (var i=0; i<data.CommonPrefixes.length; i++) {
      numbers.push(data.CommonPrefixes[i].Prefix);
    }
    var year = moment().year()
    var month = moment().month()+1
    for (var j=0;j<numbers.length;j++) {
      getMonthsTransactions(numbers[j], year, month).then((transactions) => {
        report(transactions)
        aggregate(transactions)
      }).catch((err) => {
        console.error(err)
        return err
      });
    }
  })
}

exports.handler = function(event, context, callback) {
  run(event, context, callback);
};
run()
