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
        NOISE_HI: 0x400F,                            // Noise channel length counter load (L).
        DMC_FREQ: 0x4010,                            // DMC channel IRQ enable (I), loop (L), frequency (R).
        DMC_RAW: 0x4011,                              // DMC channel load counter (D).
        DMC_START: 0x4012,                              // DMC channel sample address (A).
        DMC_LEN: 0x4013,                              // DMC channel sample length (L).
        STATUS_REGISTER: 0x4015,
        FRAME_SEQUENCE_REGISTER: 0x4017,              // Sequencer mode: 0 selects 4-step sequence, 1 selects 5-step sequence
        FRAME_SEQUENCE_CYCLES: 7457,                 // Frame sequence step in CPU cycles.
        FREQUENCY_CYCLES: 22050
    },

    frameSequenceModes: [
        [1, 2, 3, 4, 0],
        [1, 2, 3, 4, 5, 0]
    ],

    lengthTable: [10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14, 12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30],

    pulseOutTable: [],

    tndOutTable: [],

    masterVolume: 10,

    constructor: function(options) {
        this.mobo = options.mobo;
        this.pulseChannel1 = new PulseChannel({ apu: this });
        this.pulseChannel2 = new PulseChannel({ apu: this });
        this.triangleChannel = new TriangleChannel({ apu: this });
        this.noiseChannel = new NoiseChannel({ apu: this });
        this.frameSequenceMode = 0;
        this.samples = [];
        this.frameSequenceCountDown = 0;
        this.frameSequenceStep = 0;
        this.dmcEnabled = true;
        this.noiseEnabled = true;
        this.triangleEnabled = true;
        this.pulse1Enabled = true;
        this.pulse2Enabled = true;
        this.frequencyCountDown = 0;
        this.irqFlag = 0;
        this.frameInterruptFlag = 0;
    },

    load: function() {
        this.audioOutput.load();
        this.pulseChannel1.load();
        this.pulseChannel2.load();
        this.triangleChannel.load();
        this.noiseChannel.load();
        this.loadOutputLookUps();
    },

    reset: function() {
        this.pulseChannel1.reset();
        this.pulseChannel2.reset();
        this.triangleChannel.reset();
        this.noiseChannel.reset();
        this.frameSequenceMode = 0;
        this.samples = [];
        this.frameSequenceCountDown = 0;
        this.frameSequenceStep = 0;
        this.dmcEnabled = true;
        this.noiseEnabled = true;
        this.triangleEnabled = true;
        this.pulse1Enabled = true;
        this.pulse2Enabled = true;
        this.frequencyCountDown = 0;
        this.irqFlag = 0;
        this.frameInterruptFlag = 0;
    },

    /*
        Mixer output volumes (http://wiki.nesdev.com/w/index.php/APU_Mixer).
    */  
    loadOutputLookUps: function() {
        var i = 0;

        for (i = 0; i < 31; i++) {
            this.pulseOutTable.push(95.52 / (8128 / i + 100));  // pulse_out = pulse_table [pulse1 + pulse2]
        }

        for (i = 0; i < 203; i++) {
            this.tndOutTable.push(163.67 / (24329 / i + 100));  // tnd_out = tnd_table [3 * triangle + 2 * noise + dmc]
        }
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
                this.pulseChannel1.reloads(true, data);
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
                this.pulseChannel2.reloads(false, data);
            break;

            case APU.TRIANGLE_LINEAR:   // 0x4008
                this.triangleChannel.setLinearControl(data);
            break;

            case APU.TRIANGLE_LO:   // 0x400A
                this.triangleChannel.setPeriodLow(data);
            break;

            case APU.TRIANGLE_HI:   // 0x400B
                this.triangleChannel.setPeriodHigh(data);
                this.triangleChannel.reloads(data);
            break;

            case APU.NOISE_VOL:     // 0x400C
                this.noiseChannel.setHaltLengthCounter(data);
                this.noiseChannel.setConstantVolume(data);
                this.noiseChannel.setVolume(data);
            break;

            case APU.NOISE_LO:      // 0x400E
                this.noiseChannel.setMode(data);
                this.noiseChannel.setPeriod(data);
            break;

            case APU.NOISE_HI:      // 0x400F
                this.noiseChannel.reloads(data);
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

            case APU.FRAME_SEQUENCE_REGISTER:   // 0x4017
                this.setFrameSequenceMode(data);
            break;

            default:
        }
    },

    setFrameSequenceMode: function(data) {
        this.irqFlag = data >> 6 & 1;
        this.frameSequenceMode = data >> 7;

        this.frameSequenceCountDown = 0;

        if (this.frameSequenceMode) {
            this.frameSequence(2);
        }

        if (this.irqFlag == 1) {
            this.frameInterruptFlag = false;
        }
    }, 

    setChannelsStatus: function(data) {
        this.dmcEnabled = data >> 4;
        this.noiseEnabled = data >> 3 & 1;
        this.triangleEnabled = data >> 2 & 1;
        this.pulse2Enabled = data >> 1 & 1;
        this.pulse1Enabled = data & 1;

        if (this.pulse1Enabled == 0) {
            this.pulseChannel1.setLengthCounter(0);
        }

        if (this.pulse2Enabled) {
            this.pulseChannel2.setLengthCounter(0);
        }

        if (this.triangleEnabled == 0) {
            this.triangleChannel.setLengthCounter(0);
        } 

        if (this.noiseEnabled == 0) {
            this.noiseChannel.setLengthCounter(0);
        }
    },

    getStatus: function() {
        var pulseChannel1 = (this.pulse1Enabled && this.pulseChannel1.lengthCounter > 0 ? 1 : 0),
            pulseChannel2 = (this.pulse2Enabled && this.pulseChannel2.lengthCounter > 0 ? 1 : 0),
            triangleChannel = (this.triangleEnabled && this.triangleChannel.lengthCounter > 0 ? 1 : 0),
            noiseChannel = (this.noiseEnabled && this.noiseChannel.lengthCounter > 0 ? 1 : 0),
            dmcChannel = 1,
            frameInterrupt = this.frameInterruptFlag,
            dmcInterrupt = 1,
            status = pulseChannel1 | pulseChannel2 << 1 | triangleChannel << 2 | noiseChannel << 3 | dmcChannel << 4 | 0 << 5 | frameInterrupt << 6 | dmcInterrupt << 7;

        this.frameInterruptFlag = false;

        return status;
    },

    emulate: function() {
        // Clocked on every other CPU cycles, so 2 CPU cycles = 1 APU cycle.
        switch (this.frameSequenceCountDown) {
            case 7457:
                this.frameSequence(1);
            break;

            case 14916:
                this.frameSequence(2);
            break;

            case 22371:
                this.frameSequence(3);
            break;

            case 29828:
                this.frameSequence(4);
            break;

            case 29829:
                this.frameSequence(4.5);
            break;

            case 29830:
                if (this.frameSequenceMode == 0) {
                    if (this.irqFlag == 0) {
                        this.frameInterruptFlag = true;
                    }

                    this.frameSequenceCountDown = 0;
                }
            break;

            case 37281:
                this.frameSequence(5);
                this.frameSequenceCountDown = 0;
            break;

            default:
        };

        // 1 CPU clock generates 2 pulse samples (2 APU clocks).
        this.pulseChannel1.run();
        this.pulseChannel2.run();
        this.pulseChannel1.run();
        this.pulseChannel2.run();

        // this.triangleChannel.run();
        // this.noiseChannel.run();

        if (this.frequencyCountDown >= APU.FREQUENCY_CYCLES) {
            this.frequencyCountDown = 0;
            this.mixer();
        }
    },

    run: function(cpuCycles) {
        var i = 0;

        for (i = 0; i < cpuCycles; i++) {
            this.frameSequenceCountDown++;
            this.frequencyCountDown++;
            this.emulate(); 
        }
    },

    /*
        Frame sequencer (http://wiki.nesdev.com/w/index.php/APU_Frame_Counter).
    */
    frameSequence: function(step) {
        switch (step) {
            case 1:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
                this.triangleChannel.setLinearCounter();
                this.noiseChannel.setEnvelopeVolume();
            break;

            case 2:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
                this.pulseChannel1.setLengthCounter();
                this.pulseChannel2.setLengthCounter();
                this.triangleChannel.setLengthCounter();
                this.triangleChannel.setLinearCounter();
                this.pulseChannel1.setSweep(true);
                this.pulseChannel2.setSweep();
                this.noiseChannel.setEnvelopeVolume();
                this.noiseChannel.setLengthCounter();
            break;

            case 3:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
                this.triangleChannel.setLinearCounter();
                this.noiseChannel.setEnvelopeVolume();
            break;

            case 4.5:
                if (this.frameSequenceMode == 0) {
                    this.pulseChannel1.setEnvelopeVolume();
                    this.pulseChannel2.setEnvelopeVolume();
                    this.pulseChannel1.setLengthCounter();
                    this.pulseChannel2.setLengthCounter();
                    this.triangleChannel.setLengthCounter();
                    this.triangleChannel.setLinearCounter();
                    this.pulseChannel1.setSweep(true);
                    this.pulseChannel2.setSweep();
                    this.noiseChannel.setEnvelopeVolume();
                    this.noiseChannel.setLengthCounter();
                }
            break;

            case 5:
                this.pulseChannel1.setEnvelopeVolume();
                this.pulseChannel2.setEnvelopeVolume();
                this.pulseChannel1.setLengthCounter();
                this.pulseChannel2.setLengthCounter();
                this.triangleChannel.setLengthCounter();
                this.triangleChannel.setLinearCounter();
                this.pulseChannel1.setSweep(true);
                this.pulseChannel2.setSweep();
                this.noiseChannel.setEnvelopeVolume();
                this.noiseChannel.setLengthCounter();
            break;

            default:
        }
    },  

    mixer: function() {
        var pulseOut = [],
            tndOut = [];

        // Pulse channel volumes.
        _.each(this.pulseChannel1.samples, function(sample, i) {
            pulseOut.push(this.masterVolume * this.pulseOutTable[sample + this.pulseChannel2.samples[i]]);
        }.bind(this));

        _.each(this.triangleChannel.samples, function(sample, i) {
            tndOut.push(this.masterVolume * this.tndOutTable[3 * sample + 2 * this.noiseChannel.samples[i] + 0]);
        }.bind(this));

        // _.each(this.triangleChannel.samples, function(sample, i) {
        //     tndOut.push(this.masterVolume * this.tndOutTable[3 * sample + 2 * 0 + 0]);
        // }.bind(this));

        // _.each(this.noiseChannel.samples, function(sample, i) {
        //     tndOut.push(this.masterVolume * this.tndOutTable[3 * 0 + 2 * sample + 0]);
        // }.bind(this));

        this.pulseChannel1.samples.length = 0;
        this.pulseChannel2.samples.length = 0;
        this.triangleChannel.samples.length = 0;
        this.noiseChannel.samples.length = 0;

        // this.audioOutput.play(pulseOut, tndOut);
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
        this.dutyIndex = 0;
        this.decayVolume = 0;
        this.decayCountDown = 0;
        this.shiftCount = 0;
        this.dividerPeriod = 0;
        this.silenced = false;
        this.resetEnvelope = false;
        this.sweetReload = false;
        this.periodTimer = 0;
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
        this.dutyIndex = 0;
        this.decayVolume = 0;
        this.decayCountDown = 0;
        this.shiftCount = 0;
        this.dividerPeriod = 0;
        this.silenced = false;
        this.resetEnvelope = false;
        this.sweetReload = false;
        this.periodTimer = 0;
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

    reloads: function(isChannel1, data) {
        var channelEnabled = true;

        if (isChannel1) {
            channelEnabled = this.apu.pulse1Enabled;
        } else {
            channelEnabled = this.apu.pulse2Enabled;
        }

        if (channelEnabled) {
            this.lengthCounter = this.apu.lengthTable[data >> 3];
        } else {
            this.lengthCounter = 0;
        }

        this.duty = 0;
        this.periodCountDown = this.getPeriodTimer();
        this.dutyIndex = 0;
        this.resetEnvelope = true;
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

                if (this.sweepEnabled == 1 && this.periodCountDown < 8) {
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
    setLengthCounter: function(length) {
        if (_.isUndefined(length) == false) {
            this.lengthCounter = length;
        } else {
            if (this.haltLengthCounter == false) {
                if (this.lengthCounter > 0) {
                    this.lengthCounter--;
                }
            } 
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

        if (this.periodCountDown < 8 || this.silenced) {
            vol = 0;
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
        if (this.dutySequence[this.duty][this.dutyIndex] == 1) {
            this.samples.push(this.getVolume());
        } else {
            this.samples.push(0);
        }

        // Reset period when one cycle is completed.
        if (this.periodCountDown <= 0) {   
            this.periodCountDown = this.getPeriodTimer();

            // Increment duty sequence index every cycle.
            this.dutyIndex++;

            // Reset duty sequence index if it is more than cycles length.
            if (this.dutyIndex == this.dutySequence[this.duty].length) {
                this.dutyIndex = 0;
            }
        } else {
            this.periodCountDown--;
        }
    }
});

var TriangleChannel = Class({
    $const: {

    },

    clockSequence: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],

    constructor: function(options) {
        this.apu = options.apu;
        this.haltLengthCounter = 0;
        this.counterReloadValue = 0;
        this.linearControlReload = false;
        this.periodLow = 0;
        this.periodHigh = 0;
        this.lengthCounter = 0;
        this.linearCounter = 0;
        this.periodTimer = 0;
        this.periodCountDown = 0;
        this.silenced = false;
        this.clockIndex = -1;
        this.samples = [];
    },

    load: function() {
        this.reset();
    },

    reset: function() {
        this.haltLengthCounter = 0;
        this.counterReloadValue = 0;
        this.linearControlReload = false;
        this.periodLow = 0;
        this.periodHigh = 0;
        this.lengthCounter = 0;
        this.linearCounter = 0;
        this.periodTimer = 0;
        this.periodCountDown = 0;
        this.silenced = false;
        this.clockIndex = -1;
        this.samples.length = 0;
    },

    setLinearControl: function(data) {
        this.haltLengthCounter = data >> 7;
        this.counterReloadValue = data & 0x7F;
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
        if (this.apu.triangleEnabled) {
            this.lengthCounter = this.apu.lengthTable[data >> 3];
        } else {
            this.lengthCounter = 0;
        }

        this.linearControlReload = true;
    },

    setLengthCounter: function(length) {
        if (_.isUndefined(length) == false) {
            this.lengthCounter = length;
        } else {
            if (this.haltLengthCounter == false) {
                if (this.lengthCounter > 0) {
                    this.lengthCounter--;
                }
            } 
        }

        if (this.lengthCounter == 0) {
            this.silenced = true;
        } else {
            this.silenced = false;
        }
    },

    setLinearCounter: function() {
        if (this.linearControlReload == true) {
            this.linearCounter = this.counterReloadValue;
        } else {
            if (this.linearCounter > 0) {
                this.linearCounter--;
            }
        }

        if (this.haltLengthCounter == 0) {
            this.linearControlReload = false;
        }
    },

    getPeriodTimer: function() {
        return this.periodTimer;
    },

    getVolume: function() {

    },

    run: function() { 
        var lowPeriod = false;

        if (this.linearCounter > 0 && this.lengthCounter > 0) {
            if (this.periodCountDown <= 0) {
                this.periodCountDown = this.getPeriodTimer();

                if (this.periodCountDown > 2) {
                    this.clockIndex++;

                    if (this.clockIndex > this.clockSequence.length) {
                        this.clockIndex = 0;
                    }
                } else {
                    lowPeriod = true;
                }
            } else {
                this.periodCountDown--;
            }
        }

        if (lowPeriod) {
            this.samples.push(7.5);
        } else {
            this.samples.push(this.clockSequence[this.clockIndex]);
        }
    }
});

var NoiseChannel = Class({
    $const: {

    },

    periodTable: [4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068],

    constructor: function(options) {
        this.apu = options.apu;
        this.haltLengthCounter = 0;
        this.constantVolume = 0;
        this.volume = 0;
        this.mode = 0;
        this.periodTimer = 0;
        this.samples = [],
        this.lengthCounter = 0;
        this.resetEnvelope = false;
        this.decayCountDown = 0;
        this.decayVolume = 0;
        this.periodCountDown = 0;
        this.shiftRegister = 0;
    },

    load: function() {
        this.reset();
    },

    reset: function() {
        this.haltLengthCounter = 0;
        this.constantVolume = 0;
        this.volume = 0;
        this.mode = 0;
        this.periodTimer = 0;
        this.samples.length = 0;
        this.lengthCounter = 0;
        this.resetEnvelope = false;
        this.decayCountDown = 0;
        this.decayVolume = 0;
        this.periodCountDown = 0;
        this.shiftRegister = 1;
    },

    setHaltLengthCounter: function(data) {
        this.haltLengthCounter = data >> 5 & 1;
    },

    setConstantVolume: function(data) {
        this.constantVolume = data >> 4 & 1;
    },

    setVolume: function(data) {
        this.volume = data & 0x0F;
    },

    setMode: function(data) {
        this.mode = data >> 7;
    },

    setPeriod: function(data) {
        this.periodTimer = data & 0x0F;
    },

    reloads: function(data) {
        if (this.apu.noiseEnabled) {
            this.lengthCounter = this.apu.lengthTable[data >> 3];
        } else {
            this.lengthCounter = 0;
        }

        this.resetEnvelope = true;
    },

    getPeriodTimer: function() {
        return this.periodTable[this.periodTimer];
    },

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

    setLengthCounter: function(length) {
        if (_.isUndefined(length) == false) {
            this.lengthCounter = length;
        } else {
            if (this.haltLengthCounter == false) {
                if (this.lengthCounter > 0) {
                    this.lengthCounter--;
                }
            } 
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

        if (this.silenced || this.shiftRegister & 1 == 1) {
            vol = 0;
        }

        return vol;
    },

    run: function() { 
        var feedback = 0,
            bit6 = 0,
            bit1 = 0,
            bit0 = 0;

        if (this.periodCountDown <= 0) {
            this.periodCountDown = this.getPeriodTimer();
        } else {
            this.periodCountDown--;
            bit0 = this.shiftRegister & 1;

            // 1. Feedback is calculated as the exclusive-OR of bit 0 and one other bit: bit 6 if Mode flag is set, otherwise bit 1.
            // 2. The shift register is shifted right by one bit.
            // 3. Bit 14, the leftmost bit, is set to the feedback calculated earlier.
            if (this.mode == 1) {
                bit6 = this.shiftRegister >> 6 & 1;
                feedback = bit6 ^ bit0;
            } else {
                bit1 = this.shiftRegister >> 1 & 1;
                feedback = bit1 ^ bit0;
            }

            this.shiftRegister >>= 1;
            this.shiftRegister = this.shiftRegister | (feedback << 14);
        }

        this.samples.push(this.getVolume());
    }
});