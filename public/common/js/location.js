function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
    console.log("Geolocation is supported by this browser.");
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}


function sendLocation() {
  console.log(position);
  $.ajax({
    type: "GET",
          url: "/search",
          data: {latitude: position.coords.latitude, longitude: position.coords.longitude}
  });
}

getLocation();
sendLocation();