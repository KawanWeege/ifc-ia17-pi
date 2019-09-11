console.log("Loading physicsProperties");

import { PhysicsPropertyJSON } from './fileController';
import GenericCalculator, { NumberCalculator, Vector2Calculator } from './genericCalulator';
import { PhysicsObject } from './physicsObjects';
import PropertyLI, { PropertyLINumber, PropertyLIVector2 } from './propertyLI';
import { PhysicsPropertyType, Simulatable } from './types';
import Vector2 from './vector2';
import Gizmos from './gizmos';
import { CanvasRenderer } from './rendering';

export default abstract class PhysicsProperty<T> implements Simulatable{
    public active: boolean;
    public propertyLI: PropertyLI<T> | null = null;
    public doDrawGizmos: boolean;
    private onValueChangedCallbacks: Function[];

    constructor(
        public readonly kind: PhysicsPropertyType,
        public readonly changeable: boolean,
        public readonly object: PhysicsObject,
        private iValue: T,
        private oValue: T,
        private genericCalculator: GenericCalculator<T>,
        public readonly simulationPriority: number = 0

    ){
        this.active = true;
        this.onValueChangedCallbacks = [];
        this.doDrawGizmos = false;
    }

    get initialValue(){
        return this.iValue;
    }

    set initialValue(value: T){
        this.iValue = value;
        this.propertyLI!.setValue(this.value);
        this.onValueChangedCallbacks.forEach(callback => callback());
    }

    get value(){
        return this.genericCalculator.sum(this.iValue, this.oValue);
    }

    set value(value: T){
        this.oValue = this.genericCalculator.sub(value, this.iValue);
        this.propertyLI!.setValue(this.value);
        this.onValueChangedCallbacks.forEach(callback => callback());
    }

    drawGizmos(canvasRenderer: CanvasRenderer){
    }

    simulate(step: number): void{
    }

    reset(): void{
        this.value = this.initialValue;
    }

    toJSON(): PhysicsPropertyJSON<any> {
        return Object.assign({}, {
            kind: this.kind,
            iValue: this.iValue
        });
    }
}

export class ObjectPosition extends PhysicsProperty<Vector2>{
    constructor(
        initialPosition: Vector2,
        object: PhysicsObject
    ){
        super(PhysicsPropertyType.ObjectPosition, true, object, initialPosition, Vector2.zero, Vector2Calculator.instance);
        this.propertyLI = new PropertyLIVector2(this, "pos<sub>(x, y)</sub>", "m", initialPosition, "Vetor posição", false);
        this.updateSpritePosition();
    }

    private updateSpritePosition(): void{
        this.object.sprite.drawPosition = this.value;
    }

    set initialValue(value: Vector2){
        super.initialValue = value;
        this.updateSpritePosition();
    }

    get initialValue(){
        return super.initialValue;
    }

    get value(): Vector2{
        return super.value;
    }
    
    set value(value: Vector2){
        super.value = value;
        this.updateSpritePosition();
    }

    drawGizmos(canvasRenderer: CanvasRenderer){
        if(this.doDrawGizmos)
            Gizmos.drawPositionPoint(canvasRenderer, this.value, {style: "lightblue", strokeStyle: "black", strokeThickness: 2, font: "italic 15px CMU Serif", pointRadius: 3});
    }
}

export class ObjectSize extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;

    constructor(
        initialSize: Vector2,
        object: PhysicsObject
    ){
        super(PhysicsPropertyType.ObjectSize, true, object, initialSize, Vector2.zero, Vector2Calculator.instance);
        this.propertyLI = new PropertyLIVector2(this, "tam<sub>(x, y)</sub>", "m", initialSize, "Tamanho", false);
        this.objectPosition = <ObjectPosition>this.object.getProperty(PhysicsPropertyType.ObjectPosition);
        this.updateSpriteSize();
    }

    private updateSpriteSize(): void{
        this.object.sprite.drawSize = this.value;
    }

    set initialValue(value: Vector2){
        super.initialValue = value;
        this.updateSpriteSize();

        // Change area
        const objArea = this.object.getProperty(PhysicsPropertyType.ObjectArea);
        if(objArea)
            (<PhysicsProperty<any>>objArea).initialValue = this.value.x * this.value.y;
    }
    
    get initialValue(){
        return super.initialValue;
    }

    get value(): Vector2{
        return super.value;
    }

    set value(value: Vector2){
        super.value = value;
        this.updateSpriteSize();
    }

    drawGizmos(canvasRenderer: CanvasRenderer){
        if(this.doDrawGizmos && this.objectPosition){
            const from = Vector2.sub(this.objectPosition.value, Vector2.div(this.value, 2));
            const to = Vector2.sum(this.objectPosition.value, Vector2.div(this.value, 2));
            Gizmos.drawVector(canvasRenderer, from, to, {style: "lightblue", strokeStyle: "black", strokeThickness: 2, lineThickness: 2, headLength: 10});
        }
    }
}

export class ObjectArea extends PhysicsProperty<number>{
    constructor(object: PhysicsObject){
        super(PhysicsPropertyType.ObjectArea, false, object, 0, 0, NumberCalculator.instance);
        this.propertyLI = new PropertyLINumber(this, "área", "m<sup>2</sup>", 0, "Área");
        
        const objectSize = <PhysicsProperty<any>> object.getProperty(PhysicsPropertyType.ObjectSize);
        const sizeVector2 = (objectSize) ? objectSize.initialValue : Vector2.zero;
        this.initialValue = sizeVector2.x * sizeVector2.y;
    }
}

export class ObjectVelocity extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;
    private objectAcceleration: ObjectAcceleration | null;

    constructor(object: PhysicsObject){
        super(PhysicsPropertyType.ObjectVelocity, true, object, Vector2.zero, Vector2.zero, Vector2Calculator.instance, 1);
        this.propertyLI = new PropertyLIVector2(this, "vel", "<sup>m</sup>&frasl;<sub>s</sub>", Vector2.zero, "Vetor velocidade", true, "m/s");

        this.objectPosition = <ObjectPosition>this.object.getProperty(PhysicsPropertyType.ObjectPosition);
        this.objectAcceleration = <ObjectAcceleration>this.object.getProperty(PhysicsPropertyType.ObjectAcceleration);
    }

    simulate(step: 0): void{
        const currentVel = this.value;

        if(this.objectAcceleration)
            this.value = Vector2.sum(
                this.value, Vector2.mult(
                    this.objectAcceleration.value, step
                )
            );

        if(this.objectPosition && this.objectAcceleration){
            
            this.objectPosition.value = Vector2.sum(
                this.objectPosition.value, 
                Vector2.sum(
                    Vector2.mult(currentVel, step),
                    Vector2.div(
                        Vector2.mult(this.objectAcceleration.value, Math.pow(step, 2)),
                        2
                    )
                )
            );
        }
    }

    drawGizmos(canvasRenderer: CanvasRenderer){
        if(this.doDrawGizmos && this.objectPosition){
            const from = this.objectPosition.value;
            const to = Vector2.sum(from, this.value);
            Gizmos.drawVector(canvasRenderer, from, to, {style: "lightblue", strokeStyle: "black", strokeThickness: 2, lineThickness: 2, headLength: 10});
        }
    }
}

export class ObjectDisplacement extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;

    constructor(object: PhysicsObject){
        super(PhysicsPropertyType.ObjectDisplacement, false, object, Vector2.zero, Vector2.zero, Vector2Calculator.instance);
        this.propertyLI = new PropertyLIVector2(this, "des", "m", Vector2.zero, "Deslocamento", true, "m");
        this.objectPosition = <ObjectPosition>this.object.getProperty(PhysicsPropertyType.ObjectPosition)!;
    }

    simulate(step: 0): void {
        if(this.objectPosition)
            this.value = Vector2.sub(this.objectPosition.value, this.objectPosition.initialValue);
    }

    drawGizmos(canvasRenderer: CanvasRenderer){
        if(this.doDrawGizmos && this.objectPosition){
            const from = this.objectPosition.initialValue;
            const to = Vector2.sum(from, this.value);
            Gizmos.drawVector(canvasRenderer, from, to, {style: "lightblue", strokeStyle: "black", strokeThickness: 2, lineThickness: 2, headLength: 10});
        }
    }
}

export class ObjectAcceleration extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;

    constructor(object: PhysicsObject){
        super(PhysicsPropertyType.ObjectAcceleration, true, object, Vector2.zero, Vector2.zero, Vector2Calculator.instance);
        this.propertyLI = new PropertyLIVector2(this, "acel", "<sup>m</sup>&frasl;<sub>s<sup>2</sup></sub>", this.initialValue, "Vetor aceleração", true, "m/s²");

        this.objectPosition = <ObjectPosition>this.object.getProperty(PhysicsPropertyType.ObjectPosition);
    }

    drawGizmos(canvasRenderer: CanvasRenderer){
        if(this.doDrawGizmos && this.objectPosition){
            const from = this.objectPosition.value;
            const to = Vector2.sum(from, this.value);
            Gizmos.drawVector(canvasRenderer, from, to, {style: "lightblue", strokeStyle: "black", strokeThickness: 2, lineThickness: 2, headLength: 10});
        }
    }
}

