// This file initializes Sequelize, imports all models, and sets up associations.
//models/index.js → central place to sync models and define relationships (e.g., User.hasMany(Order)).

export * as Cart from './Cart.js';
export * as Order from './Order.js';
export * as Product from './Product.js';
export * as User from './User.js';
export * as SupportChat from './SupportChat.js';
export * as SupportMessage from './SupportMessage.js';
export * as SupportAttachment from './SupportAttachment.js';
