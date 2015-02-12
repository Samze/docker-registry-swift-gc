'use strict';

var request = require('request'),
	memoize = require('memoizee'),
 	Q = require('q'),
 	action,
 	swift_auth,
	envVariables = [],
	missingEnvVariables = [];

envVariables.push({name:'OS_USERNAME',value:process.env.OS_USERNAME});
envVariables.push({name:'OS_PASSWORD',value:process.env.OS_PASSWORD});
envVariables.push({name:'OS_AUTH_URL',value:process.env.OS_AUTH_URL});
envVariables.push({name:'CONTAINER',value:process.env.CONTAINER});

envVariables.forEach(function(ele){
	if(typeof ele.value === 'undefined') {
		missingEnvVariables.push(ele.name);
	}
});

if (missingEnvVariables.length > 0) {
	console.log('Cannot start glance service. Missing the following environment variables: ' +
			missingEnvVariables);
	process.exit(1);
}

swift_auth = require('./swift_auth.js')(process.env.OS_AUTH_URL,process.env.OS_USERNAME,process.env.OS_PASSWORD);

swift_auth()
.then(function(result){
	var OS_SWIFT_URL = result.url;
	var OS_SWIFT_TOKEN = result.token;

	if(OS_SWIFT_URL && OS_SWIFT_URL){
		console.log('Successfully Authenticated');
	} else {
		console.log('Auth failed.');
		process.exit(1);
	}

	var OS_SWIFT_CONTAINER_URL = OS_SWIFT_URL + '/' + process.env.CONTAINER;
	var swiftCalls = require('./swift_calls.js')(OS_SWIFT_CONTAINER_URL,OS_SWIFT_TOKEN);

	switch (process.argv[2]) {
		case 'summary':
			swiftCalls.getListOfTaggedImages()
			.then(function(taggedImages){
				console.log('Total tags: ' + taggedImages.length);
				
				swiftCalls.getAllImages()
				.then(function(allImages){
					console.log('Total image layers: ' + allImages.length);
					
					swiftCalls.getUnusedImages()
					.then(function(unusedImages){
							console.log('Unused image layers: ' + unusedImages.length);
					});
				});
			});
			break;
		case 'delete_unused':
			//TODO
			process.exit(1);			
			break;
		case 'list':
			action = function(list){ console.log(list);}
			break;
		case 'count':
			action = function(list){ console.log(list.length);}
			break;
		default:
			console.log('first param can be: summary, list, count');
			break;
	}

	if(process.argv[2] != 'summary'){
		switch (process.argv[3]) {
			case 'all_images':
				swiftCalls.getAllImages()
				.then(function(allImages){
					action(allImages);
				});
				break;

			case 'tagged':
				swiftCalls.getListOfTaggedImages()
				.then(function(taggedImages){
					action(taggedImages);
				});
				break;

			case 'unused_images':
				swiftCalls.getUnusedImages()
				.then(function(images){
					action(images);
				});
				break;
			case 'used_images':
				swiftCalls.getListOfUsedImages()
				.then(function(images){
					action(images);
				});
				break;
			default:
				console.log('second parm can be: all_images, tagged, unused_images, used_images');
				break;
		}
	}
});