import { Def, Lifecycle, Model, Props } from "@/set-piece";
import { CombatableModel } from "./combatable";
import { Mutable } from "utility-types";
import { GameModel } from "./game";
import { MinionModel } from "./card/minion";
import { FeatureDef, FeatureModel } from "./feature";


export type BuffDef = Def.Create<{
    code: string;
    stateDict: {
    },
    paramDict: {
        modAttack: number;
        modHealth: number;
        shouldDisposedOnRoundEnd?: boolean;
    }
}>

export abstract class BuffModel<
    T extends Def = Def
> extends FeatureModel<T & BuffDef> {
    static buffProps<T>(
        props: Props<T & FeatureDef & BuffDef>
    ) {
        const featureProps = FeatureModel.featureProps(props);
        return featureProps;
    }

    @Lifecycle.useLoader()
    private _handleBuff() {
        if (this.card instanceof MinionModel) {
            const card: MinionModel<Def.Pure> = this.card;
            const combatable = card.childDict.combatable;
            this.bindEvent(
                combatable.eventEmitterDict.onParamCheck,
                this._buff
            );
        }
    }

    private _buff(
        target: CombatableModel, 
        param: Mutable<Model.ParamDict<CombatableModel>>
    ) {
        console.log('[execute-buff]', param, this, this.stateDict);
        param.attack += this.stateDict.modAttack;
        param.maxHealth += this.stateDict.modHealth;
    }

    @Lifecycle.useLoader()
    private _handleRoundEnd() {
        if (
            this.stateDict.shouldDisposedOnRoundEnd && 
            this.card instanceof MinionModel
        ) {
            const card: MinionModel<Def.Pure> = this.card;
            const combatable = card.childDict.combatable;
            this.bindEvent(
                GameModel.core.eventEmitterDict.onRoundEnd,
                () => {
                    this.unbindEvent(
                        combatable.eventEmitterDict.onParamCheck,
                        this._buff
                    );
                }
            );
        }
    }
}
