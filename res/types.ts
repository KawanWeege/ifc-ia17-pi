console.log("Loading types");

import PhysicsProperty from './physicsProperties';
import { CanvasRenderer } from './rendering/canvasRenderer';
import Vector2 from './vector2';
import Simulator from './simulator';

/* Enums */

export enum ButtonColor {
    Dark = "dark-button",
    White = "white-button",
    InvisibleBackground = "invisible-bg-button"
}

export enum PhysicsObjectType {
    Solid = 0
}

/* Types */

export type PhysicsPropertyName = "position" | "size" | "velocity" | "acceleration" | "displacement" | "area" | "name" | "centripetalAcceleration" | "mass";

/* Interfaces */

export interface Selectable {
    name: string;
    getPropertyEditorOptions?(): PropertyEditorOption[];
    getProperty(name: PhysicsPropertyName): PhysicsProperty<any> | undefined;
    getAllProperties(): PhysicsProperty<any>[] | undefined;
    destroy?(): void;
}

export interface PhysicsObjectConfig {
    name?: string;
    position: Vector2;
    size: Vector2;
}

export interface Simulatable {
    simulate(step: number): void;
    reset(): void;
    onSimulatorAdded?(simulator: Simulator): void;
}

export interface Renderable {
    draw(canvasRenderer: CanvasRenderer, step?: DOMHighResTimeStamp): void;
    onCanvasAdded?(canvasRenderer: CanvasRenderer): void;
    onCanvasRemoved?(canvasRenderer: CanvasRenderer): void;
}

export interface ButtonConfig {
    buttonName: string;
    buttonColor: ButtonColor;
    enabled: boolean;
    imgSrc?: string;
    altImgSrc?: string;
    title?: string;
    altTitle?: string;
    func?: string;
    args?: string;
}

export interface ValueGetter {
    name: string;
    getTargetNames(): string[];
    getValue(target: string): number;
}

export interface CartesianPlaneStyle {
    xAxisStyle: string;
    yAxisStyle: string;
    gridStyle: string;
    originStyle: string;
    measurementStyle?: string;

    axisLineThickness: number;
    gridThickness: number;

    axisMarkerFont: string;
    axisNameFont: string;
    measurementFont?: string;

    showMeasurements: boolean;
}

export interface Followable {
    locate(): Vector2;
}

interface GizmosStyle {
    style: string;
    strokeStyle?: string;
}

export interface VectorGizmosStyle extends GizmosStyle {
    lineThickness: number;
    strokeThickness?: number;
    headLength: number;
}

export interface PositionPointGizmosStyle extends GizmosStyle {
    font: string;
    pointRadius: number;
    strokeThickness?: number;
}

export interface SelectionGizmosStyle extends GizmosStyle {
    lineThickness: number;
    lineDash: number[];
    offset: number;
}

export interface PropertyEditorOption {
    readonly element: HTMLElement;
    readonly category: string;
    readonly layoutOrder: number;
    active: boolean;
    appendTo(element: HTMLElement): void;
    onChanged?(ev: Event): void;
    onClicked?(ev: MouseEvent): void;
    onMouseOver?(ev: MouseEvent): void;
    onMouseOut?(ev: MouseEvent): void;
}

export interface PropertyEditorFormTarget {
    doDrawGizmos: boolean;
    onUserInput(formData: any[]): void;
    onUserToggle?(v: boolean): void;
}

export interface PropertyEditorInputListRow<T> {
    name: string;
    active: boolean;
    appendTo(target: HTMLElement): void;
    onChanged(): T;
    resetToLastValue(): void;
    updateValue(v: T): void;
}

export interface VectorModulus {
    vector: Vector2;
    modulus: number;
}