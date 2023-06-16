"use client";

import { useReducer } from "react";
import { UnitPriceForm } from "../UnitPriceForm";
import { Action, State } from "../../types";
import { UnitPriceList } from "../UnitPriceList";

function createRandomId() {
  return Math.floor(Math.random() * 100000);
}

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "ADD_PRODUCT":
      return [
        ...state,
        {
          id: action.payload.id || createRandomId(),
          label: action.payload.label,
          price: action.payload.price,
          quantity: action.payload.quantity,
          unit: action.payload.unit,
          unitPrice: action.payload.unitPrice,
        },
      ];
    case "DELETE_PRODUCT":
      return state.filter((product) => product.id !== action.payload);
    default:
      return state;
  }
};

export function UnitPriceCalculator() {
  const [state, dispatch] = useReducer(reducer, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const label = String(formData.get("label"));
    const price = Number(formData.get("price"));
    const quantity = Number(formData.get("quantity"));
    const unit = String(formData.get("unit"));
    const unitPrice = price / quantity;

    dispatch({
      type: "ADD_PRODUCT",
      payload: {
        id: createRandomId(),
        label,
        price,
        quantity,
        unit,
        unitPrice,
      },
    });

    event.currentTarget.reset();
  }

  const handleRemoveProduct = (id: number) => {
    dispatch({
      type: "DELETE_PRODUCT",
      payload: id,
    });
  };

  return (
    <>
      <UnitPriceForm onSubmit={handleSubmit} />
      <UnitPriceList products={state} onRemoveProduct={handleRemoveProduct} />
    </>
  );
}
