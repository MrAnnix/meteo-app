function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
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

sendLocation();