

var AWS = require("aws-sdk");
var sns = new AWS.SNS();
const parseTorrent = require('parse-torrent')

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
    if (magnetUri) {
        return {
            validate: true,
            magnet: magnetUri,
            torrent: url
        }
    } else {
        return {
            validate: false,
            torrent: url
        }
    }
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