import { Product } from "../../types";

export function UnitPriceList({
  products,
  onRemoveProduct,
}: {
  products: Product[];
  onRemoveProduct: (id: number) => void;
}) {
  return (
    <table className="table-auto w-full">
      <thead>
        <tr>
          <th className="text-left">Label</th>
          <th className="text-left">Price</th>
          <th className="text-left">Quantity</th>
          <th className="text-left">Unit Price</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.label}</td>
            <td>£{product.price}</td>
            <td>{product.quantity}</td>
            <td>
              £{(product.unitPrice * 100).toFixed(2)} / 100{product.unit}
            </td>
            <td>
              <button type="button" onClick={() => onRemoveProduct(product.id)}>
                &times;
              </button>
            </td>
          </tr>
        ))}
        {products.length === 0 && (
          <tr>
            <td colSpan={5} className="text-slate-600 text-center p-5">
              No products added yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
