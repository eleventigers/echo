Struct.Segment = function (geometry, material) {
	THREE.Mesh.call(this);
	this.geometry = geometry;
	this.material = material;
	this.geometry.computeBoundingSphere();	
	this.fading = false;
	this.picking = false;
}

Struct.Segment.prototype = new THREE.Mesh();
Struct.Segment.prototype.constructor = Struct.Segment;

Struct.Segment.prototype.pickUp = function(who, time, callback){
	if(!this.fading && !this.picking && who && callback){

		var callback = callback;
		var who = who;
		var time = (time) ? time : 500;
		var self = this;
		var parent = this.parent;
		var origScale = self.scale.clone();
		var newPos = who.position;
		var opacity = self.material.opacity;
		var pickings = [];
		
		var reduce = new TWEEN.Tween( self.scale ).to({x:0, y:0, z:0}, time).easing( TWEEN.Easing.Exponential.Out );
		var fly = new TWEEN.Tween( self.position ).to( newPos, time / 1.1).easing( TWEEN.Easing.Quintic.Out );
	    var fade = new TWEEN.Tween( opacity ).to( 0, time).easing( TWEEN.Easing.Linear.None );
	          
	  	nextTree();

		function pickTree(tree, onComplete){

			if(tree.constructor === Struct.Tree){
				
				var tree = tree;
				tree.sound.stop();	
				pickSegment();
			
				function pickSegment(){
					tree.children[2].pickUp(self, 100, function(pick){
						console.log(pick, "really?")
						if (pick){
							console.log(pick, "yay")
							for(var n = 0; n < pick.length; ++n){
								pickings.push(pick[n]);
								console.log("pushing", n)
							}
						}
						if(tree.children.length > 2) {
							pickSegment();
						} else {
							console.log("done?")
							onComplete(); 		
						}
					});
				}

			} else {
				console.log("no tree")
				onComplete(); 
			}
		}

		function nextTree(){
			self.picking = true;
			if (self.children.length != 0) {
				pickTree(self.children[0], nextTree);
			} else {
				allTreesDone();
			}					 	
		}

		function allTreesDone(){
			self.picking = false;
			reduce.start();
	    	fly.start();
	    	fade.onComplete(function(){
	    		pickings.push(self);
	    		callback(pickings);
	    		parent.removeChild(self);
	    	}).start();
		}				   	    	
	}
			
};

Struct.Segment.prototype.dance = function(time){

	if (!this.fading){
		var self = this;
		var time = (time) ? time : Math.log(self.buffers[0].length) * 100 + 300;
		var material = self.material;
		var pos = self.position;
		var origPos = new THREE.Vector3().copy(self.position);
		var randPos = origPos.clone().subSelf(new THREE.Vector3(Math.random()*0.2-0.4, Math.random()*2-4, Math.random()*0.2-0.4));

		var rumble = new TWEEN.Tween( pos )
					.to({x: randPos.x, y: randPos.y, z: randPos.z}, time / 2)
					.easing( TWEEN.Easing.Sinusoidal.In )
					//.interpolation(TWEEN.Interpolation.Bezier)
					.onStart( function() {
						material.wireframe = false;
						self.fading = true;
					});

		var rumbleBack = new TWEEN.Tween( pos )
					.to({x: origPos.x, y: origPos.y, z: origPos.z}, time / 2)
					.easing( TWEEN.Easing.Sinusoidal.Out )
					//.interpolation(TWEEN.Interpolation.Bezier)
					.onComplete( function(){
						material.wireframe = true;
						self.fading = false;
					});
					

		rumble.chain(rumbleBack);
		rumble.start();
	}		

};
