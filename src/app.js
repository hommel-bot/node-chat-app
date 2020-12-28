
const path=require('path')
// http is only needed if socket.io will be used
const http = require('http')
// Import Express
const express = require('express')
// Express provides a single function you can call to create a new Express application
const app = express() 
// For socketio:
const server = http.createServer(app)
// express.json is set to parse incoming JSON into a JavaScript object which you can access on req.body. 
app.use(express.json())
// Specify the static files directory:
const publicDirectoryPath = path.join(__dirname, '../public') 
app.use(express.static(publicDirectoryPath)) 
// Export the Express app:
module.exports = {app, server}