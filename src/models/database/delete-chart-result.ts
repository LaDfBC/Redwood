import {DeleteChartFailureReason} from "../../enums";

export interface DeleteChartResult {
    success: boolean;
    reason: DeleteChartFailureReason | undefined;
}