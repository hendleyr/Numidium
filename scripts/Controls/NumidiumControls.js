/**
 * @author mrdoob / http://mrdoob.com/
 * @edited by Thomas Grelecki, Derek Isson, Richard Hendley, Ger Her
 */

NUMIDIUM.NumidiumControls = function ( camera ) {
	var scope = this;
	
	var playerHeight = 12;	// keep player these units above ground (ie, player's eye-level) TODO: configurable...?
	var playerBound = 2;	// keep player these units away from walls
	var stepHeight = 1;	// tolerance for variations in elevation before player is considered 'falling'

	var velocity = new THREE.Vector3();
	
	camera.rotation.set( 0, 0, 0 );

	var rollObject = new THREE.Object3D();
	rollObject.add(camera);
	
	var pitchObject = new THREE.Object3D();
	pitchObject.add(rollObject);

	var yawObject = new THREE.Object3D();
	yawObject.position.y = playerHeight;
	yawObject.add( pitchObject );

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	var canJump = false;

	var yRaycaster = new THREE.Raycaster(yawObject.position, new THREE.Vector3(0, -1, 0), 0, Infinity);
	var xRaycaster = new THREE.Raycaster(yawObject.position, new THREE.Vector3(1, 0, 0), 0, playerBound);
	var zRaycaster = new THREE.Raycaster(yawObject.position, new THREE.Vector3(0, 0, 1), 0, playerBound);

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
				//case 38: // up
				case 87: // w
					moveForward = true;
					break;

				//case 37: // left
				case 65: // a
					moveLeft = true;
					break;

				//case 40: // down
				case 83: // s
					moveBackward = true;
					break;

				//case 39: // right
				case 68: // d
					moveRight = true;
					break;

				case 32: // space
					velocity.y += 2;	// jump velocity
					canJump = false;
					break;
			}
		}
	};

	var onKeyUp = function ( event ) {
		switch( event.keyCode ) {
			//case 38: // up
			case 87: // w
				moveForward = false;
				break;

			//case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			//case 40: // down
			case 83: // a
				moveBackward = false;
				break;

			//case 39: // right
			case 68: // d
				moveRight = false;
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
	
	this.update = function ( delta ) {
		if ( scope.enabled === false ) {
			return;
		}

		delta *= 0.1;
		velocity.x += ( - velocity.x ) * 0.08 * delta;
		velocity.z += ( - velocity.z ) * 0.08 * delta;

		if ( moveForward ) velocity.z -= 0.06 * delta;
		if ( moveBackward ) velocity.z += 0.06 * delta;
		if ( moveLeft ) velocity.x -= 0.06 * delta;
		if ( moveRight ) velocity.x += 0.06 * delta;

		if ( canJump === true ) {
			velocity.y = Math.max( 0, velocity.y );
		}
		else {
			velocity.y -= 0.125 * delta;
			velocity.y = Math.max(velocity.y, -2);
		}
		
		// sceneGraph set in loading callback. probably want to rework this somehow to be more clear
		if (this.sceneGraph) {
			var intersections, sceneGraphObjects, lookAhead = new THREE.Object3D();
			lookAhead.position.x = yawObject.position.x;
			lookAhead.position.y = yawObject.position.y;
			lookAhead.position.z = yawObject.position.z;
			
			// check x
			sceneGraphObjects = this.sceneGraph.search( xRaycaster.ray.origin, xRaycaster.ray.far, true, xRaycaster.ray.direction );	
			intersections = xRaycaster.intersectOctreeObjects( sceneGraphObjects );
			if ( intersections.length > 0 ) {
				console.log("x: bumped into something");
				velocity.x = 0;
			}
			
			// check z		
			sceneGraphObjects = this.sceneGraph.search( zRaycaster.ray.origin, zRaycaster.ray.far, true, zRaycaster.ray.direction );
			intersections = zRaycaster.intersectOctreeObjects( sceneGraphObjects );
			if ( intersections.length > 0 ) {
				console.log("z: bumped into something");
				velocity.z = 0;
			}
			
			// translate x & z, then see if we've made a valid move up or down
			lookAhead.translateX(velocity.x);
			lookAhead.translateZ(velocity.z);
			
			// look down -- are we stepping up/down, falling up/down, or over an abyss?
			yRaycaster.ray.origin = lookAhead.position;
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
			
			yawObject.translateX( velocity.x );
			yawObject.translateY( velocity.y );
			yawObject.translateZ( velocity.z );
			if (intersections[0] && yawObject.position.y - playerHeight < intersections[0].point.y) {
				console.log("fell through! fixing...");
				yawObject.position.y = intersections[0].point.y + playerHeight;
				canJump = true;
			}
		}
	};
};
