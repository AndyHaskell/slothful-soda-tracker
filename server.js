var http    = require('http'),
    express = require('express'),
    io      = require('socket.io')

var app    = express(),
    server = http.Server(app),
    ioSvr  = io(server)



app.use('/bower',   express.static(__dirname+"/bower_components"))
app.use('/scripts', express.static(__dirname+"/public/scripts"))
app.use('/styles',  express.static(__dirname+"/public/styles"))
app.use('/images',  express.static(__dirname+"/public/images"))

app.get('/', function(req, res){res.sendFile(__dirname+'/views/index.html')})



var positions = {} //Stores the coordinates for each socket.io connection

//socket.io connection events
ioSvr.on('connection', function(socket){
  //send the user their ID number and all other users' positions
  socket.emit('you joined', {yourId: socket.id, positions: positions})

  console.log(socket.id + " connected")

  //When a user disconnects, delete their connection ID from the positions
  //object and have all other users delete that user's marker.
  socket.on('disconnect', function(){
    delete(positions[socket.id])
    socket.broadcast.emit('delete marker', socket.id)
  })

  //When a user updates their position or connects to the server, update their
  //position in positions and broadcast their new position to the other users.
  socket.on('update position', function(data){
    positions[socket.id] = data
    socket.broadcast.emit('update marker', {id: socket.id, coords: data})
  })
})

server.listen(1123, function(){console.log("Now listening on Port 1123")})
