import React from "react";
import { ModelComp } from ".";
import { useModel } from "./use-model";
import { CardComp } from "./card";
import { Link } from "./common";
import { DeckModel } from "@/model/hearth/deck";

export function DeckComp(props: {
    model: DeckModel
}) {
    const model = useModel(props.model);    

    return <ModelComp 
        model={props.model} 
        form={
            <>
                <Link model={props.model} action="generateCard" />
                <Link model={props.model} action="removeCard" />
                <Link model={props.model} action="drawCard" />
            </>
        }
        menu={
            <>
                {model.childList.map(child => (
                    <CardComp key={child.uuid} model={child} />
                ))}
            </>
        }    
    />;
}
