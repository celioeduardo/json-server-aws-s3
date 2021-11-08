const Base = require('lowdb/adapters/Base')
const AWS = require('aws-sdk')
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
const { humanFileSize, s3UriToParams } = require('./utils')

class S3Adapter extends Base {

  constructor(source,options) {
    super(source, options)
    this.lastData = null
    this.writing = false
  }

  read() {
    
    console.log(`Fetching data from ${this.source}`)
    const startTime = performance.now()

    const params = s3UriToParams(this.source)
    
    return s3.getObject(params).promise()
      .then((res) => {
        const trimmed = res.Body.toString('utf-8')
        const timeDiff = performance.now() - startTime
        console.log(`Finish reading ${humanFileSize(res.Body.length)} in ${Math.round(timeDiff)} miliseconds`)
        return trimmed ? this.deserialize(trimmed) : this.defaultValue
      })
      .catch(e => {
        if (e.statusCode == 404)
          return {}
          
        if (e instanceof SyntaxError) {
          e.message = `Malformed JSON in file: ${this.source}\n${e.message}`
        }
        throw e
      })
  }

  write(data) {

    this.lastData = data

    if (this.writing){      
      console.log('Writing is running... scheduled')
      return
    } 

    this.writing = true

    const json = this.serialize(this.lastData)

    this.lastData = null

    const params = s3UriToParams(this.source)
    params.ContentType = 'application/json'
    params.Body = json
    
    console.log(`Writing to ${this.source}`)
    const startTime = performance.now()
    
    return s3.putObject(params).promise()
      .then((res) => {
        this.writing = false
        const timeDiff = performance.now() - startTime   
        const length = Buffer.byteLength(json, 'utf8')     
        console.log(`Finish writing ${humanFileSize(length)} in ${Math.round(timeDiff)} miliseconds`)

        if (this.lastData != null){
          console.log('There is more data to upload')
          this.write(this.lastData)
        }

      })
      .catch(err => {
        this.writing = false
        throw err
      })
  }

}

module.exports = S3Adapter