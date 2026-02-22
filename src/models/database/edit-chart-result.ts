import {EditChartFailureReason} from "../../enums";

export interface EditChartResult {
    success: boolean;
    reason: EditChartFailureReason | undefined;
}
