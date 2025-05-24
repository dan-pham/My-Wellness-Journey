export interface SavedTip {
    id: string;
    savedAt: Date;
}

export interface GetSavedTipsResponse {
    success: true;
    savedTips: SavedTip[];
}

export interface SaveTipRequest {
    tipId: string;
}

export interface SaveTipResponse {
    success: true;
    message: string;
}

export interface DeleteTipResponse {
    success: true;
    message: string;
}

export type SavedTipError = { error: string } | { errors: { [key: string]: string[] } }; 