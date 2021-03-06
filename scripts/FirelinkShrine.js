// MAIN
var container, scene, stats, collisionMesh;
var viewController;
var audioEnabled;

var directionalLight = new THREE.DirectionalLight( 0xfefdbc, 0.5 );

init();
animate();

// FUNCTIONS
function init()
{
	//An alert to get Google Chrome, if not in use
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    if (!is_chrome) {
		var r=confirm("It looks as though you are using a browser other than Google Chrome.\nWe recommend using Chrome for best performance.\n\nClick OK to navigate away from this site and visit the Google Chrome download page.\n\nClick Cancel to continue anyway...");
		if (r==true) {
			window.location.href="http://www.google.com/chrome?";
		}
		// alert("It looks as though you aren't using Google Chrome.\nWe recommend using Chrome for best performance.\n\nTo download, navigate your browser to www.google.com/chrome.");
    }
	
	// SCENE
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00075 );
	
	// VIEW CONTROLLER
	viewController = new NUMIDIUM.ViewController();
	container = document.body;
	container.appendChild(viewController.getRenderer().domElement);
	
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
		viewController.sceneGraph.add(collisionMesh.children[0].children[0], { useFaces: true });	// add mesh		 
		viewController.getKbamControls().sceneGraph = viewController.sceneGraph; // so hacky... TODO: nice interface to bootstrap scenes
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
	audioEnabled = false;
	var ambientAudio = new THREE.AudioObject('audio/Wind.mp3');
	scene.add( ambientAudio );
}

this.toggleAudio = function() {
	audioEnabled = !audioEnabled;
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

function update() {
	viewController.update();
	stats.update();
	if(audioEnabled) {
		for (var i=0;i<scene.children.length;i++) { 
			if (scene.children[i].setVolume) {
				scene.children[i].setVolume(1);
			}
		}
	} else {
		for (var i=0;i<scene.children.length;i++) { 
			if (scene.children[i].setVolume) {
				scene.children[i].setVolume(0);
			}
		}
	}
}