function getDataByURL(url, datos, obtainedData) {
  $.ajax({
    url: url,
    data: datos,
    success: function(data) {
      obtainedData(data); 
    }
  });
}

function initializeSwiper() {
  var swiper = new Swiper('.swiper-container', {
      slidesPerView: 4,
      spaceBetween: 30,
      freeMode: true,
    });
}

function getDetailedWeatherByLocation(loc) {
  let url = '/detailed';
  let data = {
    location: loc
  };

  getDataByURL(
    url,
    data, 
    function(o){
      document.getElementById('weatherGrid').innerHTML = o;
    }
  );
}

function getDetailedWeatherByCoordinates(lat, lng) {
  var url = '/detailed';
  var data = {
    latitude: lat,
    longitude: lng
  };

  getDataByURL(
    url,
    data, 
    function(o){
      document.getElementById('weatherGrid').innerHTML = o;
    }
  );
}

function getPrevisionWeatherByLocation(loc) {
  let url = '/prevision';
  let data = {
    location: loc
  };

  getDataByURL(
    url,
    data, 
    function(o){
      document.getElementById('previsionBlock').innerHTML = o;
      initializeSwiper();
    }
  );
}

function getPrevisionWeatherByCoordinates(lat, lng) {
  var url = '/prevision';
  var data = {
    latitude: lat,
    longitude: lng
  };

  getDataByURL(
    url,
    data, 
    function(o){
      document.getElementById('previsionBlock').innerHTML = o;
      initializeSwiper();
    }
  );
}

function get(name) {
  if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
    return decodeURIComponent(name[1]);
}

function getFullWeather() {
  var location = get('location');

  if (location) {
    getDetailedWeatherByLocation(location);
    getPrevisionWeatherByLocation(location)
  } else if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function success(position) {
        getDetailedWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
        getPrevisionWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
      },
      function error(error_message) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
      }
    );
  } else {
    console.error('No se especificó ningún lugar ni se pudo obtener una ubicación');
    return
  }
  initializeSwiper();
}

$(function () {
  getFullWeather();
});
