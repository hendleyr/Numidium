
var container, scene, camera, renderer, controls, stats, oculuscontrol, oculusEffect, anaglyphEffect, realcamera;
var isOculus, isAnaglyph;
var clock = new THREE.Clock();
var lighthouse;

init();
animate();

function init() 
{
	container = document.body;

	// SCENE
	scene = new THREE.Scene();
	
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 60, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	
	// RENDERER
	if ( Detector.webgl ) {
		renderer = new THREE.WebGLRenderer( {antialias:false} );
	}
	else {
		renderer = new THREE.CanvasRenderer();
	}	
	
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);		
	scene.add(camera);
			
	// CONTROLS
	controls = new THREE.FirstPersonControls( camera );
	controls.movementSpeed = 400;
	controls.lookSpeed = 0.15;
	controls.lookVertical = true;
	
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.body;
	container.appendChild( renderer.domElement );

	// EFFECTS
	isOculus = false;
	oculusEffect = new THREE.OculusRiftEffect( renderer, {worldFactor: 1} );
	oculusEffect.setSize( window.innerWidth, window.innerHeight );
	oculuscontrol = new THREE.OculusControls( camera );
	oculuscontrol.connect();
	
	isAnaglyph = false;
	anaglyphEffect = new THREE.AnaglyphEffect(  renderer, SCREEN_WIDTH, SCREEN_HEIGHT );
	anaglyphEffect.setSize( window.innerWidth, window.innerHeight );

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
	var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -90;
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
	
	// var loader = new THREE.OBJMTLLoader();
	// loader.load( 'models/Old Building 28/Old Building 28-OBJ/Old Building 28.obj', 'models/Old Building 28/Old Building 28-OBJ/Old Building 28.mtl', function ( object ) {
		// object.position.y = - 80;			
		// object.scale = new THREE.Vector3( 10, 10, 10 );
		// scene.add( object );
	// } );
				
	var loader = new THREE.OBJLoader( manager );
	loader.load( 'models/Old Building 28/Old Building 28-OBJ/Old Building 28.obj', function ( object ) {
		object.scale = new THREE.Vector3( 50, 50, 50 );
		object.position.y = - 90;
		scene.add( object );
	});
	
	var ambientLight = new THREE.AmbientLight(0xFF1111);
	scene.add(ambientLight);
	
	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener('keydown', keyPressed, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	controls.handleResize();

	oculusEffect.setSize( window.innerWidth, window.innerHeight );
	anaglyphEffect.setSize( window.innerWidth, window.innerHeight );
}

function keyPressed(event) {
	var key = event.keyCode;
	
	if (key === 72) { // H
		guiVisible = !guiVisible;
		document.getElementById('info').style.display = guiVisible ? "block" : "none";
	}
	
	switch(key) {
		case 49 :
			isOculus = false;
			isAnaglyph = false;
			onWindowResize();
			break;
		case 50 :
			isOculus = true;
			isAnaglyph = false;
			//onWindowResize(); //Doesn't seem to be necessary
			break;
		case 51 :
			isOculus = false;
			isAnaglyph = true;
			onWindowResize();
			break;
		default:
			break;
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
	stats.update();
	controls.update(clock.getDelta() );
	if(isOculus) oculuscontrol.update(clock.getDelta());
}

function render() 
{ 
	if(isOculus) oculusEffect.render( scene, camera );
	else if(isAnaglyph) anaglyphEffect.render( scene, camera );
	else renderer.render( scene, camera );
}