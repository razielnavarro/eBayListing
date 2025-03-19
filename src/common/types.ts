export interface Spec {
    label: string;
    value: string;
  }
  
  export interface StructuredSpecs {
    features: { [key: string]: string };
    otherFeatures: { [key: string]: string };
  }
  