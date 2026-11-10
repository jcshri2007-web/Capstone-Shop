// seed.js - built-in catalog used when the live API cannot be reached.
(() => {
  'use strict';
  const App = (window.App = window.App || { views: {} });
  const p = (id, title, price, category, rate, count, description) =>
    ({ id, title, price, category, image: '', rating: { rate, count }, description });
  App.seed = [
    p(1, 'Trail Backpack 25L', 64.0, 'outdoor', 4.6, 312, 'Lightweight daypack with a padded laptop sleeve and rain cover.'),
    p(2, 'Insulated Steel Bottle', 24.5, 'outdoor', 4.8, 904, 'Keeps drinks cold for 24 hours or hot for 12.'),
    p(3, 'Merino Hiking Socks', 18.0, 'outdoor', 4.4, 188, 'Breathable, odour-resistant socks with reinforced heels.'),
    p(4, 'Wireless Earbuds', 59.99, 'electronics', 4.2, 521, 'Bluetooth 5.3 earbuds with 28 hours of battery in the case.'),
    p(5, 'Portable SSD 1TB', 89.0, 'electronics', 4.7, 267, 'Pocket-sized USB-C drive with read speeds up to 1,000 MB/s.'),
    p(6, 'Mechanical Keyboard', 74.5, 'electronics', 4.5, 433, 'Compact tenkeyless keyboard with tactile switches.'),
    p(7, 'Ceramic Pour-Over Set', 36.0, 'home', 4.3, 97, 'Dripper and carafe for a clean, bright cup of coffee.'),
    p(8, 'Linen Throw Blanket', 49.0, 'home', 4.6, 156, 'Stonewashed linen blanket, soft from the first use.'),
    p(9, 'Desk Lamp with Dimmer', 42.0, 'home', 4.1, 214, 'LED lamp with three colour temperatures and a USB port.'),
    p(10, 'Cotton Crew T-Shirt', 19.99, 'clothing', 4.0, 640, 'Midweight organic cotton tee in a relaxed fit.'),
    p(11, 'Waterproof Shell Jacket', 119.0, 'clothing', 4.5, 122, 'Taped seams, adjustable hood and packable design.'),
    p(12, 'Canvas Everyday Cap', 15.5, 'clothing', 3.9, 75, 'Six-panel cap with an adjustable strap.'),
  ];
})();
