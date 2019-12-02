function sendLocation(loc, lat, lng) {
  $.ajax({
    url: "/weather",
    data: {
      location: loc,
      latitude: lat,
      longitude: lng
    },
    success: function (data) {
      document.getElementById('weatherGrid').innerHTML = data;
    }
  });
}

function get(name){
   if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
}

function getLocation() {
  if ("geolocation" in navigator) {
    // check if geolocation is supported/enabled on current browser
    navigator.geolocation.getCurrentPosition(
      function success(position) {
      // for when getting location is a success
      sendLocation(get('location'), position.coords.latitude, position.coords.longitude)
    },
      function error(error_message) {
      // for when getting location results in an error
      console.error('An error has occured while retrieving' + 'location', error_message)
    });
  } else {
    // geolocation is not supported
    // get your location some other way
    console.log('geolocation is not enabled on this browser')
  }
}