Struct.Tree = function (parameters) {
	THREE.Object3D.call(this);
}
Struct.Tree.prototype = new THREE.Object3D();
Struct.Tree.prototype.constructor = Struct.Tree;
Struct.Tree.prototype.removeChild = function(child){
	if(child && this.children.length > 0){	
		if(_.contains(this.children, child)){
			this.remove(child);
			if(this.children.length === 2){ // CAUTION! This assumes that the last children are an Audio.Org and Turtle objects so we can delete the whole thing :?		
				var self = this;
				var id = window.setInterval(function() {window.clearInterval(id); self.removeSelf(); }, 2000);
			}
		}
	}
};
Struct.Tree.prototype.removeSelf = function(){
	if(this.parent) {
		this.parent.remove(this);
	} else {
		console.log(this, "has no parent... :<");
	}
	
};

