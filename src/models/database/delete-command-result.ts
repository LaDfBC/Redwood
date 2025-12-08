import {DeleteCommandFailureReason} from "../../enums";

export interface DeleteCommandResult {
    success: boolean;
    reason: DeleteCommandFailureReason | undefined;
}