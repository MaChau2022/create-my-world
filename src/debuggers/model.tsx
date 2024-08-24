import React from "react";
import { BaseModel } from "../types/model";
import type { App } from "../app";
import { useModel } from "./use-model";
import "./index.css";

export type ModelDebuggerProps = {
    target: BaseModel,
    app   : App
}

export function ModelDebugger(props: ModelDebuggerProps) {
    const { target, app } = props;
    const { children, data } = useModel(props);

    return (
        <div
            className="model" 
            id={target.key}
        >
            <div className="data">
                <div className="title">{target.constructor.name}</div>
                {Object.keys(data).map(key => (
                    <div className="row" key={key}>
                        <div className="key">{key}</div>
                        <div className="value">{target.data[key]}</div>
                    </div>
                ))}
                {Object.keys(target.debug).map(key => (
                    <div className="row" key={key}>
                        <div className="key">{key}</div>
                        <div 
                            className="function"
                            onClick={target.debug[key].bind(target)}
                        >
                            function
                        </div>
                    </div>
                ))}
            </div>
            <div className="children">
                {children.map(item => (
                    <ModelDebugger 
                        key={item.key}
                        target={item}
                        app={app}
                    />
                ))}
            </div>
        </div>
    );
}