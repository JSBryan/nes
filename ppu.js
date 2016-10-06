var PPU = Class({
    $const: {
        V_RAM_SIZE: 0x10000,    // 64KB.              
        PATTERN_TABLES_START: 0x0000,
        PATTERN_TABLE_SIZE: 0x1000,
        NAME_TABLES_START: 0x2000,
        NAME_TABLE_SIZE: 0x3C0,
        NAME_TABLE_WIDTH: 32,       // Name table is 32x30 tiles.
        NAME_TABLE_HEIGHT: 30,
        ATTRIBUTE_TABLES_START: 0x23C0,
        ATTRIBUTE_TABLE_SIZE: 0x40,
        PALETTES_START: 0x3F00
    },

    // Palette from http://nesdev.com/pal.txt
    palette: ["117 117 117", "39 27 143", "0 0 171", "71 0 159", "143 0 119", "171 0 19", "167 0 0", "127 11 0", "67 47 0", "0 71 0", "0 81 0", "0 63 23", "27 63 95", "0 0 0", "0 0 0", "0 0 0", "188 188 188", "0 115 239", "35 59 239", "131 0 243", "191 0 191", "231 0 91", "219 43 0", "203 79 15", "139 115 0", "0 151 0", "0 171 0", "0 147 59", "0 131 139", "0 0 0", "0 0 0", "0 0 0", "255 255 255", "63 191 255", "95 151 255", "167 139 253", "247 123 255", "255 119 183", "255 119 99", "255 155 59", "243 191 63", "131 211 19", "79 223 75", "88 248 152", "0 235 219", "0 0 0", "0 0 0", "0 0 0", "255 255 255", "171 231 255", "199 215 255", "215 203 255", "255 199 255", "255 199 219", "255 191 179", "255 219 171", "255 231 163", "227 255 163", "171 243 191", "179 255 207", "159 255 243", "0 0 0", "0 0 0", "0 0 0"],

    constructor: function(options) {
        this.mobo = options.mobo;
        this.tilesDisplayDevice = options.tilesDisplayDevice;
        this.nameTableDisplayDevice = options.nameTableDisplayDevice;
        this.vram = new VRAM();                       // Video RAM.
        this.sram = new SRAM();                       // Sprite RAM.
        this.tiles = new Array(0x200);                // Tiles from pattern tables. Two tile sets each one is 256KB for a 512KB total.
        this.tilesRenderer = null;
        this.nameTableRenderer = null;
        this.sramAddress = 0x00;
        this.vramIOaddress = 0x00;
        this.vramIOAddressHighBits = 0x00;
        this.vramIOAddressLowBits = 0x00;
    },

    load: function() {
        this.vram.load();
        this.sram.load();
        this.reset();
        this.mobo.cpu.writeToRAM(0x2002, [128]);
    },

    loadTiles: function() {
        var i = 0,  
            index = 0,
            tileIndex = -1,
            val = 0,
            bit = 0,
            valBits = '';

        // First and second pattern table tiles.
        for (i = PPU.PATTERN_TABLES_START; i < 0x2000; i++) {
            if (i % 16 == 0) {
                tileIndex++;
                this.tiles[tileIndex] = new Array(64);
            }
            
            // Show value in binary format with all eight bits.
            val = this.vram.readFrom(i);        
            valBits = val.toString(2);
            valBits = '00000000'.substr(valBits.length) + valBits;

            for (j = 0; j < valBits.length; j++) {
                bit = parseInt(valBits[j]);
                index = j + (i % 8) * 8;

                if (this.tiles[tileIndex][index]) {
                    if (this.tiles[tileIndex][index] == 0) {
                        if (bit == 1) {
                            bit = 2;
                        }
                    } else if (this.tiles[tileIndex][index] == 1) {
                        if (bit == 1) {
                            bit = 3;
                        } else {
                            bit = 1;
                        }
                    }
                } 

                this.tiles[tileIndex][index] = bit;
            }
        }

        this.renderTiles();
    },

    reset: function() {
        this.tiles.length = 0;

        if (this.tilesRenderer) {
            this.tilesRenderer.reset();
        }

        if (this.nameTableRenderer) {
            this.nameTableRenderer.reset();
        }
    },

    nextFrame: function() {
        this.mobo.cpu.triggerInterrupt(CPU.NMI_INTERRUPT);
    },

    getTile: function(index) {
        var tile = [],
            tileStr = '';

        if (index > this.tiles.length - 1) {
            throw new Error ('Tile ' + index + ' not found.');
        } else {
            tile = this.tiles[index];

            _.each(tile, function(spriteData, index) {
                var xPos = index % 8;

                if (xPos == 0 && index > 0) {
                    tileStr += '\n';
                } 

                tileStr += spriteData;
            });

            console.log(tileStr);

            return tile;
        }
    },

    renderTiles: function() {
        this.tilesRenderer = new Renderer({
            displayDevice: this.tilesDisplayDevice,
            width: 640,
            height: 480
        });

        _.each(this.tiles, function(tile, index) {
            var x = index % 8 * 8;
                y = Math.floor(index / 8) * 8;

            this.tilesRenderer.render(tile, x, y);
        }.bind(this));
    },

    getPatternTable: function(index) {
        var address = 0x00,
            data = [];

        if (index > 1 || index < 0) {
            throw new Error('Invalid pattern table index. ' + index);
        } 

        address = PPU.PATTERN_TABLE_SIZE * index + PPU.PATTERN_TABLES_START;

        for (i = address; i < address + PPU.PATTERN_TABLE_SIZE; i++) {
            data.push(this.vram.readFrom(i));
        }

        return data;
    },

    getNameTable: function(index) {
        var address = 0x00,
            data = [];

        if (index > 3 || index < 0) {
            throw new Error('Invalid name table index. ' + index);
        }

        address = PPU.NAME_TABLE_SIZE * index + PPU.NAME_TABLES_START;

        for (i = address; i < address + PPU.NAME_TABLE_SIZE; i++) {
            data.push(this.vram.readFrom(i));
        }

        return data;
    },

    getAttributeTable: function(index) {
        var address = 0x00,
            data = [];

        if (index > 3 || index < 0) {
            throw new Error('Invalid attribute table index. ' + index);
        }

        address = PPU.ATTRIBUTE_TABLE_SIZE * index + PPU.ATTRIBUTE_TABLES_START;

        for (i = address; i < address + PPU.ATTRIBUTE_TABLE_SIZE; i++) {
            data.push(this.vram.readFrom(i));
        }

        return data;
    },

    renderNameTable: function(index) {
        var nameTable = this.getNameTable(index),
            tileIndex = 0,
            i = 0,
            j = 0,
            x = 0,
            y = 0;

        this.nameTableRenderer = new Renderer({
            displayDevice: this.nameTableDisplayDevice,
            width: 256,
            height: 240
        });
        
        console.log('Name table ' + index, nameTable);

        for (i = 0; i < PPU.NAME_TABLE_HEIGHT; i++) {
            for (j = 0; j < PPU.NAME_TABLE_WIDTH; j++) {
                tile = this.tiles[nameTable[tileIndex]];
                x = tileIndex % 8 * 8;
                y = Math.floor(tileIndex / 8) * 8;
                this.nameTableRenderer.render(tile, x, y);
                tileIndex++;    
            }
        }        
    },

    setSRAMaddress: function(data) {
        this.sramAddress = data;
    },

    writeToSRAM: function(data) {
        this.sram.writeTo(this.sramAddress, data);
    },

    setVRAMaddress: function(data) {
        if (this.vramIOAddressHighBits == 0x00) {
            this.vramIOAddressHighBits = data;
        } else {
            this.vramIOAddressLowBits = data;
            this.vramIOaddress = this.vramIOAddressLowBits | this.vramIOAddressHighBits << 8;
            this.vramIOAddressHighBits = 0x00;
            this.vramIOAddressLowBits = 0x00;
        }  
    },

    writeIOToVRAM: function(data) {
        this.vram.writeTo(this.vramIOaddress, data);

        // Read ppu controler register #1 (0x2000) bit 2 to increase vram address by 1 or 32.
        this.vramIOaddress += ((this.mobo.cpu.readFromRAM(0x2000) >> 2 & 1) == 0 ? 1 : 32);
    },

    dump: function() {
        
    }
});

var VRAM = Class({
    $const: {
        VRAM_SIZE: 0x10000    // 64KB.              
    },

    constructor: function(options) {
        this.memory = new Array(VRAM.VAM_SIZE);
    },

    load: function() {
        this.reset();
    },

    reset: function() {
        var i = 0;

        this.memory.length = 0;

        // Pattern tables.
        for (i = 0; i < 0x2000; i++) {
            this.memory[i] = 0x00;
        }

        // Name/attribute tables.
        for (i = 0x2000; i < 0x3F00; i++) {
            this.memory[i] = 0x00;
        }

        // Image/sprite palettes.
        for (i = 0x3F00; i < 0x4000; i++) {
            this.memory[i] = 0x00;
        }

        // Mirrors.
        for (i = 0x4000; i < 0x10000; i++) {
            this.memory[i] = 0x00;
        }
    },

    writeTo: function(address, data) {
        var i = 0;

        for (i = 0; i < data.length; i++) {
            this.memory[address + i] = data[i];
        }
    },

    readFrom: function(address) {
        try {
            return this.memory[address];
        } catch(e) {
            console.log('Invalid memory address.', address);
            throw e;
        }
    }
}); 

var SRAM = Class({
    $const: {
        SRAM_SIZE: 0x10000    // 64KB.              
    },

    constructor: function(options) {
        this.memory = new Array(SRAM.SRAM_SIZE);
    },

    load: function() {
        this.reset();
    },

    reset: function() {
        var i = 0;

        this.memory.length = 0;

        for (i = 0; i < SRAM.SRAM_SIZE; i++) {
            this.memory[i] = 0x00;
        }
    },

    writeTo: function(address, data) {
        var i = 0;

        for (i = 0; i < data.length; i++) {
            this.memory[address + i] = data[i];
        }
    },

    readFrom: function(address) {
        try {
            return this.memory[address];
        } catch(e) {
            console.log('Invalid memory address.', address);
            throw e;
        }
    }
}); 

var Renderer = Class({
    $const: {
        
    },

    constructor: function(options) {
        var settings = {
                view: false,
                transparent: false,
                antialias: false,
                preserveDrawingBuffer: false,
                resolution: 1
            };

        this.displayDevice = options.displayDevice;
        this.width = options.width;
        this.height = options.height;

        // Create the renderer.
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, settings);

        // Add the canvas to the HTML document.
        this.displayDevice.append(this.renderer.view);

        // Create a container object called the `stage`.
        this.stage = new PIXI.Container();
    },

    load: function() {
        this.reset();
    },

    reset: function() {
        this.stage.destroy(true);
        this.renderer.destroy(true);
    },

    render: function(graphData, x, y) {
        var pixels = new PIXI.Graphics(),
            dimensions = Math.sqrt(graphData.length),
            pixelDimension = 1;

        _.each(graphData, function(spriteData, index) {
            var color = 0xFFFFFF,
                xPos = index % dimensions * pixelDimension,
                yPos = Math.floor(index / dimensions) * pixelDimension;

            if (spriteData == 0) {
                color = 0x000000;
            } 

            pixels.beginFill(color);
            pixels.drawRect(xPos + x, yPos + y, pixelDimension, pixelDimension);
        });

        pixels.endFill(); 

        this.stage.addChild(pixels);
        this.renderer.render(this.stage);
    }
});