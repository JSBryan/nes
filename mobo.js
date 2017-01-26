var Mobo = Class({
    $const: {

    },

    cpu: null,
    ram: null,
    rom: null,
    ppu: null,
    mmc: null,

    constructor: function() {

    },

    load: function() {
        var self = this,
        	cartridge = $('#cartridge'),
        	fullscreenButton = $('#fullscreenButton');

        this.cpu = new CPU({mobo: this});
        this.ram = new RAM({mobo: this});
        this.ppu = new PPU({mobo: this, mainDisplayDevice: $('#mainDisplay'), tilesDisplayDevice: $('#tilesDisplay'), nameTableDisplayDevice: $('#nameTableDisplay'), paletteDisplayDevice: $('#paletteDisplay')});
        this.apu = new APU({mobo: this});

	    cartridge.on('change', function(e) {
	      	var file = this.files[0],
	      		reader = new FileReader();

	      	if (file) {
	      		reader.onload = function(e) {
					self.rom = new ROM({
						mobo: self,
						rom: new Uint8Array(reader.result)
					});

					cartridge.val('');

					try {
						self.ram.load();
						self.ppu.load();
						self.rom.load();
						self.cpu.load();
						self.apu.load();

						self.controller1 = new Controller({mobo: self, port: 0x4016, displayDevice: $('#mainDisplay').children('canvas').get(0)});
        				self.controller2 = new Controller({mobo: self, port: 0x4017, displayDevice: $('#mainDisplay').children('canvas').get(0)});
						self.controller1.load();

						self.cpu.run();
						fullscreenButton.show();
					} catch(e) {
						fullscreenButton.hide();
						console.log(e.message);
			            console.log(e.stack);
					}
				}

				reader.readAsArrayBuffer(file);	
	      	}
	    });

	    fullscreenButton.on('click', function() {
	    	self.toggleFullScreen();
	    });
    },

    toggleFullScreen: function() {
    	$('#mainDisplay canvas').get(0).webkitRequestFullScreen();
    	this.ppu.toggleFullScreen(true);
    },

    dump: function() {

    }
});