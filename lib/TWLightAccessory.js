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
            .updateValue(this.convertBrightnessFromTuyaToHomeKit(dps[this.getBrightnessIdentifier()]))
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));

        const characteristicColorTemperature = service.getCharacteristic(Characteristic.ColorTemperature)
            .setProps({
                minValue: 0,
                maxValue: 600
            })
            .updateValue(this.convertColorTemperatureFromTuyaToHomeKit(dps[this.getColorTemperatureIdentifier()]))
            .on('get', this.getColorTemperature.bind(this))
            .on('set', this.setColorTemperature.bind(this));

        this.characteristicColorTemperature = characteristicColorTemperature;

        this.device.on('change', (changes, state) => {
            if (changes.hasOwnProperty('1') && characteristicOn.value !== changes['1']) characteristicOn.updateValue(changes['1']);

            if (changes.hasOwnProperty(this.getBrightnessIdentifier()) && this.convertBrightnessFromHomeKitToTuya(characteristicBrightness.value) !== changes[this.getBrightnessIdentifier()])
                characteristicBrightness.updateValue(this.convertBrightnessFromTuyaToHomeKit(changes[this.getBrightnessIdentifier()]));

            if (changes.hasOwnProperty(this.getColorTemperatureIdentifier())) {
                if (this.convertColorTemperatureFromHomeKitToTuya(characteristicColorTemperature.value) !== changes[this.getColorTemperatureIdentifier()])
                    characteristicColorTemperature.updateValue(this.convertColorTemperatureFromTuyaToHomeKit(changes[this.getColorTemperatureIdentifier()]));
            } else if (changes[this.getBrightnessIdentifier()]) {
                characteristicColorTemperature.updateValue(this.convertColorTemperatureFromTuyaToHomeKit(state[this.getColorTemperatureIdentifier()]));
            }
        });
    }

    getBrightnessIdentifier() {
        return '2'
    }

    getColorTemperatureIdentifier() {
        return '3';
    }

    getBrightness(callback) {
        return callback(null, this.convertBrightnessFromTuyaToHomeKit(this.device.state[this.getBrightnessIdentifier()]));
    }

    setBrightness(value, callback) {
        return this.setState(this.getBrightnessIdentifier(), this.convertBrightnessFromHomeKitToTuya(value), callback);
    }

    getColorTemperature(callback) {
        callback(null, this.convertColorTemperatureFromTuyaToHomeKit(this.device.state[this.getColorTemperatureIdentifier()]));
    }

    setColorTemperature(value, callback) {
        if (value === 0) return callback(null, true);

        this.setState(this.getColorTemperatureIdentifier(), this.convertColorTemperatureFromHomeKitToTuya(value), callback);
    }
}

module.exports = TWLightAccessory;
