/**
 * @author eleventigers / http://jokubasdargis.com/
 */

Util.Loader = function(properties){

	var self = this;
	this.audio = properties.audio || null;
	this.map = {
		sound: {
			loader: function (list, oncomplete, onprogress, onerror){
				if(self.audio) self.audio.buffers.load(list, oncomplete, onprogress, onerror); 	
			},
			cache: []
		},
		freesound: {
			loader: function (list, oncomplete, onprogress, onerror){
				if(self.audio) self.audio.buffers.loadFreesound(list, oncomplete, onprogress, onerror); 	
			},
			cache: []
		}
	};
}

Util.Loader.prototype.constructor = Util.Loader;

Util.Loader.prototype.get = function(cat){
	if(!cat || !this.map.hasOwnProperty(cat)) return this.map;
	return this.map[cat].cache;
};

Util.Loader.prototype.load = function(assets, oncomplete, onprogress, onerror) {

	if(this.audio){

		var self = this;
		var total = 0;
		var toLoad = 0;
		var errors  = 0;
		var cats = [];

		for(k in assets){
			if(assets.hasOwnProperty(k)){
				cats.push(k);
				if( Object.prototype.toString.call( assets[k] ) === '[object Array]' ){
					toLoad += assets[k].length;
				}
				else {
					if(assets[k] && typeof assets[k] != "object") ++toLoad; 
				}
			}
		}

		total = toLoad;

		next(0, assets);

		function next(index, requested){
			if(cats.length > 0 && toLoad > 0){
				loadCat(index, requested);
			} else {
				complete();
			}
		}

		function progress(file){
			--toLoad;
			if(onprogress) onprogress(file, toLoad, total);
			console.log(self+" loaded "+file, toLoad+" left to load...");
		}

		function error(file){
			--toLoad;
			++errors;
			if(onerror) onerror(file);
			console.error(self+" can't load "+file);
		}

		function complete(){
			if(oncomplete) oncomplete(self.map, errors);
		}

		function loadCat(index, allCats){
			var cat = cats[index];
			if(self.map[cat] && self.map[cat].loader){
				self.map[cat].loader(allCats[cat], 
					function(results){
						self.map[cat].cache = self.map[cat].cache.concat(results);
						next(index+1, allCats);
					},
					function(file){
						progress(file);
					},
					function(file){
						error(file);
					}
				);
			} else {
				console.log(self+" no external loader to load "+cat);
			}
		}

	} else {
		console.log(this+" can't load to a game audio of "+this.audio);
	}

};


Util.Loader.prototype.toString = function() {
	return "Util.Loader"
}