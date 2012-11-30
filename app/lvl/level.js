Level = function(properties){
	THREE.Scene.call(this);
	this.objectives = [];
	this.failures = [];	
	this.toUpdate = [];
	this.complete = false;
}
Level.prototype = new THREE.Scene(); 

Level.prototype.setPlayer = function(player){
	if(player){
		this.player.mesh = player;
	}
};
Level.prototype.testConditions = function(topic){
	if(!topic) return;
	if(this.hasOwnProperty(topic)){
		var l = this[topic].length;
		var res = [];
		var func;
		if(l > 0){
			for (var i = 0; i < l; ++i){
				func = this[topic][i];
				res.push(func());
			}
			return res;
		} else {
			return false;
		}
	}	
};

Level.prototype.update = function(){
		for(var i = 0; i < this.toUpdate.length; ++i){
			this.toUpdate[i]();
		}
};

Level.prototype.spawnPlayer = function(){
	var index = this.children.indexOf(this.player.mesh);
	if( index === -1) {
		this.add(this.player.mesh);
	}
	this.player.mesh.position = new THREE.Vector3(this.entry.point.x, this.entry.point.y, this.entry.point.z);
	this.player.mesh.rotation.y = -1.5;
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

		if(this.state.renderer) {
			if(object.material) this.state.renderer.deallocateMaterial(object.material);
			this.state.renderer.deallocateObject(object);
		}
	}	
};