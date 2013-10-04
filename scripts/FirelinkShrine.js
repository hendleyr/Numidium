// MAIN
// need a new strategy for loading in IE... require.js?
// enable webgl in firefox; use latest nightly build for very slight perf. increase...
// standard global variables
var container, scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();

init();
animate();

// FUNCTIONS
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);
	
	// RENDERER
	if ( Detector.webgl ) {
		renderer = new THREE.WebGLRenderer( {antialias:false} );
	}
	else {
		renderer = new THREE.CanvasRenderer();
	}
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.body;
	container.appendChild( renderer.domElement );
	
	// EVENTS
	//fullscreen, oculus enable, audio mute, IPD adjust, quality adjusts
	
	// CONTROLS
	controls = new THREE.FirstPersonControls( camera );
	controls.movementSpeed = 250;
	controls.lookSpeed = 0.125;
	controls.lookVertical = true;
	controls.constrainVertical = true;
	controls.verticalMin = 1.1;
	controls.verticalMax = 2.2;
	
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

	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00075 );

	// LEVEL GEOMETRY
	var manager = new THREE.LoadingManager();
		manager.onProgress = function ( item, loaded, total ) {
			console.log( item, loaded, total );
		};

	 var loader = new THREE.OBJLoader( manager );
	 loader.load( 'models/FirelinkShrine/FirelinkShrine.obj', function ( object ) {
		 object.scale = new THREE.Vector3( 10, 10, 10 );
		 object.position.y = - 80;
		 scene.add( object );
		 document.getElementById("loadingScreen").style.display = "none";
	 });
	
	// LIGHTS
	var ambientLight = new THREE.AmbientLight(0xFF1111);
	scene.add(ambientLight);
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
	stats.update();
}

function render() 
{
	controls.update( clock.getDelta() );
	renderer.render( scene, camera );
}