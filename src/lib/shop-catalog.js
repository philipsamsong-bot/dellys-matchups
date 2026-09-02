// src/lib/shop-catalog.js

export const SHOP_CURRENCY = "USD";

export const SHOP_PRODUCTS = Object.freeze({
  "book-i-do-i-dont": Object.freeze({
    id: "book-i-do-i-dont",
    type: "book",
    category: "Books",
    title: "I DO, I DON’T",
    price: 25,
    image: "/ido-idont.webp",
  }),

  "book-diary-special-mum": Object.freeze({
    id: "book-diary-special-mum",
    type: "book",
    category: "Books",
    title: "Diary of a Special Mum",
    price: 25,
    image: "/diary-special-mum.webp",
  }),

  "book-adventures-delphine": Object.freeze({
    id: "book-adventures-delphine",
    type: "book",
    category: "Books",
    title: "Adventures of Delphine",
    price: 40,
    image: "/adventures-delphine.webp",
  }),

  "book-journal-maman-speciale": Object.freeze({
    id: "book-journal-maman-speciale",
    type: "book",
    category: "Books",
    title: "Journal d'une Maman Spéciale",
    price: 25,
    image: "/journal-maman-speciale.webp",
  }),

  "merch-receive-sense-tshirt": Object.freeze({
    id: "merch-receive-sense-tshirt",
    type: "merch",
    category: "T-Shirts",
    title: "Receive Sense T-Shirt",
    price: 25,
    image: "/receivesense2.webp",
  }),

  "merch-receive-sense-hoodie": Object.freeze({
    id: "merch-receive-sense-hoodie",
    type: "merch",
    category: "Hoodies",
    title: "Receive Sense Hoodie",
    price: 100,
    image: "/receivesense1.webp",
  }),

  "merch-receive-sense-cap": Object.freeze({
    id: "merch-receive-sense-cap",
    type: "merch",
    category: "Caps",
    title: "Receive Sense Cap",
    price: 50,
    image: "/receivesense-cap.webp",
  }),

  "merch-customised-hoodie": Object.freeze({
    id: "merch-customised-hoodie",
    type: "merch",
    category: "Custom",
    title: "Customised Hoodie",
    price: 100,
    image: "/customisedhoodie.webp",
  }),

  "merch-favourite-scriptures-tshirt": Object.freeze({
    id: "merch-favourite-scriptures-tshirt",
    type: "merch",
    category: "Faith Collection",
    title: "Favourite Scriptures T-Shirt",
    price: 30,
    image: "/customised-tshirt.webp",
  }),

  "merch-customised-tshirt": Object.freeze({
    id: "merch-customised-tshirt",
    type: "merch",
    category: "Custom",
    title: "Customised T-Shirt",
    price: 30,
    image: "/customisedt-shirt1.webp",
  }),
});

export const SHOP_PRODUCT_LIST = Object.freeze(
  Object.values(SHOP_PRODUCTS),
);

export function getShopProduct(productId) {
  if (typeof productId !== "string") {
    return null;
  }

  const normalizedProductId = productId.trim();

  if (!normalizedProductId) {
    return null;
  }

  return SHOP_PRODUCTS[normalizedProductId] || null;
}

export function isValidShopQuantity(quantity) {
  return (
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 20
  );
}

export function normalizeShopCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Cart is empty.");
  }

  const groupedItems = new Map();

  for (const rawItem of cart) {
    const productId =
      typeof rawItem?.id === "string"
        ? rawItem.id.trim()
        : "";

    if (!productId) {
      throw new Error(
        "A Shop item is missing its product ID.",
      );
    }

    const product = getShopProduct(productId);

    if (!product) {
      throw new Error(
        `Unknown Shop product: ${productId}`,
      );
    }

    const rawQuantity =
      rawItem?.quantity === undefined
        ? 1
        : Number(rawItem.quantity);

    if (!isValidShopQuantity(rawQuantity)) {
      throw new Error(
        `Invalid quantity for ${product.title}.`,
      );
    }

    const currentQuantity =
      groupedItems.get(productId) || 0;

    const nextQuantity =
      currentQuantity + rawQuantity;

    if (!isValidShopQuantity(nextQuantity)) {
      throw new Error(
        `Maximum quantity for ${product.title} is 20.`,
      );
    }

    groupedItems.set(
      productId,
      nextQuantity,
    );
  }

  return Array.from(
    groupedItems.entries(),
  ).map(([productId, quantity]) => ({
    id: productId,
    quantity,
  }));
}

export function calculateShopCart(cart) {
  const normalizedCart =
    normalizeShopCart(cart);

  const items = normalizedCart.map(
    ({ id, quantity }) => {
      const product =
        getShopProduct(id);

      const subtotal =
        product.price * quantity;

      return {
        id: product.id,
        type: product.type,
        category: product.category,
        title: product.title,
        image: product.image,
        unitPrice: product.price,
        quantity,
        subtotal,
        currency: SHOP_CURRENCY,
      };
    },
  );

  const itemCount = items.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );

  const total = items.reduce(
    (sum, item) =>
      sum + item.subtotal,
    0,
  );

  return {
    items,
    itemCount,
    subtotal: total,
    shipping: 0,
    total,
    currency: SHOP_CURRENCY,
  };
}

export function createShopCartPayload(cart) {
  const normalizedCart =
    normalizeShopCart(cart);

  return normalizedCart.map(
    ({ id, quantity }) => ({
      id,
      quantity,
    }),
  );
}
