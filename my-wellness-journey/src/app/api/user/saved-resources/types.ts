export interface SavedResource {
    id: string;
    savedAt: Date;
}

export interface GetSavedResourcesResponse {
    success: true;
    savedResources: SavedResource[];
}

export interface SaveResourceRequest {
    resourceId: string;
}

export interface SaveResourceResponse {
    success: true;
    message: string;
}

export interface DeleteResourceResponse {
    success: true;
    message: string;
}

export type SavedResourceError = { error: string } | { errors: { [key: string]: string[] } }; 