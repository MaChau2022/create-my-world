import React, { useEffect, useState } from "react";
import { AppStatus } from "../types/status";
import { SlotData } from "../types/app";
import type { App } from "../app";
import { ModelDebugger } from "./model";

export function AppDebugger(props: {
    app: App
}) {
    const { app } = props;

    const [ status, setStatus ] = useState<AppStatus>(app.status);
    const [ slots, setSlots ] = useState<SlotData[]>(app.slot.data);
  
    const create = async () => {
        await app..new({
            difficulty: 0,
            name: 'iduck'
        });
        setSlots([ ...app.slot.data ]);
    };

    const start = async (index: number) => {
        await app.mount(index);
        setStatus(app.status);
    };

    const save = () => {
        app.slot.save();
    };

    useEffect(() => {
        if (slots.length > 0) {
            start(0);
        }
    }, []);

    return <div>
        <button onClick={create}>
            new
        </button>
        {status === AppStatus.UNMOUNTED && 
            slots.map((slot, index) => (
                <button 
                    key={slot.slotId} 
                    onClick={() => start(index)}
                >
                    slot_{slot.slotId}
                </button>
            ))
        }
        {status === AppStatus.MOUNTED && 
            <button onClick={save}>save</button>
        }
        {status === AppStatus.MOUNTED && app.root && 
            <ModelDebugger
                target={app.root}
                app={app}
            />
        }
    </div>;
}