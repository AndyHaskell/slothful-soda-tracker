//Globals
var mapData = {
  socket  :  null, //Your socket.io connection
  map     :  null, //The Google Map
  markers :  {},   //Google Maps markers for every user's position
  you     : {
    id : '',       //Your socket.io connection ID
    pos: null      //Your coordinates in a Google Maps LatLng
  }
}

var freshPond = {lat: 42.388282, lng: -71.153968} //Cambridge Fresh Pond

//Create a new Google Map centered at the Cambridge Fresh Pond
var initMap = function(){
  var opt = {
    center   : freshPond,
    zoom     : 13,
    mapTypeId: google.maps.MapTypeId.HYBRID
  }

  mapData.map = new google.maps.Map(document.getElementById('map'), opt)
}

//Initialize the map, start the socket.io connection, and add WASD controls
var init = function(){
  initMap()
  addSocketEvents(io())
  $(document).keydown(WASD)
}

//populateMap creates a Google Maps marker for each user connected to the
//socket.io server and gets rid of any markers that were on the map if the
//user is reconnecting
var populateMap = function(positions, yourId, yourPos){
  var ids     = Object.keys(positions),
      markers = mapData.markers

  //Get rid of any markers that were on the map (if reconnecting after
  //disconnecting)
  markerIds = Object.keys(markers)
  for (var i = 0; i < markerIds.length; i++) {
    markers[markerIds[i]].setMap(null)
    delete(markers[markerIds])
  }

  //Add regular markers for everyone else's positions
  for (var i = 0; i < ids.length; i++) {
    mapData.markers[ids[i]] = new google.maps.Marker({
      position: new google.maps.LatLng(positions[ids[i]].lat,
                                       positions[ids[i]].lng),
      map     : mapData.map
    })
  }

  //Add a hibiscus marker for your position
  mapData.markers[yourId] = new google.maps.Marker({
    position: yourPos,
    map     : mapData.map,
    icon    : {
      url       : 'images/hibiscus.png',
      scaledSize: new google.maps.Size(30, 30)
    }
  })
  mapData.map.panTo(yourPos)
}

var addSocketEvents = function(socket){
  mapData.socket = socket

  /*The 'you joined' event is sent when the server gets your connection and
   *is passed your connection ID and all other users' positions.
   *
   *In the callback, your ID and position variables are initialized, the map
   *is populated, and your position is broadcasted to the other users.
   */
  socket.on('you joined', function(data){
    /*If you're joining the socket.io server for the first time, initialize
     *your coordinates to the Cambridge Fresh Pond. If you're reconnecting,
     *keep your position the same.
     */
    if (mapData.you.id == '')
      mapData.you.pos = new google.maps.LatLng(freshPond.lat, freshPond.lng)
    mapData.you.id = data.yourId

    var yourId  = mapData.you.id,
        yourPos = mapData.you.pos

    populateMap(data.positions, yourId, yourPos) //Populate the map

    //Add yourself on the server side
    socket.emit('update position', {lat: yourPos.lat(), lng: yourPos.lng()})
  })

  /*'update marker' is broadcasted when a user's position updates or a user
   *connects. The event is passed the user's connection ID and updated
   *coordinates.
   *
   *The callback either creates or moves the user's Google maps marker,
   *depending on if the user had just connected or only moved their position.
   */
  socket.on('update marker', function(data){
    var markerId = data.id,
        pos      = new google.maps.LatLng(data.coords.lat, data.coords.lng),
        markers  = mapData.markers

    if (!markers[markerId]) //New connection
      markers[markerId] = new google.maps.Marker({
        position: pos,
        map     : mapData.map
      })
    else                    //Updated position
      markers[markerId].setPosition(pos)
  })

  //'delete marker' is broadcasted when a user disconnects from the socket.io
  //server. Their marker is removed from the map and mapData.markers.
  socket.on('delete marker', function(data){
    var markerId = data

    mapData.markers[markerId].setMap(null)
    delete(mapData.markers[markerId])
  })
}
