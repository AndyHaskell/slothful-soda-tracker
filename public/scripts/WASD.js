//Updates your current position, returning the position as a Google Maps LatLng.
var updatePosition = function(key){
  var lat = mapData.you.pos.lat(),
      lng = mapData.you.pos.lng()

  if (key == "87") //W; move north
    lat += 0.00014
  if (key == "65") //A; move west
    lng -= 0.00020
  if (key == "83") //S; move south
    lat -= 0.00014
  if (key == "68") //D; move east
    lng += 0.00020

  return new google.maps.LatLng(lat, lng)
}

//WASD navigation; update your marker and your position on the server side.
var WASD = function(ev){
  var key = ev.which
  
  if (key == "87" || key == "65" || key == "83" || key == "68") {
    mapData.you.pos = updatePosition(key)

    var yourId  = mapData.you.id,
        yourPos = mapData.you.pos

    mapData.markers[yourId].setPosition(yourPos)
    mapData.map.panTo(yourPos)
  
    mapData.socket.emit('update position',
                          {lat: yourPos.lat(), lng: yourPos.lng()})
  }
}
