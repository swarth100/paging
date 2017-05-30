let maps = require('../app/models/googlemaps/googlemaps');
let database = require('../app/models/mongoose/location');
let should = require('should');

describe('GoogleMaps', function() {
    describe('convertFormat', function() {
        it('should convert properly', function() {
            let dummySearchResult = {
                place_id: 'id',
                geometry: {location: {lat: 1, lng: 1}},
            };
            let dummyType = 'museum';

            let convertedResult = maps.convertFormat(dummySearchResult, dummyType);

            convertedResult.should.have.properties({
                id: 'id',
                avgtime: maps.avgTimes[dummyType],
                latitude: 1,
                longitude: 1,
            });
        });
    });

    describe('chooseRandomPlaces', function() {
        it('should choose places at random', function() {

        });
    });
});
