

var AWS = require("aws-sdk");
var sns = new AWS.SNS();
const parseTorrent = require('parse-torrent')
AWS.config.update({ region: 'eu-west-1' });
var sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
exports.sqsPayloadLoggerHandler = async (event, context) => {
    console.log("Request que ha llegado -> ");
    console.log(event);
    var body = event.Records[0].body;
    console.log("Body del request")
    console.log(body)
    var url = JSON.parse(body).torrent;
    console.log("Torrent url")
    console.log(url)
    try {
        checkHttp(url);
    } catch (error) {
        console.error(error);
    }
    let magnetUri = await convertTorrent(url);
    let dataToReturn;
    if (magnetUri) {
        console.log("Torrent Validate");
        dataToReturn = {
            validate: true,
            magnet: magnetUri,
            torrent: url
        }
    } else {
        console.log("Torrent Not Validate");
        dataToReturn = {
            validate: false,
            torrent: url
        }
    }
    console.log("Data to return")
    console.log(JSON.stringify(dataToReturn))
    var params = {
        MessageBody: JSON.stringify(dataToReturn),
        QueueUrl: SQS_QUEUE_URL,
    };
    console.log(`Sending notification via SQS: ${SQS_QUEUE_URL}.`);
    try {
        await sqs.sendMessage(params).promise(); // since your handler returns a promise, lambda will only resolve after sqs responded with either failure or success
    } catch (err) {
        console.log(err)
    }
    return {
        statusCode: 200,
        body: JSON.stringify(dataToReturn),
    };
}
function convertTorrent(uri) {
    return new Promise(function (resolve, reject) {
        parseTorrent.remote(
            uri, { timeout: 60 * 1000 }, (err, parsedTorrent) => {
                if (err) {
                    console.log("Cannot convert torrent")
                    resolve(undefined);
                }
                else {
                    resolve(parseTorrent.toMagnetURI(parsedTorrent));
                }
            })
    })
}
function checkHttp(url) {
    if (url && !url.startsWith("http")) {
        console.log("Not start with HTTP");
        throw "Not is a torrent . Not start with HTTP"
    }
}