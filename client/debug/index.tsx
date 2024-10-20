/* eslint-disable max-len */
import React, { ReactNode, useEffect, useState } from "react";
import type { App } from "../app";
import type { Model } from "../model";
import "./index.css";
import { Signal } from "../utils/signal";
import { ModelDef } from "../type/model/define";
import { Effect } from "../utils/effect";
import { Base } from "../type";
import { useIntf } from "./use-intf";


export type ModelProps<M extends ModelDef> = {
    model: Model<M>,
    app: App
}

export type ModelInfo<M extends ModelDef> = {
    childList: Model.ChildList<M>,
    childDict: Model.ChildDict<M>,
    signalDict: Signal.ModelDict<M>,
    updateSignalDict: Signal.StateAlterDict<M>,
    modifySignalDict: Signal.StateCheckDict<M>,
    effectDict: Effect.ModelDict<M>,
    state: ModelDef.State<M>
}

export type VisibleInfo = {
    model: boolean;
    method: boolean;
    state: boolean;
    child: boolean;
    signal: boolean;
    effect: boolean;
}

const FolderComp = (props: {
    title: keyof VisibleInfo;
    length: number;
    visibleDict: VisibleInfo,
    setVisibleDict: React.Dispatch<React.SetStateAction<VisibleInfo>>
    children?: ReactNode[];
}) => {
    const {
        title,
        length,
        visibleDict: visible,
        children,
        setVisibleDict: setVisible
    } = props;

    if (!length) return null;

    return <>
        <div className={`row ${visible[title] ? '' : 'fold'}`}>
            <div className="title key">{title}</div>
            <div className="value">({length})</div>
            <div 
                className="icon" 
                onClick={() => {
                    setVisible(prev => ({
                        ...prev,
                        [title]: !prev[title]
                    }));
                }}
            >
                {visible[title] ? '▴' : '▾'}
            </div>
        </div>
        {visible[title] && children}
    </>;
};

export function ModelComp<
    M extends ModelDef
>(props: ModelProps<M>) {
    const { model, app } = props;

    const modelIntf = useIntf(model);
    const [ modelInfo, setModelInfo ] = useState<ModelInfo<M>>();
    const [ modelVisible, setModelVisible ] = useState<VisibleInfo>({
        model: true,
        state: true,
        child: true,
        signal: true,
        effect: true,
        method: true
    });
    
    const formatValue = (value: Base.Value) => {
        if (typeof value === 'string') return `"${value}"`;
        return `(${value})`;
    };

    const [ activedChild, setActivedChild ] = useState<Model>();
    const [ activedSignal, setActivedSignal ] = useState<Signal>();
    const [ activedEffect, setActivedEffect ] = useState<Effect>();

    useEffect(() => {
        if (!activedChild) return;
        const elem = document.getElementById(activedChild.id);
        if (elem) {
            elem.classList.add('actived');
            return () => elem.classList.remove('actived');
        }
    }, [ activedChild ]);

    useEffect(() => {
        if (!activedSignal) return;
        for (const effectId of activedSignal.effectIdList) {
            const elem = document.getElementById(effectId);
            if (elem) {
                elem.classList.add('actived');
            }
        }
        return () => {
            for (const effectId of activedSignal.effectIdList) {
                const elem = document.getElementById(effectId);
                if (elem) {
                    elem.classList.remove('actived');
                }
            }
        };
    }, [ activedSignal ]);

    useEffect(() => {
        if (!activedEffect) return;
        for (const signalId of activedEffect.signalIdList) {
            const elem = document.getElementById(signalId);
            if (elem) {
                elem.classList.add('actived');
            }
        }
        return () => {
            for (const signalId of activedEffect.signalIdList) {
                const elem = document.getElementById(signalId);
                if (elem) {
                    elem.classList.remove('actived');
                }
            }
        };
    }, [ activedEffect ]);

    useEffect(() => {
        return model._useState.call(model, setModelInfo);
    }, [ model ]);

    if (!modelInfo) return null;

    const {
        childDict,
        childList,
        signalDict,
        effectDict,
        state
    } = modelInfo;


    return (
        <div className="model">
            <div className="body" id={model.id}>
                <div 
                    className={`head ${modelVisible.model ? '' : 'fold'}`}
                    onClick={() => {
                        setModelVisible(prev => ({
                            ...prev,
                            model: !modelVisible.model
                        }));
                    }}
                >
                    {model.code}
                </div>
                <div className={`row ${modelVisible.model ? '' : 'fold'}`}>
                    <div className="title key">id</div>
                    <div className="value">{formatValue(model.id)}</div>
                </div>
                {modelVisible.model && <>
                    <FolderComp
                        visibleDict={modelVisible}
                        setVisibleDict={setModelVisible}
                        title="method"
                        length={Object.keys(modelIntf).length}
                    >
                        {Object.keys(modelIntf).map(key => (
                            <div className="row" key={key}>
                                <div 
                                    className="key method"
                                    onClick={() => {
                                        modelIntf[key].call(model);
                                    }}
                                >
                                    {key}
                                </div>
                            </div>
                        ))}
                    </FolderComp>
                    <FolderComp 
                        visibleDict={modelVisible}
                        setVisibleDict={setModelVisible}
                        title="state"
                        length={Object.keys(state).length}
                    >
                        {Object.keys(state).map(key => (
                            <div className="row" key={key}>
                                <div className="key link">{key}</div>
                                <div className="value">{formatValue(state[key])}</div>
                            </div>
                        ))}
                    </FolderComp>
                    <FolderComp
                        visibleDict={modelVisible}
                        setVisibleDict={setModelVisible}
                        title="child"
                        length={Object.keys(childDict).length + childList.length}
                    >
                        {childList.map((item, index) => (
                            <div 
                                className='row' 
                                key={index}
                            >
                                <div 
                                    className={`key link ${activedChild === item ? 'hover' : ''}`}
                                    onMouseEnter={() => setActivedChild(item)}
                                    onMouseLeave={() => setActivedChild(undefined)}
                                >
                                [{index}]
                                </div>
                            </div>
                        ))}
                        {Object.keys(childDict).map(key => (
                            <div 
                                className='row'
                                key={key}
                            > 
                                <div 
                                    className={`key link ${activedChild === childDict[key] ? 'hover' : ''}`}
                                    onMouseEnter={() => setActivedChild(childDict[key])}
                                    onMouseLeave={() => setActivedChild(undefined)}
                                >
                                    {key}
                                </div>
                            </div>
                        ))}
                    </FolderComp>
                    <FolderComp
                        visibleDict={modelVisible}
                        setVisibleDict={setModelVisible}
                        title="signal"
                        length={Object.keys(signalDict).length}
                    >
                        {Object.keys(signalDict).map(key => (
                            <div 
                                id={signalDict[key].id}
                                className="row" 
                                key={key}
                            >
                                <div 
                                    className={`key link ${activedSignal === signalDict[key] ? 'hover' : ''}`}
                                    onMouseEnter={() => setActivedSignal(signalDict[key])}
                                    onMouseLeave={() => setActivedSignal(undefined)}
                                >
                                    {key}
                                </div>
                                <div className="value">{formatValue(signalDict[key].id)}</div>
                            </div>
                        ))}
                    </FolderComp>
                    <FolderComp
                        visibleDict={modelVisible}
                        setVisibleDict={setModelVisible}
                        title="effect"
                        length={Object.keys(effectDict).length}
                    >
                        {Object.keys(effectDict).map(key => (
                            <div 
                                id={effectDict[key].id}
                                className="row" 
                                key={key}
                            >
                                <div 
                                    className={`key link ${activedEffect === effectDict[key] ? 'hover' : ''}`}
                                    onMouseEnter={() => setActivedEffect(effectDict[key])}
                                    onMouseLeave={() => setActivedEffect(undefined)}
                                >
                                    {key}
                                </div>
                                <div className="value">{formatValue(effectDict[key].id)}</div>
                            </div>
                        ))}
                    </FolderComp>
                </>}
            </div>
            {modelVisible.model && <div className="children">
                {childList.map(item => (
                    <ModelComp 
                        key={item.id}
                        model={item}
                        app={app}
                    />
                ))}
                {Object.values(childDict).map(item => (
                    <ModelComp 
                        key={item.id}
                        model={item}
                        app={app}
                    />
                ))}
            </div>}
        </div>
    );
}

