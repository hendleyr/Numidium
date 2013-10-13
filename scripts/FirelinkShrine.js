// MAIN
var container, scene, controls, stats, collisionMesh;
var viewController;
var clock = new THREE.Clock();
var time = Date.now();

init();
animate();

// FUNCTIONS
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	sceneGraph = new THREE.Octree( {
		// uncomment below to see the octree (may kill the fps)
		//scene: scene,
		// when undeferred = true, objects are inserted immediately
		// instead of being deferred until next octree.update() call
		// this may decrease performance as it forces a matrix update
		undeferred: true,
		// set the max depth of tree
		depthMax: Infinity,
		// max number of objects before nodes split or merge
		objectsThreshold: 512,
		// percent between 0 and 1 that nodes will overlap each other
		// helps insert objects that lie over more than one node
		overlapPct: 0.25
	} );
	
	// RENDERER
	viewController =  new NUMIDIUM.ViewController();
	container = document.body;
	container.appendChild(viewController.getRenderer().domElement);
	
	// EVENTS
	//fullscreen, oculus enable, audio mute, IPD adjust, quality adjusts
	
	// CONTROLS
	controls = new NUMIDIUM.NumidiumControls(viewController.getCamera());
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
		controls.sceneGraph = sceneGraph;
		collisionMesh.scale = new THREE.Vector3( 10, 10, 10 );
		scene.add( collisionMesh );
		sceneGraph.add(collisionMesh.children[0].children[0], { useFaces: true });	// add mesh
		controls.sceneGraph = sceneGraph;
			
		// sceneGraph details to console		
		//console.log( ' ============================================================================================================');
		//console.log( ' SCENE GRAPH: ', sceneGraph );
		//console.log( ' ... depth ', sceneGraph.depth, ' vs depth end?', sceneGraph.depthEnd() );
		//console.log( ' ... num nodes: ', sceneGraph.nodeCountEnd() );
		//console.log( ' ... total objects: ', sceneGraph.objectCountEnd(), ' vs tree objects length: ', sceneGraph.objects.length );
		//console.log( ' ============================================================================================================');
		//console.log( ' ');		
		// print full sceneGraph structure to console		
		//sceneGraph.toConsole();
				 
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
	sceneGraph.update();
}

function update()
{
	//listen for keyboard/HMD/mouse controls
	//controls.update( clock.getDelta() );
	controls.update( Date.now() - time );	
	stats.update();
}