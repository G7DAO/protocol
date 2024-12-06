export enum  FacetCutAction {Add, Replace, Remove}
export type FacetCut = {
    facetAddress: string; // address
    action: FacetCutAction; // uint8
    functionSelectors: string[]; // bytes4[]
}