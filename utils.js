const http = require('http')
const https = require('https')
const AWS = require('aws-sdk')
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

exports.humanFileSize = (size) => {
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}
function s3UriToParams(s3Uri){

  const url = new URL(s3Uri)
  const pathname = url.pathname.startsWith("/") ? url.pathname.replace("/", "") : url.pathname

  return params = {
    Bucket: url.host,
    Key: pathname
  }

}
exports.s3UriToParams = s3UriToParams

exports.sendToS3 = (jsonObject, source) => {
  
  const json = typeof jsonObject == "object" ? JSON.stringify(jsonObject, null, 2) : jsonObject
  
  const params = s3UriToParams(source)
  
  params.ContentType = 'application/json'
  params.Body = json

  return s3.putObject(params).promise()

}

function isURL(s){
  return /^(http|https):/.test(s)
}
exports.isURL = isURL

exports.isS3 = (s) => {
  return /^s3:/.test(s)
}

exports.isFILE = (s) => {
  return !isURL(s) && /\.json$/.test(s)
}

exports.httpGet = (source) => {
  return new Promise((resolve, reject) => {
    const sourceUrl = new URL(source)
    // Pick the client based on the protocol scheme
    const client = sourceUrl.protocol === 'https:' ? https : http

    client
      .get(sourceUrl, (res) => {
        let dbData = ''
        res.on('data', (data) => {
          dbData += data
        })

        res.on('end', () => {
          resolve(dbData)
        })
      })
      .on('error', (error) => {
        return reject(error)
      })
  })
}
