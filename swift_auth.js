'use strict';

var request = require('request'),
 	Q = require('q'),
 	authenticate = {};

module.exports = function(authurl, user, key){
	return function(){
		var deferred = Q.defer();

		request(
		{
			method: 'GET',
			uri: authurl,
			headers: {
				'X-Auth-User': user,
				'X-Auth-Key':key
			}
		}, function(error,response,body){
			if(!error && response.statusCode == 200){
				var token = response.headers["x-auth-token"];
				var url = response.headers["x-storage-url"];
				deferred.resolve({token:token,url:url});
			} else {
				console.log(error);
				deferred.reject(error);
			}
		});
		return deferred.promise;
	}
};