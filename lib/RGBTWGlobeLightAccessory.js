const RGBTWLightAccessory = require('./RGBTWLightAccessory');
const async = require('async');

class RGBTWGlobeLightAccessory extends RGBTWLightAccessory {
    static getCategory(Categories) {
        return Categories.LIGHTBULB;
    }

    constructor(...props) {
        super(...props);
    }

    getModeIdentifier() {
        return '21';
    }

    getColorTemperatureIdentifier() {
        return '23';
    }

    getBrightnessIdentifier() {
        return '22';
    }

    getColorIdentifier() {
        return '24';
    }

    convertColorFromTuyaToHomeKit(value) {
        const [, h, s, b] = (value || '').match(/^0([0-9a-z]{3})0([0-9a-z]{3})0([0-9a-z]{3})$/i) || [0, 255, 255];
        return {
            h: parseInt(h, 16),
            s: Math.round(parseInt(s, 16) / 2.55),
            b: Math.round(parseInt(b, 16) / 2.55)
        };
    }

    convertColorFromHomeKitToTuya(value, dpValue) {
        const cached = this.convertColorFromTuyaToHomeKit(dpValue || this.device.state[this.getColorIdentifier()]);
        let {h, s, b} = {...cached, ...value};
        const hsb = [
            h.toString(16).padStart(4, '0'),
            Math.round(2.55 * s).toString(16).padStart(2, '0'),
            Math.round(2.55 * b).toString(16).padStart(2, '0')
        ].join('0')

        return hsb;
    }
}

module.exports = RGBTWGlobeLightAccessory;
