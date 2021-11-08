# Some request examples
curl -H "Content-Type: application/json" -X POST -d '{"body": "Hi there"}' http://localhost:5000/posts
curl -H "Content-Type: application/json" -X POST -d '{"title": "New post", "body":"Post at 15:33"}' http://localhost:5000/posts
curl -H "Content-Type: application/json" -X POST -d '{"title": "New post", "body":"Post at 16:15", "userId":10}' http://localhost:5000/posts

curl localhost:5000/posts

# Restart application
curl -X POST localhost:5000/json-server/restart

# Reset the entire database - It only works for S3 source
curl -H "Content-Type: application/json" -X PUT --data-binary '@db.json' http://localhost:5000/db
curl -H "Content-Type: application/json" -X PUT --data-binary '@db.json' http://localhost:5000/db

# Change the source
curl -H "Content-Type: application/json" -X PUT -d '{"source":"http://jsonplaceholder.typicode.com/db"}' http://localhost:5000/json-server/source
curl -H "Content-Type: application/json" -X PUT -d '{"source":"s3://some-bucket/example-db.json"}' http://localhost:5000/json-server/source
