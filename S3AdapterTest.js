const low = require('lowdb')
const S3Adapter = require("./S3Adapter")

source = 's3://some-bucket/example-db.json'

const adapter = new S3Adapter(source)
const db = low(adapter)

function main(db){
  const post = db
    .get('posts')
    .find({ id: 100})
    .value()

  console.log(post)
}

db.then(main)