/**
 * @author mrdoob / http://mrdoob.com/
 * @edited by Thomas Grelecki, Derek Ison, Richard Hendley, Ger Her
 */

NUMIDIUM.NumidiumControls = function ( camera ) {
	var scope = this;
	
	var helpMenuPosition = new THREE.Vector(534.5581117630347,410.5,22.546609271090336);
	var helpMenuPositionBefore = new THREE,Vector();
	
	var playerHeight = 12;	// keep player these units above ground (ie, player's eye-level) TODO: configurable...?
	var playerBound = 6;	// keep player these units away from walls
	var stepHeight = 1;		// tolerance for variations in elevation before player is considered 'falling'

	var velocity = new THREE.Vector3();
	camera.rotation.set( 0, 0, 0 );

	var rollObject = new THREE.Object3D();
	rollObject.add(camera);
	
	var pitchObject = new THREE.Object3D();
	pitchObject.add(rollObject);

	var yawObject = new THREE.Object3D();
	yawObject.position.y = playerHeight;
	yawObject.add( pitchObject );

	var gamepadRotateObject = new THREE.Object3D();
	
	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	
	// sound effects
	var audio = document.createElement('audio');
	var source = document.createElement('source');
	source.src = 'audio/Footsteps.wav';
	audio.appendChild(source);	

	var canJump = false;

	var yRaycaster = new THREE.Raycaster(yawObject.position, new THREE.Vector3(0, -1, 0), 0.1, Infinity);
	var xRaycaster = new THREE.Raycaster(yawObject.position, new THREE.Vector3(1, 0, 0), 0.1, playerBound);

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {
		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
	};

	var onKeyDown = function ( event ) {
		if (canJump === true) {
			// disable movement input if midair
			switch ( event.keyCode ) {
				case 87: // W
					moveForward = true;
					break;

				case 65: // A
					moveLeft = true;
					break;

				case 83: // S
					moveBackward = true;
					break;

				case 68: // D
					moveRight = true;
					break;

				case 32: // space
					velocity.y += 2;	// jump velocity
					canJump = false;
					break;
					
				case 72: // h
								
				kbamControls.getObject().position.set(534.5581117630347
														,410.5
														 ,22.546609271090336);
															 
				kbamControls.getObject().rotation.y = 1.0540000000000003;
				kbamControls.getObject().quaternion.z = 0;
				kbamControls.getObject().quaternion.x = 0;
				kbamControls.getObject().quaternion.y = 0.5029426489776037;
				kbamControls.getObject().quaternion.w = 0.8643197856345711;
				
				collisionMesh.children[469].visible = true;
				/*
					if(collisionMesh.children[469].visible == true)
						collisionMesh.children[469].visible = false;
					else
						collisionMesh.children[469].visible = true;
					*/							
					break;
					
				default:
					break;
			}
		}
		
	};

	var onKeyUp = function ( event ) {
		switch( event.keyCode ) {
			case 87: // W
				moveForward = false;
				break;

			case 65: // A
				moveLeft = false;
				break;

			case 83: // S
				moveBackward = false;
				break;

			case 68: // D
				moveRight = false;
				break;
				
			case 77: //M
				toggleAudio();
				break;
				
			default:
				break;
		}
	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {
		return yawObject;
	};
	
	this.getGamepadRotate = function () {
		return gamepadRotateObject;
	};
	
	
	this.update = function ( delta ) {
		
		delta *= 0.01;
		if (Gamepad.supported) {
			var pads = Gamepad.getStates();
			var pad = pads[0]; // assume only 1 player.
						
			//Begining orientation for combining oculus & gamepad rotation
			var yRotationStart = yawObject.rotation.y;
			
			if (pad) {
				// adjust for deadzone.
				if (Math.abs(pad.leftStickX) > 0.2){
					velocity.x += 0.06 * pad.leftStickX * delta;
					audio.play();
				}
				
				if (Math.abs(pad.leftStickY) > 0.2) {
					velocity.z += 0.06 * pad.leftStickY * delta;
					audio.play();
				}

				if (Math.abs(pad.rightStickX) > 0.2) {
					yawObject.rotation.y -= pad.rightStickX * 0.05;
				}
				if (Math.abs(pad.rightStickY) > 0.2) {
					pitchObject.rotation.x -= pad.rightStickY * 0.05;
					pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
				}
				if ( pad.dpadUp ) {
					
				}
				if ( pad.dpadDown ) {
					viewController.viewToggleNormal();
				}
				if ( pad.dpadLeft ) {
					viewController.viewToggleAnaglyph();
				}
				if ( pad.dpadRight ) {
					viewController.viewToggleOculus();
				}
				if ( pad.faceButton0 && canJump === true ){ // A
					velocity.y += 2;	// jump velocity
					canJump=false;
				}
				if ( pad.leftStickButton ) {
					velocity.x += 0.06 * pad.leftStickX * delta;
					velocity.z += 0.06 * pad.leftStickY * delta;
				}
				
				if ( pad.faceButton1 ) {// B
					velocity.x += 0.06 * pad.leftStickX * delta;
					velocity.z += 0.06 * pad.leftStickY * delta;
				}
				
				if ( pad.faceButton2 ) {} // X
				if ( pad.faceButton3 ) {} // Y
					
				if ( pad.select ) {
					toggleAudio();
				}
				
				if( pad.start ) {
					location.reload();
				}
			}

			//Set the y rotation delta to be used in NumidiumOculusControls
			gamepadRotateObject.rotation.y = yawObject.rotation.y - yRotationStart;
		}
		
		if ( scope.enabled === false ) {
			return;
		}

		velocity.x += ( - velocity.x ) * 0.08 * delta;
		velocity.z += ( - velocity.z ) * 0.08 * delta;


		if ( moveForward ) {
			collisionMesh.children[469].visible = false;
			velocity.z -= 0.06 * delta;
			audio.play();
		}
		if ( moveBackward ) {
			collisionMesh.children[469].visible = false;
			velocity.z += 0.06 * delta;
			audio.play();
		}
		if ( moveLeft ) {
			collisionMesh.children[469].visible = false;
			velocity.x -= 0.06 * delta;
			audio.play();
		}
		if ( moveRight ) {
			collisionMesh.children[469].visible = false;
			velocity.x += 0.06 * delta;
			audio.play();
		}

		

		if ( canJump === true ) {
			velocity.y = Math.max( 0, velocity.y );
		}
		else {
			velocity.y -= 0.125 * delta;
			velocity.y = Math.max(velocity.y, -2);
		}
		
		// sceneGraph set in loading callback. probably want to rework this somehow to be more clear
		if (this.sceneGraph) {
			var intersections, sceneGraphObjects;
			//
			var movementVector = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
			movementVector.applyQuaternion(yawObject.quaternion).normalize();
			xRaycaster.ray.direction = movementVector;
			sceneGraphObjects = this.sceneGraph.search(xRaycaster.ray.origin, xRaycaster.ray.far, true, xRaycaster.ray.direction);
			intersections = xRaycaster.intersectOctreeObjects( sceneGraphObjects );
			if ( intersections.length > 0 ) {
				//console.log("bumped into something");
				velocity.x = 0, velocity.z = 0;
			}

			yawObject.translateX( velocity.x );
			yawObject.translateZ( velocity.z );
			//collisionMesh.children[469].translateX(velocity.z);
			//collisionMesh.children[469].translateZ(-velocity.x);
			
			// look down -- are we stepping up/down, falling down
			yRaycaster.ray.origin = yawObject.position;
			sceneGraphObjects = this.sceneGraph.search( yRaycaster.ray.origin, 256, true, yRaycaster.ray.direction );
			intersections = yRaycaster.intersectOctreeObjects( sceneGraphObjects );
			if ( intersections.length > 0 ) {
				var distance = intersections[0].distance;
				if (distance - playerHeight <= stepHeight && canJump) {
					velocity.y = 0;
					yawObject.position.y = intersections[0].point.y + playerHeight;
					canJump = true;
				}
				else {
					//console.log("We're falling...");
					canJump = false;
				}
			}			
			yawObject.translateY( velocity.y );
			
			if (intersections[0] && yawObject.position.y - playerHeight < intersections[0].point.y) {
				console.log("fell through! fixing...");
				yawObject.position.y = intersections[0].point.y + playerHeight;
				canJump = true;
			}
		}
	};
};
