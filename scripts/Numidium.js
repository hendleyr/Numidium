// MAIN
// need a new strategy for loading in IE... require.js?
// enable webgl in firefox; use latest nightly build for very slight perf. increase...
// standard global variables
var container, scene, camera, renderer, controls, stats, oculuscontrol, effect, realcamera;
var clock = new THREE.Clock();

// custom global variables
var lighthouse;

init();
animate();

// FUNCTIONS
function init() 
{
	container = document.body;

	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	
		// RENDERER
	if ( Detector.webgl ) {
		renderer = new THREE.WebGLRenderer( {antialias:false} );
	}
	else {
		renderer = new THREE.CanvasRenderer();
	}	
	
	if(true) { //oculus rift
		
		renderer.setSize( window.innerWidth, window.innerHeight );
		
		camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 5000 );
		//camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
		camera.position.set(0,150,400);
		//camera.lookAt(scene.position);	
		
		effect = new THREE.OculusRiftEffect( renderer, { worldScale: 1 } );
		effect.setSize( window.innerWidth, window.innerHeight );
		
		effect.separation = 20;
		effect.distortion = 0.1;
		effect.fov = 110;
		
		container.appendChild( renderer.domElement );
		
		controls = new THREE.FirstPersonControls( camera );
		controls.movementSpeed = 400;
		controls.lookSpeed = 0.15;
		controls.lookVertical = true;

		oculuscontrol = new THREE.OculusControls( camera );
		
		//document.body.appendChild( renderer.domElement );
		
				
	}
	else {
		camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
		camera.position.set(0,150,400);
		camera.lookAt(scene.position);		
		scene.add(camera);
		// CONTROLS
		controls = new THREE.OrbitControls( camera, renderer.domElement );
		
	
		oculuscontrol = new THREE.OculusControls( camera );
	
		renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
		container = document.body;
		container.appendChild( renderer.domElement );
	}
	


	// EVENTS
	//window resize, fullscreen, oculus enable, audio mute, IPD adjust
	
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(-100,200,100);
	scene.add(light);
	
	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture( 'textures/checkerboard.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -80;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00075 );
	
	//var jsonLoader = new THREE.JSONLoader();
	//jsonLoader.load( "models/lighthouse/lighthouse.js", addModelToScene );
	var manager = new THREE.LoadingManager();
				manager.onProgress = function ( item, loaded, total ) {

					console.log( item, loaded, total );

				};
	
	//var loader = new THREE.OBJMTLLoader();
	//			loader.load( 'models/Old Building 28/Old Building 28-OBJ/Old Building 28.obj', 'models/Old Building 28/Old Building 28-OBJ/Old Building 28.mtl', function ( object ) {
	//				//object.position.y = - 80;			object.scale = new THREE.Vector3( 10, 10, 10 );
	//				scene.add( object );
	//			} );
				
	var loader = new THREE.OBJLoader( manager );
	loader.load( 'models/Old Building 28/Old Building 28-OBJ/Old Building 28.obj', function ( object ) {
		object.scale = new THREE.Vector3( 10, 10, 10 );
		object.position.y = - 80;
		scene.add( object );
	});


	
	var ambientLight = new THREE.AmbientLight(0xFF1111);
	scene.add(ambientLight);
	
	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener('keydown', keyPressed, false);

	oculuscontrol.connect();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	realcamera.aspect = window.innerWidth / window.innerHeight;
	realcamera.updateProjectionMatrix();
	effect.setSize( window.innerWidth, window.innerHeight );
	controls.handleResize();
}

function keyPressed(event) {
	if (event.keyCode === 72) { // H
		guiVisible = !guiVisible;
		document.getElementById('info').style.display = guiVisible ? "block" : "none";
	}
}

function addModelToScene( geometry, materials ) 
{
	var material = new THREE.MeshBasicMaterial( materials );
	lighthouse = new THREE.Mesh( geometry, material );
	lighthouse.scale.set(10,10,10);
	scene.add( lighthouse );
}

function animate() 
{
	requestAnimationFrame( animate );

	render();		
	update();
}

function update()
{
	//listen for keyboard/HMD/mouse controls	
	controls.update(clock.getDelta() );
	oculuscontrol.update(clock.getDelta() );
	stats.update();
}

function render() 
{
	renderer.render( scene, camera );
}