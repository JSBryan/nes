var PPU = Class({
    $const: {
        NES_RESOLUTION_WIDTH: 256, 
        NES_RESOLUTION_HEIGHT: 240,          
        PATTERN_TABLES_START: 0x0000,
        PATTERN_TABLE_SIZE: 0x1000,
        PATTERN_TABLE_0_START: 0x0000,
        PATTERN_TABLE_0_END: 0x0FFF,
        PATTERN_TABLE_1_START: 0x1000,
        PATTERN_TABLE_1_END: 0x1FFF,
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
        SPRITE_PALETTE_0_START: 0x3F10,
        SPRITE_PALETTE_1_START: 0x3F14,
        SPRITE_PALETTE_2_START: 0x3F18,
        SPRITE_PALETTE_3_START: 0x3F1C,
        PPU_CONTROL_REGISTER_1: 0x2000,
        PPU_MASK_REGISTER: 0x2001,
        PPU_STATUS_REGISTER: 0x2002,
        PPU_OAM_ADDR_REGISTER: 0x2003,
        PPU_OAM_DATA_REGISTER: 0x2004,
        PPU_SCROLL_REGISTER: 0x2005,
        PPU_ADDR_REGISTER: 0x2006,
        PPU_DATA_REGISTER: 0x2007,
        UNIVERSAL_BACKDROP_COLOR_ADDRESS: 0x3F00,
        PPU_CYCLES_PER_SCANLINE: 341                     // Number of PPU cycles per scanline.
    },

    // Palette from http://nesdev.com/pal.txt.
    palette: [[117, 117, 117], [ 39,  27, 143], [  0,   0, 171], [ 71,   0, 159], [143,   0, 119], [171,   0,  19], [167,   0,   0], [127,  11,   0], [ 67,  47,   0], [  0,  71,   0], [  0,  81,   0], [  0,  63,  23], [ 27,  63,  95], [  0,   0,   0], [  0,   0,   0], [  0,   0,   0], [188, 188, 188], [  0, 115, 239], [ 35,  59, 239], [131,   0, 243], [191,   0, 191], [231,   0,  91], [219,  43,   0], [203,  79,  15], [139, 115,   0], [  0, 151,   0], [  0, 171,   0], [  0, 147,  59], [  0, 131, 139], [  0,   0,   0], [  0,   0,   0], [  0,   0,   0], [255, 255, 255], [ 63, 191, 255], [ 95, 151, 255], [167, 139, 253], [247, 123, 255], [255, 119, 183], [255, 119,  99], [255, 155,  59], [243, 191,  63], [131, 211,  19], [ 79, 223,  75], [ 88, 248, 152], [  0, 235, 219], [  0,   0,   0], [  0,   0,   0], [  0,   0,   0], [255, 255, 255], [171, 231, 255], [199, 215, 255], [215, 203, 255], [255, 199, 255], [255, 199, 219], [255, 191, 179], [255, 219, 171], [255, 231, 163], [227, 255, 163], [171, 243, 191], [179, 255, 207], [159, 255, 243], [  0,   0,   0], [  0,   0,   0], [  0,   0,   0]],
    paletteStr: [['117', '117', '117'], [' 39',  '27', '143'], ['  0',   '0', '171'], [' 71',   '0', '159'], ['143',   '0', '119'], ['171',   '0',  '19'], ['167',   '0',   '0'], ['127',  '11',   '0'], [' 67',  '47',   '0'], ['  0',  '71',   '0'], ['  0',  '81',   '0'], ['  0',  '63',  '23'], [' 27',  '63',  '95'], ['  0',   '0',   '0'], ['  0',   '0',   '0'], ['  0',   '0',   '0'], ['188', '188', '188'], ['  0', '115', '239'], [' 35',  '59', '239'], ['131',   '0', '243'], ['191',   '0', '191'], ['231',   '0',  '91'], ['219',  '43',   '0'], ['203',  '79',  '15'], ['139', '115',   '0'], ['  0', '151',  '0'], ['  0', '171',   '0'], ['  0', '147',  '59'], ['  0', '131', '139'], ['  0',   '0',   '0'], ['  0',   '0',   '0'], ['  0',   '0',   '0'], ['255', '255', '255'], [' 63', '191', '255'], [' 95', '151', '255'], ['167', '139', '253'], ['247', '123', '255'], ['255', '119', '183'], ['255', '119',  '99'], ['255', '155',  '59'], ['243', '191',  '63'], ['131', '211',  '19'], [' 79', '223',  '75'], [' 88', '248', '152'], ['  0', '235', '219'], ['  0',   '0',   '0'], ['  0',   '0',   '0'], ['  0',   '0',   '0'], ['255', '255', '255'], ['171', '231', '255'], ['199', '215', '255'], ['215', '203', '255'], ['255', '199', '255'], ['255', '199', '219'], ['255', '191', '179'], ['255', '219', '171'], ['255', '231', '163'], ['227', '255', '163'], ['171', '243', '191'], ['179', '255', '207'], ['159', '255', '243'], ['  0',   '0',   '0'], ['  0',   '0',   '0'], ['  0',   '0',   '0']],

    constructor: function(options) {
        this.mobo = options.mobo;
        this.mainDisplayDevice = options.mainDisplayDevice;
        this.tilesDisplayDevice = options.tilesDisplayDevice;
        this.nameTableDisplayDevice = options.nameTableDisplayDevice;
        this.paletteDisplayDevice = options.paletteDisplayDevice;
        this.vram = new VRAM();                         // Video RAM.
        this.sram = new SRAM();                         // Sprite RAM.
        this.oam = new Array(64);                       // 64 sprites to be rendered.
        this.tiles = new Array(0x200);                  // Tiles from pattern tables. Two tile sets each one is 256KB for a 512KB total.
        this.mainRenderer = null;
        this.tilesRenderer = null;
        this.nameTableRenderer = null;
        this.paletteRenderer = null;
        this.spriteRenderer = null;
        this.sramAddress = 0x00;
        this.vramIOaddress = 0x00;
        this.vramIOAddressHighBits = -1;
        this.vramIOAddressLowBits = -1;
        this.cycles = -1;
        this.scanline = 0;
        this.spriteOverflow = false;
        this.patternTableIndex = 0;
        this.vblank = false;                            // Is it in v-blank?
        this.sramWritten = false;                       // Has sprite RAM been written?
        this.firstScrollRegister = true;
        this.nextScrollX = 0;
        this.nextScrollY = 0;
        this.scrollX = 0;
        this.scrollY = 0;
        this.sprite0Hit = false;
        this.readBuffer = 0;
        this.backgroundMask = new Array(PPU.NES_RESOLUTION_WIDTH * PPU.NES_RESOLUTION_HEIGHT);
        this.isNMI = false;
        this.powerUp = true;
        this.spritePatternTableIndex= 0;
        this.nameTableIndex = 0;
        this.backgroundPatternTableIndex = 0;
        this.bigSprite = false;
        this.attributeByteLookUp = new Array(PPU.NES_RESOLUTION_WIDTH * PPU.NES_RESOLUTION_HEIGHT);
        this.attributeTileNumberLookUp = new Array(PPU.NES_RESOLUTION_WIDTH * PPU.NES_RESOLUTION_HEIGHT);
        this.currentScanline = {
            tiles: [],
            attributes: []
        };
    },

    load: function() {
        this.loadAttributeLookUps();
        this.vram.load();
        this.sram.load();

        this.mainRenderer = new Renderer({
            displayDevice: this.mainDisplayDevice,
            width: PPU.NES_RESOLUTION_WIDTH,
            height: PPU.NES_RESOLUTION_HEIGHT,
            focus: true
        });
        this.mainRenderer.load();

        // this.tilesRenderer = new Renderer({
        //     displayDevice: this.tilesDisplayDevice,
        //     width: 600,
        //     height: 880,
        //     focus: false
        // });
        // this.tilesRenderer.load();

        // this.spriteRenderer = new Renderer({
        //     displayDevice: this.tilesDisplayDevice,
        //     width: 600,
        //     height: 880,
        //     focus: false
        // });
        // this.spriteRenderer.load();

        // this.nameTableRenderer = new Renderer({
        //     displayDevice: this.nameTableDisplayDevice,
        //     width: PPU.NES_RESOLUTION_WIDTH,
        //     height: PPU.NES_RESOLUTION_HEIGHT,
        //     focus: false,
        //     scaleX: 0,
        //     scaleY: 0
        // });
        // this.nameTableRenderer.load();

        // this.paletteRenderer = new Renderer({
        //     displayDevice: this.paletteDisplayDevice,
        //     width: PPU.NAME_TABLE_WIDTH * 8,
        //     height: PPU.NAME_TABLE_HEIGHT * 8,
        //     focus: false
        // });
        // this.paletteRenderer.load();

        this.mainRenderer.setFocus();
        
        // this.mobo.cpu.writeToRAM(CPU.PPU_STATUS_REGISTER, [128]);
    },

    loadAttributeLookUps: function() {
        var i = 0,
            j = 0,
            attributeByte = 0,
            tileNumber = 0,
            tileX = 0,
            tileY = 0,
            grid = [
                 [0, 1, 4, 5],
                 [2, 3, 6, 7],
                 [8, 9, 12, 13],
                 [10, 11, 14, 15]
            ],
            pixelPosition = 0,
            xOffset = -1,
            yOffset = -1;

        for (j = 0; j < PPU.NES_RESOLUTION_HEIGHT; j++) {
            if (j % 8 == 0) {
                yOffset++;
            }

            for (i = 0; i < PPU.NES_RESOLUTION_WIDTH; i++) {
                attributeByte = Math.floor(j / 32) * 8;
                attributeByte += Math.floor(i / 32);
                pixelPosition = i + j * PPU.NES_RESOLUTION_WIDTH;

                this.attributeByteLookUp[pixelPosition] = attributeByte;

                if (i % 8 == 0) {
                    xOffset++;
                }

                xOffset %= 4;
                yOffset %= 4;

                this.attributeTileNumberLookUp[pixelPosition] = grid[yOffset][xOffset];
            }
        }
    },

    loadTile: function(tileIndex) {
        var index = 0,
            val = 0,
            valBits = '',
            i = 0,
            startingIndex = PPU.PATTERN_TABLES_START + tileIndex * 16,
            endingIndex = startingIndex + 16,
            verticalIndex = 56,
            horizontalIndex = 7;

        if (!this.tiles[tileIndex]) {
            this.tiles[tileIndex] = { 
                data: new Array(64),
                horizontalData: new Array(64),
                verticalData: new Array(64),
                reverseData: new Array(64)
            };

            for (i = startingIndex; i < endingIndex; i++) {
                // Show value in binary format with all eight bits.
                val = this.readFromVRAM(i);        
                valBits = val.toString(2);
                valBits = '00000000'.substr(valBits.length) + valBits;

                // A tile has 64 bytes.
                if (index >= 63) {
                    index = 0;
                }

                horizontalIndex = index + 7;    // Flip horizontally so start at the end of the row.
                verticalIndex = 56 - index;     // Flip vertically so start at last row.                          

                for (j = 0; j < valBits.length; j++) {
                    bit = parseInt(valBits[j]);

                    if (!_.isUndefined(this.tiles[tileIndex].data[index])) {
                        if (this.tiles[tileIndex].data[index] == 0) {
                            if (bit == 1) {
                                bit = 2;
                            }
                        } else if (this.tiles[tileIndex].data[index] == 1) {
                            if (bit == 1) {
                                bit = 3;
                            } else {
                                bit = 1;
                            }
                        }

                        this.tiles[tileIndex].horizontalData[horizontalIndex] = bit;
                        this.tiles[tileIndex].verticalData[verticalIndex] = bit;
                        this.tiles[tileIndex].reverseData[63 - index] = bit;
                    } 

                    this.tiles[tileIndex].data[index] = bit;  

                    index++;
                    horizontalIndex--;
                    verticalIndex++;
                }
            }
        }  
    },

    loadTiles: function(start, length) {
        var i = 0;

        for (i = start; i < start + length; i++) {
            this.loadTile(i);
        }
    },

    reset: function() {
        this.cycles = -1;
        this.scanline = 0;
        this.tiles.length = 0;
        this.mainRenderer.reset();
        // this.tilesRenderer.reset();
        // this.nameTableRenderer.reset();
        // this.paletteRenderer.reset();
        // this.spriteRenderer.reset();
        this.vram.reset();
        this.sram.reset();
        this.spriteOverflow = false;
        this.vblank = false;
        this.sramWritten = false;
        this.nextScrollX = 0;
        this.nextScrollY = 0;
        this.scrollX = 0;
        this.scrollY = 0;
        this.sprite0Hit= false;
        this.backgroundMask = new Array(PPU.NES_RESOLUTION_WIDTH * PPU.NES_RESOLUTION_HEIGHT);
        this.isNMI = false;
        this.spritePatternTableIndex= 0;
        this.nameTableIndex = 0;
        this.backgroundPatternTableIndex = 0;
        this.bigSprite = false;
        this.attributeByteLookUp = new Array(PPU.NES_RESOLUTION_WIDTH * PPU.NES_RESOLUTION_HEIGHT);
        this.attributeTileNumberLookUp = new Array(PPU.NES_RESOLUTION_WIDTH * PPU.NES_RESOLUTION_HEIGHT);
        this.currentScanline = {
            tiles: [],
            attributes: []
        };

        _.each(this.oam, function(oam, index, list) {
            list[index] = 0xFF;
        });
    },

    emulate: function() {
        var cycleOffset = 1,
            tenthCycles = (this.cycles % 10 == 0);

        if (this.scanline > -1 && this.scanline < 240) {
            this.render();

            if (this.cycles > 0) {
                this.setSprite0Hit();
            }
        }

        if (this.scanline == 241) {
            if (this.cycles == 1) {
                this.vblank = true; 
                this.isNMI = true;
                this.mobo.cpu.triggerInterrupt(CPU.NMI_INTERRUPT);
            }
        }

        if (this.scanline == 261) { 
            if (this.cycles == 1) {
                this.nextFrame();
            }                      
        }

        if (this.cycles == PPU.PPU_CYCLES_PER_SCANLINE - cycleOffset) {
            this.nextScanline();

            if (this.scanline == 240) {
                this.mainRenderer.frameReady = true;

                // Debug graphics.
                // this.renderPalette();
                // this.renderTiles();
                // this.renderLoadedSprites();

                // for (nameTableIndex = 0; nameTableIndex < 4; nameTableIndex++) {
                //     this.renderNametable(nameTableIndex);
                // }
            }

            if (this.scanline >= 245 && this.scanline <= 260) {
                this.loadTiles(this.scanline % 245 * 32, 32);
            }

            // Rendered a full frame. Remove all rendered objects.
            if (this.scanline == 0) {
                this.mainRenderer.removeAllObjects();
                // this.tilesRenderer.removeAllObjects();
                // this.spriteRenderer.removeAllObjects();
                // this.paletteRenderer.removeAllObjects();
                // this.nameTableRenderer.removeAllObjects();                      
            }

            this.cycles = -1;
        }        
    },

    /*
        Run three PPU cycles each CPU cycle.
    */  
    run: function(cpuCycles) {
        var i = 0,
            cycles = cpuCycles * 3;

        for (i = 0; i < cycles; i++) {
            this.cycles++; 
            this.emulate();
        }
    },

    /*
        Render one scanline at a time (http://wiki.nesdev.com/w/index.php/PPU_rendering).
    */  
    render: function() {
        var tenthCycles = (this.cycles % 10 == 0),
            tileIndex = 0,
            cycleOffset = 1;

        if (this.cycles < 320 && tenthCycles) {
            tileIndex = this.cycles / 10;

            // Load next nametable tile every 8th scanline.
            if (this.scanline % 8 == 0) {
                if (this.currentScanline.tiles.length == 32) {
                    this.currentScanline.tiles.length = 0;
                    this.currentScanline.attributes.length = 0;
                }
                
                this.loadScanline(tileIndex);
            }

            // Render next nametable tile in this scanline.
            this.renderScanline(tileIndex);
        }

        if (this.cycles == PPU.PPU_CYCLES_PER_SCANLINE - cycleOffset) {
            this.renderSprites();
        }
    },

    nextScanline: function() {
        if (this.scanline == 261) {
            this.scanline = 0;
        } else {
            this.scanline++;
        }
    },

    /*
        Next frame when everything is rendered.
    */
    nextFrame: function() {
        this.isNMI = false;
        // this.scrollX = this.nextScrollX;
        // this.scrollY = this.nextScrollY;

        // Clear v-blank flag;
        this.vblank = false;

        // Clear sprite 0 hit flag.
        this.sprite0Hit = false;

        // Clear sprite overflow flag.
        this.spriteOverflow = false;
    },

    /*
        Load next nametable tile every 8th scanline.
    */
    loadScanline: function(tileIndex) {
        var patternTableIndex = this.getBackgroundPatternTableIndex(),
            nameTableIndex = this.getNameTableIndex(),
            x = tileIndex * 8, // 0,
            size = 32,
            background = 0,
            tile = [],
            attribute = 0,
            tileNum = 0,
            twoBits = 0;

        background = this.getNameTableData(nameTableIndex, x, this.scanline);
        tile = this.getTile(patternTableIndex, background); 
        attribute = this.getAttributeTableData(nameTableIndex, x, this.scanline); 
        tileNum = this.getAttributeTileNumber(x, this.scanline);

        switch (tileNum) {
            case 0:
            case 1:
            case 2:
            case 3:
                twoBits = attribute & 3;
            break;

            case 4:
            case 5:
            case 6:
            case 7:
                twoBits = attribute >> 2 & 3;
            break;

            case 8:
            case 9:
            case 10:
            case 11:
                twoBits = attribute >> 4 & 3;
            break;

            case 12:
            case 13:
            case 14:
            case 15:
                twoBits = attribute >> 6;
            break;

            default:
        };

        this.currentScanline.tiles.push(tile);
        this.currentScanline.attributes.push(twoBits);          
    },

    /*
        Render a nametable tile in a scanline.
    */  
    renderScanline: function(index) {   
        var scrollX = this.scrollX % 8,
            i = index,
            x = index * 8 - scrollX,
            paletteColors = [],
            bgRows = this.scanline * PPU.NES_RESOLUTION_WIDTH,
            xOffset = 0,
            yOffset = 0,
            pixel = 0,
            tile = [],
            size = 32,
            tileIndex = 0;

        if (this.currentScanline.tiles[i] && this.currentScanline.tiles[i].length) {
            xOffset = (index == 0 ? scrollX : 0);
            yOffset = this.scanline % 8 * 8;
            paletteColors = this.getImageColors(this.currentScanline.attributes[i]);
            tileIndex = yOffset + xOffset;

            // Get pixels in this scanline.
            do {
                if (x > -1) {
                    pixel = paletteColors[this.currentScanline.tiles[i][tileIndex]]; 

                    // Save background color palette indices.
                    this.backgroundMask[x + bgRows] = this.currentScanline.tiles[i][tileIndex];

                    if (pixel) {
                        this.mainRenderer.addBackgroundPixel(pixel, x, this.scanline);
                    }
                    
                    xOffset++;
                    
                } 
                
                x++;
                tileIndex++;
            } while(xOffset < 8 && x < 256);
        }
    },

    setSprite0Hit: function() {
        var i = 0,
            x = 0,
            y = 0,
            backgroundDisabled = this.mobo.cpu.isBackgroundDisabled(),
            spriteDisabled = this.mobo.cpu.isSpriteDisabled(),
            leftSideClipped = this.mobo.cpu.isLeftSideClipped(),
            flipHorizontally = false,
            flipVertically = false,
            tileIndex = 0,
            attribute = 0,
            yOffset = 0,
            bigSprite = this.bigSprite,       // 8x16 sprite.
            height = (bigSprite ? 16 : 8),
            bgRows = this.scanline * PPU.NES_RESOLUTION_WIDTH,
            tile = [],
            xPos = 0,
            yPos = 0;

        y = this.sram.readFrom(0);
        x = this.sram.readFrom(3);

        if (x == 255 || y >= 239 || this.sprite0Hit == true || backgroundDisabled || spriteDisabled || this.sramWritten == false) {
            return;
        }

        if (x + 8 >= 0 && x <= PPU.NES_RESOLUTION_WIDTH && y <= this.scanline && y + height >= this.scanline) {
            attributes = this.sram.readFrom(2);                   // Sprite attributes.
            flipHorizontally = (attributes >> 6 & 1 == 1);
            flipVertically = (attributes >> 7 == 1);
            tileIndex = this.sram.readFrom(1);                    // Tile index number.
            yOffset = (this.scanline - y) * 8;

            if (bigSprite == 1) {
                patternTableIndex = this.getBigSpritePatternTableIndex(tileIndex);
                tile = this.getTile(patternTableIndex, tileIndex - patternTableIndex, flipHorizontally, flipVertically);        // Top tile.
                tile = tile.concat(this.getTile(patternTableIndex, tileIndex - patternTableIndex + 1, flipHorizontally, flipVertically));           // Bottom tile.
            } else {
                patternTableIndex = this.getSpritePatternTableIndex();
                tile = this.getTile(patternTableIndex, tileIndex, flipHorizontally, flipVertically);        
            }

            // Get pixels in this scanline.
            tile = tile.slice(yOffset, yOffset + 8);

            for (i = 0; i < tile.length; i++) {
                xPos = x + i;

                if (tile[i] != 0 && this.backgroundMask[bgRows + xPos] != 0 && xPos >= 0 && xPos < 255) {
                    if (leftSideClipped && xPos >= 0 && xPos <= 7) {

                    } else {
                        this.sprite0Hit = true;
                        break;
                    }
                }
            }
        }
    },

    /*
        Render sprites (http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation).
    */
    renderSprites: function() {
        var sramAddress = 0xFC,
            tile = [],
            x = 0,
            y = 0,
            paletteColors = [],
            attributes = null,
            patternTableIndex = 0,
            flipHorizontally = false,
            flipVertically = false,
            behindBackground = false,
            bigSprite = this.bigSprite,       // 8x16 sprite.
            height = (bigSprite ? 16 : 8),
            rendered = 0,
            bgRows = this.scanline * PPU.NES_RESOLUTION_WIDTH,
            yOffset = 0,
            tileString = '',
            toAdd = false,
            graphData = [];

        do {
            x = this.sram.readFrom(sramAddress + 3);                // X position.
            y = this.sram.readFrom(sramAddress);                    // Y position.

            // Only add sprite if it is in view.
            if (x >= 0 && x <= PPU.NES_RESOLUTION_WIDTH && y <= this.scanline && y + height >= this.scanline) {
                attributes = this.sram.readFrom(sramAddress + 2);                   // Sprite attributes.
                behindBackground = (attributes >> 5 & 1 == 1);
                flipHorizontally = (attributes >> 6 & 1 == 1);
                flipVertically = (attributes >> 7 == 1);
                tileIndex = this.sram.readFrom(sramAddress + 1);                    // Tile index number.
                paletteColors = this.getSpriteColors(attributes & 3);               // First two bits of sprite attributes is palette index.
                
                yOffset = (this.scanline - y) * 8;

                if (bigSprite == 1) {
                    patternTableIndex = this.getBigSpritePatternTableIndex(tileIndex);
                    tile = this.getTile(patternTableIndex, tileIndex - patternTableIndex, flipHorizontally, flipVertically);        // Top tile.
                    tile = tile.concat(this.getTile(patternTableIndex, tileIndex - patternTableIndex + 1, flipHorizontally, flipVertically));           // Bottom tile.
                } else {
                    patternTableIndex = this.getSpritePatternTableIndex();
                    tile = this.getTile(patternTableIndex, tileIndex, flipHorizontally, flipVertically);        
                }

                // Get pixels in this scanline.
                tile = tile.slice(yOffset, yOffset + 8);

                _.each(tile, function(pixel, index, list) {
                    var bgX = x + index % 8;

                    // Do not draw if behind the background flag is on and background pixel is not a transparency color.
                    if (behindBackground && this.backgroundMask[bgX + bgRows] != 0) {
                        
                    } else {
                        if (list[index] != 0) {
                            if (this.palette[paletteColors[pixel]][0] == 0 && this.palette[paletteColors[pixel]][1] == 0 && this.palette[paletteColors[pixel]][2] == 0) {
                                graphData.push([1, 1, 1]);
                                tileString += '111';
                            } else {
                                graphData.push(this.palette[paletteColors[pixel]]);
                                tileString += this.paletteStr[paletteColors[pixel]][0] + this.paletteStr[paletteColors[pixel]][1] + this.paletteStr[paletteColors[pixel]][2];
                            }
                            
                            toAdd = true;
                        } else {
                            graphData.push([0, 0, 0]);
                            tileString += '000';
                        }
                    }
                }.bind(this));

                if (toAdd) {
                    this.mainRenderer.addSprite(graphData, tileString, x, this.scanline, 8, 1);
                    rendered++; 
                    toAdd = false;
                }
                
                graphData.length = 0;
                tileString = '';
            }

            sramAddress -= 4;
        } while(sramAddress >= 0);

        if (rendered > 8) {
            this.spriteOverflow = true;
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

        colors.push(this.palette[this.readFromVRAM(PPU.UNIVERSAL_BACKDROP_COLOR_ADDRESS)]);     // http://wiki.nesdev.com/w/index.php/PPU_palettes
        colors.push(this.palette[this.readFromVRAM(address + 1)]);
        colors.push(this.palette[this.readFromVRAM(address + 2)]);
        colors.push(this.palette[this.readFromVRAM(address + 3)]);

        return colors;
    },

    getSpriteColors: function(index) {
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

        colors.push(this.readFromVRAM(address));
        colors.push(this.readFromVRAM(address + 1));
        colors.push(this.readFromVRAM(address + 2));
        colors.push(this.readFromVRAM(address + 3));

        return colors;
    },

    setNameTableIndex: function(reg) {
        this.nameTableIndex = reg & 3;    // First 2 bits is index.
    },

    /*
        Get current name table index from PPU control regier 1 (0x2000).
    */
    getNameTableIndex: function() {
        return this.nameTableIndex;
    },

    setSpritePatternTableIndex: function(reg) {
        this.spritePatternTableIndex = reg >> 3 & 1;       // Bit 3 is index.
    },

    /*
        Get current sprite pattern table index from PPU control register 1 (0x2000).
    */
    getSpritePatternTableIndex: function() {
        return this.spritePatternTableIndex;
    },

    setBigSprite: function(reg) {
        this.bigSprite = (reg >> 5 & 1);
    },

    /*
        Get current 8x16 sprite pattern table index from tile index number.
    */
    getBigSpritePatternTableIndex: function(tileIndex) {
        var index = null;

        if (this.bigSprite) {
            index = tileIndex & 1;
        }

        return index;
    },

    setBackgroundPatternTableIndex: function(reg) {
        this.backgroundPatternTableIndex = reg >> 4 & 1;
    },

    /*
        Get current background pattern table index from PPU control register 1 (0x2000).
    */
    getBackgroundPatternTableIndex: function() {
        return this.backgroundPatternTableIndex;
    },

    getTile: function(patternTableIndex, index, flipHorizontally, flipVertically) {
        var tile = [];

        if (index > this.tiles.length - 1) {
            throw new Error ('Tile ' + index + ' not found.');
        } 

        if (patternTableIndex == 1) {
            index += 256;
        }

        if (this.tiles[index]) {
            tile = this.tiles[index].data;

            if (flipHorizontally && flipVertically) {
                tile = this.tiles[index].reverseData;
            } else {
                if (flipHorizontally) {
                    tile = this.tiles[index].horizontalData;
                }

                if (flipVertically) {
                    tile = this.tiles[index].verticalData;
                }
            } 
        }

        return tile;
    },

    renderTiles: function() {
        var x = 0,
            y = -8,
            paletteColors = ['0', '16777215', '8325888', '1785695'],
            tile = [],
            tileString = '';

        _.each(this.tiles, function(tile, index) {
            var dividerHeight = (index > 255 ? 5 : 0);

            if (tile) {
                tile = tile.data.slice();
                tileString = '';

                _.each(tile, function(pixel, index, list) {
                    if (pixel != 0) {
                        list[index] = paletteColors[pixel];      // Pixel color in RGB color code.
                    }

                    tileString += list[index];
                }.bind(this));

                x = index % 16 * 8;

                if (x == 0) {
                    y += 8;
                }

                this.tilesRenderer.addSprite(tile, tileString, x, y + dividerHeight);
                tileString = '';
            }
        }.bind(this));
    },

    renderLoadedSprites: function() {
        var sramAddress = 0x00,
            tile = [],
            x = 0,
            y = 0,
            paletteColors = [],
            attributes = null,
            patternTableIndex = 0,
            ppuRegister = this.mobo.cpu.readFromRAM(PPU.PPU_CONTROL_REGISTER_1),
            bigSprite = ppuRegister >> 5 & 1,       // 8x16 sprite
            width = 8,
            height = 8,
            tileString = '';

        do {
            tileIndex = this.sram.readFrom(sramAddress + 1);
            attributes = this.sram.readFrom(sramAddress + 2);                                                
            paletteColors = this.getSpriteColors(attributes & 3);       // Sprite attributes. First two bits is palette index.                                                 

            if (bigSprite == 1) {
                width = 8;
                height = 16;
                patternTableIndex = this.getBigSpritePatternTableIndex(tileIndex);
                tile = this.getTile(patternTableIndex, tileIndex - patternTableIndex);        // Top tile.
                tile = tile.concat(this.getTile(patternTableIndex, tileIndex - patternTableIndex + 1));           // Bottom tile.
            } else {
                patternTableIndex = this.getSpritePatternTableIndex();
                tile = this.getTile(patternTableIndex, tileIndex);        // Tile index number.
            }

            _.each(tile, function(pixel, index, list) {
                if (pixel != 0) {
                    list[index] = paletteColors[pixel];      // Pixel color in RGB color code.
                }

                tileString += list[index];
            }.bind(this));
            
            this.spriteRenderer.addSprite(tile, tileString, x, y, width, height);

            tileString = '';
            x += 8;

            if (x % 64 == 0) {
                y += (bigSprite ? 16 : 8);
                x = 0;
            }

            sramAddress += 4;
        } while(sramAddress <= 252);
    },

    /*
        Get 32 tiles in every 8th scanline and check for scrolling.
    */
    getNameTableData: function(index, x, y) {
        var address = 0x00,
            size = 32,
            data = 0,
            scanline = this.scanline + this.scrollY,
            scrollX = x + this.scrollX,
            scrollY = y + this.scrollY,
            x = Math.floor(scrollX / 8),
            y = Math.floor(scrollY / 8);

        if (index > 3 || index < 0) {
            throw new Error('Invalid name table index. ' + index);
        }

        if (scrollX >= PPU.NES_RESOLUTION_WIDTH && scrollY >= PPU.NES_RESOLUTION_HEIGHT) {
            x = x - 32;
            y = y - 30;

            switch (index) {
                case 0:
                    address = PPU.NAME_TABLE_3_START;
                break;

                case 1:
                    address = PPU.NAME_TABLE_2_START;
                break;

                case 2:
                    address = PPU.NAME_TABLE_1_START;
                break;

                case 3:
                    address = PPU.NAME_TABLE_0_START;
                break;

                default:
            }
        } else if (scrollX >= PPU.NES_RESOLUTION_WIDTH) {
            x = x - 32;

            switch (index) {
                case 0:
                    address = PPU.NAME_TABLE_1_START;
                break;

                case 1:
                    address = PPU.NAME_TABLE_0_START;
                break;

                case 2:
                    address = PPU.NAME_TABLE_3_START;
                break;

                case 3:
                    address = PPU.NAME_TABLE_2_START;
                break;

                default:
            }
        } else if (scrollY >= PPU.NES_RESOLUTION_HEIGHT) {
            y = y - 30;

            switch (index) {
                case 0:
                    address = PPU.NAME_TABLE_2_START;
                break;

                case 1:
                    address = PPU.NAME_TABLE_3_START;
                break;

                case 2:
                    address = PPU.NAME_TABLE_0_START;
                break;

                case 3:
                    address = PPU.NAME_TABLE_1_START;
                break;

                default:
            }
        } else {
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
        }

        data = this.readFromVRAM(address + (x + y * 32));

        return data;
    },

    getAttributeTileNumber: function(x, y) {
        var data = 0,
            x = x + this.scrollX,
            y = y + this.scrollY;

        if (x >= PPU.NES_RESOLUTION_WIDTH && y >= PPU.NES_RESOLUTION_HEIGHT) {
            x = x - PPU.NES_RESOLUTION_WIDTH;
            y = y - PPU.NES_RESOLUTION_HEIGHT;
        } else if (x >= PPU.NES_RESOLUTION_WIDTH) {
            x = x - PPU.NES_RESOLUTION_WIDTH;
        } else if (y >= PPU.NES_RESOLUTION_HEIGHT) {
            y = y - PPU.NES_RESOLUTION_HEIGHT;
        }

        data = this.attributeTileNumberLookUp[x + y * PPU.NES_RESOLUTION_WIDTH];

        return data;
    },

    /*
        Get nametable attribute for 32 tiles in every 8th scanline.
    */
    getAttributeTableData: function(index, x, y) {
        var address = 0x00,
            data = 0,
            x = x + this.scrollX,
            y = y + this.scrollY;

        if (index > 3 || index < 0) {
            throw new Error('Invalid attribute table index. ' + index);
        }

        if (x >= PPU.NES_RESOLUTION_WIDTH && y >= PPU.NES_RESOLUTION_HEIGHT) {
            x = x - PPU.NES_RESOLUTION_WIDTH;
            y = y - PPU.NES_RESOLUTION_HEIGHT;

            switch (index) {
                case 0:
                    address = PPU.ATTRIBUTE_TABLES_3_START;
                break;

                case 1:
                    address = PPU.ATTRIBUTE_TABLES_2_START;
                break;

                case 2:
                    address = PPU.ATTRIBUTE_TABLES_1_START;
                break;

                case 3:
                    address = PPU.ATTRIBUTE_TABLES_0_START;
                break;

                default:
            }
        } else if (x >= PPU.NES_RESOLUTION_WIDTH) {
            x = x - PPU.NES_RESOLUTION_WIDTH;

            switch (index) {
                case 0:
                    address = PPU.ATTRIBUTE_TABLES_1_START;
                break;

                case 1:
                    address = PPU.ATTRIBUTE_TABLES_0_START;
                break;

                case 2:
                    address = PPU.ATTRIBUTE_TABLES_3_START;
                break;

                case 3:
                    address = PPU.ATTRIBUTE_TABLES_2_START;
                break;

                default:
            }
        } else if (y >= PPU.NES_RESOLUTION_HEIGHT) {
            y = y - PPU.NES_RESOLUTION_HEIGHT;

            switch (index) {
                case 0:
                    address = PPU.ATTRIBUTE_TABLES_2_START;
                break;

                case 1:
                    address = PPU.ATTRIBUTE_TABLES_3_START;
                break;

                case 2:
                    address = PPU.ATTRIBUTE_TABLES_0_START;
                break;

                case 3:
                    address = PPU.ATTRIBUTE_TABLES_1_START;
                break;

                default:
            }
        } else {
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
        }

        data = this.readFromVRAM(address + this.attributeByteLookUp[x + y * PPU.NES_RESOLUTION_WIDTH]);

        return data;
    },

    renderNametable: function(index) {
        var address = 0x00,
            i = 0,
            patternTableIndex = this.getBackgroundPatternTableIndex(),
            tile = [],
            paletteColors = ['0', '16777215', '8325888', '1785695'],
            x = 0,
            y = 0,
            deltaX = 0,
            deltaY = 0,
            tileString = '';

        switch (index) {
            case 0:
                address = PPU.NAME_TABLE_0_START;
            break;

            case 1:
                address = PPU.NAME_TABLE_1_START;
                x = 261;
            break;

            case 2:
                address = PPU.NAME_TABLE_2_START;
                y = 245;
            break;

            case 3:
                address = PPU.NAME_TABLE_3_START;
                x = 261;
                y = 245;
            break;

            default:
        }

        this.nameTableRenderer.frameReady = true;

        for (i = address; i < address + PPU.NAME_TABLE_SIZE; i++) {
            tile = this.getTile(patternTableIndex, this.readFromVRAM(i)).slice();

            _.each(tile, function(pixel, index, list) {
                if (pixel != 0) {
                    list[index] = paletteColors[pixel];      
                }

                tileString += list[index];
            });

            this.nameTableRenderer.addSprite(tile, tileString, x + deltaX, y + deltaY);

            tileString = '';
            deltaX += 8;

            if (deltaX >= 256) {
                deltaX = 0;
                deltaY += 8;
            } 
        }
    },

    renderPalette: function() {
        var i = 0,
            j = 0,
            square = [],
            colors = [],
            x = 0,
            y = 0,
            toAdd = false,
            squareString = '';

        for (i = 0; i < 4; i++) {
            colors = this.getImageColors(i);

            _.each(colors, function(color) {
                toAdd = false;
                square.length = 0;

                if (color) {
                    toAdd = true;

                    for (j = 0; j < 64; j++) {
                        square.push(color);
                        squreString += color;
                    }
                }

                if (toAdd) {
                    this.paletteRenderer.addSprite(square, squareString, x, y); 
                }

                squareString = '';
                x += 8;

                if (x >= 32) {
                    y += 8;
                    x = 0;
                }   
            }.bind(this));
        }

        squareString = '';

        for (i = 0; i < 4; i++) {
            colors = this.getSpriteColors(i);

            _.each(colors, function(color) {
                toAdd = false;
                square.length = 0;

                if (color) {
                    toAdd = true;

                    for (j = 0; j < 64; j++) {
                        square.push(color);
                        squreString += color;
                    }
                }

                if (toAdd) {
                    this.paletteRenderer.addSprite(square, squareString, x, y); 
                }

                squareString = '';
                x += 8;

                if (x >= 32) {
                    y += 8;
                    x = 0;
                }   
            }.bind(this));
        }
    },

    getPPUStatusRegister: function() {
        var status = 0 | 0 << 1 | 0 << 2 | 0 << 3 | 0 << 4 | this.spriteOverflow << 5 | this.sprite0Hit << 6 | this.vblank << 7;
        
        this.vblank = false;
        // this.firstScrollRegister = true;
        // this.nextScrollX = 0;
        // this.nextScrollY = 0;
        this.vramIOaddress = 0;
        this.vramIOAddressHighBits = -1;
        this.vramIOAddressLowBits = -1;

        return status;
    },

    setSRAMaddress: function(data) {
        this.sramAddress = data;
    },

    writeToSRAM: function(data, oam) {
        this.sramWritten = true;
        this.sram.writeTo(this.sramAddress, data);

        if (!oam) {
            this.sramAddress++;
        }
    },

    readFromSRAM: function(address) {
        var val = this.sram.readFrom(this.sramAddress);

        return val;
    },

    setVRAMaddress: function(data) {
        if (this.vramIOAddressHighBits == -1) {
            this.vramIOAddressHighBits = data;
        } else {
            this.vramIOAddressLowBits = data;
            this.vramIOaddress = this.vramIOAddressLowBits | this.vramIOAddressHighBits << 8;
            this.vramIOAddressHighBits = -1;
            this.vramIOAddressLowBits = -1;
        }  
    },

    readFromVRAM: function(address) {
        var val = this.vram.readFrom(address);

        return val;
    },

    readIOFromVRAM: function() {
        var regVal = this.mobo.cpu.readFromRAM(PPU.PPU_MASK_REGISTER),
            val = 0,
            isBackgroundDisabled = this.mobo.cpu.isBackgroundDisabled(),
            isSpriteDisabled = this.mobo.cpu.isSpriteDisabled();
        
        // if (this.vblank || (isBackgroundDisabled && isSpriteDisabled)) {
            if (this.vramIOaddress < 0x3F00) {
                val = this.readBuffer;
                this.readBuffer = this.vram.readFrom(this.vramIOaddress);
            } else {
                // Palette returns the value and buffer is the mirror data before it (http://nesdev.com/NinTech.txt).
                val = this.vram.readFrom(this.vramIOaddress);
                this.readBuffer = this.vram.readFrom(this.vramIOaddress - 0x1000);
            }
        // }

        return val;
    },

    /*
        Write data to VRAM.
    */  
    writeIOToVRAM: function(data) {            
        var i = 0,
            regVal = this.mobo.cpu.readFromRAM(PPU.PPU_MASK_REGISTER),
            oldVal = this.readFromVRAM(this.vramIOaddress),
            tileIndex = 0,
            isBackgroundDisabled = this.mobo.cpu.isBackgroundDisabled(),
            isSpriteDisabled = this.mobo.cpu.isSpriteDisabled();

        // if (this.vblank || (isBackgroundDisabled && isSpriteDisabled)) {
            this.vram.writeTo(this.vramIOaddress, data);

            // Check to see if a tile has new data.
            if (this.vramIOaddress >= PPU.PATTERN_TABLE_0_START && this.vramIOaddress <= PPU.PATTERN_TABLE_1_END) {
                if (oldVal != data[0]) {
                    tileIndex = Math.floor(this.vramIOaddress / 16);

                    // Clear data if a tile has been loaded.
                    if (this.tiles[tileIndex]) {
                        this.tiles[tileIndex].data.length = 0;
                        this.tiles[tileIndex].horizontalData.length = 0;
                        this.tiles[tileIndex].verticalData.length = 0;
                        this.tiles[tileIndex].reverseData.length = 0;
                    }

                    this.tiles[tileIndex] = false;
                }
            }

            // PPU mirrors (last section of PPU memory map).
            // this.vram.writeTo(this.vramIOaddress + 0x4000, data);

            // Name table PPU mirrors (0x3000 - 0x3F00).
            if (this.vramIOaddress >= 0x2000 && this.vramIOaddress <= 0x2EFF) {
                this.vram.writeTo(this.vramIOaddress + 0x1000, data);
            }
            if (this.vramIOaddress >= 0x3000 && this.vramIOaddress < 0x3F00) {
                this.vram.writeTo(this.vramIOaddress - 0x1000, data);
            }

            // Name table ROM mirrors.
            if (this.mobo.mmc.rom.verticalMirroring) {
                if (this.vramIOaddress >= PPU.NAME_TABLE_0_START && this.vramIOaddress < PPU.NAME_TABLE_2_START) {
                    this.vram.writeTo(this.vramIOaddress + 0x800, data);
                }
            } else if (this.mobo.mmc.rom.horizontalMirroring) {
                if (this.vramIOaddress >= PPU.NAME_TABLE_0_START && this.vramIOaddress < PPU.NAME_TABLE_1_START || this.vramIOaddress >= PPU.NAME_TABLE_2_START && this.vramIOaddress < 0x3000) {
                    this.vram.writeTo(this.vramIOaddress + 0x400, data);
                }
            } else if (this.mobo.mmc.rom.fourScreenVRAM) {
                this.vram.writeTo(this.vramIOaddress + 0x400, data);
                this.vram.writeTo(this.vramIOaddress + 0x800, data);
                this.vram.writeTo(this.vramIOaddress + 0xC00, data);
            }

            // Palette PPU mirrors.
            if (this.vramIOaddress >= PPU.IMAGE_PALETTE_0_START && this.vramIOaddress <= 0x3F1F) {
                for (i = 1; i < 8; i++) {
                    this.vram.writeTo(this.vramIOaddress + 0x20 * i, data);
                }
            }

            // Palette first index mirrors.
            switch (this.vramIOaddress) {
                case PPU.IMAGE_PALETTE_0_START:
                    this.vram.writeTo(PPU.SPRITE_PALETTE_0_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.SPRITE_PALETTE_0_START + 0x20 * i, data);
                    }
                break;

                case PPU.SPRITE_PALETTE_0_START:
                    this.vram.writeTo(PPU.IMAGE_PALETTE_0_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.IMAGE_PALETTE_0_START+ 0x20 * i, data);
                    }
                break;

                case PPU.IMAGE_PALETTE_1_START:
                    this.vram.writeTo(PPU.SPRITE_PALETTE_1_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.SPRITE_PALETTE_1_START + 0x20 * i, data);
                    }
                break;

                case PPU.SPRITE_PALETTE_1_START:
                    this.vram.writeTo(PPU.IMAGE_PALETTE_1_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.IMAGE_PALETTE_1_START + 0x20 * i, data);
                    }
                break;

                case PPU.IMAGE_PALETTE_2_START:
                    this.vram.writeTo(PPU.SPRITE_PALETTE_2_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.SPRITE_PALETTE_2_START + 0x20 * i, data);
                    }
                break;

                case PPU.SPRITE_PALETTE_2_START:
                    this.vram.writeTo(PPU.IMAGE_PALETTE_2_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.IMAGE_PALETTE_2_START + 0x20 * i, data);
                    }
                break;

                case PPU.IMAGE_PALETTE_3_START:
                    this.vram.writeTo(PPU.SPRITE_PALETTE_3_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.SPRITE_PALETTE_3_START + 0x20 * i, data);
                    }
                break;

                case PPU.SPRITE_PALETTE_3_START:
                    this.vram.writeTo(PPU.IMAGE_PALETTE_3_START, data);
                    for (i = 1; i < 8; i++) {
                        this.vram.writeTo(PPU.IMAGE_PALETTE_3_START + 0x20 * i, data);
                    }
                break;

                default:

            }
        // }
    },

    /*
        Set nametable scroll register. First one is X position then Y position (http://wiki.nesdev.com/w/index.php/PPU_scrolling).
    */  
    setScrollRegister: function(data) {
        var data = parseInt(data);

        if (this.firstScrollRegister) {
            this.scrollX = data;
            this.firstScrollRegister = false;
        } else {
            this.firstScrollRegister = true;

            if (data < 240) {
                this.scrollY = data;
            } 
        }
    },

    toggleFullScreen: function(bool) {
        if (bool) {
            this.mainRenderer.toggleFullScreen(true);
        }
    },

    dump: function() {
        
    }
});

var VRAM = Class({
    $const: {
        VRAM_SIZE: 0x10000    // 64KB.              
    },

    constructor: function(options) {
        this.memory = new Array(VRAM.VRAM_SIZE);
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
        this.scaleX = (_.isUndefined(options.scaleX) || _.isNull(options.scaleX) ? 2 : options.scaleX);
        this.scaleY = (_.isUndefined(options.scaleY) || _.isNull(options.scaleY) ? 2 : options.scaleY);
        this.renderer = null;
        this.stage = null;
        this.textures = {};
        this.fpsMeter = new FPSMeter();
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
        }

        // Create a container object called the `stage`.
        this.stage = new PIXI.Container();
        this.stage.scale.x += this.scaleX;
        this.stage.scale.y += this.scaleY;
        requestAnimationFrame(this.render.bind(this));

        // Background canvas.
        this.bgCanvas = document.createElement('canvas');
        this.bgContext = this.bgCanvas.getContext('2d');
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
        this.bgImageData = this.bgContext.createImageData(this.width, this.height);
        this.bgTexture = PIXI.Texture.fromCanvas(this.bgCanvas);
        this.bgSprite = new PIXI.Sprite(this.bgTexture);
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
        var index = (this.width * y + x) * 4,
            red = color[0],
            green = color[1],
            blue = color[2],
            alpha = 255;

        this.bgImageData.data[index] = red;
        this.bgImageData.data[index + 1] = green;
        this.bgImageData.data[index + 2] = blue;
        this.bgImageData.data[index + 3] = alpha;
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