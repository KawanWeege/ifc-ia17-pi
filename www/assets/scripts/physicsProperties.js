var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./genericCalulator", "./types", "./vector2", "./propertyLI"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const genericCalulator_1 = require("./genericCalulator");
    const types_1 = require("./types");
    const vector2_1 = __importDefault(require("./vector2"));
    const propertyLI_1 = require("./propertyLI");
    class PhysicsProperty {
        constructor(kind, changeable, object, iValue, oValue, genericCalculator) {
            this.kind = kind;
            this.changeable = changeable;
            this.object = object;
            this.iValue = iValue;
            this.oValue = oValue;
            this.genericCalculator = genericCalculator;
            this.propertyLI = null;
            this.active = true;
            this.onValueChangedCallbacks = [];
        }
        get initialValue() {
            return this.iValue;
        }
        set initialValue(value) {
            this.iValue = value;
            this.propertyLI.setValue(this.value);
            this.onValueChangedCallbacks.forEach(callback => callback());
        }
        get value() {
            return this.genericCalculator.sum(this.iValue, this.oValue);
        }
        set value(value) {
            this.oValue = this.genericCalculator.sub(value, this.iValue);
            this.propertyLI.setValue(this.value);
            this.onValueChangedCallbacks.forEach(callback => callback());
        }
        simulateStep(step) {
        }
        reset() {
            this.value = this.initialValue;
        }
        toJSON() {
            return Object.assign({}, {
                kind: this.kind,
                iValue: this.iValue
            });
        }
    }
    exports.default = PhysicsProperty;
    class ObjectPosition extends PhysicsProperty {
        constructor(initialPosition, object) {
            super(types_1.PhysicsPropertyType.ObjectPosition, true, object, initialPosition, vector2_1.default.zero, genericCalulator_1.Vector2Calculator.instance);
            this.propertyLI = new propertyLI_1.PropertyLIVector2(this, "pos<sub>(x, y)</sub>", "m, m", initialPosition);
            this.updateSpritePosition();
        }
        updateSpritePosition() {
            this.object.sprite.drawPosition = this.value;
        }
        set initialValue(value) {
            super.initialValue = value;
            this.updateSpritePosition();
        }
        get initialValue() {
            return super.initialValue;
        }
        get value() {
            return super.value;
        }
        set value(value) {
            super.value = value;
            this.updateSpritePosition();
        }
    }
    exports.ObjectPosition = ObjectPosition;
    class ObjectSize extends PhysicsProperty {
        constructor(initialSize, object) {
            super(types_1.PhysicsPropertyType.ObjectSize, true, object, initialSize, vector2_1.default.zero, genericCalulator_1.Vector2Calculator.instance);
            this.propertyLI = new propertyLI_1.PropertyLIVector2(this, "tam<sub>(x, y)</sub>", "m, m", initialSize);
            this.updateSpriteSize();
        }
        updateSpriteSize() {
            this.object.sprite.drawSize = this.value;
        }
        set initialValue(value) {
            super.initialValue = value;
            this.updateSpriteSize();
            // Change area
            const objArea = this.object.getProperty(types_1.PhysicsPropertyType.ObjectArea);
            if (objArea)
                objArea.initialValue = this.value.x * this.value.y;
        }
        get initialValue() {
            return super.initialValue;
        }
        get value() {
            return super.value;
        }
        set value(value) {
            super.value = value;
            this.updateSpriteSize();
        }
    }
    exports.ObjectSize = ObjectSize;
    class ObjectArea extends PhysicsProperty {
        constructor(object) {
            super(types_1.PhysicsPropertyType.ObjectArea, false, object, 0, 0, genericCalulator_1.NumberCalculator.instance);
            this.propertyLI = new propertyLI_1.PropertyLINumber(this, "área", "m<sup>2</sup>", 0);
            const objectSize = object.getProperty(types_1.PhysicsPropertyType.ObjectSize);
            const sizeVector2 = (objectSize) ? objectSize.initialValue : vector2_1.default.zero;
            this.initialValue = sizeVector2.x * sizeVector2.y;
        }
    }
    exports.ObjectArea = ObjectArea;
    class ObjectVelocity extends PhysicsProperty {
        constructor(object) {
            super(types_1.PhysicsPropertyType.ObjectVelocity, true, object, vector2_1.default.zero, vector2_1.default.zero, genericCalulator_1.Vector2Calculator.instance);
            this.propertyLI = new propertyLI_1.PropertyLIVector2(this, "velocidade", "<sup>m</sup>&frasl;<sub>s</sub>, <sup>m</sup>&frasl;<sub>s</sub>", vector2_1.default.zero);
        }
        simulateStep(step) {
            const displacement = vector2_1.default.mult(this.value, step);
            const objectPosition = this.object.getProperty(types_1.PhysicsPropertyType.ObjectPosition);
            const objectDisplacement = this.object.getProperty(types_1.PhysicsPropertyType.ObjectDisplacement);
            //add displacement to objectdisplacement
            if (objectDisplacement)
                objectDisplacement.value += vector2_1.default.distance(vector2_1.default.zero, displacement);
            //displace object
            if (objectPosition)
                objectPosition.value = vector2_1.default.sum(displacement, objectPosition.value);
        }
    }
    exports.ObjectVelocity = ObjectVelocity;
    class ObjectDisplacement extends PhysicsProperty {
        constructor(object) {
            super(types_1.PhysicsPropertyType.ObjectDisplacement, false, object, 0, 0, genericCalulator_1.NumberCalculator.instance);
            this.propertyLI = new propertyLI_1.PropertyLINumber(this, "deslocamento", "m", 0);
        }
    }
    exports.ObjectDisplacement = ObjectDisplacement;
    class ObjectAcceleration extends PhysicsProperty {
        constructor(object) {
            super(types_1.PhysicsPropertyType.ObjectAcceleration, true, object, vector2_1.default.zero, vector2_1.default.zero, genericCalulator_1.Vector2Calculator.instance);
            this.propertyLI = new propertyLI_1.PropertyLIVector2(this, "acel", "<sup>m</sup>&frasl;<sub>s<sup>2</sup></sub>, <sup>m</sup>&frasl;<sub>s<sup>2</sup></sub>", this.initialValue);
        }
        simulateStep(step) {
            const objectVel = this.object.getProperty(types_1.PhysicsPropertyType.ObjectVelocity);
            const velDisplacement = vector2_1.default.mult(this.value, step);
            if (objectVel)
                objectVel.value = vector2_1.default.sum(velDisplacement, objectVel.value);
        }
    }
    exports.ObjectAcceleration = ObjectAcceleration;
});