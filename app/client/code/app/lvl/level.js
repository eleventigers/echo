Level = function(){
	THREE.Scene.call(this);
	

}

Level.prototype = new THREE.Scene(); 

Level.prototype.setPlayer = function(player){
	if(player){
		this.player.mesh = player;
		this.add(this.player.mesh);
	}
}