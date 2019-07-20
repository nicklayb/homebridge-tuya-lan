const BaseAccessory = require('./TWLightAccessory');
const async = require('async');

class TWGlobeLightAccessory extends TWLightAccessory {
    static getCategory(Categories) {
        return Categories.LIGHTBULB;
    }

    constructor(...props) {
        super(...props);
    }

    getBrightnessIdentifier() {
        return '3'
    }

    getBrightnessIdentifier() {
        return '4';
    }
}

module.exports = TWLightAccessory;
