var NUMIDIUM = {};

NUMIDIUM.ViewController = function () {
	var camera, viewAngle, aspectRatio, nearClip, farClip;
	var renderer, anaglyphRenderer, oculusRenderer;
	var	isAnaglyph = false, isOculus = false;
	
	init = function () {
		viewAngle = 45;
		aspectRatio = window.innerWidth / window.innerHeight;
		nearClip = 1;
		farClip = 10000;
		camera = new THREE.PerspectiveCamera(viewAngle, aspectRatio, nearClip, farClip);
		
		if ( Detector.webgl ) {
			renderer = new THREE.WebGLRenderer( {antialias:false} );
		}
		else {
			renderer = new THREE.CanvasRenderer();
		}
		
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor( scene.fog.color, 1 );
		renderer.autoClear = false;
		renderer.shadowMapEnabled = true;
		renderer.shadowMapType = THREE.PCFShadowMap;
		
		oculusRenderer = new THREE.NumidiumOculusRiftEffect( renderer, camera, {worldFactor: 1} );
		anaglyphRenderer = new THREE.AnaglyphEffect(  renderer, window.innerWidth, window.innerHeight );

		document.addEventListener( 'keydown', onKeyDown, false );
		window.addEventListener('resize', onWindowResize, false);
	};
		
	this.getCamera = function () {
		return camera;
	};
	this.getRenderer = function () {
		if (isAnaglyph) {
			return anaglyphRenderer;
		}
		else if (isOculus) {
			return oculusRenderer;
		}
		else {
			return renderer;
		}
	};
	
	this.render = function (scene) {
		if (isAnaglyph) {
			anaglyphRenderer.render(scene, camera);
		}
		else if (isOculus) {
			oculusRenderer.render(scene, camera);
		}
		else {
			renderer.render(scene, camera);
		}
	};
	
	onWindowResize = function () {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		anaglyphRenderer.setSize(window.innerWidth, window.innerHeight);
		oculusRenderer.setSize(window.innerWidth, window.innerHeight);
	};
	
	onKeyDown = function (event) {
		switch (event.keyCode) {
			case 73:	//i
				isAnaglyph = true;
				isOculus = false;
                onWindowResize();
				break;
			case 79:	//o
				isAnaglyph = false;
				isOculus = true;
                onWindowResize();
				break;
			case 80:	//p
				isAnaglyph = false;
				isOculus = false;
                onWindowResize();
				break;
		}
	};
	
	init();
};