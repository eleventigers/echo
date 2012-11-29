Struct.Segment = function (geometry, material) {
	THREE.Mesh.call(this);
	this.geometry = geometry;
	this.material = material;
	this.geometry.computeBoundingSphere();
	this.geometry.computeFaceNormals()
	this.updateMatrixWorld();	
	this.fading = false;
	this.picking = false;
}

Struct.Segment.prototype = new THREE.Mesh();

Struct.Segment.prototype.constructor = Struct.Segment;

Struct.Segment.prototype.pickUp = function(who, time, callback){

	if(!this.picking){
		var callback = callback || function(){};
		var time = (time) ? time : 500;
		var self = this;
		var parent = this.parent;
		var origScale = self.scale.clone();
		var newPos = new THREE.Vector3(who.position.x, who.position.y+0.5, who.position.z);
		var opacity = self.material.opacity;
		var pickings = [];
		
		var reduce = new TWEEN.Tween( self.scale ).to({x:0, y:0, z:0.0001}, time).easing( TWEEN.Easing.Exponential.Out );
		var fly = new TWEEN.Tween( self.position ).to( newPos, time).easing( TWEEN.Easing.Quintic.Out );
	    var fade = new TWEEN.Tween( opacity ).to( 0, time).easing( TWEEN.Easing.Linear.None );
	        
	  	nextTree();

		function nextTree(){	
			if (self.children.length != 0) {
				pickTree(self.children[0], nextTree);
			} else {
				if(self === self.parent.children[3]){
					pickTree(self.parent, function(){
						callback(pickings);
					});
				}else{
					allTreesDone();
				}	
			}					 	
		}

		function pickTree(tree, onComplete){
			
			if(tree.constructor === Struct.Tree){
				
				if(tree.sound) tree.sound.stop();

				if(tree.children.length > 0) pickSegment();
			
				function pickSegment(){

					if(!tree.children[0].pickUp){
						tree.remove(tree.children[0]);
						if(tree.children.length > 0) {
								pickSegment();
						}
					} else {
						tree.children[0].picking = false;
						tree.children[0].pickUp(self, 50, function(pick){
							if (pick){
								for(var n = 0; n < pick.length; ++n){
									pickings.push(pick[n]);
								}
							}
							if(tree.children.length > 0) {
								pickSegment();
							} else {	
								onComplete(); 		
							}
						});
					}	
				}
			} else {
				onComplete(); 
			}
		}

		function allTreesDone(){
			self.picking = true;
			fly.start();
			reduce.start();	
	    	fade.onComplete(function(){
	    		self.picking = false;
	    		pickings.push(self);	
	    		parent.removeChild(self);
	    		callback(pickings);	
	    	}).start();
		}				   	    	
	} 			
};

Struct.Segment.prototype.dance = function(properties){

	if (!this.fading && !this.picking){
		var props = properties;
		var self = this;
		var time = Math.log(self.buffers[0].length) * 100 + 300;
		var material = self.material;
		var pos = self.position;
		var origPos = self.matrix.getPosition();
		var factor = {x:1, y:1, z:1};
		if (this.parent) factor = this.parent.parent.boundRadiusScale;
		var randPos = origPos.clone().subSelf(new THREE.Vector3(Math.random()*0.2-0.4, Math.random()*2-4, Math.random()*0.2-0.4).divideScalar(factor));

		var rumble = new TWEEN.Tween( pos )
					.to({x: randPos.x, y: randPos.y, z: randPos.z}, time / 2)
					.easing( TWEEN.Easing.Sinusoidal.In )
					.onStart( function() {
						material.wireframe = false;
						self.fading = true;
					});

		var rumbleBack = new TWEEN.Tween( pos )
					.to({x: origPos.x, y: origPos.y, z: origPos.z}, time / 2)
					.easing( TWEEN.Easing.Sinusoidal.Out )
					.onComplete( function(){
						material.wireframe = true;
						self.fading = false;
						if(props.suicide) self.removeSelf();
					});
					

		rumble.chain(rumbleBack);
		rumble.start();
	}		

};

Struct.Segment.prototype.removeSelf = function(){
	if(!this.picking){
		var self = this;
		var shrink = new TWEEN.Tween( self.scale )
		.to( {x:0, y:0, z:0}, 2000)
		.easing( TWEEN.Easing.Linear.None )
		.onComplete(function(){
			if(!self.picking && self.parent) self.parent.removeChild(self);
		}).start();
	}
};
define(['app/struct/struct', 'libs/three/three', 'libs/tween/Tween'], function (){return Struct.Segment});

