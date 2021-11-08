const fs = require('fs').promises
const { constants } = require('fs');

const enableDestroy = require('server-destroy')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const Memory = require('lowdb/adapters/Memory')
const S3Adapter = require('./S3Adapter')
const { isURL, isS3, httpGet, sendToS3, isFILE } = require('./utils')
const AWS = require('aws-sdk')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

const app_params = {
  name: '',
  source: null,
  port: 5000
}

function load(source) {

  if (isS3(source)) {
    console.log('Source is a S3 URI')
    return low(new S3Adapter(source))
  
  } else if (isURL(source)) {
    console.log('Source is a HTTP URL')
    return httpGet(source)
      .then((dbData) => low(new Memory()).setState(JSON.parse(dbData)))
  
  } else if (isFILE(source)) {
    return fs.access(source, constants.W_OK)
      .then(_ => low(new FileAsync(source)))
      .catch(_ => {
        return fs.readFile(source, 'utf8')
          .then((dbData) => low(new Memory()).setState(JSON.parse(dbData)))
          .then((lowDb) => {
            console.log('LowDb Memory adapter')
            return lowDb
          })
      })
  } else {
    throw Error(`Can't load source ${source}`)
  }

}

function listen(db) {

  let server = null

  const jsonServer = require('json-server')

  const middlewares = jsonServer.defaults()

  const app = jsonServer.create()

  const customRoutes = {
    '/api/*': '/$1'
  }
  app.get('/api/__rules', (req, res) => res.json(customRoutes))
  
  app.use(jsonServer.rewriter(customRoutes))
  
  const router = jsonServer.router(db)
  
  app.use(middlewares)

  app.post("/db-upload", upload.single('db'), (req, res, next) => {
    return fs.readFile(req.file.path, 'utf8')
      .then((data) => {
        if (!isS3(app_params.source)) {
          res.status(400).send("Not support for this type of source. It only supports S3 source")
          return;
        }
    
        return sendToS3(data, app_params.source)
          .then(() => {
            res.sendStatus(200)
            restart(server)
          })
          .catch((err) => res.status(500).send(err))
      })
      .then(() => fs.rm(req.file.path))
    
  })

  app.use(jsonServer.bodyParser)

  app.post('/json-server/restart', (req, res) => {
    res.sendStatus(200)
    res.end()
    restart(server)
  })

  app.put('/db', (req, res) => {
    if (!isS3(app_params.source)) {
      res.status(400).send("Not support for this type of source. It only supports S3 source")
      return;
    }

    return sendToS3(req.body, app_params.source)
      .then(() => {
        res.sendStatus(200)
        restart(server)
      })
      .catch((err) => res.status(500).send(err))
    
  })

  app.get('/json-server/name', (req, res) => {
    res.status(200).send(app_params.name)
  })

  app.get('/json-server/source', (req, res) => {
    res.status(200).send(app_params.source)
  })

  app.put('/json-server/source', (req, res) => {
    const newSource = req.body.source
    if (!newSource) {
      res.status(400).send("source can't be empty")
      return
    }

    console.log(`Changing the source to ${newSource}`)
    app_params.source = newSource
    res.sendStatus(200)
    restart(server)
  })


  app.use(router)

  server = app.listen(app_params.port, () => {
    console.log(`JSON Server is running on port ${app_params.port}`)
  })

  enableDestroy(server)

  return server
}

function restart(server) {
  console.log("Restarting server...")
  return server && server.destroy(() => start())
}

function start() {
  return load(app_params.source)
    .then((db) => listen(db))
}

function init() {
  return new Promise((resolve, reject) => {
    app_params.name = process.env.NAME || ''
    app_params.source = process.env.DB_SOURCE

    app_params.port = process.env.PORT || 5000

    if (!app_params.source)
      reject("Source can't be empty.")
    else
      resolve(app_params)
  })
}

init()
  .then(() => start())
  .then((s) => console.log("I'm ready!"))
  .catch((err) => console.error(err))