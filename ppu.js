var PPU = Class({
    $const: {
        NES_RESOLUTION_WIDTH: 256, 
        NES_RESOLUTION_HEIGHT: 224,
        V_RAM_SIZE: 0x10000,                    // 64KB.              
        PATTERN_TABLES_START: 0x0000,
        PATTERN_TABLE_SIZE: 0x1000,
        NAME_TABLE_SIZE: 0x3C0,
        NAME_TABLE_0_START: 0x2000,
        NAME_TABLE_1_START: 0x2400,
        NAME_TABLE_2_START: 0x2800,
        NAME_TABLE_3_START: 0x2C00,
        NAME_TABLE_WIDTH: 32,                   // Name table is 32x30 tiles.
        NAME_TABLE_HEIGHT: 30,
        ATTRIBUTE_TABLE_SIZE: 0x40,
        ATTRIBUTE_TABLES_0_START: 0x23C0,
        ATTRIBUTE_TABLES_1_START: 0x27C0,
        ATTRIBUTE_TABLES_2_START: 0x2BC0,
        ATTRIBUTE_TABLES_3_START: 0x2FC0,
        IMAGE_PALETTE_0_START: 0x3F00,
        IMAGE_PALETTE_1_START: 0x3F04,
        IMAGE_PALETTE_2_START: 0x3F08,
        IMAGE_PALETTE_3_START: 0x3F0C,
        PALETTES_START: 0x3F00,
        SPRITE_PALETTE_0_START: 0x3F10,
        SPRITE_PALETTE_1_START: 0x3F14,
        SPRITE_PALETTE_2_START: 0x3F18,
        SPRITE_PALETTE_3_START: 0x3F1C,
        CPU_CYCLES_PER_SCANLINE: 113.667        // Number of CPU cycles per NES scanline.
    },

    // Palette from http://nesdev.com/pal.txt
    palette: ["117 117 117", "39 27 143", "0 0 171", "71 0 159", "143 0 119", "171 0 19", "167 0 0", "127 11 0", "67 47 0", "0 71 0", "0 81 0", "0 63 23", "27 63 95", "0 0 0", "0 0 0", "0 0 0", "188 188 188", "0 115 239", "35 59 239", "131 0 243", "191 0 191", "231 0 91", "219 43 0", "203 79 15", "139 115 0", "0 151 0", "0 171 0", "0 147 59", "0 131 139", "0 0 0", "0 0 0", "0 0 0", "255 255 255", "63 191 255", "95 151 255", "167 139 253", "247 123 255", "255 119 183", "255 119 99", "255 155 59", "243 191 63", "131 211 19", "79 223 75", "88 248 152", "0 235 219", "0 0 0", "0 0 0", "0 0 0", "255 255 255", "171 231 255", "199 215 255", "215 203 255", "255 199 255", "255 199 219", "255 191 179", "255 219 171", "255 231 163", "227 255 163", "171 243 191", "179 255 207", "159 255 243", "0 0 0", "0 0 0", "0 0 0"],

    constructor: function(options) {
        this.mobo = options.mobo;
        this.mainDisplayDevice = options.mainDisplayDevice;
        this.tilesDisplayDevice = options.tilesDisplayDevice;
        this.nameTableDisplayDevice = options.nameTableDisplayDevice;
        this.vram = new VRAM();                         // Video RAM.
        this.sram = new SRAM();                         // Sprite RAM.
        this.oam = new Array(64);                       // 64 sprites to be rendered.
        this.tiles = new Array(0x200);                  // Tiles from pattern tables. Two tile sets each one is 256KB for a 512KB total.
        this.mainRenderer = null;
        this.tilesRenderer = null;
        this.nameTableRenderer = null;
        this.sramAddress = 0x00;
        this.vramIOaddress = 0x00;
        this.vramIOAddressHighBits = 0x00;
        this.vramIOAddressLowBits = 0x00;
        this.cycles = 0;
        this.scanline = -1;
        this.tileIndex = 0;                             // Current tile index in name table.
        this.spriteOverflow = false;
        this.patternTableIndex = 0;
    },

    load: function() {
        this.vram.load();
        this.sram.load();

        this.mainRenderer = new Renderer({
            displayDevice: this.mainDisplayDevice,
            width: 640,
            height: 480,
            focus: true
        });
        
        this.mainRenderer.load();

        this.tilesRenderer = new Renderer({
            displayDevice: this.tilesDisplayDevice,
            width: 640,
            height: 480,
            focus: false
        });
        this.tilesRenderer.load();

        this.nameTableRenderer = new Renderer({
            displayDevice: this.nameTableDisplayDevice,
            width: PPU.NAME_TABLE_WIDTH * 8,
            height: PPU.NAME_TABLE_HEIGHT * 8,
            focus: false
        });
        this.nameTableRenderer.load();

        this.mainRenderer.setFocus();
        
        this.mobo.cpu.writeToRAM(CPU.PPU_STATUS_REGISTER, [128]);
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

        // this.renderTiles();
    },

    reset: function() {
        this.cycles = 0;
        this.scanline = -1;
        this.tileIndex = 0;
        this.tiles.length = 0;
        this.mainRenderer.reset();
        this.tilesRenderer.reset();
        this.nameTableRenderer.reset();
        this.vram.reset();
        this.sram.reset();
        this.spriteOverflow = false;

        _.each(this.oam, function(oam, index, list) {
            list[index] = 0xFF;
        });

        // this.mobo.cpu.writeToRAM(0x2002, [128]);
    },

    /*
        Render one scanline at a time (http://wiki.nesdev.com/w/index.php/PPU_rendering).
    */  
    render: function() {
        var i = 0,
            ppuRegister = 0;

        if (this.scanline == -1) {
            ppuRegister = this.mobo.cpu.readFromRAM(CPU.PPU_STATUS_REGISTER);

            if (ppuRegister >> 7 == 1) {    // Clear PPU status register bit 7 to indicate v-blank has started (http://wiki.nesdev.com/w/index.php/PPU_registers#PPUMASK).
                this.mobo.cpu.writeToRAM(CPU.PPU_STATUS_REGISTER, ppuRegister - 128);
            }

            this.mainRenderer.removeAllObjects();
        } else {
            // Render every 8th scanline.
            if (this.scanline > 0 && this.scanline % 8 == 0 && this.scanline <= 240) {    
                this.renderScanline();
            }

            if (this.scanline == 240) {
                this.renderSprites();
            }

            if (this.scanline == 241) {
                ppuRegister = this.mobo.cpu.readFromRAM(CPU.PPU_STATUS_REGISTER);

                if (ppuRegister >> 7 != 1) {    // Set PPU status register bit 7 to indicate v-blank has started (http://wiki.nesdev.com/w/index.php/PPU_registers#PPUMASK).
                    this.mobo.cpu.writeToRAM(CPU.PPU_STATUS_REGISTER, ppuRegister + 128);
                }
            }
            
            // Rendered a full frame. Start a new one.
            if (this.scanline >= 262) {
                this.nextFrame();
                return;
            }
        }

        this.scanline++;
    },  

    /*
        Next frame when all pixels are rendered.
    */
    nextFrame: function() {
        this.cycles = 0;
        this.scanline = -1;
        this.tileIndex = 0;
        this.mobo.cpu.triggerInterrupt(CPU.NMI_INTERRUPT);
    },

    /*
        Render scanline. To keep it simple and faster, each scanline renders 32 tiles horizontally instead of rendering one pixel across the screen.
    */  
    renderScanline: function() {
        var i = 0,
            background = this.getNameTableData(this.getNameTableIndex()),
            attributes = this.getAttributeTableData(this.getPatternTableIndex());

        for (i = 0; i < background.length; i++) {
            tile = _.toArray($.extend(true, {},  this.getTile(background[i])));

            _.each(tile, function(pixel, index, list) {
                var rgb = [],
                    paletteColors = [],
                    attributeByte = attributes[Math.floor(index / 4)],
                    tileNum = 0,
                    matrixScanline = (this.scanline / 8 - 1) % 4,   // Scan line in 4x4 color matrix from attribute table.
                    twoBits = 0;    // Upper two color bits.

                // Read color info from attribute table per byte (http://tuxnes.sourceforge.net/nestech100.txt).
                // Starting tile number every 8th scanline.
                switch (matrixScanline) {
                    case 0:
                        tileNum = 0;
                    break;

                    case 1:
                        tileNum = 2;
                    break;

                    case 2:
                        tileNum = 8;
                    break;

                    case 3:
                        tileNum = 10
                    break;
                };

                // Tile number in the scanline across the screen (rotates every 4 tiles).
                switch (index % 4) {
                    case 1:
                        tileNum = tileNum + 1;
                    break;

                    case 2:
                        tileNum = tileNum + 4;
                    break;

                    case 3:
                        tileNum = tileNum + 5;
                    break;

                    default:
                }

                switch (tileNum) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        twoBits = attributeByte & 3;
                    break;

                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        twoBits = attributeByte >> 2 & 3;
                    break;

                    case 8:
                    case 9:
                    case 10:
                    case 11:
                        twoBits = attributeByte >> 4 & 3;
                    break;

                    case 12:
                    case 13:
                    case 14:
                    case 15:
                        twoBits = attributeByte >> 6 & 3;
                    break;

                    default:
                };

                paletteColors = this.getImageColors(twoBits);

                if (pixel != 0) {
                    rgb = paletteColors[pixel - 1].split(' ');
                    list[index] = rgb[0] << 16 | rgb[1] << 8 | rgb[2];      // Pixel color in RGB color code.
                }
            }.bind(this));

            this.mainRenderer.addSprite(tile, i * 8, this.scanline - 8);
            this.cycles += 64;
        }

        this.tileIndex += 32;
    },

    /*
        Render sprites (http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation).
    */
    renderSprites: function() {
        var i = 0,
            cursor = 0,
            sramAddress = 0x00,
            tile = '',
            x = 0,
            y = 0,
            paletteColors = [];

        do {
            // Only add sprite if it is in view.
            if (this.sram.readFrom(sramAddress) <= this.scanline) {
                y = this.sram.readFrom(sramAddress);                                                        // Y position.
                tile = _.toArray($.extend(true, {},  this.tiles[this.sram.readFrom(sramAddress + 1)]));     // Tile index number.
                paletteColors = this.getPaletteColors(this.sram.readFrom(sramAddress + 2) & 3);             // Sprite attributes. First two btis is palette index.
                x = this.sram.readFrom(sramAddress + 3);                                                    // X position.

                _.each(tile, function(pixel, index, list) {
                    var rgb = [];

                    if (pixel != 0) {
                        rgb = paletteColors[pixel - 1].split(' ');
                        list[index] = rgb[0] << 16 | rgb[1] << 8 | rgb[2];      // Pixel color in RGB color code.
                    }
                }.bind(this));

                this.mainRenderer.addSprite(tile, x, y);
                cursor += 4;
            }

            sramAddress += 4;
        } while(cursor <= 252);

        this.spriteOverflow = false;

        // Find next sprite in view to set sprite overflow flag.
        for (i = sramAddress; i < 0x100; i+=4) {
            if (this.sram.readFrom(i) <= this.scanline) {
                this.spriteOverflow = true;
                break;
            }
        }
    },

    getImageColors: function(index) {
        var address = 0x00,
            colors = [];

        switch (index) {
            case 0:
                address = PPU.IMAGE_PALETTE_0_START;
            break;

            case 1:
                address = PPU.IMAGE_PALETTE_1_START;
            break;

            case 2:
                address = PPU.IMAGE_PALETTE_2_START;
            break;

            case 3:
                address = PPU.IMAGE_PALETTE_3_START;
            break;

            default:
        }

        colors.push(this.palette[this.vram.readFrom(address + 1)]);
        colors.push(this.palette[this.vram.readFrom(address + 2)]);
        colors.push(this.palette[this.vram.readFrom(address + 3)]);

        return colors;
    },

    getPaletteColors: function(index) {
        var address = 0x00,
            colors = [];

        switch (index) {
            case 0:
                address = PPU.SPRITE_PALETTE_0_START;
            break;

            case 1:
                address = PPU.SPRITE_PALETTE_1_START;
            break;

            case 2:
                address = PPU.SPRITE_PALETTE_2_START;
            break;

            case 3:
                address = PPU.SPRITE_PALETTE_3_START;
            break;

            default:
        }

        colors.push(this.palette[this.vram.readFrom(address + 1)]);
        colors.push(this.palette[this.vram.readFrom(address + 2)]);
        colors.push(this.palette[this.vram.readFrom(address + 3)]);

        return colors;
    },

    /*
        Get current name table index from PPU control regier 1 (0x2000).
    */
    getNameTableIndex: function() {
        var reg = this.mobo.cpu.readFromRAM(CPU.PPU_CONTROL_REGISTER_1),
            index = reg & 3;    // First 2 bits is index.

        return index;
    },

    /*
        Get current pattern table index from PPU control register 1 (0x2000).
    */
    getPatternTableIndex: function() {
        var reg = this.mobo.cpu.readFromRAM(CPU.PPU_CONTROL_REGISTER_1),
            index = reg >> 3 & 1;    // Bit 3 is index.

        return index;
    },

    getTile: function(index) {
        var tile = [],
            patternTablePosition = (this.patternTableIndex == 0 ? 0 : 256),
            index = index + patternTablePosition;

        if (index > this.tiles.length - 1) {
            throw new Error ('Tile ' + index + ' not found.');
        } 
            
        tile = this.tiles[index];

        return tile;
    },

    renderTiles: function() {
        var x = 0,
            y = -1;

        _.each(this.tiles, function(tile, index) {
            x = index % 8 * 8;

            if (x == 0) {
                y += 8;
            }

            this.tilesRenderer.addObject(tile, x, y);
        }.bind(this));

        this.tilesRenderer.render();
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

    /*
        Get 32 tiles in every 8th scanline.
    */
    getNameTableData: function(index) {
        var address = 0x00,
            data = [];

        if (index > 3 || index < 0) {
            throw new Error('Invalid name table index. ' + index);
        }

        switch (index) {
            case 0:
                address = PPU.NAME_TABLE_0_START;
            break;

            case 1:
                address = PPU.NAME_TABLE_1_START;
            break;

            case 2:
                address = PPU.NAME_TABLE_2_START;
            break;

            case 3:
                address = PPU.NAME_TABLE_3_START;
            break;

            default:
        }

        address += (this.scanline / 8) * 32 - 32;

        for (i = address; i < address + 32; i++) {
            data.push(this.vram.readFrom(i));
        }

        return data;
    },

    /*
        Get nametable attribute for 32 tiles in every 8th scanline.
    */
    getAttributeTableData: function(index) {
        var address = 0x00,
            length = 32 / 4,    // One byte is 4x4 tiles.
            data = [];

        if (index > 3 || index < 0) {
            throw new Error('Invalid attribute table index. ' + index);
        }

        switch (index) {
            case 0:
                address = PPU.ATTRIBUTE_TABLES_0_START;
            break;

            case 1:
                address = PPU.ATTRIBUTE_TABLES_1_START;
            break;

            case 2:
                address = PPU.ATTRIBUTE_TABLES_2_START;
            break;

            case 3:
                address = PPU.ATTRIBUTE_TABLES_3_START;
            break;

            default:
        }

        address = address + this.scanline / 32 * length

        for (i = address; i < address + length; i++) {
            data.push(this.vram.readFrom(i));
        }

        return data;
    },

    renderNameTable: function(index) {
        var oldScanline = this.scanline,
            nameTable = this.getNameTableData(index),
            tile = '',
            x = 0,
            y = -1,
            i = 0;
        
        for (i = 0; i < nameTable.length; i++) {
            tile = this.tiles[nameTable[i]];
            x = i % 32;
            
            if (x == 0) {
                y++;
            }

            this.nameTableRenderer.addObject(tile, x * 8, y * 8);
        }      

        this.nameTableRenderer.render();
        this.scanline = oldScanline;
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

        // Read PPU controler register #1 (0x2000) bit 2 to increase VRAM address by 1 or 32.
        this.vramIOaddress += ((this.mobo.cpu.readFromRAM(CPU.PPU_CONTROL_REGISTER_1) >> 2 & 1) == 0 ? 1 : 32);
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
        this.displayDevice = options.displayDevice;
        this.width = options.width;
        this.height = options.height;
        this.focus = options.focus || false;
        this.renderer = null;
        this.stage = null;
        this.textures = [];
        this.objects = [];
        // this.meter = new FPSMeter();
    },

    load: function() {
        var self = this,
            settings = {
                view: false,
                transparent: false,
                antialias: false,
                preserveDrawingBuffer: false,
                resolution: 1
            };

        // Create the renderer.
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, settings);

        // Add the canvas to the HTML document.
        this.displayDevice.append(this.renderer.view);

        if (this.focus) {
            this.renderer.view.setAttribute('tabindex', 1);

            $(this.renderer.view).on('click', function() {
                self.setFocus();
            });
        }

        // Create a container object called the `stage`.
        this.stage = new PIXI.Container();

        requestAnimationFrame(this.render.bind(this));
    },

    reset: function() {
        _.each(this.textures, function(texture) {
            texture.destroy();
        });
        
        this.textures.length = 0;
        this.objects.length = 0;

        this.stage.destroy(true);
        this.renderer.destroy(true);
    },

    setFocus: function() {
        if (this.focus) {
            $(this.renderer.view).focus();
        }
    },

    addSprite: function(graphData, x, y) {
        var dimensions = Math.sqrt(graphData.length),
            sprite = null,
            canvas = null,
            context = null,
            imageData = null,
            texture = null,
            found = _.find(this.textures, function(obj) {
                        return obj.graphData.toString() == graphData.toString();
                    });

        if (found) {
            texture = found.texture;
        } else {
            canvas = document.createElement('canvas');
            context = canvas.getContext('2d');
            canvas.width = dimensions;
            canvas.height = dimensions;
  
            imageData = context.createImageData(dimensions, dimensions);

            _.each(graphData, function(pixel, index) {
                var red = 0,
                    green = 0,
                    blue = 0,
                    alpha = 0;

                if (pixel != 0) {
                    red = pixel >> 16;
                    green = pixel >> 8 & 0xFF;
                    blue = pixel & 0xff;
                    alpha = 255;
                }

                index *= 4;

                imageData.data[index++] = red;
                imageData.data[index++] = green;
                imageData.data[index++] = blue;
                imageData.data[index] = alpha;
            }.bind(this));

            context.putImageData(imageData, 0, 0);
            texture = PIXI.Texture.fromCanvas(canvas);
            
            this.textures.push({
                graphData: graphData,
                texture: texture
            });

            delete canvas;
            delete context;
            delete imageData;
        }

        sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        this.stage.addChild(sprite);
    },

    addObject: function(graphData, x, y) {
        var dimensions = Math.sqrt(graphData.length);

        _.each(graphData, function(pixel, index) {
            var red = (pixel == 0 ? 0 : 255),
                green = (pixel == 0 ? 0 : 255),
                blue = (pixel == 0 ? 0 : 255),
                alpha = (pixel == 0 ? 0 : 255),
                xPos = index % dimensions,
                yPos = Math.floor(index / dimensions),
                dataIndex = (yPos + y) * this.canvas.width + (xPos + x);

            dataIndex *= 4;

            this.imageData.data[dataIndex++] = red;
            this.imageData.data[dataIndex++] = green;
            this.imageData.data[dataIndex++] = blue;
            this.imageData.data[dataIndex] = alpha;
        }.bind(this));
    },

    removeObject: function(index) {
        this.stage.removeChildAt(index);
    },

    removeAllObjects: function() {
        this.stage.removeChildren();
    },

    render: function() {
        // this.meter.tickStart();
        this.renderer.render(this.stage);
        requestAnimationFrame(this.render.bind(this));
        // this.meter.tick();
    }
});