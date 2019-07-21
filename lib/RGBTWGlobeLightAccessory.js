const BaseAccessory = require('./RGBTWLightAccessory');
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
}

module.exports = RGBTWGlobeLightAccessory;
