export interface Characteristic {
    label: string;
    value: string;
  }
  
  export interface StructuredCharacteristics {
    specifications: { [key: string]: string };
    otherSpecifications: Characteristic[];
  }
  