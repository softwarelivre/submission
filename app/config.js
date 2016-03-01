(function() {
  "use strict";

  angular
    .module('segue.submission')
    .constant('Config', {
      API_HOST: 'http://backend.segue.org',
      API_PATH: '/api',
      GEOIP_API: 'http://ip-api.com/json',
      GOOGLE_GEO_API: 'http://maps.googleapis.com/maps/api/geocode/json',
      PAGSEGURO_CHECKOUT: 'https://pagseguro.uol.com.br/v2/checkout/payment.html',
      PROPOSAL_LANGUAGES: [
        { abbr: 'pt', name: 'português' },
        { abbr: 'es', name: 'espanhol' },
        { abbr: 'en', name: 'inglês' },
      ],
      PROPOSAL_LEVELS: [ "beginner", "advanced" ],
      TIMEZONE: "-0300"
    });

})();
