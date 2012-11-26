Level.Zero = function(){
	Level.call(this);
	this.player = {
		mesh: null,
		collideWith: []
	};
	this.entry = new THREE.Vector3(1,1,1);
	this.exit = new THREE.Vector3();
	this.fog = new THREE.FogExp2( 0x121212, 0.001 );
	this.lights = {
		main: new THREE.DirectionalLight( 0x757575, 1 ),
		ambient: new THREE.AmbientLight( 0xf2f2f2 ),
		spot: new THREE.SpotLight(0xffffff, 1 ),
		spot2: new THREE.SpotLight(0xffffff, 50 )
	}

	this.lights.main.position.set( 1000, 5000, 1000 );
	this.lights.main.castShadow = true;
	this.lights.main.shadowCameraNear = 50;
	this.lights.main.shadowCameraFar = 6000;
	this.lights.main.shadowDarkness = 0.3;
	this.lights.main.shadowMapWidth = 4096;
	this.lights.main.shadowMapHeight = 4096;
	
}

Level.Zero.prototype = new Level();






