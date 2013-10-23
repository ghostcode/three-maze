
/**
 * Maze class
 * @param $element
 */
function threemaze($element)
{
    // Object attributes
    this.$element =         $element;
    this.camera =           {};
    this.cameraHelper =     {};
    this.scene =            {};
    this.map =              [];
    this.renderer =         {};
    this.side =             21;
    this.thickness =        20;

    // Inits
    this.initScene();
    this.onWindowResize();
    this.render();

    // Events
    this.$element.on('mousemove', $.proxy(this,'onMouseMove'));
    this.$element.on('mousedown', $.proxy(this, 'onMouseDown'));
    this.$element.on('mouseup', $.proxy(this, 'onMouseUp'));
    this.$element.find('.generate').on('click', $.proxy(this, 'onGenerateMaze')).trigger('click');
    $(window).on('resize', $.proxy(this, 'onWindowResize'));
};

/**
 * Generates a new maze
 * Loops into the maze, removes old blocks and adds new ones
 */
threemaze.prototype.onGenerateMaze = function()
{
    var new_map =                   this.generateMaze(this.side);
    var target_show_properties =    {scale: 1, y: this.thickness / 2};
    var target_hide_properties =    {scale: 0, y: 0};
    var delay =                     0;
    var self =                      this;
    for (var x = 1; x < this.side + 1; x += 1)
    {
        for (var y = 1;y < this.side + 1; y += 1)
        {
            // Removes old mesh if needed
            if (typeof this.map[x] != 'undefined' && typeof this.map[x][y] != 'undefined' && typeof this.map[x][y] == 'object')
            {
                // Builds the related tween
                this.map[x][y].current_properties = {scale: 1, y: this.thickness / 2, mesh: this.map[x][y]};
                var tween = new TWEEN.Tween(this.map[x][y].current_properties).to(target_hide_properties, 200).delay(delay);
                tween.onUpdate(function()
                {
                    this.mesh.scale.y =     this.scale;
                    this.mesh.position.y =  this.y;
                });
                tween.onComplete(function()
                {
                    this.mesh.visible = false;
                    self.scene.remove(this.mesh);
                });
                tween.start();
            }

            // Adds a new mesh if needed
            if (new_map[x][y] == 0)
            {
                // Generates the mesh
                var wall_geometry =     new THREE.CubeGeometry(this.thickness, this.thickness, this.thickness, 1, 1, 1);
                new_map[x][y] =         new THREE.Mesh(wall_geometry, new THREE.MeshLambertMaterial({color: 0xffffff, wireframe: false}));
                new_map[x][y].scale.y = 0;
                new_map[x][y].visible = false;
                new_map[x][y].position.set(x * this.thickness - ((this.side * this.thickness) / 2), 0, y * 20 - ((this.side * this.thickness) / 2));
                this.scene.add(new_map[x][y]);

                // Builds the related tween
                new_map[x][y].current_properties = {scale: 0, y: 0, mesh: new_map[x][y]};
                var tween = new TWEEN.Tween(new_map[x][y].current_properties).to(target_show_properties, 200).delay(delay);
                tween.onUpdate(function()
                {
                    this.mesh.scale.y =     this.scale;
                    this.mesh.position.y =  this.y;
                });
                tween.onStart(function()
                {
                    this.mesh.visible = true;
                });
                tween.start();
            }
            else
            {
                new_map[x][y] = false;
            }
        }
        delay += 50;
    }
    this.map = new_map;
};

/**
 * Inits the scene
 */
threemaze.prototype.initScene = function()
{
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera =            new THREE.PerspectiveCamera(45, 1, 1, 2000);
    this.camera.angles =     {horizontal: 0, vertical: 0};
    this.camera.clicked =    false;

    // Lights
    this.scene.add(new THREE.AmbientLight(0x999999));
    var directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(0, 0.5, 1);
    this.scene.add(directional);

    // Camera helper
    var geometry =  new THREE.Geometry();
    var material =  new THREE.LineBasicMaterial({color: 0x333333, lineWidth: 1});
    geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.sqrt(3) * (this.side * this.thickness)), 0, 0);
    this.cameraHelper = new THREE.Line(geometry, material);
    this.scene.add(this.cameraHelper);
    this.cameraHelper.visible =         false;
    this.cameraHelper.targetRotation =  false;
    this.cameraHelper.rotation.x =      0;
    this.cameraHelper.rotation.y =      0.38639;
    this.cameraHelper.rotation.z =      0.648339;

    // Renderer
    this.renderer = typeof WebGLRenderingContext != 'undefined' && window.WebGLRenderingContext ? new THREE.WebGLRenderer({antialias: true}) : new THREE.CanvasRenderer({});
    this.$element.append(this.renderer.domElement);
};

/**
 * Moving the mouse over the container: sets a target rotation for the camera helper
 * @param evt
 */
threemaze.prototype.onMouseMove = function(evt)
{
    if (this.camera.clicked !== false)
    {
        var target_rotation = {};
        target_rotation.z = this.cameraHelper.rotation.z + ((evt.pageY - this.camera.clicked.y) / 800);
        if (target_rotation.z < 0)
        {
            target_rotation.z = 0;
        }
        if (target_rotation.z > (Math.PI / 2) - 0.1)
        {
            target_rotation.z = Math.PI / 2 - 0.1;
        }
        target_rotation.y = this.cameraHelper.rotation.y + ((this.camera.clicked.x - evt.pageX) / 800);
        this.cameraHelper.targetRotation = target_rotation;
    }
};

/**
 * Mouse down: starts dragging the maze
 * @param evt
 */
threemaze.prototype.onMouseDown = function(evt)
{
    evt.preventDefault();
    this.camera.clicked = {x: evt.pageX, y: evt.pageY};
};

/**
 * Mouse up: stops dragging the maze
 * @param evt
 */
threemaze.prototype.onMouseUp = function(evt)
{
    evt.preventDefault();
    this.camera.clicked = false;
};

/**
 * Render loop
 * Sets the camera position and renders the scene
 */
threemaze.prototype.render = function()
{
    requestAnimationFrame($.proxy(this, 'render'));
    TWEEN.update();
    if (this.cameraHelper.targetRotation !== false)
    {
        this.cameraHelper.rotation.z += (this.cameraHelper.targetRotation.z - this.cameraHelper.rotation.z) / 10;
        this.cameraHelper.rotation.y += (this.cameraHelper.targetRotation.y - this.cameraHelper.rotation.y) / 10;
    }
    var camera_position = this.cameraHelper.geometry.vertices[1].clone().applyProjection(this.cameraHelper.matrixWorld);
    this.camera.position = camera_position;
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
};

/**
 * Sets the scene dimensions on window resize
 */
threemaze.prototype.onWindowResize = function()
{
    var $window = $(window);
    this.renderer.setSize($window.width(), $window.height());
    this.camera.aspect = $window.width() / $window.height();
    this.camera.updateProjectionMatrix();
};
