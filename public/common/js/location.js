function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function sendLocation() {
  $.ajax({
    type: "GET",
          url: "/search",
          data: {coordinates: location},
          success: function(data){
            alert('Successful');
          },
  });
}

sendLocation();