import React from "react";
import { HandModel } from "@/model/hand";
import { ModelComp } from ".";

export function HandComp(props: {
    model: HandModel
}) {
    return <ModelComp model={props.model} />;
}
