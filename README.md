# meteo-app
Codigo fuente de meteo, una [Progresive Web App (PWA)](https://ionicframework.com/docs/intro/what-are-progressive-web-apps "What a PWA is")

Consulta la información del tiempo en tu zona haciendo uso de la API de [ipgeolocation](https://ipgeolocation.io/documentation.html) (opcional), la API de [Google Places](https://cloud.google.com/maps-platform/places/), la API de la [AEMET](https://opendata.aemet.es/dist/index.html).

## Como se organiza
- Backend: Express sobre Node.js
- Frontend: Pug.js (HTML5), CSS y JavaScript.

## Prerequisitos
- Claves para las respectivas APIs
- Tener instalado [Node.js](https://nodejs.org/)
- Un navegador compatible ;)

## Instrucciones
```sh
git clone https://github.com/MrAnnix/meteo-app.git
cd meteo-app
```

Renombra el fichero `./data/APIKeys_template.json` a `./data/APIKeys.json` y edítalo con tus claves.

```sh
npm install
npm start
```

Navegar desde el navegador a [http://localhost:8080/](http://localhost:8080/)

Para ver una demo puedes acceder [aquí](https://meteo.raulsanmartin.me/), si lo haces desde un navegador móvil incluso podrás instalarla como una app más.
