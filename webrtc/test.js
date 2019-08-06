process.env.NODE_ENV = 'test';
const { ObjectID } = require('mongodb')

// Mongoose
//const { mongoose } = require('./db/mongoose');
const Restaurant = require('./models/restaurant').Restaurant

//Require the dev-dependencies
const chai = require('chai');
const server = require('./server');
const request = require("request");
const expect = require("chai").expect;
const datetime = require('date-and-time');


function POSTObjRest(name,desc){
	return {
		url:"http://localhost:3000/restaurants",
		json: {
			"name": name,
			"description": desc
		}
	};
}
function POSTObjRes(time,ppl,id){
	return {
		url:`http://localhost:3000/restaurants/${id}`,
		json: {
			"time": time,
			"people": ppl
		}
	};
}

function serverPath(id,resv_id){
	if (id){
		if(resv_id){
			return {
				url:`http://localhost:3000/restaurants/${id}/${resv_id}`
			};
		} else {
			return {
				url:`http://localhost:3000/restaurants/${id}`
			};
		}
	}
	return {
		url:`http://localhost:3000/restaurants`
	};
}

function serverPathWithBody(id,resv_id,time,ppl){
	if (id){
		if(resv_id){
			return {
				url:`http://localhost:3000/restaurants/${id}/${resv_id}`,
				json: {
					"time": time,
					"people": ppl
				}
			};
		} else {
			return {
				url:`http://localhost:3000/restaurants/${id}`,
				json: {
					"time": time,
					"people": ppl
				}
			};
		}
	}
	return {
		url:`http://localhost:3000/restaurants`,
		json: {
			"time": time,
			"people": ppl
		}
	};
}

function tryFunction(tryFcn){
	try {
		tryFcn();
	} catch(e){
		throw e;
	}
}

function tryFunctionNested(tryFcn1,tryFcn2,tryFcn3,tryFcn4){
	tryFunction(() => {
		try{
			tryFcn1;
		} catch(e) {
			try {
				tryFcn2;
			} catch(e){
				try{
					tryFcn3;
				} catch(e) {
					tryFcn4;
				}
			}
		}
	});
}

const name1 = "CSC309SushiAYCE";
const name2 = "CSC309SushiBar";
const name3 = "CSC309";

const desc1 = "only $19.99!";
const desc2 = "half price Tuesday!";
const desc3 = "mongo and mocha!";
const desc4 = "duplicate name"

const time1 = "Mar 17 2019 18:15:00";
const time2 = "Mar 18 2019 18:15:00";
const time3 = "Mar 18 2019 18:25:00";
const time4 = "Mar 17 2019 17:15:00";

const ppl1 = 5;
const ppl2 = 2;
const ppl3 = 8;
const ppl4 = 7;


describe('Testing POST /restaurants', function () {
	before('connect', function(){
		return require('./db/mongoose');
	})

	beforeEach(function () {
		this.timeout(10000);
		return Restaurant.deleteMany({});
	});
	
	it('Request returns added restaurant', function(done) {
		request.post(POSTObjRest(name1,desc1), function(error, res, body) {
			tryFunction(function () {
				try {
					expect(body).to.include({"name":name1,"description":desc1});
				}catch(e){
					expect(body.restaurant).to.include({"name":name1,"description":desc1});
				}
			})
			
			done();
		})
		
	});
	it('MongoDB contains added restaurant', function(done) {
		request.post(POSTObjRest(name1,desc1), function(error, res, body) {
			Restaurant.findById(body._id, (err, restaurant) => {
				if (!restaurant)
					throw new Error("Entry not found");
				
				expect(restaurant).to.include({"name":name1,"description":desc1});
				done();
			});
		})
	});
	it('Request returns added restaurant with reservation', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		rest1.save((err,result1) => {
			request.post(POSTObjRes(time1,ppl1,result1._id), function(error, res, body) {
				
				expect(body.restaurant).to.include({"name":name1,"description":desc1});
				expect(body.reservation).to.include({"time":time1,"people":ppl1});
				done();
			})
		});
	});
	it('MongoDB contains added reservation', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		rest1.save((err,result1) => {
			request.post(POSTObjRes(time1,ppl1,result1._id), function(error, res, body) {
				Restaurant.findById(result1._id, (err, restaurant) => {
					if (!restaurant)
						throw new Error("Entry not found");
					
					expect(restaurant).to.include({"name":name1,"description":desc1});
					expect(restaurant.reservations[0]).to.include({"time":time1,"people":ppl1});
					
					done();
				});
			})
		});
	});
});

describe('Testing GET /restaurants', function () {
	before('connect', function(){
		return require('./db/mongoose');
	})

	beforeEach(function () {
		this.timeout(10000);
		return Restaurant.deleteMany({});
	});
	
	it('Request returns added restaurants', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		const rest2 = new Restaurant ({
			name: name2,
			description: desc2
		});
		
		rest1.save((err,result1) => {
			rest2.save((err,result2) => {
				request.get(serverPath(), function(error, res, body) {
					tryFunction(function () {
						try{
							expect(JSON.parse(body)[0]).to.include({"name":name1,"description":desc1});
							expect(JSON.parse(body)[1]).to.include({"name":name2,"description":desc2});
						}catch(e){
							try{
								expect(JSON.parse(body).restaurants[0]).to.include({"name":name1,"description":desc1});
								expect(JSON.parse(body).restaurants[1]).to.include({"name":name2,"description":desc2});
							}catch(e){
								expect(JSON.parse(body).restaurant[0]).to.include({"name":name1,"description":desc1});
								expect(JSON.parse(body).restaurant[1]).to.include({"name":name2,"description":desc2});
							}
							
						}
					})
					done();
				});
			});
		});
	});
	it('Request returns the specified restaurant', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		const rest2 = new Restaurant ({
			name: name2,
			description: desc2
		});
		
		rest1.save((err,result1) => {
			rest2.save((err,result2) => {
				request.get(serverPath(result1._id), function(error, res, body) {
					tryFunction(function () {
						try{
							expect(JSON.parse(body)).to.include({"name":name1,"description":desc1});
						}catch(e){
							expect(JSON.parse(body).restaurant).to.include({"name":name1,"description":desc1});
						}
					})
					done();
				});
			});
		});
	});
	it('Request returns the specified reservation', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		const rest2 = new Restaurant ({
			name: name2,
			description: desc2
		});
		
		const res1 = rest1.reservations.create({time:time1,people:ppl1});
		rest1.reservations.push(res1);
		rest1.save((err,result1) => {
			rest2.save((err,result2) => {
				request.get(serverPath(result1._id,result1.reservations[0]._id), function(error, res, body) {
					tryFunction(function () {
						try{
							expect(JSON.parse(body)).to.include({"time":time1,"people":ppl1});
						}catch(e){
							expect(JSON.parse(body).reservation).to.include({"time":time1,"people":ppl1});
						}
					})
					
					done();
				});
				
			});
		});
	});
});

describe('Testing DELETE /restaurants/<restaurant_id>/<reservation_id>', function () {
	before('connect', function(){
		return require('./db/mongoose');
	})

	beforeEach(function () {
		this.timeout(10000);
		return Restaurant.deleteMany({});
	});
	
	it('Request returns deleted reservation', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		const rest2 = new Restaurant ({
			name: name2,
			description: desc2
		});
		
		const res1 = rest1.reservations.create({time:time1,people:ppl1});
		rest1.reservations.push(res1);
		rest1.save((err,result1) => {
			rest2.save((err,result2) => {
				request.del(serverPath(result1._id,result1.reservations[0]._id), function(error, res, body) {
					
					expect(JSON.parse(body).restaurant).to.include({"name":name1,"description":desc1});
					expect(JSON.parse(body).reservation).to.include({"time":time1,"people":ppl1});
					done();
				});
			});
		});
	});
	it('Request deleted reservation on MongoDB', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		const rest2 = new Restaurant ({
			name: name2,
			description: desc2
		});
		
		const res1 = rest1.reservations.create({time:time1,people:ppl1});
		rest1.reservations.push(res1);
		rest1.save((err,result1) => {
			rest2.save((err,result2) => {
				request.del(serverPath(result1._id,result1.reservations[0]._id), function(error, res, body) {
					Restaurant.findById(result1._id, (err, restaurant) => {
						expect(restaurant.reservations).eql([]);
						done();
					});
				});
			});
		});
	});
});

describe('Testing PATCH /restaurants/<restaurant_id>/<reservation_id>', function () {
	before('connect', function(){
		return require('./db/mongoose');
	})

	beforeEach(function () {
		this.timeout(10000);
		return Restaurant.deleteMany({});
	});
	
	it('Request returns updated reservation', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		const rest2 = new Restaurant ({
			name: name2,
			description: desc2
		});
		
		const res1 = rest1.reservations.create({time:time1,people:ppl1});
		rest1.reservations.push(res1);
		rest1.save((err,result1) => {
			rest2.save((err,result2) => {
				request.patch(serverPathWithBody(result1._id,result1.reservations[0]._id,time1,ppl1), function(error, res, body) {
					
					expect(body.restaurant).to.include({"name":name1,"description":desc1});
					expect(body.reservation).to.include({"time":time1,"people":ppl1});
					done();
				});
			});
		});
	});
	it('Request updated reservation on MongoDB', function(done) {
		const rest1 = new Restaurant ({
			name: name1,
			description: desc1
		});
		const rest2 = new Restaurant ({
			name: name2,
			description: desc2
		});
		
		const res1 = rest1.reservations.create({time:time1,people:ppl1});
		rest1.reservations.push(res1);
		rest1.save((err,result1) => {
			rest2.save((err,result2) => {
				request.patch(serverPathWithBody(result1._id,result1.reservations[0]._id,time1,ppl2), function(error, res, body) {
					Restaurant.findById(result1._id, (err, restaurant) => {
						if(!restaurant)
							throw new Error("Restaurant not found");
						
						expect(restaurant.reservations.id(result1.reservations[0]._id)).to.include({"time":time1,"people":ppl2});
						done();
					});
				});
			});
		});
	});
});

	
	

