let maps = require('../app/models/googlemaps/googlemaps');
let avgTimes = require('../app/models/googlemaps/average-times');
let mongooseLocation = require('../app/models/mongoose/location');

let googleMapsClient = require('@google/maps').createClient({
    // key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    key: 'AIzaSyD_UOu_gSsRAFFSmEEKmR7fZqgDmvmMJIg',
    Promise: Promise,
});

let should = require('should');
let chai = require('chai');
let sinon = require('sinon');
let assert = require('assert');

describe('GoogleMaps', function() {
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

    describe('chooseRandomPlaces', function() {
        it('should choose places at random', function() {
            let dummyPlaces = ['e1', 'e2', 'e3', 'e4', 'e5'];
            let dummyArgument = dummyPlaces.slice(0);
            let dummyResult = maps.chooseRandomPlaces(dummyArgument);

            dummyResult.should.have.length(dummyPlaces.length);
            dummyResult.should.containDeep(dummyPlaces);
        });
    });

    describe('convertFormat', function() {
        it('should convert properly', function() {
            let dummySearch = {
                place_id: 'id',
                geometry: {location: {}},
            };
            let dummyType = 'museum';

            let dummyResult = maps.convertFormat(dummySearch, dummyType);

            dummyResult.should.have.properties({
                id: 'id',
                avgtime: avgTimes[dummyType],
                location: {},
                name: 'easy_to_trace_string',
            });
        });
    });

    describe('convertFormatOfPlaces', function() {
        it('should convert a list properly', function() {
            let dummySearch = [{
                place_id: 'id',
                geometry: {location: {}},
            }];
            let dummyType = 'museum';

            let dummyResult = maps.convertFormatOfPlaces(dummySearch, dummyType);

            dummyResult.should.have.length(1);
            dummyResult[0].should.have.properties({
                id: 'id',
                avgtime: avgTimes[dummyType],
                location: {},
                name: 'easy_to_trace_string',
            });
        });
    });

    // describe('findDistances', function() {
    //     it('should return promise of distances', function () {
    //
    //     })
    // });

    describe('pruneResults', function() {
        it('should return one of one', function() {
            let dummyResults = ['result'];

            // What a horrible dummy...
            let dummyResponse = {json: {rows: [{elements: [{distance: {value: 0}}]}]}};
            let dummyRadius = 1;

            let dummyResult = maps.pruneResults(dummyResults, dummyResponse, dummyRadius);

            dummyResult.should.have.length(1);
            dummyResult[0].should.equal('result');
        });

        it('should return one of two', function() {
            let dummyResults = ['result', 'disregard'];

            // Another horrible dummy...
            let dummyResponse = {json: {rows: [{
                elements: [{distance: {value: 0}}, {distance: {value: 2}}],
            }]}};
            let dummyRadius = 1;

            let dummyResult = maps.pruneResults(dummyResults, dummyResponse, dummyRadius);

            dummyResult.should.have.length(1);
            dummyResult[0].should.equal('result');
        });
    });

    // describe('findInDatabase', function() {
    //     afterEach(function () {
    //         mongooseLocation.find.restore();
    //         maps.saveInDatabase.restore();
    //     });
    //
        // it('should be able to find existent entry in the database', function () {
        //     let dummyValue = 'banana';
        //
        //     sinon.stub(mongooseLocation, 'find').returns(Promise.resolve(dummyValue));
        //     sinon.stub(maps, 'saveInDatabase');
        //
        //     let dummyRandomPlace = {
        //         id: 'id',
        //     };
        //
        //     let dummyResult = maps.findInDatabase(dummyRandomPlace);
        //
        //     assert(mongooseLocation.find.calledWithMatch({id: 'id'}));
        //     sinon.assert.notCalled(maps.saveInDatabase);
        //     // Currently the below line fails because chai-as-promised is
        //     // having problems with the installation.
        //     // chai.expect(dummyResult).to.eventually.equal(dummyResponse);
        //
        //     return dummyResult.then(function (result) {
        //         result.should.equal(dummyValue);
        //     });
        // });
    //
    //     it('should not be able to find a non-existent entry in database', function () {
    //         let dummyReason = 'banana';
    //
    //         sinon.stub(mongooseLocation, 'find').returns(Promise.reject(dummyReason));
    //         sinon.stub(maps, 'saveInDatabase').returns(Promise.resolve('apple'));
    //
    //         let dummyRandomPlace = {
    //             id: 'id',
    //         };
    //
    //         let dummyResult = maps.findInDatabase(dummyRandomPlace);
    //
    //         sinon.assert.calledWith(mongooseLocation.find, {id: 'id'});
    //         sinon.assert.called(maps.saveInDatabase);
    //
    //         return dummyResult.then(function (response) {
    //             response.should.equal('apple');
    //         });
    //     })
    // });

    // describe('saveInDatabase', function () {
        // after(function () {
        //     maps.findName.restore();
        //     mongooseLocation.saveLocation.restore();
        // });
        //
        // it('should store entry in database', function () {
        //     let dummyString = 'response';
        //
        //     sinon.stub(maps, 'findName');
        //     sinon.stub(mongooseLocation, 'saveLocation').returns(Promise.resolve(dummyString));
        //
        //     let dummyRandomPlace = {
        //         id: 'id',
        //     };
        //
        //     let dummyResult = maps.saveInDatabase(dummyRandomPlace);
        //
        //     // assert(maps.findName.calledWithMatch(dummyRandomPlace));
        //
        //     return dummyResult.then(function (response) {
        //         response.should.deepEqual(dummyString);
        //     });
        // })
    // });

    // describe('findName', function () {
        // after(function () {
        //     googleMapsClient.place.restore();
        // });
        //
        // it('should be able to find the name of a place name', function () {
        //     let stubborn = sinon.stub(googleMapsClient, 'place');
        //
        //     maps.findName({id: 'id'});
        //
        //     sinon.assert.calledOnce(stubborn);
        // })
    // });
});
