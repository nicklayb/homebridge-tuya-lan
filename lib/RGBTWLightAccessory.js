const BaseAccessory = require('./BaseAccessory');
const async = require('async');

const WHITE = 'white';
const COLOUR = 'colour';

class RGBTWLightAccessory extends BaseAccessory {
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
            .updateValue(dps[this.getModeIdentifier()] === WHITE ? this.convertBrightnessFromTuyaToHomeKit(dps[this.getBrightnessIdentifier()]) : this.convertColorFromTuyaToHomeKit(dps[this.getColorIdentifier()]).b)
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));

        const characteristicColorTemperature = service.getCharacteristic(Characteristic.ColorTemperature)
            .setProps({
                minValue: 0,
                maxValue: 600
            })
            .updateValue(dps[this.getModeIdentifier()] === WHITE ? this.convertColorTemperatureFromTuyaToHomeKit(dps[this.getColorTemperatureIdentifier()]) : 0)
            .on('get', this.getColorTemperature.bind(this))
            .on('set', this.setColorTemperature.bind(this));

        const characteristicHue = service.getCharacteristic(Characteristic.Hue)
            .updateValue(dps[this.getModeIdentifier()] === WHITE ? 0 : this.convertColorFromTuyaToHomeKit(dps[this.getColorIdentifier()]).h)
            .on('get', this.getHue.bind(this))
            .on('set', this.setHue.bind(this));

        const characteristicSaturation = service.getCharacteristic(Characteristic.Saturation)
            .updateValue(dps[this.getModeIdentifier()] === WHITE ? 0 : this.convertColorFromTuyaToHomeKit(dps[this.getColorIdentifier()]).s)
            .on('get', this.getSaturation.bind(this))
            .on('set', this.setSaturation.bind(this));

        this.characteristicHue = characteristicHue;
        this.characteristicSaturation = characteristicSaturation;
        this.characteristicColorTemperature = characteristicColorTemperature;

        this.device.on('change', (changes, state) => {
            if (changes.hasOwnProperty('1') && characteristicOn.value !== changes['1']) characteristicOn.updateValue(changes['1']);

            switch (state[this.getModeIdentifier()]) {
                case WHITE:
                    if (changes.hasOwnProperty(this.getBrightnessIdentifier()) && this.convertBrightnessFromHomeKitToTuya(characteristicBrightness.value) !== changes[this.getBrightnessIdentifier()])
                        characteristicBrightness.updateValue(this.convertBrightnessFromTuyaToHomeKit(changes[this.getBrightnessIdentifier()]));

                    if (changes.hasOwnProperty(this.getColorTemperatureIdentifier()) && this.convertColorTemperatureFromHomeKitToTuya(characteristicColorTemperature.value) !== changes[this.getColorTemperatureIdentifier()]) {

                        const newColorTemperature = this.convertColorTemperatureFromTuyaToHomeKit(changes[this.getColorTemperatureIdentifier()]);
                        const newColor = this.convertHomeKitColorTemperatureToHomeKitColor(newColorTemperature);

                        characteristicHue.updateValue(newColor.h);
                        characteristicSaturation.updateValue(newColor.s);
                        characteristicColorTemperature.updateValue(newColorTemperature);

                    } else if (changes[this.getModeIdentifier()] && !changes.hasOwnProperty(this.getColorTemperatureIdentifier())) {

                        const newColorTemperature = this.convertColorTemperatureFromTuyaToHomeKit(state[this.getColorTemperatureIdentifier()]);
                        const newColor = this.convertHomeKitColorTemperatureToHomeKitColor(newColorTemperature);

                        characteristicHue.updateValue(newColor.h);
                        characteristicSaturation.updateValue(newColor.s);
                        characteristicColorTemperature.updateValue(newColorTemperature);
                    }

                    break;

                default:
                    if (changes.hasOwnProperty(this.getColorIdentifier())) {
                        const oldColor = this.convertColorFromTuyaToHomeKit(this.convertColorFromHomeKitToTuya({
                            h: characteristicHue.value,
                            s: characteristicSaturation.value,
                            b: characteristicBrightness.value
                        }));
                        const newColor = this.convertColorFromTuyaToHomeKit(changes[this.getColorIdentifier()]);

                        if (oldColor.b !== newColor.b) characteristicBrightness.updateValue(newColor.b);
                        if (oldColor.h !== newColor.h) characteristicHue.updateValue(newColor.h);

                        if (oldColor.s !== newColor.s) characteristicSaturation.updateValue(newColor.h);

                        if (characteristicColorTemperature.value !== 0) characteristicColorTemperature.updateValue(0);

                    } else if (changes[this.getModeIdentifier()]) {
                        if (characteristicColorTemperature.value !== 0) characteristicColorTemperature.updateValue(0);
                    }
            }
        });
    }

    getModeIdentifier() {
        return '2';
    }

    getColorTemperatureIdentifier() {
        return '4';
    }

    getBrightnessIdentifier() {
        return '3';
    }

    getBrightness(callback) {
        if (this.device.state[this.getModeIdentifier()] === WHITE) return callback(null, this.convertBrightnessFromTuyaToHomeKit(this.device.state[this.getBrightnessIdentifier()]));
        callback(null, this.convertColorFromTuyaToHomeKit(this.device.state[this.getColorIdentifier()]).b);
    }

    setBrightness(value, callback) {
        if (this.device.state[this.getModeIdentifier()] === WHITE) return this.setState(this.getBrightnessIdentifier(), this.convertBrightnessFromHomeKitToTuya(value), callback);
        this.setState(this.getColorIdentifier(), this.convertColorFromHomeKitToTuya({b: value}), callback);
    }

    getColorTemperature(callback) {
        if (this.device.state[this.getModeIdentifier()] !== WHITE) return callback(null, 0);
        callback(null, this.convertColorTemperatureFromTuyaToHomeKit(this.device.state[this.getColorTemperatureIdentifier()]));
    }

    setColorTemperature(value, callback) {
        if (value === 0) return callback(null, true);

        const newColor = this.convertHomeKitColorTemperatureToHomeKitColor(value);
        this.characteristicHue.updateValue(newColor.h);
        this.characteristicSaturation.updateValue(newColor.s);

        this.setMultiState({[this.getModeIdentifier()]: WHITE, [this.getColorTemperatureIdentifier()]: this.convertColorTemperatureFromHomeKitToTuya(value)}, callback);
    }

    getHue(callback) {
        if (this.device.state[this.getModeIdentifier()] === WHITE) return callback(null, 0);
        callback(null, this.convertColorFromTuyaToHomeKit(this.device.state[this.getColorIdentifier()]).h);
    }

    setHue(value, callback) {
        this._setHueSaturation({h: value}, callback);
    }

    getSaturation(callback) {
        if (this.device.state[this.getModeIdentifier()] === WHITE) return callback(null, 0);
        callback(null, this.convertColorFromTuyaToHomeKit(this.device.state[this.getColorIdentifier()]).s);
    }

    setSaturation(value, callback) {
        this._setHueSaturation({s: value}, callback);
    }

    _setHueSaturation(prop, callback) {
        if (!this._pendingHueSaturation) {
            this._pendingHueSaturation = {props: {}, callbacks: []};
        }

        if (prop) {
            if (this._pendingHueSaturation.timer) clearTimeout(this._pendingHueSaturation.timer);

            this._pendingHueSaturation.props = {...this._pendingHueSaturation.props, ...prop};
            this._pendingHueSaturation.callbacks.push(callback);

            this._pendingHueSaturation.timer = setTimeout(() => {
                this._setHueSaturation();
            }, 500);
            return;
        }

        //this.characteristicColorTemperature.updateValue(0);

        const callbacks = this._pendingHueSaturation.callbacks;
        const callEachBack = err => {
            async.eachSeries(callbacks, (callback, next) => {
                try {
                    callback(err);
                } catch (ex) {}
                next();
            }, () => {
                this.characteristicColorTemperature.updateValue(0);
            });
        };

        const isSham = this._pendingHueSaturation.props.h === 0 && this._pendingHueSaturation.props.s === 0;
        const newValue = this.convertColorFromHomeKitToTuya(this._pendingHueSaturation.props);
        this._pendingHueSaturation = null;


        if (this.device.state[this.getModeIdentifier()] === WHITE && isSham) return callEachBack();

        this.setMultiState({[this.getModeIdentifier()]: COLOUR, [this.getColorIdentifier()]: newValue}, callEachBack);
    }
}

module.exports = RGBTWLightAccessory;
