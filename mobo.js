var Mobo = Class({
    $const: {

    },

    cpu: null,
    ram: null,
    rom: null,

    constructor: function() {

    },

    load: function() {
        var self = this,
        	cartridge = $('#cartridge');

        this.cpu = new CPU({mobo: this});
        this.ram = new RAM({mobo: this});

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
						self.rom.load();
						self.cpu.load();
						self.cpu.run();
					} catch(e) {
						console.log(e.message);
			            console.log(e.stack);
					}
				}

				reader.readAsArrayBuffer(file);	
	      	}
	    });
    },

    dump: function() {

    }
});