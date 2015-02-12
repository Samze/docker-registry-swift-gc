var request = require('request'),
	memoize = require('memoizee'),
 	Q = require('q'),
	imageRegex = new RegExp('^registry/images/(.+)/_checksum$');

String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

module.exports = function(OS_SWIFT_CONTAINER_URL, OS_SWIFT_TOKEN){
	var module = {};

	function requestPromise(method,uri){
		var deferred = Q.defer();

		request(
		{
			method: method,
			uri: uri,
			headers: {'X-Auth-Token':OS_SWIFT_TOKEN}
		}, function(error,response,body){
			if(!error && response.statusCode == 200){
				deferred.resolve(body);
			} else {
				console.log(error);
				deferred.reject(error);
			}
		});
		return deferred.promise;
	}

	function getListOfImagesDirect(marker_image){
		var url = OS_SWIFT_CONTAINER_URL + (marker_image ? '?marker=' + encodeURI(marker_image) : '');
		return requestPromise('GET',url)
			.then(function(body){
				var results = body.split('\n');
				results = results.slice(0, results.length - 1);

				 //Documented number of max results. http://docs.openstack.org/api/openstack-object-storage/1.0/content/large-lists.html
				if(results.length >= 10000) {
					var lastResult = results[results.length - 1];
					return getListOfImages(lastResult)
					.then(function(recursiveResult){
						var allResults = results.concat(recursiveResult);
						return allResults;
					});
				} else {
					return results;
				}
			});
	}

	var getListOfImages = memoize(getListOfImagesDirect);

	module.getAllImages = function(){
		return getListOfImages()
		.then(function(imageList){
			return imageList.filter(function(item){
				var imageMatch = item.match(imageRegex);
				if(imageMatch){
					return true;
				}
			}).map(function(item){
				var imageMatch = item.match(imageRegex);
				return imageMatch[1];
			});
		});
	};

	module.getListOfTaggedImages = function(){
		return getListOfImages()
		.then(function(imageList){
			return imageList.filter(function(item){
				if(item.indexOf('tag_') > -1){
					return item;
				}
			});
		});
	};

	function getAncestorImagesForImage(image){
		return requestPromise('GET', OS_SWIFT_CONTAINER_URL + '/registry/images/' + image + '/ancestry')
		.then(function(results){
			return JSON.parse(results);
		});
	}

	function getImagesForTag(tag){
		return requestPromise('GET', OS_SWIFT_CONTAINER_URL + '/' + tag)
		.then(function(image){
			return getAncestorImagesForImage(image);
		});
	}

	module.getListOfUsedImages = function(){
		return module.getListOfTaggedImages()
		.then(function(tags){

			var tagImagesPromise = tags.map(function(tag){
				return getImagesForTag(tag);
			});

			return Q.all(tagImagesPromise)
			.then(function(allImagesForTag){
				var imageResultArray = [];
				var imagesSet = {};

				//Flatten array.
				var mergedAllImagesForTag = [].concat.apply([],allImagesForTag);

				//Remove duplicates
				mergedAllImagesForTag.forEach(function(image){
					imagesSet[image] = true;
				});

				//Put back in array
				for(var key in imagesSet){
					imageResultArray.push(key);
				}

				return imageResultArray;
			});
		})
	};

	module.getUnusedImages = function(){
		return module.getAllImages()
		.then(function(allImages){
			return module.getListOfUsedImages()
			.then(function(usedImages){
				return allImages.filter(function(image){
					if(usedImages.indexOf(image) === -1){
						return image;
					}
				});
			});
		});
	}

	return module;
}