// MAIN
var container, scene, stats, collisionMesh;
var kbamControls, oculusControls, viewController;
var clock = new THREE.Clock();
var time = Date.now();
var directionalLight = new THREE.DirectionalLight( 0xfefdbc, 0.5 );

init();
animate();

// FUNCTIONS
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00075 );
	sceneGraph = new THREE.Octree( {
		// uncomment below to see the octree (may kill the fps)
		// scene: scene,
		// when undeferred = true, objects are inserted immediately
		// instead of being deferred until next octree.update() call
		// this may decrease performance as it forces a matrix update
		undeferred: true,
		// set the max depth of tree
		depthMax: Infinity,
		// max number of objects before nodes split or merge
		objectsThreshold: 256,
		// percent between 0 and 1 that nodes will overlap each other
		// helps insert objects that lie over more than one node
		overlapPct: 0.25
	} );
	
	// RENDERER
	viewController = new NUMIDIUM.ViewController();
	container = document.body;
	container.appendChild(viewController.getRenderer().domElement);
	
	// EVENTS
	//fullscreen, oculus enable, audio mute, IPD adjust, quality adjusts
	document.addEventListener( 'keydown', function (event) {
		switch (event.keyCode) {
			case 67:	//c
			oculusControls.connect();	// send a GET to http://localhost:50000/
			break;
		}
	}, false );
	
	// CONTROLS
	kbamControls = new NUMIDIUM.NumidiumControls(viewController.getCamera());
	kbamControls.getObject().position.set(872,-82,-261);
	oculusControls = new THREE.OculusControls(viewController.getCamera());
	scene.add( kbamControls.getObject() );
	
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

	// LEVEL GEOMETRY
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};

	 var loader = new THREE.OBJLoader( manager );
	 loader.load( 'models/FirelinkShrine/FirelinkShrine.obj', function ( object ) {
		collisionMesh = object;
		collisionMesh.scale = new THREE.Vector3( 10, 10, 10 );
		collisionMesh.castShadow = true;
		collisionMesh.receiveShadow = true;
		
		// set the mesh to cast/receive shadows
		collisionMesh.children[0].children[0].castShadow = true;
		collisionMesh.children[0].children[0].receiveShadow = true;
		
		scene.add( collisionMesh );
		sceneGraph.add(collisionMesh.children[0].children[0], { useFaces: true });	// add mesh
		kbamControls.sceneGraph = sceneGraph;				 
		document.getElementById("loadingScreen").style.display = "none";
	 });
	
	// LIGHTS
	var ambientLight = new THREE.AmbientLight(0x423433);

	
	directionalLight.position.set( -1500, 1100, 1200 );
	// optimization opportunity--if we can get values for shadow camera right, we can
	// use smaller frustums/distances/resolutions 
	//directionalLight.shadowCascade = true;
	//directionalLight.shadowCameraVisible = true;
	
	directionalLight.castShadow = true;
	directionalLight.shadowCameraRight = 500;
	directionalLight.shadowCameraLeft = -500;
	directionalLight.shadowCameraTop = 500;
	directionalLight.shadowCameraBottom = -500;
	
	directionalLight.shadowCameraNear = 50;
	directionalLight.shadowCameraFar = 5000;

	directionalLight.shadowBias = 0.0001;
	directionalLight.shadowDarkness = 0.5;

	directionalLight.shadowMapWidth = 2048;
	directionalLight.shadowMapHeight = 2048;
	
	scene.add( directionalLight );
	scene.add(ambientLight);
	
	// AUDIO
	var ambientAudio = new THREE.AudioObject('audio/Wind.mp3');
	scene.add( ambientAudio );
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
	viewController.render(scene);
}

function update()
{
	//listen for keyboard/HMD/mouse controls
	kbamControls.update( Date.now() - time ); //TODO: tweak values so clock delta can be used instead
	oculusControls.update(clock.getDelta());
	//TODO: gamepad controls also updating
	
	sceneGraph.update();	
	stats.update();
}