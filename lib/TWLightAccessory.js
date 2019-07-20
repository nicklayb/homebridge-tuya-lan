const BaseAccessory = require('./BaseAccessory');
const async = require('async');

class TWLightAccessory extends BaseAccessory {
    static getCategory(Categories) {
        return Categories.LIGHTBULB;
    }

    constructor(...props) {
        super(...props);
    }

    _registerPlatformAccessory() {
        const {Service} = this.hap;

        this.accessory.addService(Service.Lightbulb, this.device.context.name);

        super._registerPlatformAccessory();
    }

    _registerCharacteristics(dps) {
        const {Service, Characteristic} = this.hap;
        const service = this.accessory.getService(Service.Lightbulb);
        this._checkServiceName(service, this.device.context.name);

        const characteristicOn = service.getCharacteristic(Characteristic.On)
            .updateValue(dps['1'])
            .on('get', this.getState.bind(this, '1'))
            .on('set', this.setState.bind(this, '1'));

        const characteristicBrightness = service.getCharacteristic(Characteristic.Brightness)
            .updateValue(this.convertBrightnessFromTuyaToHomeKit(dps['3']))
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));

        const characteristicColorTemperature = service.getCharacteristic(Characteristic.ColorTemperature)
            .setProps({
                minValue: 0,
                maxValue: 600
            })
            .updateValue(this.convertColorTemperatureFromTuyaToHomeKit(dps['4']))
            .on('get', this.getColorTemperature.bind(this))
            .on('set', this.setColorTemperature.bind(this));

        this.characteristicColorTemperature = characteristicColorTemperature;

        this.device.on('change', (changes, state) => {
            if (changes.hasOwnProperty('1') && characteristicOn.value !== changes['1']) characteristicOn.updateValue(changes['1']);

            if (changes.hasOwnProperty('3') && this.convertBrightnessFromHomeKitToTuya(characteristicBrightness.value) !== changes['3'])
                characteristicBrightness.updateValue(this.convertBrightnessFromTuyaToHomeKit(changes['3']));

            if (changes.hasOwnProperty('4')) {
                if (this.convertColorTemperatureFromHomeKitToTuya(characteristicColorTemperature.value) !== changes['4'])
                    characteristicColorTemperature.updateValue(this.convertColorTemperatureFromTuyaToHomeKit(changes['4']));
            } else if (changes['3']) {
                characteristicColorTemperature.updateValue(this.convertColorTemperatureFromTuyaToHomeKit(state['4']));
            }
        });
    }

    getBrightness(callback) {
        return callback(null, this.convertBrightnessFromTuyaToHomeKit(this.device.state['3']));
    }

    setBrightness(value, callback) {
        return this.setState('3', this.convertBrightnessFromHomeKitToTuya(value), callback);
    }

    getColorTemperature(callback) {
        callback(null, this.convertColorTemperatureFromTuyaToHomeKit(this.device.state['4']));
    }

    setColorTemperature(value, callback) {
        if (value === 0) return callback(null, true);

        this.setState('4', this.convertColorTemperatureFromHomeKitToTuya(value), callback);
    }
}

module.exports = TWLightAccessory;
