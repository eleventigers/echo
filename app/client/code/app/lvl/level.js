Level = function(properties){
	THREE.Scene.call(this);
	this.objectives = [];	
}
Level.prototype = new THREE.Scene(); 

Level.prototype.setPlayer = function(player){
	if(player){
		this.player.mesh = player;
	}
};
Level.prototype.testObjectives = function(){
	var l = this.objectives.length;
	var res = [];
	var obj;
	if(l > 0){
		for (var i = 0; i < l; ++i){
			obj = this.objectives[i]
			res.push(obj());
		}
		return res;
	} else {
		return false;
	}
};
Level.prototype.spawnPlayer = function(){
	this.player.mesh.position.set(this.entry.point.x, this.entry.point.y, this.entry.point.z);
	this.add(this.player.mesh);
};
Level.prototype.populateWith = function(list){
	var self = this;
	if( Object.prototype.toString.call( list ) === '[object Array]' ){  
        populate(list);        
    } else {     
       	populate([list]);
    }
	function populate(list) {
		for(var i = 0; i < list.length; ++i){
			var index = self.children.indexOf(list[i]);
			if( index === -1 ){
				self.add(list[i]);
				if(list[i].collideWithPlayer) self.player.collideWith.push(list[i]);
				if(list[i].collideWithDynamic) self.dynamic.collideWith.push(list[i]);
			}
		}	
	}		
};
Level.prototype.remove = function ( object ) {

	var index = this.player.collideWith.indexOf( object );
	if( index !== -1 ) {
		 this.player.collideWith.splice( index, 1);
	}

	index = this.dynamic.collideWith.indexOf( object );
	if( index !== -1 ) {
		 this.dynamic.collideWith.splice( index, 1);
	}

	index = this.children.indexOf( object );
	if ( index !== - 1 ) {
		object.parent = undefined;
		this.children.splice( index, 1 );
		// remove from scene
		var scene = this;
		while ( scene.parent !== undefined ) {
			scene = scene.parent;
		}
		if ( scene !== undefined && scene instanceof THREE.Scene ) {
			scene.__removeObject( object );
		}

		if(this.renderer) {
			if(object.material) this.renderer.deallocateMaterial(object.material);
			this.renderer.deallocateObject(object);
		}
	}

	
};