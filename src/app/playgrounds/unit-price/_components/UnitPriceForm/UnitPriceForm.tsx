export function UnitPriceForm({
  onSubmit,
}: {
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap gap-4 sticky top-0 bg-white p-4"
    >
      <div className="flex flex-col">
        <label htmlFor="label">Label</label>
        <input type="text" name="label" id="label" step="0.01" required />
      </div>
      <div className="flex flex-col">
        <label htmlFor="price">Price</label>
        <input type="number" name="price" id="price" step="0.01" required />
      </div>
      <div className="flex flex-col">
        <label htmlFor="quantity">Quantity</label>
        <input type="number" name="quantity" id="quantity" required />
      </div>
      <div className="flex flex-col">
        <label htmlFor="unit">Unit</label>
        <select name="unit" id="unit" required>
          <option value="">Select a unit</option>
          <option value="g">g</option>
          <option value="ml">ml</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white rounded-md p-2 inline-block"
      >
        Add Product
      </button>
    </form>
  );
}
