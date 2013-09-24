// MAIN
// need a new strategy for loading in IE... require.js?
// enable webgl in firefox; use latest nightly build for very slight perf. increase...
// standard global variables
var container, scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();

// custom global variables
var lighthouse;

init();
animate();

// FUNCTIONS
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
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
	//window resize, fullscreen, oculus enable, audio mute, IPD adjust
	
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
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
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00075 );
	
	var jsonLoader = new THREE.JSONLoader();
	jsonLoader.load( "models/lighthouse.js", addModelToScene );
	
	var ambientLight = new THREE.AmbientLight(0x111111);
	scene.add(ambientLight);
}

function addModelToScene( geometry, materials ) 
{
	var material = new THREE.MeshFaceMaterial( materials );
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
	controls.update();
	stats.update();
}

function render() 
{
	renderer.render( scene, camera );
}