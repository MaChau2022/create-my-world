import React, { useEffect, useState } from "react";
import type { App } from "../app";
import { ModelComp } from ".";
import { ArchieveData } from "../services/archieve";
import { AppStatus } from "../types/status";

export function AppComp(props: {
    app: App
}) {
    const { app } = props;
    const [ status, setStatus ] = useState<AppStatus>(app.status);
    const [ archieves, setArchieves ] = useState<ArchieveData[]>(app.archieveService.data);
  
    const createArchieve = async () => {
        await app.archieveService.createArchieve();
        setArchieves([ ...app.archieveService.data ]);
    };

    const startGame = async (index: number) => {
        await app.startGame(index);
        setStatus(app.status);
    };

    const saveArchieve = () => {
        app.archieveService.saveArchieve();
    };

    const quitGame = async () => {
        await app.quitGame();
        setStatus(app.status);
    };

    useEffect(() => {
        // if (app.archieveService.data.length) {
        //     startGame(0);
        // }
    }, []);

    if (status === AppStatus.UNMOUNTED) {
        return <div>
            <button onClick={createArchieve}>
                new
            </button>
            {archieves.map((archieve, index) => (
                <button 
                    key={archieve.id} 
                    onClick={() => startGame(index)}
                >
                    slot_{archieve.id}
                </button>
            ))}
        </div>;
    }

    if (status === AppStatus.MOUNTED && app.root) {
        return <div>
            <button onClick={saveArchieve}>
                save
            </button>
            <button onClick={quitGame}>
                quit
            </button>
            <ModelComp
                model={app.root}
                app={app}
            />
        </div>;
    }
}