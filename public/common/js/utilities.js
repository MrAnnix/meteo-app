function getDataByURL(url, datos, obtainedData) {
  $.ajax({
    url: url,
    data: datos,
    success: function(data) {
      obtainedData(data); 
    }
  });
}

String.prototype.replaceAll = function(str1, str2, ignore) 
{
  return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function initializeSwiper() {
  var slidesNumHours = 0.01 * $(window).width();
  var slidesNumDays = slidesNumHours;
  if (slidesNumDays > 6) {
    slidesNumDays = 6;
  }

  var swiperDays = new Swiper('.slider-days', {
      slidesPerView: slidesNumDays,
      spaceBetween: 30,
      freeMode: true,
    });
  
  var swiperHours = new Swiper('.slider-hours', {
      slidesPerView: slidesNumHours,
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

function getActualWeatherByLocation(loc) {
  let url = '/weather';
  let data = {
    location: loc  
  };

  getDataByURL(
    url,
    data, 
    function(o){
      document.getElementById('fullWeather').innerHTML = o;
      initializeSwiper();
    }
  );
}

function getActualWeatherByCoordinates(lat, lng) {
  var url = '/weather';
  var data = {
    latitude: lat,
    longitude: lng
  };

  getDataByURL(
    url,
    data, 
    function(o){
      document.getElementById('fullWeather').innerHTML = o;
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
    getActualWeatherByLocation(location);
  } else if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function success(position) {
        getActualWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
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

function getDetailedWeather() {
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

$('#searchPlace').text(function(){
  var texto = get('location');
	if (texto) {
		this.value = texto.replaceAll('+', ' ');
	}
});
