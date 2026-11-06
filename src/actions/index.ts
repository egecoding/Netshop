import { cart } from './cart';
import { auth } from './auth';
import { account } from './account';
import { checkout } from './checkout';
import { quote } from './quote';
import { products } from './admin/products';
import { categories } from './admin/categories';
import { orders } from './admin/orders';
import { quotes } from './admin/quotes';

export const server = {
  cart,
  auth,
  account,
  checkout,
  quote,
  admin: {
    products,
    categories,
    orders,
    quotes,
  },
};
