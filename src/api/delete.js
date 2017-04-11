'use strict';
const aws = require('aws-sdk');
const isValidRequest = require('../lib/is-valid-request');

module.exports.handler = (event, context, callback) => {

  const payload = isValidRequest.validate(event.body);
  if (payload === false) {
    return new Promise((resolve, reject) => {
      callback(null, {
          "statusCode": 400,
          "body": "Invalid request"
      });
      reject("Invalid request");
    });
  }


  const itemParams = {
      "TableName": "featureFlags",
      "Key": {
        "featureName": payload.featureName
      },
      "Expected": {
          "featureName": {
              "Exists": true,
              "Value": payload.featureName
          }
      }
  };
  const docClient = new aws.DynamoDB.DocumentClient();

  return new Promise((resolve, reject) => {
      return docClient.delete(itemParams).promise()
        .then(() => {
          callback(null, {"statusCode": 204});
          resolve();
        })
        .catch((err) => {
          let statusCode = 500;
          if(err.statusCode && err.statusCode === 400) {
            statusCode = 404;
          }
          callback(null, {statusCode, "body": JSON.stringify(err)});
          reject(err)
        });
  });

};
