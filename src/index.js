const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter =require('bad-words')
const { ifError } = require('assert')
const {genrateMessage,genratelocation}=require('./utils/messages')
const {addUser,removeUser,getUser,getUserInRoom}=require('./utils/users')

const app= express()
const server=http.createServer(app)
const io=socketio(server)

const port=process.env.PORT || 3000
const publicDirectory= path.join(__dirname,'../public')

app.use(express.static(publicDirectory))

io.on('connection',(socket)=>{
    console.log('New WebSocket connection')

    socket.on('join',({username,room},callback)=>{

        const {error,user}= addUser({
            id: socket.id,
            username,
            room})

        if(error)
        {
            return callback(error)
        }

        socket.join(user.room)
       
        socket.emit('message',genrateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',genrateMessage(`${user.username} has joined!`))
        
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMssg',(mssg,callback)=>{

        const filter =new Filter()

        const user=getUser(socket.id)

        if(filter.isProfane(mssg))
        {
            return callback('gali mat bhejo')
        }

        io.to(user.room).emit('message',genrateMessage(user.username,mssg))
        callback()
    })

    socket.on('disconnect',()=>{

       const user= removeUser(socket.id)

       if(user){
        io.to(user.room).emit('message',genrateMessage(user.username,`has left!! `))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInRoom(user.room)
        })
    }
    })

    socket.on('sendLocation',(coords,callback)=>{

        
         const user=getUser(socket.id)

         io.to(user.room).emit('LocationMessage',genratelocation(user.username,`https://google.com/maps?=${coords.lat},${coords.long}`))

         callback()
    })

})

server.listen(port,()=>{
    console.log(`Server is up on port ${port}`)
})