const path = require('path')
const http = require('http')
const express = require("express")
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')



const app = express()
//server is a raw http server. We need it to use socket io because socket io requires a raw http server
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))
const port = process.env.PORT || 3000


io.on('connection', (socket) => {


    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        })

        if (error) {
            return callback(error)
        }
        socket.join(user.room)


        socket.emit('message', generateMessage('Server', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Server', `${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))

        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (!user) {
            return
        }
        io.to(user.room).emit('message', generateMessage('Server', `${user.username} has left!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    socket.on('sendLocation', (data, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `http://google.com/maps?q=${data.latitude},${data.longitude}`))
        callback()
    })


})





server.listen(port, () => {
    console.log("Server is running on port", port)
})