var Renderer = Class({
    $const: {
        
    },

    constructor: function(options) {
        this.displayDevice = options.displayDevice;
        this.width = options.width;
        this.height = options.height;
        this.focus = options.focus || false;
        this.scaleX = (_.isUndefined(options.scaleX) || _.isNull(options.scaleX) ? 2 : options.scaleX);
        this.scaleY = (_.isUndefined(options.scaleY) || _.isNull(options.scaleY) ? 2 : options.scaleY);
        this.renderer = null;
        this.stage = null;
        this.textures = {};
        this.fpsMeter = null;
        this.frameReady = false;
        this.bgCanvas = null;
        this.bgContext = null;
        this.bgImageData = null;
        this.bgTexture = null;
        this.bgSprite = null;
        this.ratio = 0;
    },

    load: function() {
        var self = this,
            settings = {
                view: false,
                transparent: false,
                antialias: true,
                preserveDrawingBuffer: false,
                resolution: 1,
                autoResize: true,
                forceFXAA: false
            };

        this.fpsMeter = new FPSMeter();
        this.ratio = this.width / this.height;

        // Disable Pixi banner in console.
        PIXI.utils._saidHello = true;

        // Create renderer.
        this.renderer = PIXI.autoDetectRenderer(this.width * (this.scaleX + 1), this.height * (this.scaleY + 1), settings);

        // Add canvas to HTML document.
        this.displayDevice.append(this.renderer.view);

        if (this.focus) {
            this.renderer.view.setAttribute('tabindex', 1);

            $(this.renderer.view).on('click', function() {
                self.setFocus();
            });

            this.setFocus();
        }

        // Create a container object called the `stage`.
        this.stage = new PIXI.Container();
        this.stage.scale.x += this.scaleX;
        this.stage.scale.y += this.scaleY;

        // Background canvas.
        this.bgCanvas = document.createElement('canvas');
        this.bgContext = this.bgCanvas.getContext('2d');
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
        this.bgImageData = this.bgContext.createImageData(this.width, this.height);
        this.bgTexture = PIXI.Texture.fromCanvas(this.bgCanvas);
        this.bgSprite = new PIXI.Sprite(this.bgTexture);

        requestAnimationFrame(this.render.bind(this));
    },

    reset: function() {
        _.each(this.textures, function(texture) {
            texture.destroy();
        });
        
        this.textures = {};
        this.stage.destroy(true);
        this.renderer.destroy(true);
    },

    setFocus: function() {
        if (this.focus) {
            $(this.renderer.view).focus();
        }
    },

    addBackgroundPixel: function(color, x, y) {
        if (x >= 0 && x <= this.width - 1 && y >= 0 && y <= this.height - 1) {
            var index = (this.width * y + x) * 4,
                red = color[0],
                green = color[1],
                blue = color[2],
                alpha = 255;

            this.bgImageData.data[index] = red;
            this.bgImageData.data[index + 1] = green;
            this.bgImageData.data[index + 2] = blue;
            this.bgImageData.data[index + 3] = alpha;
        }
    },

    addSprite: function(graphData, graphId, x, y, width, height) {
        var sprite = null,
            canvas = null,
            context = null,
            imageData = null,
            width = width || 8,
            height = height || 8,
            texture = this.textures[graphId];

        if (!texture) {
            canvas = document.createElement('canvas');
            context = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            imageData = context.createImageData(width, height);

            _.each(graphData, function(color, index) {
                var index = index * 4,
                    red = color[0],
                    green = color[1],
                    blue = color[2],
                    alpha = 255;

                if (red == 0 && green == 0 && blue == 0) {
                    alpha = 0;
                }

                imageData.data[index] = red;
                imageData.data[index + 1] = green;
                imageData.data[index + 2] = blue;
                imageData.data[index + 3] = alpha;
            }.bind(this));

            context.putImageData(imageData, 0, 0);
            texture = PIXI.Texture.fromCanvas(canvas);
            this.textures[graphId] = texture;

            delete canvas;
            delete context;
            delete imageData;
        }

        sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;

        this.stage.addChild(sprite);
    
        return sprite;
    },

    getSpriteCounts: function() {
        return this.stage.children.length;
    },

    moveSprite: function(sprite, deltaX, deltaY) {
        sprite.x += deltaX;
        sprite.y += deltaY;
    },

    removeObject: function(index) {
        this.stage.removeChildAt(index);
    },

    removeAllObjects: function() {
        this.stage.removeChildren();
    },

    toggleFullScreen: function(bool) {
        var fullscreenHeight = screen.availWidth / this.ratio,
            scaleX = screen.availWidth / PPU.NES_RESOLUTION_WIDTH,
            scaleY = fullscreenHeight / PPU.NES_RESOLUTION_HEIGHT;

        if (bool) {
            this.renderer.resize(screen.availWidth, fullscreenHeight);
            this.stage.scale.x = scaleX - 1;
            this.stage.scale.y = scaleY - 1;
        }       
    },  

    renderBackground: function() { 
        this.bgContext.putImageData(this.bgImageData, 0, 0);
        this.bgTexture.update();
        this.stage.addChildAt(this.bgSprite, 0);  
    },

    render: function() {
        if (this.frameReady) { 
            this.fpsMeter.tickStart();
            this.frameReady = false;
            this.renderBackground();
            this.renderer.render(this.stage); 
            this.fpsMeter.tick();
        }
           
        requestAnimationFrame(this.render.bind(this));
    }
});