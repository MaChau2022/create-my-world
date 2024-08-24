import { useEffect, useRef, useState } from "react";
import { DebugRenderer } from "../renders/debug";
import type { ModelDebuggerProps } from "./model";

export function useModel(props: ModelDebuggerProps) {
    const { target, app } = props;

    const [ data, setData ] = useState(target.data);
    const [ children, setChildren ] = useState(target.children);
    const render = useRef(new DebugRenderer({ 
        setData,
        setChildren,
        app
    }));
    
    useEffect(() => {
        render.current.active(target);
        return render.current.deactive.bind(render);
    }, []);

    return {
        data,
        children
    };
}