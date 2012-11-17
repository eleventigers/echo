Struct.Segment = function (geometry, material) {
	THREE.Mesh.call(this);
	this.geometry = geometry;
	this.material = material;
	this.geometry.computeBoundingSphere();	
}

Struct.Segment.prototype = new THREE.Mesh();
Struct.Segment.prototype.constructor = Struct.Segment;

Struct.Segment.prototype.pickUp = function(time){
	var time = (time) ? time : 0;
	var self = this;
	var parent = this.parent;
	var id = window.setInterval(function() {window.clearInterval(id); parent.removeChild(self); parent.sound.dropBust(); }, time);
	return self;
};
Struct.Segment.prototype.dance = function(time){
	var time = (time) ? time : 150;
	var self = this;
	var parent = this.parent;
	self.scale.multiplyScalar(1.1);
	var id = window.setInterval(function() {window.clearInterval(id); self.scale.divideScalar(1.1); }, time);
};
