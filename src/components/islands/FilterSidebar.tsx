import type { FormEvent } from 'react';

interface Props {
  actionPath: string;
  availableBrands: string[];
  selectedBrands: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  sort: string;
  q?: string;
  fixedCategorySlug?: string;
}

export default function FilterSidebar({
  actionPath,
  availableBrands,
  selectedBrands,
  minPrice,
  maxPrice,
  inStockOnly,
  sort,
  q,
  fixedCategorySlug,
}: Props) {
  function autoSubmit(e: FormEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.form?.requestSubmit();
  }

  return (
    <form method="get" action={actionPath} className="card space-y-5 p-4">
      {fixedCategorySlug && <input type="hidden" name="category" value={fixedCategorySlug} />}
      {q && <input type="hidden" name="q" value={q} />}

      <div>
        <label className="label" htmlFor="sort">
          Sort by
        </label>
        <select id="sort" name="sort" defaultValue={sort} onChange={autoSubmit} className="input">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div>
        <p className="label">Price</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minPrice"
            min={0}
            defaultValue={minPrice ?? ''}
            placeholder="Min"
            className="input"
          />
          <span className="text-slate-400">&ndash;</span>
          <input
            type="number"
            name="maxPrice"
            min={0}
            defaultValue={maxPrice ?? ''}
            placeholder="Max"
            className="input"
          />
        </div>
      </div>

      {availableBrands.length > 0 && (
        <div>
          <p className="label">Brand</p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="brand"
                  value={brand}
                  defaultChecked={selectedBrands.includes(brand)}
                  onChange={autoSubmit}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="inStock"
            value="1"
            defaultChecked={inStockOnly}
            onChange={autoSubmit}
            className="h-4 w-4 rounded border-slate-300"
          />
          In stock only
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary flex-1 text-sm">
          Apply Filters
        </button>
        <a href={fixedCategorySlug ? actionPath : '/products'} className="btn btn-secondary text-sm">
          Clear
        </a>
      </div>
    </form>
  );
}
