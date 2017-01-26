var APU = Class({
    $const: {
        PULSE_1_VOL: 0x4000,                       // Pulse 1 channel duty (D), envelope loop / length counter halt (L), constant volume (C), volume/envelope (V).
        PULSE_1_SWEEP: 0x4001,                       // Pulse 1 channel sweep unit: enabled (E), period (P), negate (N), shift (S).
        PULSE_1_LO: 0x4002,                          // Pulse 1 channel timer low (T).
        PULSE_1_HI: 0x4003,                         // Pulse 1 channel length counter load (L), timer high (T).
        PULSE_2_VOL: 0x4004,                       // Pulse 2 channel duty (D), envelope loop / length counter halt (L), constant volume (C), volume/envelope (V).
        PULSE_2_SWEEP: 0x4005,                       // Pulse 2 channel sweep unit: enabled (E), period (P), negate (N), shift (S).
        PULSE_2_LO: 0x4006,                          // Pulse 2 channel timer low (T).
        PULSE_2_HI: 0x4007,                         // Pulse 2 channel length counter load (L), timer high (T).
        TRIANGLE_LINEAR: 0x4008,                        // Triangle channel length counter halt / linear counter control (C), linear counter load (R).
        TRIANGLE_LO: 0x400A,                         // Triangle channel timer low (T).
        TRIANGLE_HI: 0x400B,                        // Triangle channel length couter load (L), timer high (T).
        NOISE_VOL: 0x400C,                          // Noise channel envelope loop / length counter halt (L), constant volume (C), volume/envelope (V).
        NOISE_LO: 0x400E,                           // Noise channel loop noise (L), noise period (P).
        NOICE_HI: 0x400F,                            // Noise channel length counter load (L).
        DMC_FREQ: 0x4010,                            // DMC channel IRQ enable (I), loop (L), frequency (R).
        DMC_RAW: 0x4011,                              // DMC channel load counter (D).
        DMC_START: 0x4012,                              // DMC channel sample address (A).
        DMC_LEN: 0x4013,                              // DMC channel sample length (L).
        STATUS_REGISTER: 0x4015,
        FRAME_SEQUENCE_REGISTER: 0x4017,              // Sequencer mode: 0 selects 4-step sequence, 1 selects 5-step sequence
        FRAME_SEQUENCE_CYCLES: 7457                 // Frame sequence step in CPU cycles.
    },

    frameSequenceModes: [
        [1, 2, 3, 4, 0],
        [1, 2, 3, 4, 5, 0]
    ],

    lengthTable: [10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14, 12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30],

    constructor: function(options) {
        this.mobo = options.mobo;
        this.pulseChannel1 = null;
        this.pulseChannel2 = null;
        this.triangleChannel = null;
        this.frameSequenceMode = 0;
        this.samples = [];
        this.frameSequenceCountDown = 0;
        this.frameSequenceStep = 0;
        this.dmcEnabled = true;
        this.noiseEnabled = true;
        this.triangleEnabled = true;
        this.pulseEnabled = true;
        this.masterVolume = 0;
        this.cycles = 0;
    },

    load: function() {
        this.pulseChannel1 = new PulseChannel({ apu: this });
        this.pulseChannel2 = new PulseChannel({ apu: this });
        this.triangleChannel = new TriangleChannel();
        this.reset();
    },

    reset: function() {
        this.pulseChannel1.reset();
        this.pulseChannel2.reset();
        this.triangleChannel.reset();
        this.frameSequenceMode = 0;
        this.samples = [];
        this.frameSequenceCountDown = 0;
        this.frameSequenceStep = 0;
        this.dmcEnabled = true;
        this.noiseEnabled = true;
        this.triangleEnabled = true;
        this.pulseEnabled = true;
        this.masterVolume = 1;
        this.cycles = 0;
    },

    writeReg: function(address, data) {
        var data = data[0];

        switch (address) {
            case APU.PULSE_1_VOL:   // 0x4000, envelope
                this.pulseChannel1.setDuty(data);
                this.pulseChannel1.setHaltLengthCounter(data);
                this.pulseChannel1.setConstantVolume(data);
                this.pulseChannel1.setVolume(data);
            break;

            case APU.PULSE_1_SWEEP:     // 0x4001, sweep
                this.pulseChannel1.setSweepEnabled(data);
                this.pulseChannel1.setDividerPeriod(data);
                this.pulseChannel1.setNegateFlag(data);
                this.pulseChannel1.setShiftCount(data);
                this.pulseChannel1.setSweetReloads();
            break;

            case APU.PULSE_1_LO:    // 0x4002
                this.pulseChannel1.setPeriodLow(data);
            break;

            case APU.PULSE_1_HI:    // 0x4003
                this.pulseChannel1.setPeriodHigh(data);
                this.pulseChannel1.reloads(data);
            break;

            case APU.PULSE_2_VOL:   // 0x4004
                this.pulseChannel2.setDuty(data);
                this.pulseChannel2.setHaltLengthCounter(data);
                this.pulseChannel2.setConstantVolume(data);
                this.pulseChannel2.setVolume(data);
            break;

            case APU.PULSE_2_SWEEP: // 0x4005
                this.pulseChannel2.setSweepEnabled(data);
                this.pulseChannel2.setDividerPeriod(data);
                this.pulseChannel2.setNegateFlag(data);
                this.pulseChannel2.setShiftCount(data);
                this.pulseChannel2.setSweetReloads();
            break;

            case APU.PULSE_2_LO:    // 0x4006
                this.pulseChannel2.setPeriodLow(data);
            break;

            case APU.PULSE_2_HI:    // 0x4007
                this.pulseChannel2.setPeriodHigh(data);
                this.pulseChannel2.reloads(data);
            break;

            case APU.TRIANGLE_LINEAR:   // 0x4008
                
            break;

            case APU.TRIANGLE_LO:   // 0x400A
                
            break;

            case APU.TRIANGLE_HI:   // 0x400B
                
            break;

            case APU.NOISE_VOL:     // 0x400C

            break;

            case APU.NOISE_LO:      // 0x400E

            break;

            case APU.NOISE_HI:      // 0x400F

            break;

            case APU.DMC_FREQ:      // 0x4010

            break;

            case APU.DMC_RAW:       // 0x4011

            break;

            case APU.DMC_START:     // 0x4012

            break;

            case APU.DMC_LEN:       // 0x4013

            break;              

            case APU.STATUS_REGISTER:   // 0x4015
                this.setChannelsStatus(data);
            break;

            case APU.FRAME_SEQUENCE_REGISTER:
                this.setFrameSequenceMode(data);
            break;

            default:
        }
    },

    setFrameSequenceMode: function(data) {
        this.frameSequenceMode = data >> 7;
    }, 

    setChannelsStatus: function(data) {
        this.dmcEnabled = data >> 4;
        this.noiseEnabled = data >> 3 & 1;
        this.triangleEnabled = data >> 1 & 1;
        this.pulseEnabled = data & 1;
    },

    emulate: function() {
        if (this.frameSequenceCountDown >= APU.FRAME_SEQUENCE_CYCLES) {
            this.frameSequenceCountDown = 0;
            this.frameSequence();
        }

        // 1 CPU clock generates 2 samples (2 APU clocks).
        this.pulseChannel1.run();
        this.pulseChannel2.run();
        this.pulseChannel1.run();
        this.pulseChannel2.run();
    },

    run: function(cpuCycles) {
        var i = 0;

        for (i = 0; i < cpuCycles; i++) {
            this.frameSequenceCountDown++;
            this.emulate(); 
        }
    },

    /*
        Frame sequencer (http://wiki.nesdev.com/w/index.php/APU_Frame_Counter).
    */
    frameSequence: function() {
        var step = this.frameSequenceModes[this.frameSequenceMode][this.frameSequenceStep];

        switch (step) {
            case 1:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
            break;

            case 2:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
                this.pulseChannel1.setLengthCounter();
                this.pulseChannel2.setLengthCounter();
                this.pulseChannel1.setSweep(true);
                this.pulseChannel2.setSweep();
            break;

            case 3:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
            break;

            case 4:
                if (this.frameSequenceMode == 0) {
                    this.pulseChannel1.setEnvelopeVolume();
                    this.pulseChannel2.setEnvelopeVolume();
                    this.pulseChannel1.setSweep(true);
                    this.pulseChannel2.setSweep();
                }
            break;

            case 5:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
                this.pulseChannel1.setSweep(true);
                this.pulseChannel2.setSweep();
            break;

            default:
        }

        this.frameSequenceStep++;

        if (this.frameSequenceStep == this.frameSequenceModes[this.frameSequenceMode].length) {
            this.frameSequenceStep = 0;
        }
    },  

    play: function() {
        
    },

    dump: function() {

    }
});

var PulseChannel = Class({
    $const: {
        MAX_VOLUME: 15              // 4 bits from 0x4000 register.
    },

    dutySequence: [
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [1, 0, 0, 1, 1, 1, 1, 1]
    ],

    constructor: function(options) { 
        var options = options || {};

        this.apu = options.apu;
        this.samples = [];
        this.duty = 0;
        this.haltLengthCounter = 0;
        this.constantVolume = 0;
        this.volume = 0;
        this.sweepEnabled = true;
        this.periodLow = 0;
        this.periodHigh = 0;
        this.negateFlag = 0;            // 0: add to period, sweeping toward lower frequencies. 21: subtract from period, sweeping toward higher frequencies.
        this.periodCountDown = 0;
        this.dutyIndex = -1;
        this.decayVolume = 0;
        this.decayCountDown = 0;
        this.shiftCount = 0;
        this.dividerPeriod = 0;
        this.silenced = false;
        this.resetEnvelope = false;
        this.sweetReload = false;
        this.periodTimer = 0;
        this.samplesCountDown = 0;
    },

    load: function() {
        this.reset();
    },

    reset: function() {
        this.samples.length = 0;
        this.duty = 0;
        this.haltLengthCounter = 0;
        this.constantVolume = 0;
        this.volume = 0;
        this.sweepEnabled = true;
        this.periodLow = 0;
        this.periodHigh = 0;
        this.negateFlag = 0;
        this.periodCountDown = 0;
        this.dutyIndex = -1;
        this.decayVolume = 0;
        this.decayCountDown = 0;
        this.shiftCount = 0;
        this.dividerPeriod = 0;
        this.silenced = false;
        this.resetEnvelope = false;
        this.sweetReload = false;
        this.periodTimer = 0;
        this.samplesCountDown = 0;
    },

    setDuty: function(data) {
        this.duty = data >> 6;
    },

    setHaltLengthCounter: function(data) {
        this.haltLengthCounter = data >> 5 & 1;
    },

    setConstantVolume: function(data) {
        this.constantVolume = data >> 4 & 1;

        if (this.constantVolume == 0) {
            this.decayCountDown = this.volume;
        }
    },

    setVolume: function(data) {
        this.volume = data & 0x0F;
    },

    setSweepEnabled: function(data) {
        this.sweepEnabled = data >> 7;
    },

    setPeriodLow: function(data) {
        this.periodLow = data;
        this.periodTimer &= 0x700;
        this.periodTimer |= this.periodLow;
    },

    setPeriodHigh: function(data) {
        this.periodHigh = data & 0x07;
        this.periodTimer &= 0xFF;
        this.periodTimer |= this.periodHigh << 8;
    },

    reloads: function(data) {
        if (this.apu.pulseEnabled) {
            this.lengthCounter = this.apu.lengthTable[data >> 3];
        } else {
            this.lengthCounter = 0;
        }

        this.duty = 0;
        this.periodCountDown = this.getPeriodTimer();
        this.dutyIndex = 0;
        this.resetEnvelope= true;
        this.decayVolume = 0x0F;
    },

    /*
        Get period timer (http://wiki.nesdev.com/w/index.php/APU_Pulse).
    */
    getPeriodTimer: function() {
        return this.periodTimer;
    },

    setNegateFlag: function(data) {
        this.negateFlag = data >> 3 & 0x01;
    },

    setShiftCount: function(data) {
        this.shiftCount = data & 0x07;        
    },

    setDividerPeriod: function(data) {
        this.dividerPeriod = data >> 4 & 0x07;
    },

    setSweetReloads: function() {
        this.sweetReload = true;
    },

    /*
        Sweep unit periodically adjust period up or down (http://wiki.nesdev.com/w/index.php/APU_Sweep).
    */  
    setSweep: function(isChannel1) {
        var sweepPeriod = this.periodCountDown;

        if (this.sweetReload) {
            if (this.sweepCounter == 0) {
                if (this.sweepEnabled == 1) {
                    sweepPeriod >>= this.shiftCount;

                    // Negate flag. 0: add to period, sweeping toward lower frequencies. 1: subtract from period, sweeping toward higher frequencies
                    if (this.negateFlag == 1) {
                        sweepPeriod *= -1; 
                        
                        if (isChannel1) {
                            sweepPeriod++;
                        }
                    }

                    this.periodCountDown += sweepPeriod;
                }
            }

            this.sweepCounter = this.dividerPeriod;
            this.sweetReload = false;
        } else {
            if (this.sweepCounter > 0) {
                this.sweepCounter--;
            } else {
                this.sweepCounter = this.dividerPeriod;

                if (this.sweepEnabled == 1) {
                    sweepPeriod >>= this.shiftCount;

                    // Negate flag. 0: add to period, sweeping toward lower frequencies. 1: subtract from period, sweeping toward higher frequencies
                    if (this.negateFlag == 1) {
                        sweepPeriod *= -1; 
                        
                        if (isChannel1) {
                            sweepPeriod++;
                        }
                    }

                    this.periodCountDown += sweepPeriod;
                }
            }
        }
    },

    /*
        Decrement length counter in half frame from frame counter (http://wiki.nesdev.com/w/index.php/APU_Length_Counter).
    */
    setLengthCounter: function() {
        if (this.lengthCounter > 0 && this.haltLengthCounter == false) {
            this.lengthCounter--;
        }

        if (this.lengthCounter == 0) {
            this.silenced = true;
        } else {
            this.silenced = false;
        }
    },

    getVolume: function() {
        var vol = 0;

        if (this.constantVolume == 1) {
            vol = this.volume;
        } else if (this.constantVolume == 0) {
            vol = this.decayVolume;
        }

        if (this.silenced) {
            vol = 0;
        } else {
            vol /= PulseChannel.MAX_VOLUME;
        }

        return vol;
    },

    /*
        Quarter frame by frame counter (http://wiki.nesdev.com/w/index.php/APU_Envelope).
    */
    setEnvelopeVolume: function() {
        if (this.resetEnvelope) {
            this.resetEnvelope = false;
            this.decayCountDown = this.volume;
            this.decayVolume = 0xF;
        } else {
            if (this.decayCountDown > 0) {
                this.decayCountDown--;
            } else {
                this.decayCountDown = this.volume;

                if (this.decayVolume > 0) {
                    this.decayVolume--;
                } else {
                    if (this.haltLengthCounter == 1) {
                        this.decayVolume = 0x0F;
                    }
                }
            }
        }
    },

    run: function() {

    }
});

var TriangleChannel = Class({
    $const: {

    },

    clockSequence: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],

    constructor: function(options) {

    },

    load: function() {

    },

    reset: function() {
        
    },

    run: function(cpuCycles) { 
    
    }
});