export type Product = {
  id: number;
  label: string;
  price: number;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type State = Product[];

export type Action =
  | {
      type: "ADD_PRODUCT";
      payload: Product;
    }
  | {
      type: "DELETE_PRODUCT";
      payload: number;
    };
