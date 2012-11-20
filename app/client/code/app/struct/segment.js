Struct.Segment = function (geometry, material) {
	THREE.Mesh.call(this);
	this.geometry = geometry;
	this.material = material;
	this.geometry.computeBoundingSphere();	
	this.fading = false;
}

Struct.Segment.prototype = new THREE.Mesh();
Struct.Segment.prototype.constructor = Struct.Segment;

Struct.Segment.prototype.pickUp = function(who, time){
	if(this.fading || !who) return;
	var who = who;
	var time = (time) ? time : 500;
	var self = this;
	var parent = this.parent;
	var origScale = self.scale.clone();
	var newPos = who.position;
	var opacity = self.material.opacity;
	
	var reduce = new TWEEN.Tween( self.scale )
			.to({x:0, y:0, z:0}, time)
			.easing( TWEEN.Easing.Exponential.Out )
			// .onComplete( function(){
			// 	//self.scale = origScale;
			// })
			.start();

	var fly = new TWEEN.Tween( self.position )
            .to( newPos, time)
            .easing( TWEEN.Easing.Quintic.Out )
            .start();

    var fade = new TWEEN.Tween( opacity )
            .to( 0, time)
            .easing( TWEEN.Easing.Linear.None )
            .onComplete( function () {
            	parent.removeChild(self); 
				parent.sound.dropBust();	
            })
            .start();

	return self;

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
