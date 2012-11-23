Struct.Tree = function (parameters) {
	THREE.Object3D.call(this);
}
Struct.Tree.prototype = new THREE.Object3D();
Struct.Tree.prototype.constructor = Struct.Tree;
Struct.Tree.prototype.removeChild = function(child){
	if(child && this.children.length > 0){	
		if(_.contains(this.children, child)){
			this.remove(child);
			if(this.containsSegment() === 0){ 
				this.removeSelf();
			}
		}
	}
};
Struct.Tree.prototype.removeSelf = function(){
	if(this.parent) {
		this.parent.remove(this);
		console.log("suicide");
	} else {
		console.log(this, "has no parent... :<");
	}
	
};

Struct.Tree.prototype.containsSegment = function(){
	var count = 0;
	for (var i = 0; i < this.children.length; ++i){
		if (this.children[i].constructor === Struct.Segment) ++count;
	}
	return count;
};

