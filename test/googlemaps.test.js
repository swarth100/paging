let maps = require('../app/models/googlemaps/googlemaps');
let avgTimes = require('../app/models/googlemaps/average-times');

let should = require('should');
let chai = require('chai');
let sinon = require('sinon');

describe('GoogleMaps', function() {
    describe('convertFormat', function() {
        it('should convert properly', function() {
            let dummySearch = {
                place_id: 'id',
                geometry: {location: {lat: 1, lng: 1}},
            };
            let dummyType = 'museum';

            let dummyResult = maps.convertFormat(dummySearch, dummyType);

            dummyResult.should.have.properties({
                id: 'id',
                avgtime: avgTimes[dummyType],
                latitude: 1,
                longitude: 1,
            });
        });
    });

    describe('chooseRandomPlaces', function() {
        it('should choose places at random', function() {
            let dummyPlaces = ['e1', 'e2', 'e3', 'e4', 'e5'];
            let dummyArgument = dummyPlaces.slice(0);
            let dummyResult = maps.chooseRandomPlaces(dummyArgument);

            dummyResult.should.have.length(dummyPlaces.length);
            dummyResult.should.containDeep(dummyPlaces);
        });
    });

    describe('convertFormatOfPlaces', function() {
        it('should convert a list properly', function() {
            let dummySearch = [{
                place_id: 'id',
                geometry: {location: {lat: 1, lng: 1}},
            }];
            let dummyType = 'museum';

            let dummyResult = maps.convertFormatOfPlaces(dummySearch, dummyType);

            dummyResult.should.have.length(1);
            dummyResult[0].should.have.properties({
                id: 'id',
                avgtime: avgTimes[dummyType],
                latitude: 1,
                longitude: 1,
            });
        });
    });

    describe('extractQueryData', function() {
        it('should extract correct data from the given query', function() {
            let dummyRandom = 'random';
            let dummyLocation = {lat: dummyRandom, lng: dummyRandom};

            let dummyQueryData = {
               location: JSON.stringify(dummyLocation),
               datetime: dummyRandom,
               avgtime: dummyRandom,
               radius: dummyRandom,
               type: dummyRandom,
            };

            let dummyResult = maps.extractQueryData(dummyQueryData);

            dummyResult.should.have.size(3);
            dummyResult.should.have.properties({
                location: dummyLocation,
                radius: dummyRandom,
                name: dummyRandom,
            });
        });
    });

    describe('cleanDatabase', function() {
        it('should clean database successfully', function() {
            let dummyResolveData = 'dummyResolveData';
            let cleanFunction = sinon.stub().resolves(dummyResolveData);

            maps.cleanDatabase(cleanFunction);

            chai.assert(cleanFunction.calledOnce);
        });

        it('should fail to clean database', function() {
            let dummyError = 'dummyError';
            let cleanFunction = sinon.stub().rejects();

            maps.cleanDatabase(cleanFunction);

            chai.assert(cleanFunction.calledOnce);
        });
    });

    describe('cleanDatabase', function() {

    });
});
