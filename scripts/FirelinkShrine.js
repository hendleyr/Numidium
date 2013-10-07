// MAIN
// need a new strategy for loading in IE... require.js?
// enable webgl in firefox; use latest nightly build for very slight perf. increase...
var container, scene, camera, renderer, controls, stats, collisionMesh;
var clock = new THREE.Clock();
var time = Date.now();

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
	controls = new THREE.PointerLockControls( camera );
	controls.getObject().position.set(872,-82,-261);
	scene.add( controls.getObject() );
	
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );

	// SKYBOX
	var skyBoxFaces = [
		'textures/skyBox/px.jpg', 
		'textures/skyBox/nx.jpg',
		'textures/skyBox/py.jpg',
		'textures/skyBox/ny.jpg',
		'textures/skyBox/pz.jpg',
		'textures/skyBox/nz.jpg'
	];
	var textureCube = THREE.ImageUtils.loadTextureCube( skyBoxFaces, new THREE.CubeRefractionMapping() );
	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = textureCube;
	var skyBoxMaterial = new THREE.ShaderMaterial( {
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		side: THREE.BackSide
	} );
	
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMesh = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBoxMesh);
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00075 );

	// LEVEL GEOMETRY
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};

	 var loader = new THREE.OBJLoader( manager );
	 loader.load( 'models/FirelinkShrine/FirelinkShrine.obj', function ( object ) {
		collisionMesh = object;
		controls.collisionMesh = collisionMesh;
		collisionMesh.scale = new THREE.Vector3( 10, 10, 10 );
		//collisionMesh.castShadow = true;
		//collisionMesh.receiveShadow = true;
		scene.add( collisionMesh );
		 
		document.getElementById("loadingScreen").style.display = "none";
	 });
	
	// LIGHTS
	var ambientLight = new THREE.AmbientLight(0x857e76);
	scene.add(ambientLight);
	
	var light = new THREE.PointLight(0x857e76);
	light.position.set(-100,200,100);
	scene.add(light);
	
	var directionalLight = new THREE.DirectionalLight( 0xfefdbc, 0.5 );
	directionalLight.position.set( -1500, 0, 1200 );

	scene.add( directionalLight );
	
	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() 
{
	requestAnimationFrame( animate );
	update();
	render();
	time = Date.now();
}

function render() 
{
	renderer.render( scene, camera );
}

function update()
{
	//listen for keyboard/HMD/mouse controls
	//controls.update( clock.getDelta() );
	controls.update( Date.now() - time );	
	stats.update();
}