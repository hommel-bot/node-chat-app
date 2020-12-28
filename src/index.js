// use the app module:
const { app, server } = require('./app')

const socketio = require('socket.io')   // returns a function
const io = socketio(server)             // Call the func with the raw HTTP server. Express does not exposes this directly
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// Get the port number form Heroku, or default to 3000
const port = process.env.PORT || 3000
// // Start the server, to listen on the port
// app.listen(port, () => { 
// 	console.log('Server is up on port ' + port)
// })
// For websockets, instead if app.listen, do:
server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})

// Listen for an event
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        //socket.emit('message', {text:'Welcome!', createdAt: new Date().getTime()})
        socket.emit('message', generateMessage('Admin', `Welcome to ${user.room}!`))

        // emit options: socket.emit : to the connection, io,emit : to all connectons
        //      socket.broadcast.emit : to all connections except the current socket connection
        //      io.to.emit : to all in a room,  socket.broadcast.to.emit : to all in the room except socket

        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined ${user.room}!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed')
        }
      
        const user = getUser(socket.id)
        if (!user) { return callback('Server error - please reconnect') }

        io.to(user.room).emit('message', generateMessage(user.username, msg))
        
        callback()
    })

    socket.on('sendLocation', (coords, ackCallback) => {
        const user = getUser(socket.id)
        if (!user) { return ackCallback('Server error - please reconnect') }

        // https://www.google.com/maps?q=-25.811,28.278
        //io.emit('message', 'Location: Lat '+coords.latitude + '  Long ' + coords.longitude)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        ackCallback()
    })

    // NB: set on disconnect _inside_ the on connection event
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
          io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
          io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
          })
        }
    })
}) 