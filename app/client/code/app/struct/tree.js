Struct.Tree = function (parameters) {
	THREE.Object3D.call(this);
}
Struct.Tree.prototype = new THREE.Object3D();
Struct.Tree.prototype.constructor = Struct;
Struct.Tree.prototype.removeChild = function(child){
	if(child && this.children.length > 0){	
		if(_.contains(this.children, child)){
			this.remove(child);
			if(this.children.length === 1){ // CAUTION! This assumes that the last child is an Audio.Org object so we can delete the whole thing :?
				
				var self = this;
				var id = window.setInterval(function() {window.clearInterval(id); self.removeSelf(); }, 2000);
			}
		}
	}
};
Struct.Tree.prototype.removeSelf = function(){
	console.log("suicide");
	this.parent.remove(this);
};

