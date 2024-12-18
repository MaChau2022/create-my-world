import React from "react";
import { ModelComp } from ".";
import { useModel } from "./use-model";
import { PingPongModel } from '../models/ping-pong';
import { Link } from "./common";

export function PingPongComp(props: {
    model: PingPongModel
}) {
    const model = useModel(props.model);

    return <ModelComp
        model={props.model}
        form={
            <>
                <Link model={props.model} action="trigger" />
                <Link model={props.model} action="appendPingPong" />
                <Link model={props.model} action="removePingPong" />
            </>
        }
        menu={
            <>
                {model.childList.map(child => (
                    <PingPongComp key={child.code} model={child} />
                ))}
            </>
        }
    />;
}
