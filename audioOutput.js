var AudioOutput = Class({
    $const: {
        FREQUENCY: 44100,
        BUFFER_SIZE: 1102
    },

    constructor: function(options) {
        this.context = null;
        this.node = null;
        this.buffer = null;
        this.data = null;
        this.highpass90 = null;
        this.highpass440 = null;
        this.lowpass14000 = null;
        this.sampleIndex = 0;
    },

    load: function() {
        var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
            
        this.context = new AudioContext();
        this.node = this.context.createBufferSource();
        this.buffer = this.context.createBuffer(1, AudioOutput.BUFFER_SIZE, AudioOutput.FREQUENCY);
        this.node.buffer = this.buffer;
        this.node.loop = true;
        this.node.connect(this.context.destination);
        this.data = this.buffer.getChannelData(0);
        this.node.start();

        // this.highpass90 = this.context.createBiquadFilter();
        // this.node.connect(this.highpass90);
        // this.highpass90.connect(this.context.destination);
        // this.highpass90.type = 'highpass';
        // this.highpass90.frequency.value = 90;

        // this.highpass440 = this.context.createBiquadFilter();
        // this.node.connect(this.highpass440);
        // this.highpass440.connect(this.context.destination);
        // this.highpass440.type = 'highpass';
        // this.highpass440.frequency.value = 440;

        // this.lowpass14000 = this.context.createBiquadFilter();
        // this.node.connect(this.lowpass14000);
        // this.lowpass14000.connect(this.context.destination);
        // this.lowpass14000.type = 'lowpass';
        // this.lowpass14000.frequency.value = 14000;

        this.reset();
    },

    reset: function() {

    },

    play: function(sample) {
        this.data[this.sampleIndex] = sample;
        this.sampleIndex++;

        if (this.sampleIndex >= AudioOutput.BUFFER_SIZE) {
            this.sampleIndex = 0;
        }
    },

    dump: function() {
        
    }
});